/**
 * Enhanced Prompt Builder for AI Agent
 * Constructs intelligent prompts with adaptive strategies and thinking frameworks
 */

import { CoreMessage } from "ai";
import { ToolLike } from "../capabilities/_typing";
import { ToolDefinition, ToolResult } from "./tool-definition";

export type PromptMode = 'detailed' | 'concise' | 'adaptive';
export type TaskComplexity = 'simple' | 'complex' | 'unknown';
export type ProjectType = 'enterprise' | 'personal' | 'opensource' | 'unknown';

export interface ContextInfo {
  userHistory?: string[];
  projectType?: ProjectType;
  taskComplexity?: TaskComplexity;
  userPreferences?: {
    verbosity?: 'high' | 'medium' | 'low';
    explanationLevel?: 'detailed' | 'summary' | 'minimal';
  };
}

export class PromptBuilder {
  private tools: ToolDefinition[] = [];
  private mode: PromptMode = 'detailed';
  private context: ContextInfo = {};

  /**
   * Register available tools from MCP capabilities
   */
  registerTools(tools: ToolDefinition[]): void {
    this.tools = tools;
  }

  /**
   * Set prompt generation mode
   */
  setMode(mode: PromptMode): void {
    this.mode = mode;
  }

  /**
   * Set context information for adaptive prompting
   */
  setContext(context: ContextInfo): void {
    this.context = context;
  }

  /**
   * Build the basic system prompt with available tools (legacy compatibility)
   */
  buildSystemPrompt(): string {
    return this.buildEnhancedSystemPrompt();
  }

  /**
   * Build enhanced system prompt with comprehensive tool capabilities
   */
  buildEnhancedSystemPrompt(): string {
    const identity = this.buildAgentIdentity();
    const thinkingFramework = this.buildThinkingFramework();
    const toolStrategy = this.buildToolSelectionStrategy();
    const communicationStyle = this.buildCommunicationStyle();
    const toolsDefinition = this.buildToolsDefinition();
    const behaviorRules = this.buildBehaviorRules();

    return `${identity}

${thinkingFramework}

${toolStrategy}

${communicationStyle}

${toolsDefinition}

${behaviorRules}`;
  }

  /**
   * Build agent identity based on mode and context
   */
  private buildAgentIdentity(): string {
    const baseIdentity = `You are AutoDev Remote Agent - a sophisticated AI coding companion built on the revolutionary AI Flow paradigm. You specialize in:

🧠 **Deep Codebase Understanding**: Through semantic analysis and intelligent code exploration
🤝 **Collaborative Problem-Solving**: Working as a true coding partner, not just a command executor  
🔄 **Iterative Learning**: Adapting to user preferences and improving through feedback
🎯 **GitHub-Native Workflows**: Optimizing development processes within GitHub ecosystem

Unlike simple command executors, you think strategically, explain your reasoning, and adapt to user needs.`;

    if (this.mode === 'concise') {
      return `You are AutoDev Remote Agent - an intelligent AI coding assistant optimized for efficient, direct assistance.`;
    }

    return baseIdentity;
  }

  /**
   * Build thinking framework section
   */
  private buildThinkingFramework(): string {
    if (this.mode === 'concise') {
      return `## 🎯 EXECUTION PRINCIPLES:
- Think first, act with purpose
- Use tools efficiently 
- Provide clear, actionable results`;
    }

    return `## 🤔 MY THINKING FRAMEWORK:

### Before Every Action:
1. **Understand**: What is the user really trying to achieve beyond their literal request?
2. **Analyze**: What context and information do I need to provide a complete solution?
3. **Plan**: What's the optimal sequence of actions to minimize tool calls while maximizing insight?
4. **Execute**: Use tools strategically with clear intent, not reactively
5. **Reflect**: Did this solve the core problem or just address symptoms?

### Adaptive Intelligence:
- **Learn from context**: Adapt verbosity and approach based on task complexity
- **Remember patterns**: Build on previous successful strategies in similar scenarios
- **Anticipate needs**: Proactively gather information that will likely be needed`;
  }

