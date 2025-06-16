import { CoreMessage, generateText } from "ai";
import { configureLLMProvider, LLMProviderConfig } from "./services/llm";
import { FunctionParser } from "./agent/function-parser";
import { AutoDevRemoteAgentTools } from "./capabilities/tools";
import { ToolExecutor, ToolHandler } from "./agent/tool-executor";
import { GitHubContextManager } from "./agent/github-context-manager";
import { ToolDefinition, ToolResult } from "./agent/tool-definition";
import { Playbook, IssueAnalysisPlaybook, BugFixPlaybook, FeatureRequestPlaybook } from "./playbooks";

let AUTODEV_REMOTE_TOOLS: ToolDefinition[] = [];

export interface AgentConfig {
	workspacePath?: string;
	githubToken?: string;
	llmConfig?: LLMProviderConfig;
	verbose?: boolean;
	maxToolRounds?: number;
	enableToolChaining?: boolean;
	toolTimeout?: number;
	autoUploadToIssue?: boolean;
	githubContext?: {
		owner: string;
		repo: string;
		issueNumber: number;
		eventType?: string;
		action?: string;
	};
	playbook?: Playbook;
}

export interface AgentResponse {
	text: string;
	toolResults: ToolResult[];
	success: boolean;
	error?: string;
	totalRounds?: number;
	executionTime?: number;
	githubContext?: {
		owner: string;
		repo: string;
		issueNumber: number;
	};
}

export class AIAgent {
	protected llmConfig: LLMProviderConfig;
	protected conversationHistory: CoreMessage[] = [];
	protected config: AgentConfig;
	protected playbook: Playbook;
	protected toolExecutor: ToolExecutor;
	protected githubManager: GitHubContextManager;

	constructor(config: AgentConfig = {}) {
		this.config = {
			maxToolRounds: 5,
			enableToolChaining: true,
			toolTimeout: 1200000,
			autoUploadToIssue: config.autoUploadToIssue || false,
			...config
		};

		// Initialize LLM provider
		const llmConfig = config.llmConfig || configureLLMProvider();
		if (!llmConfig) {
			throw new Error('No LLM provider configured. Please set GLM_TOKEN, DEEPSEEK_TOKEN, or OPENAI_API_KEY');
		}
		this.llmConfig = llmConfig;

		// Initialize Playbook
		this.playbook = config.playbook || new IssueAnalysisPlaybook();

		this.toolExecutor = new ToolExecutor({
			timeout: this.config.toolTimeout,
			verbose: this.config.verbose
		});

		// Initialize GitHub manager
		this.githubManager = new GitHubContextManager({
			token: this.config.githubToken,
			context: this.config.githubContext,
			autoUploadToIssue: this.config.autoUploadToIssue
		});

		// Extract tool definitions from MCP tools
		AUTODEV_REMOTE_TOOLS = this.extractToolDefinitions(AutoDevRemoteAgentTools);

		// Register real tool handlers
		this.registerToolHandlers();

		this.log('AI Agent initialized with LLM provider:', this.llmConfig.providerName);
		this.log('Total enhanced tools loaded:', AUTODEV_REMOTE_TOOLS.length);
		this.log('Configuration:', {
			maxToolRounds: this.config.maxToolRounds,
			enableToolChaining: this.config.enableToolChaining,
			toolTimeout: this.config.toolTimeout
		});
	}

