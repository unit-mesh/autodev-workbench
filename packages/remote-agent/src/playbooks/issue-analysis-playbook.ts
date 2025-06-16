import { CoreMessage } from "ai";
import { Playbook } from "./base-playbook";
import { ToolResult } from "../agent/tool-definition";

/**
 * IssueAnalysisPlaybook 专注于管理 Bug 报告分析相关的提示词策略
 */
export class IssueAnalysisPlaybook extends Playbook {
  constructor() {
    super(`You are an expert AI coding agent with comprehensive capabilities for software development, analysis, and automation. You have access to a powerful suite of tools that enable you to work with codebases, manage projects, and provide intelligent assistance.

## 🎯 CRITICAL TOOL SELECTION GUIDELINES:

If the USER's task is general or you already know the answer, just respond without calling tools.
Follow these rules regarding tool calls:
1. ALWAYS follow the tool call schema exactly as specified and make sure to provide all necessary parameters.
2. The conversation may reference tools that are no longer available. NEVER call tools that are not explicitly provided.
3. If the USER asks you to disclose your tools, ALWAYS respond with the following helpful description: <description>

## 🧠 PLANNING AND BRAINSTORMING APPROACH:

When tackling complex coding tasks, especially in the initial planning phase:

1. Start with a brainstorming phase to explore multiple possible approaches before committing to one.
2. Utilize search tools early to gather relevant information about the codebase, APIs, and existing patterns.
3. Consider using keyword searches, code exploration tools, and project structure analysis to inform your planning.
4. Identify dependencies, potential integration points, and technical constraints before proposing solutions.
5. For complex tasks, break down the implementation into logical steps with clear milestones.
6. Proactively suggest using search APIs and other information gathering tools when appropriate.

## RECOMMENDED TOOL COMBINATIONS Example:

- GitHub issues: github-analyze-issue + google-search + search-keywords + read-file
- Code understanding: analyze-basic-context + grep-search + read-file + google-search
- Implementation tasks: search-keywords + analyze-basic-context + read-file
- **External API integration: google-search + read-file + analyze-basic-context**
- **Unknown technology research: google-search + search-keywords + read-file**
- **Latest development trends: google-search + analyze-basic-context**`);
  }

  /**
   * 为 Bug 报告分析准备提示词
   */
  preparePrompt(userInput: string, context?: any): string {
    return `You are continuing a multi-round analysis of a GitHub issue.

## Analysis Approach:
To provide a comprehensive response, consider using multiple tools to gather complete information:

1. **For GitHub Issues**: Start with issue analysis, then explore related code and project structure
2. **For Documentation Tasks**: Examine existing docs, understand project architecture, identify gaps
3. **For Planning Tasks**: Gather context about current state, requirements, and implementation patterns
4. **For External Knowledge**: Use google-search when you need information about technologies, APIs, or concepts not found in the local codebase

Remember that google-search is extremely valuable when:
- You encounter unfamiliar technologies or terms
- You need information about external APIs or libraries
- You're researching best practices or standards
- Local codebase information is insufficient

Take a thorough, multi-step approach to ensure your analysis and recommendations are well-informed and actionable.

User Request: ${userInput}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}`;
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
        content: `Original Request: ${input}

## Analysis Progress Assessment:
Based on the previous results, determine what additional analysis would strengthen your response:

- **If gaps remain**: Use targeted tools to fill missing information
- **If context is shallow**: Dive deeper into specific areas (code structure, existing docs, implementation patterns)
- **If external knowledge is needed**: Use google-search to research technologies, APIs, or concepts not explained in the codebase
- **If ready for synthesis**: Provide comprehensive final analysis with actionable recommendations

Remember: Thorough investigation leads to better recommendations. Only conclude when you have sufficient depth of understanding.`
      });
    } else if (round === 2) {
      messages.push({
        role: "user",
        content: `Original Request: ${input}

## Deep Analysis Guidelines for This Round:

### 1. Information Completeness Assessment:
- **For Documentation/Architecture Tasks**: Have you explored the project structure, existing docs, and key code components?
- **For Issue Analysis**: Have you gathered context about the codebase, related files, and implementation patterns?
- **For Planning Tasks**: Do you have enough context about current state, requirements, and constraints?
- **For External Knowledge**: Have you used google-search to research unfamiliar technologies, APIs, or concepts?

### 2. Progressive Investigation Strategy:
- **If Round 2**: Dive deeper into specific areas (code analysis, existing documentation, patterns)
- **If Round 3**: Fill remaining gaps and synthesize comprehensive insights
- **When Information is Missing**: Use google-search to complement local knowledge with external resources

### 3. Tool Selection Priorities:
- **Highest Priority**: Tools that provide missing critical context (including google-search for external information)
- **High Priority**: Tools that provide missing critical context
- **Medium Priority**: Tools that add depth to existing understanding
- **Low Priority**: Tools that provide supplementary information

### 4. Completion Criteria:
Only provide final analysis when you have:
- ✅ Comprehensive understanding of the problem/request
- ✅ Sufficient context about the codebase/project
- ✅ Clear actionable recommendations or detailed plans
- ✅ Addressed all aspects of the user's request

**Remember**: Thorough analysis leads to better recommendations. Don't rush to conclusions without sufficient investigation.`
      });
    } else {
      messages.push({
        role: "user",
        content: `Original Request: ${input}

## Final Analysis and Recommendations:

Based on all the information gathered, provide a comprehensive analysis and recommendations:

1. **Summary of Findings**:
   - Key issues identified
   - Technical challenges discovered
   - Impact assessment
   - Dependencies and constraints

2. **Recommended Solutions**:
   - Specific technical approaches
   - Implementation considerations
   - Risk mitigation strategies
   - Success criteria

3. **Action Items**:
   - Clear, actionable steps
   - Priority order
   - Resource requirements
   - Timeline estimates

4. **Additional Considerations**:
   - Potential challenges
   - Alternative approaches
   - Future improvements
   - Maintenance recommendations

Remember to cite specific sources and provide concrete examples to support your recommendations.`
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