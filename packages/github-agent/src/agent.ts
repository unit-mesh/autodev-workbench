/**
 * Autonomous AI Agent
 * A true AI Agent that can call LLM to generate and execute MCP Tool calls
 */

import { generateText, CoreMessage } from "ai";
import { configureLLMProvider, LLMProviderConfig } from "./services/llm/llm-provider";
import { FunctionParser, ParsedResponse, FunctionCall } from "./agent/function-parser";
import { GitHubTools } from "./capabilities/tools";
import { ToolLike } from "./capabilities/_typing";

// Real tool definitions extracted from MCP tools
const GITHUB_TOOLS = [
  {
    name: "github_get_issues",
    description: "Get GitHub issues from a repository",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner (username or organization)" },
        repo: { type: "string", description: "Repository name" },
        state: { type: "string", enum: ["open", "closed", "all"], description: "State of issues to retrieve" },
        per_page: { type: "number", description: "Number of issues per page (1-100)" }
      },
      required: ["owner", "repo"]
    }
  },
  {
    name: "github_analyze_issue",
    description: "Analyze a specific GitHub issue and find related code in the current workspace",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner (username or organization)" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number to analyze" },
        workspace_path: { type: "string", description: "Path to the workspace to analyze" },
        fetch_urls: { type: "boolean", description: "Whether to fetch content from URLs mentioned in the issue" }
      },
      required: ["owner", "repo", "issue_number"]
    }
  },
  {
    name: "github_smart_search",
    description: "Intelligently search for code related to GitHub issues using AI-generated keywords",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner (username or organization)" },
        repo: { type: "string", description: "Repository name" },
        query: { type: "string", description: "Search query - can be an issue description, error message, or feature request" },
        workspace_path: { type: "string", description: "Path to the workspace to analyze" },
        search_depth: { type: "string", enum: ["shallow", "medium", "deep"], description: "Search depth" }
      },
      required: ["owner", "repo", "query"]
    }
  }
];

