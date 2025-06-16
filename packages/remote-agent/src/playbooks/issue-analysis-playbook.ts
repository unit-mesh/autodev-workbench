import { CoreMessage } from "ai";
import { Playbook } from "./base-playbook";
import { ToolResult } from "../agent/tool-definition";

/**
 * IssueAnalysisPlaybook 专注于管理 Bug 报告分析相关的提示词策略
 */
export class IssueAnalysisPlaybook extends Playbook {
  constructor() {
    super(`你是一个专业的 Bug 报告分析专家，擅长分析问题报告并提供解决方案建议。
你的主要职责是：
1. 理解 Bug 报告的详细描述和上下文
2. 分析代码库以定位问题根源
3. 提供具体且可操作的解决方案
4. 确保解决方案与项目架构保持一致`);
  }

  /**
   * 为 Bug 报告分析准备提示词
   */
  preparePrompt(userInput: string, context?: any): string {
    return `BUG报告分析任务: 分析以下 Bug 报告并提供解决方案。

用户请求: ${userInput}

${context ? `上下文信息: ${JSON.stringify(context)}` : ''}

分析指南:
1. 首先使用 github-get-issue-with-analysis 工具获取完整的 Bug 报告内容
2. 使用代码搜索工具找到与 Bug 相关的代码
3. 分析 Bug 的根本原因和影响范围
4. 提供具体且可操作的解决方案
5. 确保解决方案的完整性和可行性`;
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

    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    if (round === 1) {
      messages.push({
        role: "user",
        content: `分析阶段: 分析以下 Bug 报告，制定分析计划。

${this.preparePrompt(input, context)}

在此阶段，请专注于：
1. 理解 Bug 报告的详细描述
2. 确定需要分析的代码范围
3. 制定详细的分析计划
4. 不要急于提供解决方案`
      });
    } else if (round === 2) {
      messages.push({
        role: "user",
        content: `深入分析阶段: 基于初步分析，深入理解问题。

Bug报告: ${input}

请执行以下操作：
1. 分析相关代码的具体问题
2. 确定 Bug 的根本原因
3. 评估问题的影响范围
4. 记录关键发现`
      });
    } else {
      messages.push({
        role: "user",
        content: `解决方案阶段: 基于分析结果，提供解决方案。

Bug报告: ${input}

请执行以下操作：
1. 总结问题分析结果
2. 提供具体的解决方案
3. 说明解决方案的可行性
4. 提供实施建议`
      });
    }

    return messages;
  }

  /**
   * 构建最终的总结提示词
   */
  prepareSummaryPrompt(userInput: string, toolResults: ToolResult[], currentState: string): string {
    const successfulTools = toolResults.filter(r => r.success);
    const failedTools = toolResults.filter(r => !r.success);

    return `请基于以下信息，生成一个详细的 Bug 分析报告：

Bug报告: ${userInput}

分析结果摘要:
- 成功执行工具数: ${successfulTools.length}
- 失败执行工具数: ${failedTools.length}
- 当前分析状态: ${currentState}

报告格式要求:
1. Bug 描述：总结 Bug 的核心问题
2. 问题分析：详细说明问题的根本原因
3. 影响范围：说明问题的影响程度
4. 解决方案：提供具体的修复建议
5. 实施建议：说明如何实施修复

报告应当重点关注问题分析和解决方案，提供具体的、可操作的信息。`;
  }

  /**
   * 验证执行结果的提示词
   */
  prepareVerificationPrompt(userInput: string, results: ToolResult[]): string {
    const successfulTools = results.filter(r => r.success);
    const failedTools = results.filter(r => !r.success);

    return `验证阶段：检查 Bug 分析的完整性和准确性。

Bug报告: ${userInput}

分析结果:
- 成功执行工具数: ${successfulTools.length}
- 失败执行工具数: ${failedTools.length}

验证检查清单:
1. Bug 分析是否完整
2. 问题原因是否准确
3. 解决方案是否可行
4. 是否有遗漏的分析点
5. 是否有其他需要注意的问题`;
  }
} 