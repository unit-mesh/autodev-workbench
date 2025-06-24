import { CoreMessage } from "ai";
import { Playbook } from "./base-playbook";
import { ToolResult } from "../agent/tool-definition";

export class BugFixPlaybook extends Playbook {
  constructor() {
    super(`你是一个专业的代码修复专家，擅长分析和修复代码中的缺陷。
你的主要职责是：
1. 分析代码库中的bug和问题
2. 识别问题的根本原因
3. 设计最小且精确的修复方案
4. 应用修复并确保不引入新问题
5. 保持代码风格一致性`);
  }

  /**
   * 为Bug修复准备提示词
   */
  preparePrompt(userInput: string, context?: any): string {
    return `BUG修复任务: 分析并修复以下代码问题。

用户请求: ${userInput}

${context ? `上下文信息: ${JSON.stringify(context)}` : ''}

修复指南:
1. 首先使用代码搜索工具(grep-search, search-keywords)定位相关代码
2. 读取并理解受影响的文件
3. 分析问题的根本原因
4. 设计最小且精确的修复方案
5. 使用str-replace-editor工具应用修复
6. 验证修复是否解决了问题`;
  }

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
    const messages = await super.buildMessagesForRound(
      input,
      context,
      round,
      conversationHistory,
      workspacePath
    );

    // 根据轮次添加特定的提示词
    if (round === 1) {
      messages.push({
        role: "user",
        content: `分析阶段: 分析以下代码问题，但不要进行修改。

${this.preparePrompt(input, context)}

在此阶段，请专注于：
1. 理解代码结构和问题所在
2. 确定受影响的文件和组件
3. 探索可能的解决方案
4. 不要进行任何代码修改`
      });
    } else if (round === 2) {
      messages.push({
        role: "user",
        content: `修复阶段: 基于前面的分析，现在实现代码修复。

问题: ${input}

请执行以下操作：
1. 使用str-replace-editor工具对文件进行精确修改
2. 确保修改的范围最小化
3. 保持代码风格一致性
4. 确保修复不会引入新问题`
      });
    } else {
      messages.push({
        role: "user",
        content: `验证和完善阶段: 检查修复是否完整，并进行必要的调整。

问题: ${input}

请执行以下操作：
1. 验证所有受影响的文件都已修复
2. 检查是否有遗漏的问题场景
3. 确认修复是否与项目的整体架构保持一致
4. 如有必要，进行额外的完善`
      });
    }

    return messages;
  }

  /**
   * 构建最终的总结提示词
   */
  prepareSummaryPrompt(userInput: string, toolResults: ToolResult[], currentState: string): string {
    const modifiedFiles = toolResults
      .filter(r => r.success &&
        (r.functionCall.name === 'str-replace-editor' || r.functionCall.name === 'fs-write-file'))
      .map(r => r.functionCall.parameters.targetFile);

    const uniqueModifiedFiles = [...new Set(modifiedFiles)];

    return `请基于以下信息，生成一个关于代码修复的详细技术报告：

用户请求: ${userInput}

修改的文件:
${uniqueModifiedFiles.map(file => `- ${file}`).join('\n')}

当前状态: ${currentState}

报告格式要求:
1. 执行摘要：简明扼要地描述修复的问题和解决方案
2. 关键发现：列出问题的根本原因及其影响
3. 修复措施：详细说明所做的代码更改及其作用
4. 技术细节：说明实现细节和注意事项
5. 风险评估：讨论修复可能带来的风险和副作用

报告应当重点关注解决方案，而非分析过程。应当提供具体的、可操作的信息，引用工具执行结果作为证据支持。`;
  }

  /**
   * 验证执行结果的提示词
   */
  prepareVerificationPrompt(userInput: string, results: ToolResult[]): string {
    const modifiedFiles = results
      .filter(r => r.success &&
        (r.functionCall.name === 'str-replace-editor' || r.functionCall.name === 'fs-write-file'))
      .map(r => r.functionCall.parameters.targetFile);

    const uniqueModifiedFiles = [...new Set(modifiedFiles)];

    return `验证阶段：检查代码修复的质量和完整性。

用户请求: ${userInput}

修改的文件:
${uniqueModifiedFiles.map(file => `- ${file}`).join('\n')}

验证检查清单:
1. 修复是否解决了原始问题
2. 代码变更是否最小且精确
3. 是否保持了代码风格一致性
4. 是否可能引入新的问题
5. 是否有其他需要修复的相关问题`;
  }
}