	/**
	 * Extract tool definitions from tool installers
	 */
	private extractToolDefinitions(toolInstallers: readonly any[]): ToolDefinition[] {
		const tools: ToolDefinition[] = [];

		const mockInstaller = (
			name: string,
			description: string,
			inputSchema: Record<string, any>,
			handler: any
		) => {
			const properties: Record<string, any> = {};
			const required: string[] = [];

			for (const [key, zodType] of Object.entries(inputSchema)) {
				try {
					properties[key] = this.zodToJsonSchema(zodType);

					// Simple required check - assume all are required unless explicitly optional
					if (zodType && typeof zodType === 'object') {
						const zodObj = zodType as { isOptional?: boolean; _def?: { typeName?: string } };
						if (!zodObj.isOptional) {
							required.push(key);
						}
					}
				} catch (error) {
					// Fallback for complex types
					properties[key] = { type: 'string', description: `Parameter ${key}` };
					required.push(key);
				}
			}

			tools.push({
				name,
				description,
				parameters: {
					type: "object",
					properties,
					required
				}
			});
		};

		// Execute tool installers to capture definitions
		toolInstallers.forEach(installer => {
			try {
				installer(mockInstaller);
			} catch (error) {
				console.warn(`Failed to extract tool definition:`, error);
			}
		});

		return tools;
	}

	/**
	 * Convert Zod schema to JSON schema
	 */
	private zodToJsonSchema(zodType: any): any {
		if (!zodType || typeof zodType !== 'object') {
			return { type: 'string' };
		}

		// Handle basic types
		if (zodType._def?.typeName === 'ZodString') {
			return { type: 'string' };
		}
		if (zodType._def?.typeName === 'ZodNumber') {
			return { type: 'number' };
		}
		if (zodType._def?.typeName === 'ZodBoolean') {
			return { type: 'boolean' };
		}
		if (zodType._def?.typeName === 'ZodArray') {
			return {
				type: 'array',
				items: this.zodToJsonSchema(zodType._def.type)
			};
		}
		if (zodType._def?.typeName === 'ZodObject') {
			const properties: Record<string, any> = {};
			const required: string[] = [];

			for (const [key, value] of Object.entries(zodType._def.shape())) {
				properties[key] = this.zodToJsonSchema(value);
				const zodValue = value as { isOptional?: () => boolean };
				if (!zodValue.isOptional?.()) {
					required.push(key);
				}
			}

			return {
				type: 'object',
				properties,
				required
			};
		}

		// Fallback for unknown types
		return { type: 'string' };
	}

	/**
	 * Register real MCP tool handlers
	 */
	private registerToolHandlers(): void {
		// Create a mock installer that captures tool handlers
		const mockInstaller = (
			name: string,
			description: string,
			inputSchema: Record<string, any>,
			handler: ToolHandler
		) => {
			this.toolExecutor.registerTool(name, handler);
		};

		// Execute tool installers to register handlers
		AutoDevRemoteAgentTools.forEach(installer => {
			try {
				installer(mockInstaller);
			} catch (error) {
				console.warn(`Failed to register tool:`, error);
			}
		});
	}

	/**
	 * Process user input and generate response with enhanced tool chaining
	 */
	async start(userInput: string, context?: any): Promise<AgentResponse> {
		const startTime = Date.now();

		try {
			this.log('Processing user input:', userInput);

			if (this.config.enableToolChaining) {
				return await this.processInputWithToolChaining(userInput, startTime, context);
			} else {
				return await this.processInputSingleRound(userInput, startTime, context);
			}

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.log('Error processing input:', errorMessage);

			return {
				text: '',
				toolResults: [],
				success: false,
				error: errorMessage,
				totalRounds: 0,
				executionTime: Date.now() - startTime
			};
		}
	}

