import { CoreMessage } from "ai";
import { ToolLike } from "../capabilities/_typing";
import { ToolDefinition, ToolResult } from "./tool-definition";
import { ProjectContextAnalyzer } from "../capabilities/tools/analyzers/project-context-analyzer";

export class PromptBuilder {
  private tools: ToolDefinition[] = [];

  /**
   * Register available tools from MCP capabilities
   */
  registerTools(tools: ToolDefinition[]): void {
    this.tools = tools;
  }

  /**
   * Build the basic system prompt with available tools (legacy)
   */
  buildSystemPrompt(): string {
    return this.buildEnhancedSystemPrompt();
  }

  /**
   * Build enhanced system prompt with comprehensive tool capabilities
   */
  buildEnhancedSystemPrompt(): string {
    return `You are an expert AI coding agent with comprehensive capabilities for software development, analysis, and automation. You have access to a powerful suite of tools that enable you to work with codebases, manage projects, and provide intelligent assistance.

In this environment you have access to a set of tools you can use to answer the user's question.

## 🎯 CRITICAL TOOL SELECTION GUIDELINES:

If the USER's task is general or you already know the answer, just respond without calling tools.
Follow these rules regarding tool calls:
1. ALWAYS follow the tool call schema exactly as specified and make sure to provide all necessary parameters.
2. The conversation may reference tools that are no longer available. NEVER call tools that are not explicitly provided.
3. If the USER asks you to disclose your tools, ALWAYS respond with the following helpful description: <description>

Here are the functions available in JSONSchema format:
<functions>
${this.tools.map(tool => JSON.stringify(tool, null, 2)).join('\n')}
</functions>

Answer the user's request using the relevant tool(s), if they are available. Check that all the required parameters for each tool call are provided or can reasonably be inferred from context. IF there are no relevant tools or there are missing values for required parameters, ask the user to supply these values; otherwise proceed with the tool calls. If the user provides a specific value for a parameter (for example provided in quotes), make sure to use that value EXACTLY. DO NOT make up values for or ask about optional parameters. Carefully analyze descriptive terms in the request as they may indicate required parameter values that should be included even if not explicitly quoted.

If you intend to call multiple tools and there are no dependencies between the calls, make all of the independent calls in the same <function_calls></function_calls> block.

You can use tools by writing a "<function_calls>" inside markdown code-block like the following as part of your reply to the user:

\`\`\`xml
<function_calls>
<invoke name="FUNCTION_NAME">
<parameter name="PARAMETER_NAME">PARAMETER_VALUE</parameter>
...
</invoke>
<invoke name="FUNCTION_NAME2">
...
</invoke>
</function_calls>
\`\`\`

String and scalar parameters should be specified as is, while lists and objects should use JSON format.
`;
  }

  /**
   * Build continuation system prompt for multi-round analysis
   */
  buildContinuationSystemPrompt(round: number, previousResults: ToolResult[]): string {
    const successfulTools = previousResults.filter(r => r.success).map(r => r.functionCall.name);
    const failedTools = previousResults.filter(r => !r.success).map(r => r.functionCall.name);

    return `You are continuing a multi-round analysis (Round ${round}).

You are an expert AI coding agent with comprehensive capabilities for software development, analysis, and automation. You have access to a powerful suite of tools that enable you to work with codebases, manage projects, and provide intelligent assistance.

In this environment you have access to a set of tools you can use to answer the user's question.

If the USER's task is general or you already know the answer, just respond without calling tools.
Follow these rules regarding tool calls:
1. ALWAYS follow the tool call schema exactly as specified and make sure to provide all necessary parameters.
2. The conversation may reference tools that are no longer available. NEVER call tools that are not explicitly provided.
3. If the USER asks you to disclose your tools, ALWAYS respond with the following helpful description: <description>

## Previous Execution Summary:
- Successful tools: ${successfulTools.join(', ') || 'None'}
- Failed tools: ${failedTools.join(', ') || 'None'}

## Deep Analysis Guidelines for This Round:

### 1. Information Completeness Assessment:
- **For Documentation/Architecture Tasks**: Have you explored the project structure, existing docs, and key code components?
- **For Issue Analysis**: Have you gathered context about the codebase, related files, and implementation patterns?
- **For Planning Tasks**: Do you have enough context about current state, requirements, and constraints?

### 2. Progressive Investigation Strategy:
- **If Round 1**: Focus on broad understanding (issue details, project overview, structure)
- **If Round 2**: Dive deeper into specific areas (code analysis, existing documentation, patterns)
- **If Round 3**: Fill remaining gaps and synthesize comprehensive insights

### 3. Tool Selection Priorities:
- **High Priority**: Tools that provide missing critical context
- **Medium Priority**: Tools that add depth to existing understanding
- **Low Priority**: Tools that provide supplementary information

### 4. Completion Criteria:
Only provide final analysis when you have:
- ✅ Comprehensive understanding of the problem/request
- ✅ Sufficient context about the codebase/project
- ✅ Clear actionable recommendations or detailed plans
- ✅ Addressed all aspects of the user's request

**Remember**: Thorough analysis leads to better recommendations. Don't rush to conclusions without sufficient investigation.

You have the same tools available as before. Use them strategically to build comprehensive understanding.

Here are the functions available in JSONSchema format:
<functions>
${this.tools.map(tool => JSON.stringify(tool)).join('\n')}
</functions>

Answer the user's request using the relevant tool(s), if they are available. Check that all the required parameters for each tool call are provided or can reasonably be inferred from context. IF there are no relevant tools or there are missing values for required parameters, ask the user to supply these values; otherwise proceed with the tool calls. If the user provides a specific value for a parameter (for example provided in quotes), make sure to use that value EXACTLY. DO NOT make up values for or ask about optional parameters. Carefully analyze descriptive terms in the request as they may indicate required parameter values that should be included even if not explicitly quoted.

If you intend to call multiple tools and there are no dependencies between the calls, make all of the independent calls in the same <function_calls></function_calls> block.

You can use tools by writing a "<function_calls>" inside markdown code-block like the following as part of your reply to the user:

\`\`\`xml
<function_calls>
<invoke name="FUNCTION_NAME">
<parameter name="PARAMETER_NAME">PARAMETER_VALUE</parameter>
...
</invoke>
<invoke name="FUNCTION_NAME2">
...
</invoke>
</function_calls>
\`\`\`

String and scalar parameters should be specified as is, while lists and objects should use JSON format.
`;
  }

