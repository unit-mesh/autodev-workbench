import { CoreMessage } from "ai";
import { ToolResult } from "../agent/tool-definition";

/**
 * Playbook 是一个管理 AI Agent 提示词策略的基类
 * 不同类型的 Agent 可以使用不同的 Playbook 来管理其特定的提示词和行为模式
 *
 * 注意：这个基类现在主要用于向后兼容。推荐使用 IssueAnalysisPlaybook 等具体实现。
 */
export abstract class Playbook {
  constructor(protected systemPrompt: string = "") {
    // Base class for backward compatibility
  }

  /**
   * 注册可用的工具 - 由子类实现
   */
  registerTools(tools: any[]): void {
    // Default implementation - subclasses should override
  }

  /**
   * 获取系统提示词
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * 准备用于特定场景的提示词
   * @param input 用户输入或当前上下文
   */
  abstract preparePrompt(input: string, context?: any): string;

  /**
   * 为多轮对话构建消息
   * @deprecated 推荐子类直接实现，不依赖基类
   */
  async buildMessagesForRound(
    input: string,
    context: any,
    round: number,
    conversationHistory: CoreMessage[] = [],
    workspacePath?: string
  ): Promise<CoreMessage[]> {
    // Default implementation for backward compatibility
    // Subclasses should override this method
    throw new Error('buildMessagesForRound must be implemented by subclass');
  }

  /**
   * 构建最终的总结提示词
   * @deprecated 推荐子类直接实现，不依赖基类
   */
  prepareSummaryPrompt(
    userInput: string,
    toolResults: ToolResult[],
    currentState: string
  ): string {
    // Default implementation for backward compatibility
    throw new Error('prepareSummaryPrompt must be implemented by subclass');
  }

  /**
   * 验证执行结果的提示词
   * @deprecated 推荐子类直接实现，不依赖基类
   */
  prepareVerificationPrompt(
    userInput: string,
    results: ToolResult[]
  ): string {
    // Default implementation for backward compatibility
    throw new Error('prepareVerificationPrompt must be implemented by subclass');
  }

  /**
   * 生成综合最终回复
   * @deprecated 推荐子类直接实现，不依赖基类
   */
  async generateComprehensiveFinalResponse(
    userInput: string,
    lastLLMResponse: string,
    allToolResults: ToolResult[],
    totalRounds: number
  ): Promise<string> {
    // Default implementation for backward compatibility
    throw new Error('generateComprehensiveFinalResponse must be implemented by subclass');
  }
}