	/**
	 * Process input with multi-round tool chaining capability
	 */
	protected async processInputWithToolChaining(userInput: string, startTime: number, context?: any): Promise<AgentResponse> {
		const allToolResults: ToolResult[] = [];
		let currentRound = 1;
		let lastLLMResponse = '';

		this.log('Starting tool chaining process with max rounds:', this.config.maxToolRounds);

		while (currentRound <= this.config.maxToolRounds!) {
			this.log(`=== Tool Execution Round ${currentRound} ===`);

			// Build messages for current round using Playbook
			const messages = await this.playbook.buildMessagesForRound(
				userInput,
				context,
				currentRound,
				this.conversationHistory
			);

			// Call LLM
			const llmResponse = await this.callLLM(messages);
			lastLLMResponse = llmResponse;
			this.log(`Round ${currentRound} LLM response:`, llmResponse.substring(0, 200) + '...');

			// Debug: Show full response if verbose
			if (this.config.verbose) {
				console.log(`[AIAgent] Full LLM Response (Round ${currentRound}):`);
				console.log('---START---');
				console.log(llmResponse);
				console.log('---END---');
			}

			// Parse for function calls
			const parsedResponse = FunctionParser.parseResponse(llmResponse);

			// Debug: Show parsing details
			if (this.config.verbose) {
				console.log(`[AIAgent] Parsing result:`, {
					functionCallsFound: parsedResponse.functionCalls.length,
					hasError: parsedResponse.hasError,
					error: parsedResponse.error,
					functionCalls: parsedResponse.functionCalls.map(fc => ({ name: fc.name, parameters: fc.parameters }))
				});
			}

			if (parsedResponse.hasError) {
				this.log(`Round ${currentRound} parsing error:`, parsedResponse.error);
				break;
			}

			// If no function calls, we're done
			if (parsedResponse.functionCalls.length === 0) {
				this.log(`Round ${currentRound}: No function calls detected, ending chain`);
				lastLLMResponse = parsedResponse.text;
				break;
			}

			// Execute function calls
			const roundResults = await this.executeFunctionCalls(parsedResponse.functionCalls);
			allToolResults.push(...roundResults);

			// Check if we should continue
			if (!this.shouldContinueChain(roundResults)) {
				this.log(`Round ${currentRound}: Chain ending condition met`);
				break;
			}

			currentRound++;
		}

		// Generate final response
		const finalResponse = await this.generateFinalResponse(
			userInput,
			lastLLMResponse,
			allToolResults,
			currentRound
		);

		return {
			text: finalResponse,
			toolResults: allToolResults,
			success: true,
			totalRounds: currentRound,
			executionTime: Date.now() - startTime
		};
	}

	/**
	 * Process input with single round (legacy mode)
	 */
	private async processInputSingleRound(userInput: string, startTime: number, context?: any): Promise<AgentResponse> {
		// Build messages using Playbook
		const messages = await this.playbook.buildMessagesForRound(userInput, context, 1, this.conversationHistory);

		// Call LLM to generate response
		const llmResponse = await this.callLLM(messages);
		this.log('LLM response received:', llmResponse.substring(0, 200) + '...');

		// Parse LLM response for function calls
		const parsedResponse = FunctionParser.parseResponse(llmResponse);

		this.log('Parsed response:', {
			text: parsedResponse.text.substring(0, 200) + '...',
			functionCalls: parsedResponse.functionCalls,
			hasError: parsedResponse.hasError
		});

		if (parsedResponse.hasError) {
			return {
				text: llmResponse,
				toolResults: [],
				success: false,
				error: parsedResponse.error,
				totalRounds: 0,
				executionTime: Date.now() - startTime
			};
		}

		// Execute function calls if any
		let toolResults: ToolResult[] = [];
		if (parsedResponse.functionCalls.length > 0) {
			this.log('Function calls detected:', parsedResponse.functionCalls.map(fc => fc.name));
			toolResults = await this.toolExecutor.executeToolsWithContext({
				round: 1,
				previousResults: [],
				userInput,
				workspacePath: this.config.workspacePath || process.cwd()
			}, parsedResponse.functionCalls);

			// If we have tool results, send them back to LLM for final analysis
			if (toolResults.length > 0) {
				const finalResponse = await this.generateFinalResponse(userInput, parsedResponse.text, toolResults, 1);

				// Update conversation history with final response
				this.updateConversationHistory(userInput, finalResponse);

				const executionTime = Date.now() - startTime;
				const githubContext = this.extractGitHubContext(userInput, toolResults);

				// Export memories to markdown at the end of conversation
				await this.exportMemoriesToMarkdown();

				return {
					text: finalResponse,
					toolResults,
					success: true,
					totalRounds: 1,
					executionTime,
					githubContext
				};
			}
		} else {
			this.log('No function calls detected in LLM response');
		}

		// Update conversation history
		this.updateConversationHistory(userInput, llmResponse);

		// Export memories to markdown at the end of conversation
		await this.exportMemoriesToMarkdown();

		const executionTime = Date.now() - startTime;

		return {
			text: parsedResponse.text,
			toolResults,
			success: true,
			totalRounds: 0,
			executionTime
		};
	}

