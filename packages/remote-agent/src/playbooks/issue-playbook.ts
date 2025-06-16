import { CoreMessage } from "ai";
import { Playbook } from "./base-playbook";
import { ToolResult } from "../agent/tool-definition";

/**
 * IssuePlaybook 专注于管理 GitHub Issue 分析相关的提示词策略
 */
export class IssuePlaybook extends Playbook {
  constructor() {
    super(`你是一个 GitHub Issue 分析专家，擅长分析问题并提供解决方案建议。
你的主要职责是：
1. 理解 GitHub Issue 的需求和上下文
2. 分析代码库以找到相关代码
3. 提供具体且可操作的解决方案
4. 确保解决方案与项目架构保持一致`);
  }

  /**
   * 为 Issue 分析准备提示词
   */
  preparePrompt(userInput: string, context?: any): string {
    return `ISSUE 分析任务: 分析以下 GitHub Issue 并提供解决方案。

用户请求: ${userInput}

分析指南:
1. 首先使用 github-get-issue-with-analysis 工具获取完整的 Issue 内容
2. 使用代码搜索工具找到与 Issue 相关的代码
3. 阅读并理解相关代码结构
4. 分析 Issue 描述的问题原因
5. 提供具体且可操作的解决方案`;
  }

  /**
   * 为多轮对话构建消息
   */
  async buildMessagesForRound(
    input: string,
    context: any,
    round: number,
    conversationHistory: CoreMessage[] = []
  ): Promise<CoreMessage[]> {
    const messages: CoreMessage[] = [
      { role: "system", content: this.getSystemPrompt() }
    ];

    // 添加对话历史
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // 根据轮次生成不同的提示词
    if (round === 1) {
      messages.push({
        role: "user",
        content: this.preparePrompt(input, context)
      });
    } else if (round > 1) {
      messages.push({
        role: "user",
        content: `继续深入分析 Issue: ${input}\n\n请在分析的基础上，提供更具体的解决方案。`
      });
    }

    return messages;
  }

  /**
   * 构建最终的总结提示词
   */
  prepareSummaryPrompt(userInput: string, toolResults: ToolResult[], currentState: string): string {
    const hasIssueAnalysis = toolResults.some(r => 
      r.success && r.functionCall.name.includes('issue'));
    const hasCodeExploration = toolResults.some(r => 
      r.success && (r.functionCall.name.includes('search') || r.functionCall.name.includes('read-file')));

    return `请基于以下信息，生成一个全面、详细的 GitHub Issue 分析报告：

用户请求: ${userInput}

工具执行结果摘要:
- Issue 分析: ${hasIssueAnalysis ? '已完成' : '未完成'} 
- 代码探索: ${hasCodeExploration ? '已完成' : '未完成'}
- 当前分析状态: ${currentState}

报告要求:
1. 简明扼要地总结 Issue 的关键问题
2. 提供问题的根本原因分析
3. 提出具体且可操作的解决方案
4. 列出可能受影响的其他组件
5. 提供解决方案的实施步骤`;
  }

  /**
   * 验证执行结果的提示词
   */
  prepareVerificationPrompt(userInput: string, results: ToolResult[]): string {
    return `验证阶段：检查 Issue 分析结果是否全面、准确，并满足用户需求。

用户请求: ${userInput}

验证重点:
1. 分析是否识别了 Issue 的根本问题
2. 解决方案是否具体且可操作
3. 是否考虑了项目的整体架构和代码风格
4. 是否有遗漏的关键点需要进一步分析`;
  }
}