  /**
   * Build enhanced system prompt with project context for round 1
   */
  async buildEnhancedSystemPromptWithContext(workspacePath?: string): Promise<string> {
    let contextInfo = '';

    if (workspacePath) {
      try {
        const analyzer = new ProjectContextAnalyzer();
        const analysisResult = await analyzer.analyze(workspacePath, "basic");

        contextInfo = `

## 📋 PROJECT CONTEXT INFORMATION:

Based on the analysis of the current workspace, here's what I know about your project:

**Project Overview:**
${JSON.stringify(analysisResult)}

This context will help me provide more relevant and targeted assistance for your specific project setup.
`;
      } catch (error) {
        console.warn('Failed to analyze project context:', error);
        contextInfo = `

## 📋 PROJECT CONTEXT:
Working in directory: ${workspacePath}
(Project analysis unavailable - proceeding with general assistance)
`;
      }
    }

    return `You are an expert AI coding agent with comprehensive capabilities for software development, analysis, and automation. You have access to a powerful suite of tools that enable you to work with codebases, manage projects, and provide intelligent assistance.${contextInfo}

In this environment you have access to a set of tools you can use to answer the user's question.

## 🎯 CRITICAL TOOL SELECTION GUIDELINES:

If the USER's task is general or you already know the answer, just respond without calling tools.
Follow these rules regarding tool calls:
1. ALWAYS follow the tool call schema exactly as specified and make sure to provide all necessary parameters.
2. The conversation may reference tools that are no longer available. NEVER call tools that are not explicitly provided.
3. If the USER asks you to disclose your tools, ALWAYS respond with the following helpful description: <description>

Here are the functions available in JSONSchema format:
<functions>
${this.tools.map(tool => JSON.stringify(tool, null, 2)).join('\n')}
</functions>

Answer the user's request using the relevant tool(s), if they are available. Check that all the required parameters for each tool call are provided or can reasonably be inferred from context. IF there are no relevant tools or there are missing values for required parameters, ask the user to supply these values; otherwise proceed with the tool calls. If the user provides a specific value for a parameter (for example provided in quotes), make sure to use that value EXACTLY. DO NOT make up values for or ask about optional parameters. Carefully analyze descriptive terms in the request as they may indicate required parameter values that should be included even if not explicitly quoted.

If you intend to call multiple tools and there are no dependencies between the calls, make all of the independent calls in the same <function_calls></function_calls> block.

You can use tools by writing a "<function_calls>" inside markdown code-block like the following as part of your reply to the user:

\`\`\`xml
<function_calls>
<invoke name="FUNCTION_NAME">
<parameter name="PARAMETER_NAME">PARAMETER_VALUE</parameter>
...
</invoke>
<invoke name="FUNCTION_NAME2">
...
</invoke>
</function_calls>
\`\`\`

String and scalar parameters should be specified as is, while lists and objects should use JSON format.
`;
  }