	/**
	 * Generate final response using Playbook
	 */
	private async generateFinalResponse(
		userInput: string,
		lastLLMResponse: string,
		toolResults: ToolResult[],
		totalRounds: number
	): Promise<string> {
		const summaryPrompt = this.playbook.prepareSummaryPrompt(userInput, toolResults, lastLLMResponse);
		const verificationPrompt = this.playbook.prepareVerificationPrompt(userInput, toolResults);

		const messages: CoreMessage[] = [
			{ role: "system", content: this.playbook.getSystemPrompt() },
			{ role: "user", content: summaryPrompt },
			{ role: "user", content: verificationPrompt }
		];

		const { text } = await generateText({
			model: this.llmConfig.openai(this.llmConfig.fullModel),
			messages,
			temperature: 0.3,
			maxTokens: 4000
		});

		return text;
	}

	/**
	 * Helper methods for enhanced functionality
	 */
	private shouldContinueChain(roundResults: ToolResult[]): boolean {
		// Don't continue if we've reached max rounds
		if (this.config.maxToolRounds! <= 1) {
			this.log(`Round ${1}: Reached max rounds (${this.config.maxToolRounds}), stopping chain`);
			return false;
		}

		// Don't continue if all tools failed
		const successfulTools = roundResults.filter(r => r.success);
		if (successfulTools.length === 0) {
			this.log(`Round ${1}: All tools failed, stopping chain`);
			return false;
		}

		// For comprehensive analysis, we want to encourage deeper investigation
		// Only stop if we have truly comprehensive coverage

		// Check what types of analysis we've done so far
		const toolTypes = this.categorizeToolResults(roundResults);

		// For documentation/architecture tasks, we need more comprehensive analysis
		const hasIssueAnalysis = toolTypes.issueAnalysis > 0;
		const hasCodeExploration = toolTypes.codeExploration > 0;
		const hasStructureAnalysis = toolTypes.structureAnalysis > 0;
		const hasContentAnalysis = toolTypes.contentAnalysis > 0;

		// Continue if we're missing key analysis types for comprehensive understanding
		if (!hasIssueAnalysis) {
			this.log(`Round ${1}: Missing issue analysis, continuing chain`);
			return true;
		}

		if (!hasCodeExploration && 1 < 3) {
			this.log(`Round ${1}: Missing code exploration, continuing chain`);
			return true;
		}

		if (!hasStructureAnalysis && 1 < 3) {
			this.log(`Round ${1}: Missing structure analysis, continuing chain`);
			return true;
		}

		// If we have basic coverage but it's still early rounds, continue for depth
		if (1 < 2) {
			this.log(`Round ${1}: Early round, continuing for deeper analysis`);
			return true;
		}

		// Stop if we have comprehensive coverage
		if (hasIssueAnalysis && hasCodeExploration && hasStructureAnalysis) {
			this.log(`Round ${1}: Have comprehensive analysis coverage, stopping chain`);
			return false;
		}

		return true;
	}

