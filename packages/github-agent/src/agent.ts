import {CoreMessage, generateText} from "ai";
import {configureLLMProvider, LLMProviderConfig} from "./services/llm";
import {FunctionCall, FunctionParser} from "./agent/function-parser";
import {AutoDevRemoteAgentTools} from "./capabilities/tools";
import {PromptBuilder, ToolDefinition} from "./agent/prompt-builder";

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
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
  functionCall: FunctionCall;
  executionTime?: number;
  round?: number;
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

export interface ToolExecutionContext {
  round: number;
  previousResults: ToolResult[];
  userInput: string;
  workspacePath: string;
}

export class AIAgent {
  private llmConfig: LLMProviderConfig;
  private conversationHistory: CoreMessage[] = [];
  private config: AgentConfig;
  private toolHandlers: Map<string, Function> = new Map();
  private promptBuilder: PromptBuilder = new PromptBuilder();
  private executionStats: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageExecutionTime: number;
  } = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageExecutionTime: 0
  };

  constructor(config: AgentConfig = {}) {
    this.config = {
      maxToolRounds: 5, // Increased from 3 to 5 for more comprehensive analysis
      enableToolChaining: true,
      toolTimeout: 120000, // Increased from 30s to 120s for better handling of large repositories
      autoUploadToIssue: config.autoUploadToIssue || false,
      ...config
    };

    // Initialize LLM provider
    const llmConfig = config.llmConfig || configureLLMProvider();
    if (!llmConfig) {
      throw new Error('No LLM provider configured. Please set GLM_TOKEN, DEEPSEEK_TOKEN, or OPENAI_API_KEY');
    }
    this.llmConfig = llmConfig;

    // Extract tool definitions from MCP tools using PromptBuilder
    AUTODEV_REMOTE_TOOLS = PromptBuilder.extractToolDefinitions(AutoDevRemoteAgentTools);
    this.promptBuilder.registerTools(AUTODEV_REMOTE_TOOLS);

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
   * Register real MCP tool handlers
   */
  private registerToolHandlers(): void {
    // Create a mock installer that captures tool handlers
    const mockInstaller = (
      name: string,
      description: string,
      inputSchema: Record<string, any>,
      handler: Function
    ) => {
      this.toolHandlers.set(name, handler);
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
      this.executionStats.totalCalls++;

      if (this.config.enableToolChaining) {
        return await this.processInputWithToolChaining(userInput, startTime, context);
      } else {
        return await this.processInputSingleRound(userInput, startTime, context);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('Error processing input:', errorMessage);
      this.executionStats.failedCalls++;

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
  private async processInputWithToolChaining(userInput: string, startTime: number, context?: any): Promise<AgentResponse> {
    const allToolResults: ToolResult[] = [];
    let currentRound = 1;
    let lastLLMResponse = '';

    this.log('Starting tool chaining process with max rounds:', this.config.maxToolRounds);

    while (currentRound <= this.config.maxToolRounds!) {
      this.log(`=== Tool Execution Round ${currentRound} ===`);

      // Build messages for current round
      const messages = this.promptBuilder.buildMessagesForRound(userInput, context, allToolResults, currentRound, this.conversationHistory);

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

      // Execute function calls for this round
      this.log(`Round ${currentRound}: Executing ${parsedResponse.functionCalls.length} function calls`);
      const roundResults = await this.executeToolsWithContext({
        round: currentRound,
        previousResults: allToolResults,
        userInput,
        workspacePath: this.config.workspacePath || process.cwd()
      }, parsedResponse.functionCalls);

      // Add round info to results
      roundResults.forEach(result => {
        result.round = currentRound;
      });

      allToolResults.push(...roundResults);

      // Check if we should continue (pass all results for comprehensive analysis)
      const shouldContinue = this.shouldContinueToolChain(roundResults, currentRound, allToolResults);
      if (!shouldContinue) {
        this.log(`Round ${currentRound}: Stopping tool chain based on results`);
        break;
      }

      currentRound++;
    }

    // Generate final comprehensive response
    const finalResponse = await this.generateComprehensiveFinalResponse(
      userInput,
      lastLLMResponse,
      allToolResults,
      currentRound - 1
    );

    // Update conversation history
    this.updateConversationHistory(userInput, finalResponse);

    const executionTime = Date.now() - startTime;
    this.updateExecutionStats(true, executionTime);

    const githubContext = this.extractGitHubContext(userInput, allToolResults);

    return {
      text: finalResponse,
      toolResults: allToolResults,
      success: true,
      totalRounds: currentRound - 1,
      executionTime,
      githubContext
    };
  }

  /**
   * Process input with single round (legacy mode)
   */
  private async processInputSingleRound(userInput: string, startTime: number, context?: any): Promise<AgentResponse> {
    // Build messages for LLM
    const messages = this.promptBuilder.buildMessages(userInput, context, this.conversationHistory);

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
      this.executionStats.failedCalls++;
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
      toolResults = await this.executeToolsWithContext({
        round: 1,
        previousResults: [],
        userInput,
        workspacePath: this.config.workspacePath || process.cwd()
      }, parsedResponse.functionCalls);

      // If we have tool results, send them back to LLM for final analysis
      if (toolResults.length > 0) {
        const finalResponse = await this.generateFinalResponse(userInput, parsedResponse.text, toolResults);

        // Update conversation history with final response
        this.updateConversationHistory(userInput, finalResponse);

        const executionTime = Date.now() - startTime;
        this.updateExecutionStats(true, executionTime);

        const githubContext = this.extractGitHubContext(userInput, toolResults);

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

    const executionTime = Date.now() - startTime;
    this.updateExecutionStats(true, executionTime);

    return {
      text: parsedResponse.text,
      toolResults,
      success: true,
      totalRounds: 0,
      executionTime
    };
  }

  /**
   * Execute tools with enhanced context and error handling
   */
  private async executeToolsWithContext(context: ToolExecutionContext, functionCalls: FunctionCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const functionCall of functionCalls) {
      const startTime = Date.now();
      const { name, parameters } = functionCall;

      try {
        const handler = this.toolHandlers.get(name);
        if (!handler) {
          results.push({
            success: false,
            error: `Tool '${name}' not found. Available tools: ${Array.from(this.toolHandlers.keys()).join(', ')}`,
            functionCall,
            executionTime: Date.now() - startTime,
            round: context.round
          });
          continue;
        }

        this.log(`Round ${context.round}: Executing tool: ${name} with parameters:`, parameters);

        // Enhance parameters with context
        const enhancedParameters = this.enhanceToolParameters(parameters, context, name);

        // Execute with timeout
        const result = await this.executeWithTimeout(handler, enhancedParameters, this.config.toolTimeout!);

        const executionTime = Date.now() - startTime;
        this.log(`Round ${context.round}: Tool ${name} completed successfully in ${executionTime}ms`);

        results.push({
          success: true,
          result,
          functionCall,
          executionTime,
          round: context.round
        });

      } catch (error) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.log(`Round ${context.round}: Tool ${name} failed after ${executionTime}ms:`, errorMessage);

        // Try to provide helpful error context
        const enhancedError = this.enhanceErrorMessage(errorMessage, name, context);

        results.push({
          success: false,
          error: enhancedError,
          functionCall,
          executionTime,
          round: context.round
        });
      }
    }

    return results;
  }

  /**
   * Helper methods for enhanced functionality
   */
  private enhanceToolParameters(parameters: Record<string, any>, context: ToolExecutionContext, toolName: string): Record<string, any> {
    const enhanced = { ...parameters };

    // Add workspace_path if not provided and tool supports it
    if (!enhanced.workspace_path && (
      toolName === 'github-get-issue-with-analysis' ||
      toolName === 'github-find-code-by-description'
    )) {
      enhanced.workspace_path = context.workspacePath;
    }

    // Add context from previous results if relevant
    if (context.previousResults.length > 0 && toolName === 'github-find-code-by-description') {
      const previousAnalysis = context.previousResults
        .filter(r => r.success && r.functionCall.name === 'github-get-issue-with-analysis')
        .map(r => r.result)
        .filter(Boolean);

      if (previousAnalysis.length > 0) {
        enhanced.context_from_previous_analysis = previousAnalysis;
      }
    }

    return enhanced;
  }

  private async executeWithTimeout<T>(handler: Function, parameters: any, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${timeout}ms`));
      }, timeout);

      handler(parameters)
        .then((result: T) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error: any) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private enhanceErrorMessage(error: string, toolName: string, context: ToolExecutionContext): string {
    let enhanced = `Tool '${toolName}' failed: ${error}`;

    if (error.includes('GITHUB_TOKEN')) {
      enhanced += '\n💡 Tip: Make sure GITHUB_TOKEN environment variable is set with a valid GitHub personal access token.';
    } else if (error.includes('workspace') || error.includes('path')) {
      enhanced += `\n💡 Tip: Check if the workspace path '${context.workspacePath}' exists and is accessible.`;
    } else if (error.includes('timeout')) {
      enhanced += '\n💡 Tip: The operation timed out. Try reducing the scope or increasing the timeout.';
    } else if (context.round > 1) {
      enhanced += `\n💡 Context: This error occurred in round ${context.round} after ${context.previousResults.length} previous tool executions.`;
    }

    return enhanced;
  }

  private shouldContinueToolChain(roundResults: ToolResult[], currentRound: number, allResults?: ToolResult[]): boolean {
    // Don't continue if we've reached max rounds
    if (currentRound >= this.config.maxToolRounds!) {
      this.log(`Round ${currentRound}: Reached max rounds (${this.config.maxToolRounds}), stopping chain`);
      return false;
    }

    // Don't continue if all tools failed
    const successfulTools = roundResults.filter(r => r.success);
    if (successfulTools.length === 0) {
      this.log(`Round ${currentRound}: All tools failed, stopping chain`);
      return false;
    }

    // For comprehensive analysis, we want to encourage deeper investigation
    // Only stop if we have truly comprehensive coverage

    // Check what types of analysis we've done so far
    const allPreviousResults = allResults || [];
    const toolTypes = this.categorizeToolResults(allPreviousResults);

    // For documentation/architecture tasks, we need more comprehensive analysis
    const hasIssueAnalysis = toolTypes.issueAnalysis > 0;
    const hasCodeExploration = toolTypes.codeExploration > 0;
    const hasStructureAnalysis = toolTypes.structureAnalysis > 0;
    const hasContentAnalysis = toolTypes.contentAnalysis > 0;

    // Continue if we're missing key analysis types for comprehensive understanding
    if (!hasIssueAnalysis) {
      this.log(`Round ${currentRound}: Missing issue analysis, continuing chain`);
      return true;
    }

    if (!hasCodeExploration && currentRound < 3) {
      this.log(`Round ${currentRound}: Missing code exploration, continuing chain`);
      return true;
    }

    if (!hasStructureAnalysis && currentRound < 3) {
      this.log(`Round ${currentRound}: Missing structure analysis, continuing chain`);
      return true;
    }

    // If we have basic coverage but it's still early rounds, continue for depth
    if (currentRound < 2) {
      this.log(`Round ${currentRound}: Early round, continuing for deeper analysis`);
      return true;
    }

    // Stop if we have comprehensive coverage
    if (hasIssueAnalysis && hasCodeExploration && hasStructureAnalysis) {
      this.log(`Round ${currentRound}: Have comprehensive analysis coverage, stopping chain`);
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
   * Generate final response by sending tool results back to LLM
   */
  private async generateFinalResponse(
    userInput: string,
    initialResponse: string,
    toolResults: ToolResult[]
  ): Promise<string> {
    // Extract successful tool results
    const successfulResults = toolResults
      .filter(result => result.success)
      .map(result => {
        if (result.result?.content && Array.isArray(result.result.content)) {
          const textContent = result.result.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('\n');
          return `Tool ${result.functionCall.name} results:\n${textContent}`;
        }
        return `Tool ${result.functionCall.name} completed successfully`;
      })
      .join('\n\n');

    // Build final prompt for LLM
    const finalPrompt = `Based on the user's request and the tool execution results, provide a comprehensive analysis and answer.

User Request: ${userInput}

Tool Execution Results:
${successfulResults}

Please analyze the results and provide a helpful, detailed response to the user's request. Focus on:
1. Summarizing the key findings from the tool results
2. Answering the user's specific question
3. Providing actionable insights or recommendations
4. Highlighting any important issues or patterns found

Your response should be clear, well-structured, and directly address the user's needs.`;

    try {
      const { text } = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        messages: [
          { role: "system", content: "You are an expert GitHub issue analyst. Provide clear, actionable analysis based on the tool results." },
          { role: "user", content: finalPrompt }
        ],
        temperature: 0.3,
        maxTokens: 2000
      });

      return text;
    } catch (error) {
      this.log('Error generating final response:', error);
      return `${initialResponse}\n\n## Tool Results:\n${successfulResults}`;
    }
  }

  /**
   * Generate comprehensive final response for multi-round tool execution
   */
  private async generateComprehensiveFinalResponse(
    userInput: string,
    lastLLMResponse: string,
    allToolResults: ToolResult[],
    totalRounds: number
  ): Promise<string> {
    // Group results by round and success
    const resultsByRound = this.groupResultsByRound(allToolResults);
    const successfulResults = allToolResults.filter(r => r.success);
    const failedResults = allToolResults.filter(r => !r.success);

    // Build comprehensive summary
    const executionSummary = this.buildExecutionSummary(resultsByRound, totalRounds);
    const toolResultsSummary = this.buildToolResultsSummary(successfulResults);

    const comprehensivePrompt = `Based on the user's request and the results from multiple tool executions across ${totalRounds} rounds, provide a comprehensive, high-confidence analysis.

User Request:
${userInput}

Execution Summary:
${executionSummary}

Tool Results Summary:
${toolResultsSummary}

${failedResults.length > 0 ? `Failed Tools:
${failedResults.map(r => `- ${r.functionCall.name}: ${r.error}`).join('\n')}

` : ''}Please generate a well-structured, detailed final response that:

1. **Directly answers the user's question** using all available information across tools and rounds.
2. **Synthesizes insights** from the tools that returned successful results (${successfulResults.length} in total), especially where **consensus was observed** across multiple tool executions.
3. **Cites key results explicitly** (e.g., function name, tool name, or file path) to enhance traceability and confidence. Prefer formulations like:
   - "Tool \`${r.functionCall.name}\` successfully retrieved data from \`${r.filePath ?? 'N/A'}\`"
   - "Across ${totalRounds} rounds, X consistently indicated Y..."
4. **Highlights high-confidence findings** based on:
   - Repeated confirmation across tools
   - Low error rate
   - Converging results from different tool types
5. **Includes actionable recommendations** for next steps or code changes, clearly derived from the tools' output.
6. **Clearly state any known limitations, edge cases, or missing information**, especially where tool execution failed or returned uncertain results.

Be precise, transparent about assumptions, and emphasize where the multi-step analysis improves reliability or coverage.`;

    try {
      const { text } = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        messages: [
          {
            role: "system",
            content: "You are an expert GitHub issue analyst with access to comprehensive multi-tool analysis results. Provide detailed, actionable insights that synthesize information from multiple sources and analysis rounds."
          },
          { role: "user", content: comprehensivePrompt }
        ],
        temperature: 0.3,
        maxTokens: 3000
      });

      return text;
    } catch (error) {
      this.log('Error generating comprehensive final response:', error);
      // Fallback to simpler response
      return this.buildFallbackResponse(userInput, allToolResults, totalRounds);
    }
  }

  private groupResultsByRound(results: ToolResult[]): Map<number, ToolResult[]> {
    const grouped = new Map<number, ToolResult[]>();

    results.forEach(result => {
      const round = result.round || 1;
      if (!grouped.has(round)) {
        grouped.set(round, []);
      }
      grouped.get(round)!.push(result);
    });

    return grouped;
  }

  private buildExecutionSummary(resultsByRound: Map<number, ToolResult[]>, totalRounds: number): string {
    const summary: string[] = [];
    summary.push(`Completed ${totalRounds} rounds of tool execution:`);

    for (let round = 1; round <= totalRounds; round++) {
      const roundResults = resultsByRound.get(round) || [];
      const successful = roundResults.filter(r => r.success).length;
      const total = roundResults.length;
      const tools = roundResults.map(r => r.functionCall.name).join(', ');

      summary.push(`  Round ${round}: ${successful}/${total} tools successful (${tools})`);
    }

    return summary.join('\n');
  }

  private buildToolResultsSummary(successfulResults: ToolResult[]): string {
    return successfulResults
      .map(result => {
        if (result.result?.content && Array.isArray(result.result.content)) {
          const textContent = result.result.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('\n');
          return `Tool ${result.functionCall.name} (Round ${result.round}):\n${textContent}`;
        }
        return `Tool ${result.functionCall.name} (Round ${result.round}): Completed successfully`;
      })
      .join('\n\n');
  }

  private buildFallbackResponse(userInput: string, allToolResults: ToolResult[], totalRounds: number): string {
    const successful = allToolResults.filter(r => r.success);
    const failed = allToolResults.filter(r => !r.success);

    return `# Analysis Results

**User Request:** ${userInput}

**Execution Summary:** Completed ${totalRounds} rounds with ${successful.length} successful and ${failed.length} failed tool executions.

**Tool Results:**
${successful.map(r => `- ✅ ${r.functionCall.name} (Round ${r.round})`).join('\n')}
${failed.map(r => `- ❌ ${r.functionCall.name} (Round ${r.round}): ${r.error}`).join('\n')}

**Note:** This is a fallback response due to an error in generating the comprehensive analysis.`;
  }









  /**
   * Call LLM with messages
   */
  private async callLLM(messages: CoreMessage[]): Promise<string> {
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

    // Keep conversation history manageable (last 10 exchanges)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  /**
   * Update execution statistics
   */
  private updateExecutionStats(success: boolean, executionTime: number): void {
    if (success) {
      this.executionStats.successfulCalls++;
    } else {
      this.executionStats.failedCalls++;
    }

    // Update average execution time
    const totalCalls = this.executionStats.successfulCalls + this.executionStats.failedCalls;
    this.executionStats.averageExecutionTime =
      (this.executionStats.averageExecutionTime * (totalCalls - 1) + executionTime) / totalCalls;
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
    return AUTODEV_REMOTE_TOOLS.map(tool => tool.name);
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
   * Get execution statistics
   */
  getExecutionStats(): typeof this.executionStats {
    return { ...this.executionStats };
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Update agent configuration
   */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('Configuration updated:', newConfig);
  }

  /**
   * Extract GitHub context from user input and tool results
   */
  private extractGitHubContext(userInput: string, toolResults: ToolResult[]): { owner: string; repo: string; issueNumber: number } | undefined {
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
   * @param response - The agent response to format
   * @param options - Optional formatting options
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

      // Clear tool handlers
      this.toolHandlers.clear();

      // Reset execution stats
      this.executionStats = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageExecutionTime: 0
      };

      this.log('AI Agent cleanup completed');
    } catch (error) {
      console.warn('Warning during AI Agent cleanup:', error);
    }
  }

  /**
   * Logging utility
   */
  private log(message: string, data?: any): void {
    if (this.config.verbose) {
      console.log(`[AIAgent] ${message}`, data || '');
    }
  }
}