  /**
   * Build messages for multi-round conversation
   */
  async buildMessagesForRound(
    userInput: string,
    context: any,
    previousResults: ToolResult[],
    round: number,
    conversationHistory: CoreMessage[],
    workspacePath?: string
  ): Promise<CoreMessage[]> {
    const messages: CoreMessage[] = [];

    // Add system prompt for current round
    if (round === 1) {
      const systemPrompt = await this.buildEnhancedSystemPromptWithContext(workspacePath);
      messages.push({
        role: "system",
        content: systemPrompt
      });
    } else {
      messages.push({
        role: "system",
        content: this.buildContinuationSystemPrompt(round, previousResults)
      });
    }

    // Add conversation history (but limit it for multi-round)
    const historyLimit = Math.max(0, conversationHistory.length - 10);
    messages.push(...conversationHistory.slice(historyLimit));

    // Add current user input with context
    const userPrompt = this.buildUserPromptForRound(userInput, context, previousResults, round);
    messages.push({
      role: "user",
      content: userPrompt
    });

    return messages;
  }

  buildMessages(userInput: string, context: any, conversationHistory: CoreMessage[]): CoreMessage[] {
    const messages: CoreMessage[] = [];
    if (conversationHistory.length === 0) {
      messages.push({
        role: "system",
        content: this.buildSystemPrompt()
      });
    }

    messages.push(...conversationHistory);
    const userPrompt = context ?
      `Context: ${JSON.stringify(context, null, 2)}\n\nUser Request: ${userInput}` :
      userInput;

    messages.push({
      role: "user",
      content: userPrompt
    });

    return messages;
  }

  buildUserPromptForRound(
    userInput: string,
    context: any,
    previousResults: ToolResult[],
    round: number
  ): string {
    if (round === 1) {
      const basePrompt = context ?
        `Context: ${JSON.stringify(context, null, 2)}\n\nUser Request: ${userInput}` :
        userInput;

      return `${basePrompt}

## Analysis Approach:
To provide a comprehensive response, consider using multiple tools to gather complete information:

1. **For GitHub Issues**: Start with issue analysis, then explore related code and project structure
2. **For Documentation Tasks**: Examine existing docs, understand project architecture, identify gaps
3. **For Planning Tasks**: Gather context about current state, requirements, and implementation patterns

Take a thorough, multi-step approach to ensure your analysis and recommendations are well-informed and actionable.`;
    }

    // For subsequent rounds, include previous results and encourage deeper analysis
    const previousSummary = this.summarizePreviousResults(previousResults);
    const analysisGaps = this.identifyAnalysisGaps(previousResults, userInput);

    return `Original Request: ${userInput}

Previous Tool Results Summary:
${previousSummary}

## Analysis Progress Assessment:
${analysisGaps}

## Next Steps Guidance:
Based on the previous results, determine what additional analysis would strengthen your response:

- **If gaps remain**: Use targeted tools to fill missing information
- **If context is shallow**: Dive deeper into specific areas (code structure, existing docs, implementation patterns)
- **If ready for synthesis**: Provide comprehensive final analysis with actionable recommendations

Remember: Thorough investigation leads to better recommendations. Only conclude when you have sufficient depth of understanding.`;
  }

  private summarizePreviousResults(results: ToolResult[]): string {
    const summary = results.map(result => {
      if (result.success) {
        return `✅ ${result.functionCall.name}: Completed successfully (Round ${result.round})`;
      } else {
        return `❌ ${result.functionCall.name}: Failed - ${result.error} (Round ${result.round})`;
      }
    }).join('\n');

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return `${summary}\n\nSummary: ${successCount}/${totalCount} tools executed successfully`;
  }