	/**
	 * Categorize tool results by analysis type
	 */
	private categorizeToolResults(results: ToolResult[]): {
		issueAnalysis: number;
		codeExploration: number;
		structureAnalysis: number;
		contentAnalysis: number;
	} {
		const categories = {
			issueAnalysis: 0,
			codeExploration: 0,
			structureAnalysis: 0,
			contentAnalysis: 0
		};

		results.forEach(result => {
			if (!result.success) return;

			const toolName = result.functionCall.name;

			if (toolName.includes('issue') || toolName.includes('github-get-issue')) {
				categories.issueAnalysis++;
			} else if (toolName.includes('find-code') || toolName.includes('codebase-search') || toolName.includes('grep-search')) {
				categories.codeExploration++;
			} else if (toolName.includes('list-directory') || toolName.includes('analyze-dependencies') || toolName.includes('analyze-symbols')) {
				categories.structureAnalysis++;
			} else if (toolName.includes('read-file') || toolName.includes('extract-webpage')) {
				categories.contentAnalysis++;
			}
		});

		return categories;
	}

	/**
	 * Call LLM with messages
	 */
	protected async callLLM(messages: CoreMessage[]): Promise<string> {
		const { text } = await generateText({
			model: this.llmConfig.openai(this.llmConfig.fullModel),
			messages,
			temperature: 0.3,
			maxTokens: 4000
		});

		return text;
	}

	/**
	 * Update conversation history with enhanced context
	 */
	private updateConversationHistory(userInput: string, assistantResponse: string): void {
		this.conversationHistory.push(
			{ role: "user", content: userInput },
			{ role: "assistant", content: assistantResponse }
		);

		if (this.conversationHistory.length > 20) {
			this.conversationHistory = this.conversationHistory.slice(-20);
		}
	}

	/**
	 * Clear conversation history
	 */
	clearHistory(): void {
		this.conversationHistory = [];
		this.log('Conversation history cleared');
	}

	/**
	 * Get available tools
	 */
	getAvailableTools(): string[] {
		return this.toolExecutor.getAvailableTools();
	}

	/**
	 * Get LLM provider info
	 */
	getLLMInfo(): { provider: string; model: string } {
		return {
			provider: this.llmConfig.providerName,
			model: this.llmConfig.fullModel
		};
	}

