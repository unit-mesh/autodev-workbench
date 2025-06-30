import { ContextAwareComponent } from '../core/ContextAwareComponent';
import { ToolRegistry } from './ToolRegistry';
import {
  IMigrationContext,
  ComponentOptions,
  IToolExecutor,
  ToolDefinition,
  ToolResult,
  ToolCall
} from '../types';
import { ToolExecutionError } from '../types/errors';

export class ToolExecutor extends ContextAwareComponent implements IToolExecutor {
  private registry: ToolRegistry;
  private executionHistory: Array<{
    toolName: string;
    params: any;
    result: ToolResult;
    timestamp: Date;
    duration: number;
  }> = [];

  constructor(name: string, context: IMigrationContext, options: ComponentOptions = {}) {
    super(name, context, options);
    this.registry = new ToolRegistry();
  }

  protected async onInitialize(): Promise<void> {
    this.log('工具执行器已初始化');
    this.log(`已注册 ${this.registry.getAllTools().length} 个工具`);

    if (this.isVerbose()) {
      this.logAvailableTools();
    }
  }

  protected async onExecute(): Promise<any> {
    // 工具执行器的主要执行逻辑
    return {
      availableTools: this.registry.getAllTools().length,
      categories: this.registry.getCategories(),
      executionHistory: this.executionHistory.length
    };
  }

  public registerTool(tool: ToolDefinition): void {
    try {
      this.registry.registerTool(tool);
      this.log(`工具已注册: ${tool.name}`);

      this.emit('tool:registered', {
        toolName: tool.name,
        category: tool.category,
        description: tool.description
      });

    } catch (error) {
      this.logError(`工具注册失败: ${tool.name}`, error as Error);
      throw error;
    }
  }

