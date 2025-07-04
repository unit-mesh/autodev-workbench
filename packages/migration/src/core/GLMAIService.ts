/**
 * 智谱AI (GLM) 服务实现
 */

import { AIService } from './AIService';
import { AIServiceConfig } from '../types';
import fetch from 'node-fetch';

export class GLMAIService extends AIService {
  private apiKey: string;
  private baseURL: string;
  protected enabled: boolean;

  constructor(config: AIServiceConfig = {}) {
    // 先设置API Key，再调用父类构造函数
    const apiKey = config.apiKey || process.env.GLM_API_KEY || '';

    super({
      provider: 'glm',
      model: 'glm-4',
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 60000,
      ...config
    });

    this.apiKey = apiKey;
    this.baseURL = config.baseURL || 'https://open.bigmodel.cn/api/paas/v4';

    // 重新检查可用性
    this.enabled = this.checkAvailability();
  }

  protected checkAvailability(): boolean {
    return !!this.apiKey;
  }

  protected async performAICall(prompt: string, options: any): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GLM API Key 未设置');
    }

    const requestBody = {
      model: this.config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: false
    };

    try {
      const response = await this.makeRequest('/chat/completions', requestBody);
      
      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
      } else {
        throw new Error('GLM API 返回格式异常');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GLM API 调用失败: ${error.message}`);
      }
      throw error;
    }
  }

  private async makeRequest(endpoint: string, body: any): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    if (this.config.verbose) {
      console.log(`GLM API 请求: ${url}`);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        timeout: this.config.timeout || 60000
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (this.config.verbose) {
        console.log('GLM API 响应成功');
      }

      return result;
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        throw new Error('GLM API 请求超时');
      }

      throw error;
    }
  }

  // 重写统计方法
  public getStats(): any {
    const baseStats = super.getStats();
    return {
      ...baseStats,
      provider: 'glm',
      model: this.config.model,
      apiKeyConfigured: !!this.apiKey
    };
  }
}
