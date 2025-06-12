/**
 * Tool Executor for AI Agent
 * Executes MCP tool calls safely and manages results
 * Enhanced with parallel execution, performance monitoring, and intelligent caching
 */

import { FunctionCall, ToolExecutionContext, ToolExecutionOptions, ToolResult } from "./tool-definition";

export type { ToolResult, ToolExecutionContext, ToolExecutionOptions };

// Define tool handler function type
export type ToolHandler = (parameters: Record<string, any>) => Promise<any>;

// Enhanced execution statistics interface
interface DetailedExecutionStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageExecutionTime: number;
  toolStats: Map<string, {
    count: number;
    averageTime: number;
    maxTime: number;
    successRate: number;
  }>;
  parallelExecutions: number;
  cacheHits: number;
  cacheMisses: number;
}

// Tool dependency graph for intelligent parallel execution
interface ToolDependency {
  name: string;
  dependencies: string[];
  canRunInParallel: boolean;
}

// Simple cache entry interface
interface CacheEntry {
  result: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
}

export class ToolExecutor {
  private toolHandlers: Map<string, ToolHandler> = new Map();
  private options: ToolExecutionOptions & {
    enableParallelExecution?: boolean;
    maxConcurrency?: number;
    enableCaching?: boolean;
    cacheTTL?: number;
  };
  private executionStats: DetailedExecutionStats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageExecutionTime: 0,
    toolStats: new Map(),
    parallelExecutions: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  // Simple in-memory cache
  private cache: Map<string, CacheEntry> = new Map();

  // Tool dependency definitions
  private toolDependencies: Map<string, ToolDependency> = new Map([
    ['github-get-issue-with-analysis', { name: 'github-get-issue-with-analysis', dependencies: [], canRunInParallel: true }],
    ['list-directory', { name: 'list-directory', dependencies: [], canRunInParallel: true }],
    ['grep-search', { name: 'grep-search', dependencies: ['github-get-issue-with-analysis'], canRunInParallel: false }],
    ['read-file', { name: 'read-file', dependencies: ['list-directory'], canRunInParallel: true }],
    ['github-find-code-by-description', { name: 'github-find-code-by-description', dependencies: ['github-get-issue-with-analysis'], canRunInParallel: false }]
  ]);

  constructor(options: ToolExecutionOptions & {
    enableParallelExecution?: boolean;
    maxConcurrency?: number;
    enableCaching?: boolean;
    cacheTTL?: number;
  } = {}) {
    this.options = {
      timeout: 120000,
      verbose: false,
      enableParallelExecution: true,
      maxConcurrency: 3,
      enableCaching: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      ...options
    };

    // Start cache cleanup interval
    if (this.options.enableCaching) {
      setInterval(() => this.cleanupExpiredCache(), 60000); // Cleanup every minute
    }
  }

  /**
   * Register a tool handler
   */
  registerTool(name: string, handler: ToolHandler): void {
    this.toolHandlers.set(name, handler);
  }

  /**
   * Register multiple tool handlers
   */
  registerTools(handlers: Map<string, ToolHandler>): void {
    handlers.forEach((handler, name) => {
      this.registerTool(name, handler);
    });
  }

  /**
   * Get list of available tool names
   */
  getAvailableToolNames(): string[] {
    return Array.from(this.toolHandlers.keys());
  }

  /**
   * Check if a tool is available
   */
  hasToolAvailable(toolName: string): boolean {
    return this.toolHandlers.has(toolName);
  }

  /**
   * Execute tools with context and error handling
   * Enhanced with parallel execution capability
   */
  async executeToolsWithContext(
    context: ToolExecutionContext,
    functionCalls: FunctionCall[]
  ): Promise<ToolResult[]> {
    const startTime = Date.now();

    // Check if parallel execution is enabled and beneficial
    if (this.options.enableParallelExecution && functionCalls.length > 1) {
      this.log(`🔄 Attempting parallel execution for ${functionCalls.length} tools`);
      const parallelResults = await this.executeInParallel(context, functionCalls);
      if (parallelResults) {
        this.executionStats.parallelExecutions++;
        this.log(`✅ Parallel execution completed in ${Date.now() - startTime}ms`);
        return parallelResults;
      }
    }

    // Fallback to sequential execution
    this.log(`🔄 Sequential execution for ${functionCalls.length} tools`);
    return this.executeSequentially(context, functionCalls);
  }

