import { CoreMessage } from "ai";

/**
 * Playbook 是一个管理 AI Agent 提示词策略的基类
 * 不同类型的 Agent 可以使用不同的 Playbook 来管理其特定的提示词和行为模式
 */
export abstract class Playbook {
  constructor(protected systemPrompt: string = "") {}

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
   */
  abstract buildMessagesForRound(
    input: string, 
    context: any,
    round: number,
    conversationHistory?: CoreMessage[]
  ): Promise<CoreMessage[]>;

  /**
   * 构建最终的总结提示词
   */
  abstract prepareSummaryPrompt(
    userInput: string, 
    toolResults: any[], 
    currentState: string
  ): string;

  /**
   * 验证执行结果的提示词
   */
  abstract prepareVerificationPrompt(
    userInput: string,
    results: any[]
  ): string;
}