export interface AgentConfig {
  workspacePath?: string;
  githubToken?: string;
  llmConfig?: LLMProviderConfig;
  verbose?: boolean;
  maxToolRounds?: number;
  enableToolChaining?: boolean;
  toolTimeout?: number;
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
      maxToolRounds: 3,
      enableToolChaining: true,
      toolTimeout: 120000, // Increased from 30s to 120s for better handling of large repositories
      ...config
    };

    // Initialize LLM provider
    const llmConfig = config.llmConfig || configureLLMProvider();
    if (!llmConfig) {
      throw new Error('No LLM provider configured. Please set GLM_TOKEN, DEEPSEEK_TOKEN, or OPENAI_API_KEY');
    }
    this.llmConfig = llmConfig;

    // Register real tool handlers
    this.registerToolHandlers();

    this.log('AI Agent initialized with LLM provider:', this.llmConfig.providerName);
    this.log('Available tools:', GITHUB_TOOLS.map(t => t.name));
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
    GitHubTools.forEach(installer => {
      try {
        installer(mockInstaller);
      } catch (error) {
        console.warn(`Failed to register tool:`, error);
      }
    });

    this.log(`Registered ${this.toolHandlers.size} tool handlers:`, Array.from(this.toolHandlers.keys()));
  }

  /**
   * Process user input and generate response with enhanced tool chaining
   */
  async processInput(userInput: string, context?: any): Promise<AgentResponse> {
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
    let allToolResults: ToolResult[] = [];
    let currentRound = 1;
    let lastLLMResponse = '';

    this.log('Starting tool chaining process with max rounds:', this.config.maxToolRounds);

    while (currentRound <= this.config.maxToolRounds!) {
      this.log(`=== Tool Execution Round ${currentRound} ===`);

      // Build messages for current round
      const messages = this.buildMessagesForRound(userInput, context, allToolResults, currentRound);

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

      // Check if we should continue
      const shouldContinue = this.shouldContinueToolChain(roundResults, currentRound);
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

    return {
      text: finalResponse,
      toolResults: allToolResults,
      success: true,
      totalRounds: currentRound - 1,
      executionTime
    };
  }

  /**
   * Process input with single round (legacy mode)
   */
  private async processInputSingleRound(userInput: string, startTime: number, context?: any): Promise<AgentResponse> {
    // Build messages for LLM
    const messages = this.buildMessages(userInput, context);

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

        return {
          text: finalResponse,
          toolResults,
          success: true,
          totalRounds: 1,
          executionTime
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
    if (!enhanced.workspace_path && (toolName === 'github_analyze_issue' || toolName === 'github_smart_search')) {
      enhanced.workspace_path = context.workspacePath;
    }

    // Add context from previous results if relevant
    if (context.previousResults.length > 0 && toolName === 'github_smart_search') {
      const previousAnalysis = context.previousResults
        .filter(r => r.success && r.functionCall.name === 'github_analyze_issue')
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

  private shouldContinueToolChain(roundResults: ToolResult[], currentRound: number): boolean {
    // Don't continue if we've reached max rounds
    if (currentRound >= this.config.maxToolRounds!) {
      return false;
    }

    // Don't continue if all tools failed
    const successfulTools = roundResults.filter(r => r.success);
    if (successfulTools.length === 0) {
      this.log(`Round ${currentRound}: All tools failed, stopping chain`);
      return false;
    }

    // Don't continue if we have comprehensive results
    const hasAnalysisResult = roundResults.some(r =>
      r.success && r.functionCall.name === 'github_analyze_issue'
    );
    const hasSearchResult = roundResults.some(r =>
      r.success && r.functionCall.name === 'github_smart_search'
    );

    if (hasAnalysisResult && hasSearchResult) {
      this.log(`Round ${currentRound}: Have both analysis and search results, stopping chain`);
      return false;
    }

    return true;
  }

  private buildMessagesForRound(
    userInput: string,
    context: any,
    previousResults: ToolResult[],
    round: number
  ): CoreMessage[] {
    const messages: CoreMessage[] = [];

    // Add system prompt for current round
    if (round === 1) {
      messages.push({
        role: "system",
        content: this.buildEnhancedSystemPrompt()
      });
    } else {
      messages.push({
        role: "system",
        content: this.buildContinuationSystemPrompt(round, previousResults)
      });
    }

    // Add conversation history (but limit it for multi-round)
    const historyLimit = Math.max(0, this.conversationHistory.length - 10);
    messages.push(...this.conversationHistory.slice(historyLimit));

    // Add current user input with context
    const userPrompt = this.buildUserPromptForRound(userInput, context, previousResults, round);
    messages.push({
      role: "user",
      content: userPrompt
    });

    return messages;
  }

  private buildUserPromptForRound(
    userInput: string,
    context: any,
    previousResults: ToolResult[],
    round: number
  ): string {
    if (round === 1) {
      return context ?
        `Context: ${JSON.stringify(context, null, 2)}\n\nUser Request: ${userInput}` :
        userInput;
    }

    // For subsequent rounds, include previous results
    const previousSummary = this.summarizePreviousResults(previousResults);
    return `Original Request: ${userInput}

Previous Tool Results Summary:
${previousSummary}

Based on the previous results, determine if you need to call additional tools to provide a more comprehensive analysis. If the previous results are sufficient, provide your final analysis without calling more tools.`;
  }

  private summarizePreviousResults(results: ToolResult[]): string {
    const summary = results.map(result => {
      if (result.success) {
        return `✅ ${result.functionCall.name}: Completed successfully (Round ${result.round})`;
      } else {
        return `❌ ${result.functionCall.name}: Failed - ${result.error} (Round ${result.round})`;
      }
    }).join('\n');

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return `${summary}\n\nSummary: ${successCount}/${totalCount} tools executed successfully`;
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

    const comprehensivePrompt = `Based on the user's request and the multi-round tool execution results, provide a comprehensive analysis and answer.

User Request: ${userInput}

Execution Summary:
${executionSummary}

Tool Results Summary:
${toolResultsSummary}

${failedResults.length > 0 ? `Failed Tools:
${failedResults.map(r => `- ${r.functionCall.name}: ${r.error}`).join('\n')}

` : ''}Please provide a comprehensive response that:
1. Directly answers the user's question based on all available information
2. Synthesizes insights from multiple tool executions
3. Highlights the most important findings and patterns
4. Provides actionable recommendations
5. Notes any limitations or areas that need further investigation

Your response should be well-structured, clear, and demonstrate the value of the multi-step analysis process.`;

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
   * Build messages for LLM including system prompt and conversation history
   */
  private buildMessages(userInput: string, context?: any): CoreMessage[] {
    const messages: CoreMessage[] = [];

    // Add system prompt (only if conversation is starting)
    if (this.conversationHistory.length === 0) {
      messages.push({
        role: "system",
        content: this.buildSystemPrompt()
      });
    }

    // Add conversation history
    messages.push(...this.conversationHistory);

    // Add current user input
    const userPrompt = context ?
      `Context: ${JSON.stringify(context, null, 2)}\n\nUser Request: ${userInput}` :
      userInput;

    messages.push({
      role: "user",
      content: userPrompt
    });

    return messages;
  }

  /**
   * Build enhanced system prompt with available tools
   */
  private buildSystemPrompt(): string {
    return this.buildEnhancedSystemPrompt();
  }

  private buildEnhancedSystemPrompt(): string {
    const toolsJson = JSON.stringify(GITHUB_TOOLS, null, 2);

    return `You are an expert AI agent specialized in GitHub issue analysis and code investigation. You have access to powerful tools that can help you provide comprehensive analysis.

## Your Capabilities:
- Analyze GitHub issues and find related code
- Search codebases intelligently
- Fetch and analyze content from URLs
- Provide actionable insights and recommendations

## Tool Usage Guidelines:
1. **Start with issue analysis**: Use github_analyze_issue to get comprehensive issue details and initial code analysis
2. **Enhance with smart search**: Use github_smart_search for deeper code investigation if needed
3. **Be strategic**: Choose tools that best address the user's specific needs
4. **Chain tools intelligently**: Use results from one tool to inform parameters for subsequent tools

## CRITICAL: Function Call Format
You MUST use the exact XML format below to call functions. This is MANDATORY and NON-NEGOTIABLE.

**ONLY ACCEPTABLE FORMAT:**
<function_calls>
<invoke name="$FUNCTION_NAME">
<parameter name="$PARAMETER_NAME">$PARAMETER_VALUE</parameter>
</invoke>
</function_calls>

**EXAMPLE - Analyze GitHub Issue:**
<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="issue_number">81</parameter>
<parameter name="fetch_urls">true</parameter>
</invoke>
</function_calls>

**FORBIDDEN FORMATS (WILL BE IGNORED):**
- github_analyze_issue {"owner": "...", "repo": "..."}
- {"function": "github_analyze_issue", "parameters": {...}}
- github_analyze_issue(owner="...", repo="...")
- Any JSON format
- Any function call syntax without XML tags

**IMPORTANT:** If you don't use the exact XML format above, your function calls will be completely ignored and the user will not get the help they need.

## Example Usage Patterns:

**For issue analysis:**
<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="issue_number">81</parameter>
<parameter name="fetch_urls">true</parameter>
</invoke>
</function_calls>

**For code search:**
<function_calls>
<invoke name="github_smart_search">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="query">authentication error handling</parameter>
<parameter name="search_depth">medium</parameter>
</invoke>
</function_calls>

## Available Tools:
<functions>
${GITHUB_TOOLS.map(tool => JSON.stringify(tool, null, 2)).join('\n')}
</functions>

## Important Notes:
- Always provide clear, actionable analysis
- Explain your reasoning for tool choices
- Synthesize information from multiple sources
- Focus on helping users understand and resolve issues
`;
  }

  private buildContinuationSystemPrompt(round: number, previousResults: ToolResult[]): string {
    const successfulTools = previousResults.filter(r => r.success).map(r => r.functionCall.name);
    const failedTools = previousResults.filter(r => !r.success).map(r => r.functionCall.name);

    return `You are continuing a multi-round analysis (Round ${round}).

## Previous Execution Summary:
- Successful tools: ${successfulTools.join(', ') || 'None'}
- Failed tools: ${failedTools.join(', ') || 'None'}

## Guidelines for This Round:
1. **Review previous results**: Consider what information you already have
2. **Identify gaps**: Determine what additional analysis would be valuable
3. **Avoid redundancy**: Don't repeat successful tool calls unless necessary
4. **Be strategic**: Only call tools that will add meaningful value
5. **Consider completion**: If you have sufficient information, provide your final analysis instead of calling more tools

## Decision Framework:
- If previous results provide comprehensive coverage → Provide final analysis
- If specific areas need deeper investigation → Call targeted tools
- If previous tools failed → Try alternative approaches or tools

You have the same tools available as before. Use them wisely to build upon previous results.`;
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
    return GITHUB_TOOLS.map(tool => tool.name);
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
   * Format agent response for display with enhanced information
   */
  static formatResponse(response: AgentResponse): string {
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
   * Logging utility
   */
  private log(message: string, data?: any): void {
    if (this.config.verbose) {
      console.log(`[AIAgent] ${message}`, data || '');
    }
  }
}