  /**
   * Attempt parallel execution based on tool dependencies
   */
  private async executeInParallel(
    context: ToolExecutionContext,
    functionCalls: FunctionCall[]
  ): Promise<ToolResult[] | null> {
    try {
      const executionPlan = this.createExecutionPlan(functionCalls);
      const results: ToolResult[] = [];
      const completedTools = new Set<string>();

      this.log(`📋 Execution plan: ${executionPlan.length} stages`);

      for (let stage = 0; stage < executionPlan.length; stage++) {
        const stageTools = executionPlan[stage];
        this.log(`🎯 Stage ${stage + 1}/${executionPlan.length}: ${stageTools.length} tools`);

        // Execute tools in current stage in parallel
        const stagePromises = stageTools.map(functionCall =>
          this.executeSingleTool(context, functionCall, results)
        );

        const stageResults = await Promise.all(stagePromises);
        results.push(...stageResults);
        stageTools.forEach(fc => completedTools.add(fc.name));
      }

      return results;
    } catch (error) {
      this.log(`❌ Parallel execution failed: ${error}, falling back to sequential`);
      return null;
    }
  }

  /**
   * Create execution plan based on tool dependencies
   */
  private createExecutionPlan(functionCalls: FunctionCall[]): FunctionCall[][] {
    const plan: FunctionCall[][] = [];
    const remaining = [...functionCalls];
    const completed = new Set<string>();

    while (remaining.length > 0) {
      const currentStage: FunctionCall[] = [];

      // Find tools that can be executed in current stage
      for (let i = remaining.length - 1; i >= 0; i--) {
        const functionCall = remaining[i];
        const dependency = this.toolDependencies.get(functionCall.name);

        if (!dependency) {
          // Unknown tool, can execute immediately
          currentStage.push(functionCall);
          remaining.splice(i, 1);
          continue;
        }

        // Check if all dependencies are satisfied
        const canExecute = dependency.dependencies.every(dep =>
          completed.has(dep) || !functionCalls.some(fc => fc.name === dep)
        );

        if (canExecute) {
          currentStage.push(functionCall);
          remaining.splice(i, 1);
        }
      }

      // If no tools can be executed, force execute remaining tools
      if (currentStage.length === 0 && remaining.length > 0) {
        this.log(`⚠️ Circular dependency detected, forcing execution`);
        currentStage.push(...remaining);
        remaining.length = 0;
      }

      if (currentStage.length > 0) {
        plan.push(currentStage);
        currentStage.forEach(fc => completed.add(fc.name));
      }
    }

    return plan;
  }

