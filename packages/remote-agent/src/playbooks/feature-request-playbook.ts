import { CoreMessage } from "ai";
import { Playbook } from "./base-playbook";
import { ToolResult } from "../agent/tool-definition";

/**
 * FeatureRequestPlaybook 专注于管理功能请求澄清相关的提示词策略
 */
export class FeatureRequestPlaybook extends Playbook {
  constructor() {
    super(`你是一个功能需求分析专家，擅长澄清和细化功能请求。
你的主要职责是：
1. 理解功能请求的核心需求
2. 分析现有代码库的相关实现
3. 提出具体的实现建议
4. 确保新功能与现有系统兼容
5. 提供清晰的实现路径`);
  }

  /**
   * 为功能请求澄清准备提示词
   */
  preparePrompt(userInput: string, context?: any): string {
    return `功能请求澄清任务: 分析以下功能请求并提供实现建议。

用户请求: ${userInput}

${context ? `上下文信息: ${JSON.stringify(context)}` : ''}

分析指南:
1. 理解功能请求的核心目标和价值
2. 分析现有代码库中的相关实现
3. 识别实现新功能所需的关键组件
4. 评估与现有系统的兼容性
5. 提供具体的实现建议和步骤`;
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
        content: `需求分析阶段: 分析以下功能请求，理解核心需求。

${this.preparePrompt(input, context)}

在此阶段，请专注于：
1. 理解功能请求的核心目标
2. 确定关键功能点
3. 识别潜在的技术挑战
4. 不要急于提供具体实现方案`
      });
    } else if (round === 2) {
      messages.push({
        role: "user",
        content: `技术分析阶段: 基于需求分析，评估技术可行性。

功能请求: ${input}

请执行以下操作：
1. 分析现有代码库的相关实现
2. 评估技术可行性
3. 识别潜在的技术风险
4. 记录关键发现`
      });
    } else {
      messages.push({
        role: "user",
        content: `实现建议阶段: 基于分析结果，提供实现建议。

功能请求: ${input}

请执行以下操作：
1. 总结需求分析结果
2. 提供具体的实现建议
3. 说明实现步骤和注意事项
4. 提供技术选型建议`
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

    return `请基于以下信息，生成一个详细的功能请求分析报告：

功能请求: ${userInput}

分析结果摘要:
- 成功执行工具数: ${successfulTools.length}
- 失败执行工具数: ${failedTools.length}
- 当前分析状态: ${currentState}

报告格式要求:
1. 需求概述：总结功能请求的核心目标
2. 技术分析：说明技术可行性和挑战
3. 实现建议：提供具体的实现方案
4. 技术选型：推荐合适的技术方案
5. 实施步骤：说明具体的实施步骤

报告应当重点关注技术可行性和实现方案，提供具体的、可操作的信息。`;
  }

  /**
   * 验证执行结果的提示词
   */
  prepareVerificationPrompt(userInput: string, results: ToolResult[]): string {
    const successfulTools = results.filter(r => r.success);
    const failedTools = results.filter(r => !r.success);

    return `验证阶段：检查功能请求分析的完整性和可行性。

功能请求: ${userInput}

分析结果:
- 成功执行工具数: ${successfulTools.length}
- 失败执行工具数: ${failedTools.length}

验证检查清单:
1. 需求理解是否准确
2. 技术分析是否完整
3. 实现方案是否可行
4. 是否有遗漏的关键点
5. 是否有其他需要注意的问题`;
  }
} 