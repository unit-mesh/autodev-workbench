import { CoreMessage } from "ai";
import { Playbook } from "./base-playbook";
import { ToolResult } from "../agent/tool-definition";

/**
 * AgentPlaybook 专注于管理 AI Agent 的通用提示词策略
 */
export class AgentPlaybook extends Playbook {
  constructor() {
    super(`你是一个专业的 AI 开发助手，擅长使用各种工具来帮助用户完成开发任务。
你的主要职责是：
1. 理解用户的需求和上下文
2. 使用合适的工具来完成任务
3. 提供清晰且可操作的解决方案
4. 确保解决方案的质量和完整性
5. 保持代码风格一致性`);
  }

  /**
   * 为 Agent 任务准备提示词
   */
  preparePrompt(userInput: string, context?: any): string {
    return `任务: 完成以下开发任务。

用户请求: ${userInput}

${context ? `上下文信息: ${JSON.stringify(context)}` : ''}

执行指南:
1. 仔细分析用户需求
2. 选择合适的工具来完成任务
3. 按步骤执行任务
4. 确保每个步骤的结果符合预期
5. 提供清晰的任务执行报告`;
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
      // 第一轮：分析阶段
      messages.push({
        role: "user",
        content: `分析阶段: 分析以下任务，制定执行计划。

${this.preparePrompt(input, context)}

在此阶段，请专注于：
1. 理解任务需求和上下文
2. 确定需要使用的工具
3. 制定详细的执行计划
4. 不要急于执行具体操作`
      });
    } else if (round === 2) {
      // 第二轮：执行阶段
      messages.push({
        role: "user",
        content: `执行阶段: 基于前面的分析，现在开始执行任务。

任务: ${input}

请执行以下操作：
1. 按照计划逐步执行任务
2. 使用合适的工具完成每个步骤
3. 确保每个步骤的结果符合预期
4. 记录执行过程中的重要信息`
      });
    } else {
      // 第三轮及以后：完善和验证
      messages.push({
        role: "user",
        content: `完善和验证阶段: 检查任务完成情况，并进行必要的调整。

任务: ${input}

请执行以下操作：
1. 验证所有步骤是否已完成
2. 检查是否有遗漏的任务点
3. 确认结果是否符合预期
4. 如有必要，进行额外的完善`
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

    return `请基于以下信息，生成一个详细的任务执行报告：

用户请求: ${userInput}

执行结果摘要:
- 成功执行工具数: ${successfulTools.length}
- 失败执行工具数: ${failedTools.length}
- 当前执行状态: ${currentState}

报告格式要求:
1. 执行摘要：简明扼要地描述完成的任务和主要成果
2. 执行过程：详细说明执行的步骤和使用的工具
3. 关键发现：列出执行过程中的重要发现
4. 技术细节：说明实现细节和注意事项
5. 后续建议：提供后续改进或优化的建议

报告应当重点关注执行结果，而非执行过程。应当提供具体的、可操作的信息，引用工具执行结果作为证据支持。`;
  }

  /**
   * 验证执行结果的提示词
   */
  prepareVerificationPrompt(userInput: string, results: ToolResult[]): string {
    const successfulTools = results.filter(r => r.success);
    const failedTools = results.filter(r => !r.success);

    return `验证阶段：检查任务执行的质量和完整性。

用户请求: ${userInput}

执行结果:
- 成功执行工具数: ${successfulTools.length}
- 失败执行工具数: ${failedTools.length}

验证检查清单:
1. 任务是否完全完成
2. 执行结果是否符合预期
3. 是否有遗漏的任务点
4. 是否有需要改进的地方
5. 是否有其他需要注意的问题`;
  }
} 