  public async executeTool(toolName: string, params: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      this.log(`执行工具: ${toolName}`);

      // 获取工具定义
      const tool = this.registry.getTool(toolName);
      if (!tool) {
        throw new ToolExecutionError(`未找到工具: ${toolName}`, toolName);
      }

      // 验证参数
      const validation = tool.validator!(params);
      if (!validation.valid) {
        throw new ToolExecutionError(
          `工具参数验证失败: ${validation.error}`,
          toolName,
          `参数: ${JSON.stringify(params)}`
        );
      }

      // 执行工具
      let result: any;

      if (tool.executor) {
        // 使用工具自带的执行器
        result = await tool.executor(params, {
          projectPath: this.context.projectPath,
          dryRun: this.isDryRun(),
          verbose: this.isVerbose()
        });
      } else {
        // 使用默认执行逻辑
        result = await this.executeDefaultTool(toolName, params);
      }

      const duration = Date.now() - startTime;
      const toolResult: ToolResult = {
        success: true,
        result,
        metadata: {
          toolName,
          duration,
          timestamp: new Date(),
          params: this.sanitizeParams(params)
        }
      };

      // 记录执行历史
      this.executionHistory.push({
        toolName,
        params: this.sanitizeParams(params),
        result: toolResult,
        timestamp: new Date(),
        duration
      });

      this.emit('tool:executed', { toolName, params, result: toolResult });
      this.log(`工具执行成功: ${toolName} (${duration}ms)`);

      return toolResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const toolError = error instanceof ToolExecutionError
        ? error
        : new ToolExecutionError(
            `工具执行失败: ${error instanceof Error ? error.message : error}`,
            toolName
          );

      const toolResult: ToolResult = {
        success: false,
        error: toolError.message,
        metadata: {
          toolName,
          duration,
          timestamp: new Date(),
          params: this.sanitizeParams(params),
          errorCode: toolError.code
        }
      };

      // 记录执行历史
      this.executionHistory.push({
        toolName,
        params: this.sanitizeParams(params),
        result: toolResult,
        timestamp: new Date(),
        duration
      });

      this.emit('tool:error', { toolName, params, error: toolError });
      this.logError(`工具执行失败: ${toolName}`, toolError);

      throw toolError;
    }
  }

  private async executeDefaultTool(toolName: string, params: any): Promise<any> {
    // 默认工具执行逻辑（如果工具没有自定义执行器）
    switch (toolName) {
      case 'echo':
        return { message: params.message || 'Hello from tool executor!' };

      case 'delay':
        await this.delay(params.duration || 1000);
        return { delayed: params.duration || 1000 };

      default:
        throw new ToolExecutionError(`工具 ${toolName} 没有可用的执行器`, toolName);
    }
  }

  public async executeToolChain(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    this.log(`执行工具链: ${toolCalls.length} 个工具`);

    for (let i = 0; i < toolCalls.length; i++) {
      const toolCall = toolCalls[i];

      try {
        this.reportProgress(
          (i / toolCalls.length) * 100,
          `执行工具 ${i + 1}/${toolCalls.length}: ${toolCall.name}`
        );

        const result = await this.executeTool(toolCall.name, toolCall.parameters);
        results.push(result);

      } catch (error) {
        const errorResult: ToolResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          metadata: {
            toolName: toolCall.name,
            chainIndex: i,
            timestamp: new Date()
          }
        };

        results.push(errorResult);

        // 根据配置决定是否继续执行
        if (this.options.stopOnError !== false) {
          this.logError(`工具链执行中断于第 ${i + 1} 个工具`, error as Error);
          break;
        }
      }
    }

    this.reportProgress(100, '工具链执行完成');
    return results;
  }

  public getAvailableTools(): ToolDefinition[] {
    return this.registry.getAllTools();
  }

  public getToolsByCategory(category: string): ToolDefinition[] {
    return this.registry.getToolsByCategory(category);
  }

  public getToolsDescription(): string {
    return this.registry.getToolsDescription();
  }

  public getToolsSchema(): any {
    return this.registry.getToolsSchema();
  }

  public getRegistry(): ToolRegistry {
    return this.registry;
  }

  public getExecutionHistory(): any[] {
    return this.executionHistory.map(entry => ({
      ...entry,
      params: this.sanitizeParams(entry.params)
    }));
  }

  public clearExecutionHistory(): void {
    this.executionHistory = [];
    this.log('执行历史已清空');
  }

  public getExecutionStats(): any {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(entry => entry.result.success).length;
    const failed = total - successful;

    const totalDuration = this.executionHistory.reduce((sum, entry) => sum + entry.duration, 0);
    const avgDuration = total > 0 ? totalDuration / total : 0;

    const toolUsage = this.executionHistory.reduce((acc, entry) => {
      acc[entry.toolName] = (acc[entry.toolName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? successful / total : 0,
      totalDuration,
      avgDuration,
      toolUsage
    };
  }

  private logAvailableTools(): void {
    const categories = this.registry.getCategories();

    this.log('可用工具分类:');
    categories.forEach(category => {
      const tools = this.registry.getToolsByCategory(category);
      console.log(`  ${category}: ${tools.map(t => t.name).join(', ')}`);
    });
  }

  private sanitizeParams(params: any): any {
    // 移除敏感信息
    if (typeof params !== 'object' || params === null) {
      return params;
    }

    const sanitized = { ...params };

    // 移除可能的敏感字段
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    });

    return sanitized;
  }

  protected onCleanup(): void {
    this.clearExecutionHistory();
    this.registry.clear();
  }

  // 工具管理方法
  public hasTool(name: string): boolean {
    return this.registry.hasTool(name);
  }

  public removeTool(name: string): boolean {
    const removed = this.registry.removeTool(name);
    if (removed) {
      this.log(`工具已移除: ${name}`);
      this.emit('tool:removed', { toolName: name });
    }
    return removed;
  }

  // 批量工具操作
  public registerTools(tools: ToolDefinition[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  public async executeToolsParallel(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    this.log(`并行执行 ${toolCalls.length} 个工具`);

    const promises = toolCalls.map(async (toolCall, index) => {
      try {
        return await this.executeTool(toolCall.name, toolCall.parameters);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          metadata: {
            toolName: toolCall.name,
            index,
            timestamp: new Date()
          }
        } as ToolResult;
      }
    });

    const results = await Promise.all(promises);
    this.log('并行工具执行完成');

    return results;
  }
}
