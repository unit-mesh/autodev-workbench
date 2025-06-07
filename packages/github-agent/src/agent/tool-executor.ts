/**
 * Tool Executor for AI Agent
 * Executes MCP tool calls safely and manages results
 */

import { FunctionCall } from "./function-parser";
import { ToolLike } from "../capabilities/_typing";

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
  functionCall: FunctionCall;
}

export interface ExecutionContext {
  workspacePath?: string;
  githubToken?: string;
  llmConfig?: any;
  [key: string]: any;
}

export class ToolExecutor {
  private registeredTools: Map<string, Function> = new Map();
  private context: ExecutionContext;

  constructor(context: ExecutionContext = {}) {
    this.context = context;
  }

  /**
   * Register tools from MCP tool installers
   */
  registerTools(toolInstallers: readonly ToolLike[]): void {
    // Create a mock installer that captures tool handlers
    const mockInstaller = (
      name: string,
      description: string,
      inputSchema: Record<string, any>,
      handler: Function
    ) => {
      this.registeredTools.set(name, handler);
    };

    // Execute tool installers to register handlers
    toolInstallers.forEach(installer => {
      try {
        installer(mockInstaller);
      } catch (error) {
        console.warn(`Failed to register tool:`, error);
      }
    });

    console.log(`Registered ${this.registeredTools.size} tools:`, Array.from(this.registeredTools.keys()));
  }

  /**
   * Execute a single function call
   */
  async executeFunction(functionCall: FunctionCall): Promise<ToolResult> {
    const { name, parameters } = functionCall;

    try {
      const handler = this.registeredTools.get(name);
      if (!handler) {
        return {
          success: false,
          error: `Tool '${name}' not found. Available tools: ${Array.from(this.registeredTools.keys()).join(', ')}`,
          functionCall
        };
      }

      console.log(`Executing tool: ${name} with parameters:`, parameters);
      
      // Execute the tool handler
      const result = await handler(parameters);
      
      console.log(`Tool ${name} completed successfully`);
      return {
        success: true,
        result,
        functionCall
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Tool ${name} failed:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        functionCall
      };
    }
  }

  /**
   * Execute multiple function calls in sequence
   */
  async executeFunctions(functionCalls: FunctionCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const functionCall of functionCalls) {
      const result = await this.executeFunction(functionCall);
      results.push(result);

      // If a critical tool fails, you might want to stop execution
      // For now, we continue with all tools
    }

    return results;
  }

  /**
   * Execute function calls in parallel (for independent calls)
   */
  async executeFunctionsParallel(functionCalls: FunctionCall[]): Promise<ToolResult[]> {
    const promises = functionCalls.map(functionCall => 
      this.executeFunction(functionCall)
    );

    return Promise.all(promises);
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): string[] {
    return Array.from(this.registeredTools.keys());
  }

  /**
   * Check if a tool is available
   */
  hasTools(toolName: string): boolean {
    return this.registeredTools.has(toolName);
  }

  /**
   * Update execution context
   */
  updateContext(newContext: Partial<ExecutionContext>): void {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Format tool results for display
   */
  static formatResults(results: ToolResult[]): string {
    const output: string[] = [];

    for (const result of results) {
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

    return output.join('\n');
  }

  /**
   * Extract successful results for further processing
   */
  static extractSuccessfulResults(results: ToolResult[]): any[] {
    return results
      .filter(result => result.success)
      .map(result => result.result);
  }

  /**
   * Check if any tools failed
   */
  static hasFailures(results: ToolResult[]): boolean {
    return results.some(result => !result.success);
  }

  /**
   * Get failure summary
   */
  static getFailureSummary(results: ToolResult[]): string {
    const failures = results.filter(result => !result.success);
    if (failures.length === 0) return '';

    return `${failures.length} tool(s) failed:\n` + 
           failures.map(f => `- ${f.functionCall.name}: ${f.error}`).join('\n');
  }
}
