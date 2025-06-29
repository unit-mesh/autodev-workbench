/**
 * AI代理基类
 */

import { ContextAwareComponent } from '../core/ContextAwareComponent';
import {
  IMigrationContext,
  ComponentOptions,
  IAIService,
  IToolExecutor,
  AICallOptions
} from '../types';

export abstract class BaseAIAgent extends ContextAwareComponent {
  protected aiService: IAIService;
  protected toolExecutor: IToolExecutor;
  protected promptTemplates: Map<string, string> = new Map();

  constructor(
    name: string,
    context: IMigrationContext,
    aiService: IAIService,
    toolExecutor: IToolExecutor,
    options: ComponentOptions = {}
  ) {
    super(name, context, options);
    this.aiService = aiService;
    this.toolExecutor = toolExecutor;
  }

  protected async onInitialize(): Promise<void> {
    this.loadPromptTemplates();
    this.log('AI代理已初始化');
  }

  protected loadPromptTemplates(): void {
    // 子类可重写以加载特定的提示词模板
    this.promptTemplates.set('default', `
你是一个专业的代码迁移助手。请根据以下信息进行分析和处理：

任务: {task}
上下文: {context}
要求: {requirements}

请提供详细的分析和建议。
    `);
  }

  protected async analyzeWithAI(prompt: string, options: AICallOptions = {}): Promise<string> {
    try {
      const response = await this.aiService.callAI(prompt, {
        context: { agent: this.name, ...options.context }
      });
      
      this.recordAICall({ success: true });
      return response;
    } catch (error) {
      this.recordAICall({ success: false });
      this.logError('AI分析失败', error as Error);
      throw error;
    }
  }

  protected async executeToolsFromAI(toolCalls: any[]): Promise<any[]> {
    const results = [];
    
    for (const toolCall of toolCalls) {
      try {
        const result = await this.toolExecutor.executeTool(
          toolCall.name, 
          toolCall.parameters
        );
        results.push({ toolCall, result, success: true });
      } catch (error) {
        results.push({ 
          toolCall, 
          error: (error as Error).message, 
          success: false 
        });
      }
    }
    
    return results;
  }

  protected buildPrompt(templateName: string, variables: Record<string, any>): string {
    let template = this.promptTemplates.get(templateName);
    
    if (!template) {
      this.logWarning(`提示词模板不存在: ${templateName}，使用默认模板`);
      template = this.promptTemplates.get('default') || '';
    }

    // 替换变量
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return prompt;
  }

  protected async processWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          this.log(`操作失败，${delay}ms后重试 (${attempt}/${maxRetries})`);
          await this.delay(delay);
          delay *= 2; // 指数退避
        }
      }
    }

    throw lastError;
  }

  protected validateAIResponse(response: string, expectedFormat?: string): boolean {
    if (!response || response.trim().length === 0) {
      return false;
    }

    if (expectedFormat === 'json') {
      try {
        JSON.parse(response);
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }

  protected parseJSONResponse(response: string): any {
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*\}/) ||
                       response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      // 如果没有找到JSON块，尝试直接解析
      return JSON.parse(response);
    } catch (error) {
      this.logError('AI响应JSON解析失败', error as Error);
      return null;
    }
  }

  protected sanitizePrompt(prompt: string): string {
    // 移除敏感信息
    return prompt
      .replace(/api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9-_]+/gi, 'api_key="***"')
      .replace(/token["\s]*[:=]["\s]*[a-zA-Z0-9-_]+/gi, 'token="***"')
      .replace(/password["\s]*[:=]["\s]*[^\s"]+/gi, 'password="***"');
  }

  protected getContextInfo(): Record<string, any> {
    return {
      projectPath: this.context.projectPath,
      framework: this.context.project.framework,
      version: this.context.project.version,
      phase: this.context.phases.current,
      stats: this.context.stats
    };
  }

  // 工具方法
  protected async readProjectFile(filePath: string): Promise<string> {
    try {
      const result = await this.toolExecutor.executeTool('read_file', {
        file_path: filePath
      });
      return result.result?.content || '';
    } catch (error) {
      this.logError(`读取文件失败: ${filePath}`, error as Error);
      return '';
    }
  }

  protected async writeProjectFile(filePath: string, content: string, backup: boolean = true): Promise<boolean> {
    try {
      await this.toolExecutor.executeTool('write_file', {
        file_path: filePath,
        content,
        backup
      });
      this.updateFileStatus(filePath, 'modified');
      return true;
    } catch (error) {
      this.logError(`写入文件失败: ${filePath}`, error as Error);
      this.updateFileStatus(filePath, 'failed');
      return false;
    }
  }

  protected async listProjectFiles(pattern: string = '**/*'): Promise<string[]> {
    try {
      const result = await this.toolExecutor.executeTool('list_files', {
        pattern
      });
      return result.result?.files || [];
    } catch (error) {
      this.logError('列出文件失败', error as Error);
      return [];
    }
  }

  protected async runCommand(command: string, args: string[] = []): Promise<string> {
    try {
      const result = await this.toolExecutor.executeTool('run_command', {
        command,
        args
      });
      return result.result?.output || '';
    } catch (error) {
      this.logError(`命令执行失败: ${command}`, error as Error);
      return '';
    }
  }

  // 统计和监控
  protected getAgentStats(): any {
    return {
      name: this.name,
      status: this.state.status,
      duration: this.getDuration(),
      aiCalls: this.context.stats.aiCalls,
      filesProcessed: this.context.stats.filesAnalyzed + this.context.stats.filesModified
    };
  }

  protected reportProgress(progress: number, message?: string): void {
    this.context.setProgress(progress);
    if (message) {
      this.log(`进度 ${progress}%: ${message}`);
    }
  }

  // 错误处理
  protected handleAIError(error: Error, context?: string): void {
    this.addError(error, context);
    
    // 如果AI服务不可用，可以尝试降级到规则引擎
    if (!this.aiService.isEnabled()) {
      this.logWarning('AI服务不可用，考虑使用规则引擎替代');
    }
  }

  protected shouldFallbackToRules(error: Error): boolean {
    // 判断是否应该降级到规则引擎
    const fallbackErrors = [
      'AI服务未启用',
      'API调用失败',
      'token限制',
      'rate_limit_exceeded'
    ];

    return fallbackErrors.some(errorType => 
      error.message.toLowerCase().includes(errorType.toLowerCase())
    );
  }
}
