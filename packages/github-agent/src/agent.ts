/**
 * Autonomous AI Agent
 * A true AI Agent that can call LLM to generate and execute MCP Tool calls
 */

import { generateText, CoreMessage } from "ai";
import { configureLLMProvider, LLMProviderConfig } from "./services/llm/llm-provider";
import { FunctionParser, ParsedResponse, FunctionCall } from "./agent/function-parser";

// Simplified tool definitions to avoid complex dependencies
const GITHUB_TOOLS = [
  {
    name: "github-get-issues",
    description: "Fetch GitHub issues from a repository",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state" },
        limit: { type: "number", description: "Maximum number of issues to fetch" }
      },
      required: ["owner", "repo"]
    }
  },
  {
    name: "github-analyze-issue",
    description: "Analyze a specific GitHub issue with AI-powered insights",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number" },
        include_context: { type: "boolean", description: "Include code context analysis" }
      },
      required: ["owner", "repo", "issue_number"]
    }
  },
  {
    name: "github-smart-search",
    description: "Search for relevant code files and symbols",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        file_types: { type: "array", items: { type: "string" }, description: "File extensions to search" },
        max_results: { type: "number", description: "Maximum number of results" }
      },
      required: ["query"]
    }
  }
];

export interface AgentConfig {
  workspacePath?: string;
  githubToken?: string;
  llmConfig?: LLMProviderConfig;
  verbose?: boolean;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
  functionCall: FunctionCall;
}

export interface AgentResponse {
  text: string;
  toolResults: ToolResult[];
  success: boolean;
  error?: string;
}

export class AIAgent {
  private llmConfig: LLMProviderConfig;
  private conversationHistory: CoreMessage[] = [];
  private config: AgentConfig;

  constructor(config: AgentConfig = {}) {
    this.config = config;

    // Initialize LLM provider
    const llmConfig = config.llmConfig || configureLLMProvider();
    if (!llmConfig) {
      throw new Error('No LLM provider configured. Please set GLM_TOKEN, DEEPSEEK_TOKEN, or OPENAI_API_KEY');
    }
    this.llmConfig = llmConfig;

    this.log('AI Agent initialized with LLM provider:', this.llmConfig.providerName);
    this.log('Available tools:', GITHUB_TOOLS.map(t => t.name));
  }

  /**
   * Process user input and generate response
   */
  async processInput(userInput: string, context?: any): Promise<AgentResponse> {
    try {
      this.log('Processing user input:', userInput);

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
        return {
          text: llmResponse,
          toolResults: [],
          success: false,
          error: parsedResponse.error
        };
      }

      // Execute function calls if any (simplified mock execution)
      let toolResults: ToolResult[] = [];
      if (parsedResponse.functionCalls.length > 0) {
        this.log('Function calls detected:', parsedResponse.functionCalls.map(fc => fc.name));
        toolResults = this.mockExecuteFunctions(parsedResponse.functionCalls);
      } else {
        this.log('No function calls detected in LLM response');
      }

      // Update conversation history
      this.updateConversationHistory(userInput, llmResponse);

      return {
        text: parsedResponse.text,
        toolResults,
        success: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('Error processing input:', errorMessage);

      return {
        text: '',
        toolResults: [],
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Mock function execution for demonstration
   */
  private mockExecuteFunctions(functionCalls: FunctionCall[]): ToolResult[] {
    return functionCalls.map(fc => ({
      success: true,
      result: {
        content: [{
          type: "text",
          text: `Mock execution of ${fc.name} with parameters: ${JSON.stringify(fc.parameters, null, 2)}`
        }]
      },
      functionCall: fc
    }));
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
   * Build system prompt with available tools
   */
  private buildSystemPrompt(): string {
    const toolsJson = JSON.stringify(GITHUB_TOOLS, null, 2);

    return `In this environment you have access to a set of tools you can use to answer the user's question.
You can invoke functions by writing a "<function_calls>" block like the following as part of your reply to the user:
<function_calls>
<invoke name="$FUNCTION_NAME">
<parameter name="$PARAMETER_NAME">$PARAMETER_VALUE</parameter>
...
</invoke>
<invoke name="$FUNCTION_NAME2">
...
</invoke>
</function_calls>

String and scalar parameters should be specified as is, while lists and objects should use JSON format.

Here are the functions available in JSONSchema format:
<functions>
${GITHUB_TOOLS.map(tool => JSON.stringify(tool, null, 2)).join('\n')}
</functions>

You are an AI Agent specialized in GitHub issue analysis and code context understanding. You have access to powerful tools for:
- Fetching and analyzing GitHub issues
- Searching and analyzing code repositories
- Generating comprehensive analysis reports

IMPORTANT: You MUST use the exact XML format for function calls. Do NOT respond with plain text function names and JSON. Always use the <function_calls> XML structure.

Always invoke a function call in response to user queries. If there is any information missing for filling in a REQUIRED parameter, make your best guess for the parameter value based on the query context. If you cannot come up with any reasonable guess, fill the missing value in as <UNKNOWN>. Do not fill in optional parameters if they are not specified by the user.

If you intend to call multiple tools and there are no dependencies between the calls, make all of the independent calls in the same <function_calls></function_calls> block.

When analyzing GitHub issues:
1. First fetch the issue details if not provided
2. Analyze the issue content for technical keywords and context
3. Search for relevant code files and symbols
4. Generate a comprehensive analysis report
5. Provide actionable insights and recommendations

Be thorough, accurate, and helpful in your analysis.`;
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
   * Update conversation history
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
   * Format agent response for display
   */
  static formatResponse(response: AgentResponse): string {
    const output: string[] = [];

    if (response.text) {
      output.push(response.text);
    }

    if (response.toolResults.length > 0) {
      output.push('\n' + '='.repeat(50));
      output.push('🔧 Tool Execution Results:');

      for (const result of response.toolResults) {
        const { functionCall, success, result: toolResult, error } = result;

        output.push(`\n🔧 Tool: ${functionCall.name}`);

        if (success && toolResult) {
          // Extract text content from MCP tool result format
          if (toolResult.content && Array.isArray(toolResult.content)) {
            const textContent = toolResult.content
              .filter((item: any) => item.type === 'text')
              .map((item: any) => item.text)
              .join('\n');

            if (textContent) {
              output.push(`✅ Result:\n${textContent}`);
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