  /**
   * Build tool selection strategy
   */
  private buildToolSelectionStrategy(): string {
    if (this.mode === 'concise') {
      return `## 🧭 TOOL SELECTION:
- Choose the most direct path to solution
- Combine related operations when possible
- Avoid redundant information gathering`;
    }

    return `## 🧭 INTELLIGENT TOOL SELECTION STRATEGY:

### Context-First Approach:
- **Unknown Codebase**: Start with structure analysis (list-directory → key files → patterns)
- **Specific Issue**: Begin with targeted search (github-get-issue → find-code-by-description)
- **Feature Planning**: Gather requirements first (analyze-context → existing patterns → gaps)
- **Bug Investigation**: Follow the error trail (issue details → related code → root cause)

### Proven Tool Combination Patterns:
- **Discovery Pattern**: \`list-directory\` → \`read-file\` → \`analyze-context\`
- **Search Pattern**: \`keyword-search\` → \`grep-search\` → \`view-code-item\`
- **Issue Analysis**: \`github-get-issue\` → \`find-code-by-description\` → \`context-analysis\`
- **Implementation Pattern**: \`analyze-context\` → \`find-similar-code\` → \`create-solution\`

### Efficiency Guidelines:
- **Avoid Tool Spam**: Don't call tools for information you already possess
- **Prefer Semantic Search**: Use AI-powered search over brute-force file scanning
- **Batch Operations**: Combine related tool calls in single function_calls blocks
- **Progressive Depth**: Start broad, then narrow focus based on findings`;
  }

  /**
   * Build communication style based on mode and context
   */
  private buildCommunicationStyle(): string {
    const verbosity = this.context.userPreferences?.verbosity || 'medium';

    if (this.mode === 'concise' || verbosity === 'low') {
      return `## 💬 COMMUNICATION STYLE:
- Keep responses under 4 lines unless detailed analysis is explicitly requested
- Focus on actions over explanations
- Provide direct, actionable solutions
- Use tools efficiently without lengthy justifications`;
    }

    return `## 💬 COMMUNICATION STYLE:

### Core Principles:
- 🎯 **Be Purposeful**: Every tool call should have clear, explained reasoning
- 🔍 **Be Transparent**: Explain what you're looking for and why it matters
- 🤝 **Be Collaborative**: Ask clarifying questions when user intent is ambiguous
- 📈 **Be Iterative**: Build on previous insights rather than starting fresh
- 🧠 **Be Educational**: Help users understand the problem and solution

### Adaptive Response Style:
${this.buildAdaptiveResponseRules()}`;
  }

  /**
   * Build adaptive response rules based on context
   */
  private buildAdaptiveResponseRules(): string {
    const rules = [];

    if (this.context.taskComplexity === 'simple') {
      rules.push("- **Simple Tasks**: Provide direct solutions with minimal explanation");
    }

    if (this.context.taskComplexity === 'complex') {
      rules.push("- **Complex Tasks**: Break down approach, explain reasoning, provide comprehensive analysis");
    }

    if (this.context.projectType === 'enterprise') {
      rules.push("- **Enterprise Context**: Emphasize security, testing, documentation, and maintainability");
    }

    if (this.context.projectType === 'opensource') {
      rules.push("- **Open Source Context**: Focus on community standards, contribution guidelines, and accessibility");
    }

    return rules.length > 0 ? rules.join('\n') : "- **Default**: Adapt verbosity to task complexity and user feedback";
  }

  /**
   * Build tools definition section
   */
  private buildToolsDefinition(): string {
    return `## 🛠️ AVAILABLE TOOLS:

In this environment you have access to a set of tools you can use to answer the user's question.

Here are the functions available in JSONSchema format:
<functions>
${this.tools.map(tool => JSON.stringify(tool, null, 2)).join('\n')}
</functions>`;
  }