  /**
   * Identify gaps in analysis based on previous results and user request
   */
  private identifyAnalysisGaps(previousResults: ToolResult[], userInput: string): string {
    const categories = this.categorizeToolResults(previousResults);
    const gaps: string[] = [];

    // Determine request type
    const isDocumentationTask = userInput.toLowerCase().includes('document') ||
      userInput.toLowerCase().includes('architecture') ||
      userInput.toLowerCase().includes('plan');
    const isIssueAnalysis = userInput.toLowerCase().includes('issue') ||
      userInput.toLowerCase().includes('github.com');

    // Check for missing analysis types
    if (categories.issueAnalysis === 0 && isIssueAnalysis) {
      gaps.push("❌ Missing: Issue details and context analysis");
    }

    if (categories.structureAnalysis === 0 && isDocumentationTask) {
      gaps.push("❌ Missing: Project structure and architecture analysis");
    }

    if (categories.codeExploration === 0 && (isDocumentationTask || isIssueAnalysis)) {
      gaps.push("❌ Missing: Codebase exploration and pattern analysis");
    }

    if (categories.contentAnalysis === 0 && isDocumentationTask) {
      gaps.push("❌ Missing: Existing documentation and content analysis");
    }

    // Identify what we have
    const completed: string[] = [];
    if (categories.issueAnalysis > 0) completed.push("✅ Issue analysis completed");
    if (categories.structureAnalysis > 0) completed.push("✅ Structure analysis completed");
    if (categories.codeExploration > 0) completed.push("✅ Code exploration completed");
    if (categories.contentAnalysis > 0) completed.push("✅ Content analysis completed");

    const result = [];
    if (completed.length > 0) {
      result.push("**Completed Analysis:**");
      result.push(...completed);
    }

    if (gaps.length > 0) {
      result.push("**Analysis Gaps:**");
      result.push(...gaps);
    } else {
      result.push("**Analysis Status:** ✅ Comprehensive coverage achieved");
    }

    return result.join('\n');
  }

  /**
   * Categorize tool results by analysis type
   */
  private categorizeToolResults(results: ToolResult[]): {
    issueAnalysis: number;
    codeExploration: number;
    structureAnalysis: number;
    contentAnalysis: number;
  } {
    const categories = {
      issueAnalysis: 0,
      codeExploration: 0,
      structureAnalysis: 0,
      contentAnalysis: 0
    };

    results.forEach(result => {
      if (!result.success) return;

      const toolName = result.functionCall.name;

      if (toolName.includes('issue') || toolName.includes('github-get-issue')) {
        categories.issueAnalysis++;
      } else if (toolName.includes('find-code') || toolName.includes('codebase-search') || toolName.includes('grep-search')) {
        categories.codeExploration++;
      } else if (toolName.includes('list-directory') || toolName.includes('analyze-dependencies') || toolName.includes('analyze-symbols')) {
        categories.structureAnalysis++;
      } else if (toolName.includes('read-file') || toolName.includes('extract-webpage')) {
        categories.contentAnalysis++;
      }
    });

    return categories;
  }

  buildUserPrompt(userInput: string, context?: any): string {
    let prompt = userInput;

    if (context) {
      prompt = `Context: ${JSON.stringify(context, null, 2)}\n\nUser Request: ${userInput}`;
    }

    return prompt;
  }

  static extractToolDefinitions(toolInstallers: readonly ToolLike[]): ToolDefinition[] {
    const tools: ToolDefinition[] = [];

    const mockInstaller = (
      name: string,
      description: string,
      inputSchema: Record<string, any>,
      handler: any
    ) => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, zodType] of Object.entries(inputSchema)) {
        try {
          properties[key] = PromptBuilder.zodToJsonSchema(zodType);

          // Simple required check - assume all are required unless explicitly optional
          if (zodType && typeof zodType === 'object' && !zodType.isOptional) {
            required.push(key);
          }
        } catch (error) {
          // Fallback for complex types
          properties[key] = { type: 'string', description: `Parameter ${key}` };
          required.push(key);
        }
      }

      tools.push({
        name,
        description,
        parameters: {
          type: "object",
          properties,
          required
        }
      });
    };

    // Execute tool installers to capture definitions
    toolInstallers.forEach(installer => {
      try {
        installer(mockInstaller);
      } catch (error) {
        console.warn(`Failed to extract tool definition:`, error);
      }
    });

    return tools;
  }

  /**
   * Convert Zod type to JSON Schema (simplified)
   */
  private static zodToJsonSchema(zodType: any): any {
    // Simplified conversion with better error handling
    try {
      const typeName = zodType?._def?.typeName;
      const description = zodType?.description || '';

      switch (typeName) {
        case 'ZodString':
          return { type: 'string', description };
        case 'ZodNumber':
          return { type: 'number', description };
        case 'ZodBoolean':
          return { type: 'boolean', description };
        case 'ZodArray':
          return {
            type: 'array',
            items: PromptBuilder.zodToJsonSchema(zodType._def?.type),
            description
          };
        case 'ZodObject': {
          const properties: Record<string, any> = {};
          const shape = zodType._def?.shape?.() || {};
          for (const [key, value] of Object.entries(shape)) {
            properties[key] = PromptBuilder.zodToJsonSchema(value);
          }
          return { type: 'object', properties, description };
        }
        case 'ZodEnum':
          return {
            type: 'string',
            enum: zodType._def?.values || [],
            description
          };
        default:
          // Fallback for unknown types
          return { type: 'string', description: description || 'Parameter' };
      }
    } catch (error) {
      // Safe fallback
      return { type: 'string', description: 'Parameter' };
    }
  }
}
