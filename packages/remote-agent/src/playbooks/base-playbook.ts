import { CoreMessage } from "ai";
import { PromptBuilder } from "../agent/prompt-builder";
import { ToolResult } from "../agent/tool-definition";

/**
 * Playbook 是一个管理 AI Agent 提示词策略的基类
 * 不同类型的 Agent 可以使用不同的 Playbook 来管理其特定的提示词和行为模式
 * 所有 Playbook 都基于 PromptBuilder 来构建提示词
 */
export abstract class Playbook {
  protected promptBuilder: PromptBuilder;

  constructor(protected systemPrompt: string = "") {
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * 注册可用的工具
   */
  registerTools(tools: any[]): void {
    this.promptBuilder.registerTools(tools);
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
   */
  async buildMessagesForRound(
    input: string, 
    context: any,
    round: number,
    conversationHistory: CoreMessage[] = [],
    workspacePath?: string
  ): Promise<CoreMessage[]> {
    return this.promptBuilder.buildMessagesForRound(
      input,
      context,
      [],
      round,
      conversationHistory,
      workspacePath
    );
  }

  /**
   * 构建最终的总结提示词
   */
  prepareSummaryPrompt(
    userInput: string, 
    toolResults: ToolResult[], 
    currentState: string
  ): string {
    return this.promptBuilder.buildUserPromptForRound(
      userInput,
      {},
      toolResults,
      3
    );
  }

  /**
   * 验证执行结果的提示词
   */
  prepareVerificationPrompt(
    userInput: string,
    results: ToolResult[]
  ): string {
    return this.promptBuilder.buildUserPromptForRound(
      userInput,
      {},
      results,
      3
    );
  }
}
