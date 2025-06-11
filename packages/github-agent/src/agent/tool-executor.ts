/**
 * Tool Executor for AI Agent
 * Executes MCP tool calls safely and manages results
 */

import { FunctionCall } from "./function-parser";
import { ToolExecutionContext, ToolExecutionOptions, ToolResult } from "./tool-types";

export type { ToolResult, ToolExecutionContext, ToolExecutionOptions };

export class ToolExecutor {
  private toolHandlers: Map<string, Function> = new Map();
  private options: ToolExecutionOptions;
  private executionStats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageExecutionTime: 0
  };

  constructor(options: ToolExecutionOptions = {}) {
    this.options = {
      timeout: 120000,
      verbose: false,
      ...options
    };
  }

  /**
   * Register a tool handler
   */
  registerTool(name: string, handler: Function): void {
    this.toolHandlers.set(name, handler);
  }

  /**
   * Register multiple tool handlers
   */
  registerTools(handlers: Map<string, Function>): void {
    handlers.forEach((handler, name) => {
      this.registerTool(name, handler);
    });
  }

  /**
   * Execute tools with context and error handling
   */
  async executeToolsWithContext(
    context: ToolExecutionContext,
    functionCalls: FunctionCall[]
  ): Promise<ToolResult[]> {
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
        const result = await this.executeWithTimeout(handler, enhancedParameters, this.options.timeout!);

        const executionTime = Date.now() - startTime;
        this.log(`Round ${context.round}: Tool ${name} completed successfully in ${executionTime}ms`);

        results.push({
          success: true,
          result,
          functionCall,
          executionTime,
          round: context.round
        });

        this.updateExecutionStats(true, executionTime);

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

        this.updateExecutionStats(false, executionTime);
      }
    }

    return results;
  }

  /**
   * Get available tools
   */
  getAvailableTools(): string[] {
    return Array.from(this.toolHandlers.keys());
  }

  /**
   * Get execution statistics
   */
  getExecutionStats() {
    return { ...this.executionStats };
  }

  /**
   * Reset execution statistics
   */
  resetExecutionStats(): void {
    this.executionStats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageExecutionTime: 0
    };
  }

  /**
   * Helper methods
   */
  private enhanceToolParameters(
    parameters: Record<string, any>,
    context: ToolExecutionContext,
    toolName: string
  ): Record<string, any> {
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

  private updateExecutionStats(success: boolean, executionTime: number): void {
    this.executionStats.totalCalls++;
    if (success) {
      this.executionStats.successfulCalls++;
    } else {
      this.executionStats.failedCalls++;
    }

    // Update average execution time
    this.executionStats.averageExecutionTime =
      (this.executionStats.averageExecutionTime * (this.executionStats.totalCalls - 1) + executionTime) / this.executionStats.totalCalls;
  }

  private log(message: string, data?: any): void {
    if (this.options.verbose) {
      console.log(`[ToolExecutor] ${message}`, data || '');
    }
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