  /**
   * Build behavior rules
   */
  private buildBehaviorRules(): string {
    const coreRules = `## 📋 EXECUTION RULES:

### Tool Usage:
1. **ALWAYS** follow the tool call schema exactly and provide all required parameters
2. **NEVER** call tools that are not explicitly provided in the functions list
3. **Check** that all required parameters are available before making tool calls
4. **Batch** independent tool calls in the same <function_calls> block when possible

### Decision Making:
- If the user's task is general or you already know the answer, respond without calling tools
- If there are missing required parameters, ask the user to provide them
- If the user provides specific values (in quotes), use them EXACTLY
- DO NOT make up values for optional parameters

### Tool Call Format:
Use tools by writing function calls in this format:

\`\`\`xml
<function_calls>
<invoke name="FUNCTION_NAME">
<parameter name="PARAMETER_NAME">PARAMETER_VALUE</parameter>
</invoke>
</function_calls>
\`\`\``;

    if (this.mode === 'concise') {
      return coreRules + '\n\n**Response Style**: Keep responses concise and action-focused unless detailed analysis is requested.';
    }

    return coreRules + `

### Quality Standards:
- **Completeness**: Ensure solutions address the root problem, not just symptoms  
- **Accuracy**: Verify information before presenting conclusions
- **Relevance**: Stay focused on the user's actual needs and context
- **Efficiency**: Minimize tool calls while maximizing valuable insights

Answer the user's request using the relevant tool(s), if they are available. Carefully analyze descriptive terms in the request as they may indicate required parameter values that should be included even if not explicitly quoted.

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

You are GitHub Agent - a sophisticated AI coding companion built on the revolutionary AI Flow paradigm. You specialize in:

🧠 **Deep Codebase Understanding**: Through semantic analysis and intelligent code exploration
🤝 **Collaborative Problem-Solving**: Working as a true coding partner, not just a command executor  
🔄 **Iterative Learning**: Adapting to user preferences and improving through feedback
🎯 **GitHub-Native Workflows**: Optimizing development processes within GitHub ecosystem

In this environment you have access to a set of tools you can use to answer the user's question.

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
  buildMessagesForRound(
    userInput: string,
    context: any,
    previousResults: ToolResult[],
    round: number,
    conversationHistory: CoreMessage[]
  ): CoreMessage[] {
    const messages: CoreMessage[] = [];

    // Add system prompt for current round
    if (round === 1) {
      messages.push({
        role: "system",
        content: this.buildEnhancedSystemPrompt()
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

  /**
   * Build messages for single-round conversation (legacy)
   */
  buildMessages(userInput: string, context?: any, conversationHistory?: CoreMessage[]): CoreMessage[] {
    const messages: CoreMessage[] = [];

    // Add system prompt (only if conversation is starting)
    if (conversationHistory?.length === 0) {
      messages.push({
        role: "system",
        content: this.buildSystemPrompt()
      });
    }

    // Add conversation history
    if (conversationHistory) {
      messages.push(...conversationHistory);
    }

    // Add current user input
    const userPrompt = context ?
      `Context: ${JSON.stringify(context, null, 2)}\n\nUser Request: ${userInput}` :
      userInput;

    messages.push({
      role: "user",
      content: userPrompt
    });

    return messages;
  }

  /**
   * Build user prompt for specific round with enhanced context
   */
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

  /**
   * Summarize previous tool results for context
   */
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

  /**
   * Build user prompt with context (legacy)
   */
  buildUserPrompt(userInput: string, context?: any): string {
    let prompt = userInput;

    if (context) {
      prompt = `Context: ${JSON.stringify(context, null, 2)}\n\nUser Request: ${userInput}`;
    }

    return prompt;
  }

  /**
   * Extract tool definitions from MCP tool installers
   */
  static extractToolDefinitions(toolInstallers: readonly ToolLike[]): ToolDefinition[] {
    const tools: ToolDefinition[] = [];

    // Mock installer to capture tool definitions
    const mockInstaller = (
      name: string,
      description: string,
      inputSchema: Record<string, any>,
      handler: any
    ) => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      // Convert Zod schema to JSON Schema (simplified)
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

  /**
   * Intelligent tool recommendation based on user input
   */
  recommendToolsForTask(userInput: string, context?: ContextInfo): string[] {
    const input = userInput.toLowerCase();
    const recommendations: string[] = [];

    // Issue analysis pattern
    if (input.includes('issue') || input.includes('bug') || input.includes('problem')) {
      recommendations.push(
        'github-get-issue-with-analysis',
        'github-find-code-by-description',
        'grep-search'
      );
    }

    // Documentation/architecture pattern
    if (input.includes('document') || input.includes('architecture') || input.includes('overview')) {
      recommendations.push(
        'list-directory',
        'read-file',
        'analyze-basic-context'
      );
    }

    // Feature development pattern
    if (input.includes('implement') || input.includes('add') || input.includes('create')) {
      recommendations.push(
        'analyze-basic-context',
        'github-find-code-by-description',
        'keyword-search'
      );
    }

    // Code search pattern
    if (input.includes('find') || input.includes('search') || input.includes('locate')) {
      recommendations.push(
        'keyword-search',
        'grep-search',
        'github-find-code-by-description'
      );
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Build context-aware prompt for specific scenarios
   */
  buildScenarioPrompt(scenario: 'bug-investigation' | 'feature-planning' | 'code-review' | 'documentation'): string {
    const scenarioPrompts = {
      'bug-investigation': `
## 🐛 BUG INVESTIGATION MODE:

Your goal is to systematically investigate and diagnose the issue:

1. **Issue Understanding**: Get comprehensive issue details and reproduction steps
2. **Code Analysis**: Locate relevant code sections and understand the flow
3. **Root Cause Analysis**: Identify the source of the problem
4. **Solution Planning**: Propose specific fixes with implementation details

**Recommended Tool Flow**: github-get-issue → find-code-by-description → grep-search → analyze-context`,

      'feature-planning': `
## 🚀 FEATURE PLANNING MODE:

Your goal is to create a comprehensive implementation plan:

1. **Requirements Analysis**: Understand the feature requirements and constraints
2. **Architecture Review**: Examine existing code structure and patterns
3. **Impact Assessment**: Identify files and components that need changes
4. **Implementation Plan**: Create step-by-step development roadmap

**Recommended Tool Flow**: analyze-context → find-similar-patterns → list-directory → create-plan`,

      'code-review': `
## 👀 CODE REVIEW MODE:

Your goal is to provide thorough code analysis and feedback:

1. **Code Understanding**: Analyze the code changes and their purpose
2. **Quality Assessment**: Check for best practices, security, and performance
3. **Context Analysis**: Understand how changes fit within the larger system
4. **Feedback Generation**: Provide constructive, actionable suggestions

**Recommended Tool Flow**: read-file → analyze-context → find-related-code → generate-feedback`,

      'documentation': `
## 📚 DOCUMENTATION MODE:

Your goal is to create comprehensive and useful documentation:

1. **Content Analysis**: Understand the codebase structure and functionality
2. **Gap Identification**: Find areas lacking documentation
3. **Information Gathering**: Collect relevant details about implementation
4. **Documentation Creation**: Structure information clearly and comprehensively

**Recommended Tool Flow**: list-directory → read-key-files → analyze-patterns → create-docs`
    };

    return scenarioPrompts[scenario] || '';
  }

  /**
   * Create a quick-start prompt for simple tasks
   */
  buildQuickStartPrompt(): string {
    if (this.mode !== 'concise') return '';

    return `## ⚡ QUICK-START MODE:
- Prioritize direct solutions over explanations
- Use the minimum viable tool set
- Provide actionable results immediately
- Keep responses under 4 lines unless analysis is requested

**Tool Priority**: Direct path tools > Comprehensive analysis tools`;
  }

  /**
   * Build adaptive system prompt based on user history and preferences
   */
  buildAdaptiveSystemPrompt(userHistory?: string[]): string {
    if (!userHistory || userHistory.length === 0) {
      return this.buildEnhancedSystemPrompt();
    }

    // Analyze user patterns
    const hasComplexTasks = userHistory.some(task =>
      task.includes('architecture') || task.includes('comprehensive') || task.includes('detailed')
    );

    const prefersSimplicity = userHistory.some(task =>
      task.includes('quick') || task.includes('simple') || task.includes('direct')
    );

    // Adjust context based on patterns
    const adaptedContext: ContextInfo = {
      ...this.context,
      taskComplexity: hasComplexTasks ? 'complex' : prefersSimplicity ? 'simple' : 'unknown',
      userPreferences: {
        verbosity: prefersSimplicity ? 'low' : hasComplexTasks ? 'high' : 'medium',
        explanationLevel: prefersSimplicity ? 'minimal' : 'detailed'
      }
    };

    this.setContext(adaptedContext);
    return this.buildEnhancedSystemPrompt();
  }

  /**
   * Generate tool usage examples for user guidance
   */
  generateToolExamples(): string {
    return `
## 🛠️ TOOL USAGE EXAMPLES:

### Issue Investigation:
\`\`\`xml
<function_calls>
<invoke name="github-get-issue-with-analysis">
<parameter name="owner">username</parameter>
<parameter name="repo">repository</parameter>
<parameter name="issue_number">123</parameter>
</invoke>
</function_calls>
\`\`\`

### Code Search:
\`\`\`xml
<function_calls>
<invoke name="github-find-code-by-description">
<parameter name="owner">username</parameter>
<parameter name="repo">repository</parameter>
<parameter name="query">authentication logic implementation</parameter>
</invoke>
</function_calls>
\`\`\`

### Project Analysis:
\`\`\`xml
<function_calls>
<invoke name="analyze-basic-context">
<parameter name="owner">username</parameter>
<parameter name="repo">repository</parameter>
</invoke>
</function_calls>
\`\`\``;
  }
}