  /**
   * Execute tools sequentially (fallback method)
   */
  private async executeSequentially(
    context: ToolExecutionContext,
    functionCalls: FunctionCall[]
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const functionCall of functionCalls) {
      const result = await this.executeSingleTool(context, functionCall, results);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a single tool with enhanced monitoring and caching
   */
  private async executeSingleTool(
    context: ToolExecutionContext,
    functionCall: FunctionCall,
    previousResults: ToolResult[]
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const { name, parameters } = functionCall;

    try {
      // Check cache first
      if (this.options.enableCaching) {
        const cacheKey = this.generateCacheKey(functionCall, context);
        const cachedResult = this.getFromCache(cacheKey);

        if (cachedResult) {
          this.executionStats.cacheHits++;
          this.log(`💾 Cache HIT for ${name}`);
          return {
            success: true,
            result: cachedResult,
            functionCall,
            executionTime: Date.now() - startTime,
            round: context.round
          };
        } else {
          this.executionStats.cacheMisses++;
        }
      }

      const handler = this.toolHandlers.get(name);
      if (!handler) {
        throw new Error(`Tool '${name}' not found. Available tools: ${Array.from(this.toolHandlers.keys()).join(', ')}`);
      }

      this.log(`Round ${context.round}: Executing tool: ${name}`);

      // Enhance parameters with context and previous results
      const enhancedParameters = this.enhanceToolParameters(parameters, context, name, previousResults);

      // Execute with timeout and performance monitoring
      const result = await this.executeWithPerformanceMonitoring(handler, enhancedParameters, name);

      const executionTime = Date.now() - startTime;
      this.log(`Round ${context.round}: Tool ${name} completed in ${executionTime}ms`);

      // Cache the result
      if (this.options.enableCaching && this.shouldCacheResult(name, result)) {
        const cacheKey = this.generateCacheKey(functionCall, context);
        this.setCache(cacheKey, result);
      }

      // Update statistics
      this.updateExecutionStats(true, executionTime, name);

      return {
        success: true,
        result,
        functionCall,
        executionTime,
        round: context.round
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Round ${context.round}: Tool ${name} failed after ${executionTime}ms: ${errorMessage}`);

      this.updateExecutionStats(false, executionTime, name);

      return {
        success: false,
        error: this.enhanceErrorMessage(errorMessage, name, context),
        functionCall,
        executionTime,
        round: context.round
      };
    }
  }

  /**
   * Execute with performance monitoring
   */
  private async executeWithPerformanceMonitoring<T>(
    handler: ToolHandler,
    parameters: Record<string, any>,
    toolName: string
  ): Promise<T> {
    const startTime = Date.now();

    // Log performance warning for slow tools
    const performanceTimer = setTimeout(() => {
      this.log(`⚠️ Tool ${toolName} is taking longer than expected (>10s)`);
    }, 10000);

    try {
      const result = await this.executeWithTimeout(handler, parameters, this.options.timeout!);
      clearTimeout(performanceTimer);

      const executionTime = Date.now() - startTime;

      // Log performance insights
      if (executionTime > 5000) {
        this.log(`🐌 Slow execution: ${toolName} took ${executionTime}ms`);
      } else if (executionTime < 100) {
        this.log(`⚡ Fast execution: ${toolName} took ${executionTime}ms`);
      }

      return result as T
    } catch (error) {
      clearTimeout(performanceTimer);
      throw error;
    }
  }

  /**
   * Enhanced parameter enhancement with previous results context
   */
  private enhanceToolParameters(
    parameters: Record<string, any>,
    context: ToolExecutionContext,
    toolName: string,
    previousResults: ToolResult[]
  ): Record<string, any> {
    const enhanced = { ...parameters };

    // Add workspace_path if not provided and tool supports it
    if (!enhanced.workspace_path && (
      toolName === 'github-get-issue-with-analysis' ||
      toolName === 'github-find-code-by-description'
    )) {
      enhanced.workspace_path = context.workspacePath;
    }

    // Add context from previous successful results
    if (previousResults.length > 0) {
      const successfulResults = previousResults.filter(r => r.success);

      if (toolName === 'grep-search' && successfulResults.length > 0) {
        // Extract keywords from previous issue analysis
        const issueAnalysis = successfulResults.find(r =>
          r.functionCall.name === 'github-get-issue-with-analysis'
        );

        if (issueAnalysis) {
          enhanced.enhanced_with_issue_context = true;
          this.log(`🔗 Enhanced ${toolName} parameters with issue analysis context`);
        }
      }

      if (toolName === 'github-find-code-by-description') {
        enhanced.context_from_previous_analysis = successfulResults
          .filter(r => r.functionCall.name === 'github-get-issue-with-analysis')
          .map(r => r.result)
          .filter(Boolean);
      }
    }

    return enhanced;
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(functionCall: FunctionCall, context: ToolExecutionContext): string {
    const keyData = {
      tool: functionCall.name,
      params: functionCall.parameters,
      workspace: context.workspacePath,
      round: context.round
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64').slice(0, 32);
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.accessCount++;
    return entry.result;
  }

  private setCache(key: string, result: any): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl: this.options.cacheTTL!,
      accessCount: 1
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private shouldCacheResult(toolName: string, result: any): boolean {
    // Cache results for expensive tools
    const cacheableTools = [
      'github-get-issue-with-analysis',
      'list-directory',
      'github-find-code-by-description'
    ];

    return cacheableTools.includes(toolName) && result && typeof result === 'object';
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools(): string[] {
    return Array.from(this.toolHandlers.keys());
  }

  /**
   * Enhanced execution statistics with detailed metrics
   */
  getExecutionStats() {
    const stats = { ...this.executionStats };

    // Convert Map to object for serialization
    const toolStatsObj: Record<string, any> = {};
    for (const [toolName, toolStat] of this.executionStats.toolStats) {
      toolStatsObj[toolName] = toolStat;
    }

    return {
      ...stats,
      toolStats: toolStatsObj,
      cacheHitRate: this.executionStats.totalCalls > 0
        ? (this.executionStats.cacheHits / (this.executionStats.cacheHits + this.executionStats.cacheMisses)) * 100
        : 0,
      cacheSize: this.cache.size
    };
  }

  /**
   * Get performance summary for logging
   */
  getPerformanceSummary(): string {
    const stats = this.getExecutionStats();
    const summary = [
      `📊 Tool Executor Performance Summary:`,
      `   Total calls: ${stats.totalCalls}`,
      `   Success rate: ${stats.totalCalls > 0 ? ((stats.successfulCalls / stats.totalCalls) * 100).toFixed(1) : 0}%`,
      `   Average execution time: ${stats.averageExecutionTime.toFixed(0)}ms`,
      `   Parallel executions: ${stats.parallelExecutions}`,
      `   Cache hit rate: ${stats.cacheHitRate.toFixed(1)}%`,
      `   Cache size: ${stats.cacheSize} entries`
    ];

    // Add top 3 slowest tools
    const sortedTools = Array.from(this.executionStats.toolStats.entries())
      .sort((a, b) => b[1].averageTime - a[1].averageTime)
      .slice(0, 3);

    if (sortedTools.length > 0) {
      summary.push(`   Slowest tools:`);
      sortedTools.forEach(([name, stat]) => {
        summary.push(`     ${name}: ${stat.averageTime.toFixed(0)}ms avg`);
      });
    }

    return summary.join('\n');
  }

  /**
   * Reset execution statistics
   */
  resetExecutionStats(): void {
    this.executionStats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageExecutionTime: 0,
      toolStats: new Map(),
      parallelExecutions: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.cache.clear();
  }

  private async executeWithTimeout<T>(handler: ToolHandler, parameters: Record<string, any>, timeout: number): Promise<T> {
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

  private updateExecutionStats(success: boolean, executionTime: number, toolName: string): void {
    this.executionStats.totalCalls++;
    if (success) {
      this.executionStats.successfulCalls++;
    } else {
      this.executionStats.failedCalls++;
    }

    // Update average execution time
    this.executionStats.averageExecutionTime =
      (this.executionStats.averageExecutionTime * (this.executionStats.totalCalls - 1) + executionTime) / this.executionStats.totalCalls;

    // Update tool-specific statistics
    if (!this.executionStats.toolStats.has(toolName)) {
      this.executionStats.toolStats.set(toolName, {
        count: 0,
        averageTime: 0,
        maxTime: 0,
        successRate: 0
      });
    }

    const toolStat = this.executionStats.toolStats.get(toolName)!;
    toolStat.count++;
    toolStat.averageTime = (toolStat.averageTime * (toolStat.count - 1) + executionTime) / toolStat.count;
    toolStat.maxTime = Math.max(toolStat.maxTime, executionTime);
    toolStat.successRate = success ?
      (toolStat.successRate * (toolStat.count - 1) + 100) / toolStat.count :
      (toolStat.successRate * (toolStat.count - 1)) / toolStat.count;
  }

  private log(message: string, data?: any): void {
    if (this.options.verbose) {
      console.log(`[ToolExecutor] ${message}`, data || '');
    }
  }
}