	/**
	 * Extract GitHub context from user input and tool results
	 */
	private extractGitHubContext(userInput: string, toolResults: ToolResult[]): {
		owner: string;
		repo: string;
		issueNumber: number
	} | undefined {
		// First, try to use GitHub context from configuration (from GitHub Actions environment)
		if (this.config.githubContext) {
			this.log('Using GitHub context from configuration:', this.config.githubContext);
			return {
				owner: this.config.githubContext.owner,
				repo: this.config.githubContext.repo,
				issueNumber: this.config.githubContext.issueNumber
			};
		}

		// Second, try to extract from user input
		const inputMatch = userInput.match(/(?:github\.com\/|^|\s)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/issues\/|#)(\d+)/i);
		if (inputMatch) {
			return {
				owner: inputMatch[1],
				repo: inputMatch[2],
				issueNumber: parseInt(inputMatch[3])
			};
		}

		// Finally, try to extract from tool results
		for (const result of toolResults) {
			if (result.success && result.functionCall.name.includes('github')) {
				const params = result.functionCall.parameters;
				if (params.owner && params.repo && (params.issue_number || params.issueNumber)) {
					return {
						owner: params.owner,
						repo: params.repo,
						issueNumber: params.issue_number || params.issueNumber
					};
				}
			}
		}

		return undefined;
	}

	/**
	 * Format agent response for display with enhanced information
	 */
	static formatResponse(response: AgentResponse, options?: { autoUpload?: boolean; githubToken?: string }): string {
		const output: string[] = [];

		// Add execution summary if available
		if (response.totalRounds !== undefined || response.executionTime !== undefined) {
			const summary: string[] = [];
			if (response.totalRounds !== undefined) {
				summary.push(`${response.totalRounds} rounds`);
			}
			if (response.executionTime !== undefined) {
				summary.push(`${response.executionTime}ms`);
			}
			output.push(`📊 Execution: ${summary.join(', ')}`);
			output.push('');
		}

		if (response.text) {
			output.push(response.text);
		}

		if (response.toolResults.length > 0) {
			output.push('\n' + '='.repeat(60));
			output.push('🔧 Tool Execution Details:');

			// Group by round if available
			const resultsByRound = new Map<number, ToolResult[]>();
			response.toolResults.forEach(result => {
				const round = result.round || 1;
				if (!resultsByRound.has(round)) {
					resultsByRound.set(round, []);
				}
				resultsByRound.get(round)!.push(result);
			});

			for (const [round, results] of resultsByRound) {
				if (resultsByRound.size > 1) {
					output.push(`\n📍 Round ${round}:`);
				}

				for (const result of results) {
					const { functionCall, success, result: toolResult, error, executionTime } = result;

					const timeInfo = executionTime ? ` (${executionTime}ms)` : '';
					output.push(`\n🔧 Tool: ${functionCall.name}${timeInfo}`);

					if (success && toolResult) {
						// Extract text content from MCP tool result format
						if (toolResult.content && Array.isArray(toolResult.content)) {
							const textContent = toolResult.content
								.filter((item: any) => item.type === 'text')
								.map((item: any) => item.text)
								.join('\n');

							if (textContent) {
								// Truncate very long results for display
								const truncated = textContent.length > 1000 ?
									textContent.substring(0, 1000) + '\n... (truncated)' :
									textContent;
								output.push(`✅ Result:\n${truncated}`);
							} else {
								output.push(`✅ Completed successfully`);
							}
						} else {
							output.push(`✅ Result: ${JSON.stringify(toolResult, null, 2)}`);
						}
					} else {
						output.push(`❌ Error: ${error}`);
					}
				}
			}

			// Add summary statistics
			const successful = response.toolResults.filter(r => r.success).length;
			const total = response.toolResults.length;
			output.push(`\n📈 Summary: ${successful}/${total} tools executed successfully`);
		}

		if (!response.success && response.error) {
			output.push('\n❌ Error: ' + response.error);
		}

		return output.join('\n');
	}

	/**
	 * Clean up resources and prepare for shutdown
	 */
	async cleanup(): Promise<void> {
		try {
			this.log('Cleaning up AI Agent resources...');

			// Clear conversation history to free memory
			this.conversationHistory = [];

			// Reset tool executor stats
			this.toolExecutor.resetExecutionStats();

			this.log('AI Agent cleanup completed');
		} catch (error) {
			console.warn('Warning during AI Agent cleanup:', error);
		}
	}

	/**
	 * Logging utility
	 */
	protected log(message: string, data?: any): void {
		if (this.config.verbose) {
			console.log(`[AIAgent] ${message}`, data || '');
		}
	}

	/**
	 * Export memories to markdown file at the end of conversation
	 * This uses LLM to generate a summary of the conversation
	 */
	private async exportMemoriesToMarkdown(): Promise<void> {
		try {
			if (this.conversationHistory.length === 0) {
				this.log('No conversation history to summarize');
				return;
			}

			this.log('Saving conversation summary');

			// 使用 project-memory 工具保存摘要
			const toolCall = {
				name: 'project-memory',
				parameters: {
					conversation_history: this.conversationHistory
				}
			};

			// 执行工具
			await this.toolExecutor.executeToolsWithContext({
				round: 0,
				previousResults: [],
				userInput: 'Summarize and save conversation',
				workspacePath: this.config.workspacePath || process.cwd()
			}, [toolCall]);

			this.log('Conversation summary saved');
		} catch (error) {
			console.warn('Warning during memory export:', error);
		}
	}

	/**
	 * Execute function calls for the current round
	 */
	private async executeFunctionCalls(functionCalls: any[]): Promise<ToolResult[]> {
		this.log(`Executing ${functionCalls.length} function calls`);
		return this.toolExecutor.executeToolsWithContext({
			round: 1,
			previousResults: [],
			userInput: '',
			workspacePath: this.config.workspacePath || process.cwd()
		}, functionCalls);
	}
}
