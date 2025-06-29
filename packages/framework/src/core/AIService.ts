/**
 * AI服务基类
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';
import {
  IAIService,
  AIServiceConfig,
  AICallOptions,
  AIStats,
  AICallContext
} from '../types';
import { AIServiceError } from '../types/errors';

export abstract class AIService extends EventEmitter implements IAIService {
  protected readonly config: AIServiceConfig;
  protected stats: AIStats;
  protected enabled: boolean = false;

  constructor(config: AIServiceConfig = {}) {
    super();
    
    this.config = {
      provider: 'openai',
      model: 'gpt-4',
      maxTokens: 4000,
      temperature: 0.1,
      maxRetries: 3,
      timeout: 60000,
      verbose: false,
      ...config
    };

    this.stats = {
      calls: 0,
      success: 0,
      failed: 0,
      totalTokens: 0,
      successRate: 0
    };

    this.enabled = this.checkAvailability();
    
    if (this.config.verbose && this.enabled) {
      console.log(chalk.green(`✅ AI服务已启用 (${this.config.provider})`));
    }
  }

  protected abstract checkAvailability(): boolean;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public async callAI(prompt: string, options: AICallOptions = {}): Promise<string> {
    if (!this.enabled) {
      throw new AIServiceError('AI服务未启用或配置不正确');
    }

    const callOptions = {
      maxRetries: this.config.maxRetries || 3,
      ...options
    };

    // 确保 maxRetries 有效
    if (!callOptions.maxRetries || callOptions.maxRetries < 1) {
      callOptions.maxRetries = 3;
    }

    this.stats.calls++;
    this.emit('ai:call', { prompt: prompt.substring(0, 100), context: callOptions.context });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= callOptions.maxRetries; attempt++) {
      try {
        if (this.config.verbose && attempt > 1) {
          console.log(chalk.yellow(`🔄 AI调用重试 ${attempt}/${callOptions.maxRetries}`));
        }

        const result = await this.performAICall(prompt, {
          ...this.config,
          ...callOptions,
          attempt
        });

        this.stats.success++;
        this.updateSuccessRate();
        
        // 估算token数量（简化实现）
        const estimatedTokens = Math.ceil((prompt.length + result.length) / 4);
        this.stats.totalTokens += estimatedTokens;

        this.emit('ai:success', { 
          prompt: prompt.substring(0, 100), 
          result: result.substring(0, 100),
          tokens: estimatedTokens,
          attempt
        });

        if (this.config.verbose) {
          console.log(chalk.green(`✅ AI调用成功 (尝试 ${attempt}/${callOptions.maxRetries})`));
        }

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (this.config.verbose) {
          console.log(chalk.red(`❌ AI调用失败 (尝试 ${attempt}/${callOptions.maxRetries}): ${lastError.message}`));
        }

        // 如果不是最后一次尝试，等待一段时间再重试
        if (attempt < callOptions.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 指数退避，最大10秒
          await this.delay(delay);
        }
      }
    }

    this.stats.failed++;
    this.updateSuccessRate();

    const finalError = new AIServiceError(
      `AI调用失败，已重试 ${callOptions.maxRetries} 次: ${lastError?.message}`,
      callOptions.context?.agent
    );

    this.emit('ai:error', { 
      prompt: prompt.substring(0, 100), 
      error: finalError,
      attempts: callOptions.maxRetries
    });

    throw finalError;
  }

  protected abstract performAICall(prompt: string, options: any): Promise<string>;

  private updateSuccessRate(): void {
    this.stats.successRate = this.stats.calls > 0 ? this.stats.success / this.stats.calls : 0;
  }

  public getStats(): AIStats {
    return {
      ...this.stats,
      successRate: this.stats.successRate
    };
  }

  public resetStats(): void {
    this.stats = {
      calls: 0,
      success: 0,
      failed: 0,
      totalTokens: 0,
      successRate: 0
    };
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected log(message: string): void {
    if (this.config.verbose) {
      console.log(chalk.blue(`[AIService] ${message}`));
    }
  }

  protected logError(message: string, error?: Error): void {
    console.error(chalk.red(`[AIService] ${message}`), error?.message || error);
  }

  // 提示词处理辅助方法
  protected truncatePrompt(prompt: string, maxLength: number = 8000): string {
    if (prompt.length <= maxLength) {
      return prompt;
    }

    const truncated = prompt.substring(0, maxLength - 100);
    return truncated + '\n\n[... 内容已截断 ...]';
  }

  protected sanitizePrompt(prompt: string): string {
    // 移除敏感信息（如API密钥等）
    return prompt
      .replace(/api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9-_]+/gi, 'api_key="***"')
      .replace(/token["\s]*[:=]["\s]*[a-zA-Z0-9-_]+/gi, 'token="***"')
      .replace(/password["\s]*[:=]["\s]*[^\s"]+/gi, 'password="***"');
  }

  // 响应处理辅助方法
  protected validateResponse(response: string): boolean {
    return typeof response === 'string' && response.trim().length > 0;
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
      throw new AIServiceError(`AI响应JSON解析失败: ${error instanceof Error ? error.message : error}`);
    }
  }

  // 上下文管理
  protected buildContext(context: AICallContext = {}): string {
    const contextParts: string[] = [];
    
    if (context.taskType) {
      contextParts.push(`任务类型: ${context.taskType}`);
    }
    
    if (context.phase) {
      contextParts.push(`阶段: ${context.phase}`);
    }
    
    if (context.fileName) {
      contextParts.push(`文件: ${context.fileName}`);
    }
    
    if (context.attemptNumber) {
      contextParts.push(`尝试次数: ${context.attemptNumber}`);
    }

    return contextParts.length > 0 ? `\n上下文信息:\n${contextParts.join('\n')}\n` : '';
  }

  // 错误恢复
  protected shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
    // 网络错误或临时错误应该重试
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'rate_limit_exceeded',
      'server_error'
    ];

    const isRetryable = retryableErrors.some(code => 
      error.message.toLowerCase().includes(code.toLowerCase())
    );

    return isRetryable && attempt < maxRetries;
  }

  // 资源清理
  public cleanup(): void {
    this.removeAllListeners();
    this.resetStats();
    this.log('AI服务已清理');
  }
}
