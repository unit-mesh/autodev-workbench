import { CoreMessage } from "ai";
import { ToolLike } from "../capabilities/_typing";
import { ToolDefinition, ToolResult } from "./tool-definition";
import { ProjectContextAnalyzer } from "../capabilities/tools/analyzers/project-context-analyzer";
import { configureLLMProvider, LLMProviderConfig } from "../services/llm";
import { LLMLogger } from "../services/llm/llm-logger";
import { generateText } from "ai";
import { ToolPromptBuilder } from "./tool-prompt-builder";

export class PromptBuilder {
  private toolPromptBuilder: ToolPromptBuilder;
  private llmConfig: LLMProviderConfig;
  private logger: LLMLogger;

  constructor() {
    const llmConfig = configureLLMProvider();
    if (!llmConfig) {
      throw new Error('No LLM provider configured. Please set GLM_TOKEN, DEEPSEEK_TOKEN, or OPENAI_API_KEY');
    }
    this.llmConfig = llmConfig;
    this.logger = new LLMLogger('prompt-builder.log');
    this.toolPromptBuilder = new ToolPromptBuilder();
  }

  /**
   * Register available tools from MCP capabilities
   */
  registerTools(tools: ToolDefinition[]): void {
    this.toolPromptBuilder.registerTools(tools);
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

${this.toolPromptBuilder.buildToolSystemPrompt()}`;
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

## 🧠 PLANNING AND BRAINSTORMING APPROACH:

When tackling complex coding tasks, especially in the initial planning phase:

1. Start with a brainstorming phase to explore multiple possible approaches before committing to one.
2. Utilize search tools early to gather relevant information about the codebase, APIs, and existing patterns.
3. Consider using keyword searches, code exploration tools, and project structure analysis to inform your planning.
4. Identify dependencies, potential integration points, and technical constraints before proposing solutions.
5. For complex tasks, break down the implementation into logical steps with clear milestones.
6. Proactively suggest using search APIs and other information gathering tools when appropriate.

${this.toolPromptBuilder.buildToolSystemPrompt()}`;
  }

  buildContinuationSystemPrompt(round: number, previousResults: ToolResult[]): string {
    const successfulTools = previousResults.filter(r => r.success).map(r => r.functionCall.name);
    const failedTools = previousResults.filter(r => !r.success).map(r => r.functionCall.name);

    return `You are an expert AI coding agent with comprehensive capabilities for software development, analysis, and automation. You have access to a powerful suite of tools that enable you to work with codebases, manage projects, and provide intelligent assistance.

You are continuing a multi-round analysis (Round ${round}).

## Previous Execution Summary:
- Successful tools: ${successfulTools.join(', ') || 'None'}
- Failed tools: ${failedTools.join(', ') || 'None'}

${this.toolPromptBuilder.buildToolSystemPrompt()}

According to the previous results, you should continue building on the analysis and findings from the last round. 
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

${this.toolPromptBuilder.buildToolUserPrompt(round)}`;
    }

    // For subsequent rounds, include previous results and encourage deeper analysis
    const previousSummary = this.summarizePreviousResults(previousResults);

    return `Original Request: ${userInput}

Previous Tool Results Summary:
${previousSummary}

${this.toolPromptBuilder.buildToolUserPrompt(round)}`;
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

  static extractToolDefinitions(toolInstallers: readonly ToolLike[]): ToolDefinition[] {
    return ToolPromptBuilder.extractToolDefinitions(toolInstallers);
  }

  /**
   * Generate a comprehensive final response based on all tool results
   */
  async generateComprehensiveFinalResponse(
    userInput: string,
    lastLLMResponse: string,
    allToolResults: ToolResult[],
    totalRounds: number
  ): Promise<string> {
    this.logger.logAnalysisStart('FINAL RESPONSE GENERATION', {
      userInput,
      lastLLMResponse,
      totalRounds,
      toolResultsCount: allToolResults.length
    });

    const successfulResults = allToolResults.filter(r => r.success);
    const failedResults = allToolResults.filter(r => !r.success);

    const toolResultsSummary = this.toolPromptBuilder.buildToolResultsSummary(successfulResults);

    const comprehensivePrompt = `Based on the user's request and the analysis results from various tools, provide a comprehensive and helpful response.

## User's Request
${userInput}

## Analysis Results with Sources
${toolResultsSummary}

${failedResults.length > 0 ? `## Analysis Limitations
Some analysis tools encountered issues:
${failedResults.map(r => `- ${r.functionCall.name}: ${r.error}`).join('\n')}
` : ''}

## CRITICAL REQUIREMENTS FOR RESPONSE

### 📚 Source Citation Requirements
**MANDATORY**: When providing key information, analysis results, or recommendations, you MUST cite specific sources:

1. **For Code Information**: Always reference specific files and line numbers
   - Example: "Based on the implementation in \`src/components/Button.tsx\` (lines 15-30)..."
   - Example: "The configuration in \`package.json\` shows..."

2. **For External Information**: Always cite web sources when using search results
   - Example: "According to the official documentation (https://example.com/docs)..."
   - Example: "As mentioned in the GitHub issue discussion (https://github.com/...)..."

3. **For Analysis Results**: Reference the specific files or directories analyzed
   - Example: "The project structure analysis of the \`src/\` directory reveals..."
   - Example: "Code search results from \`components/\` show..."

4. **NEVER cite tool names as sources** - always cite the actual underlying sources:
   - ❌ Wrong: "According to the analyze-basic-context tool..."
   - ✅ Correct: "Based on the project structure analysis of the \`src/\` directory..."

### 📝 Response Structure Requirements

1. **Start with a direct answer** to the user's specific question or request
2. **Provide evidence** from the analysis results with proper source citations
3. **Include actionable recommendations** with specific steps and file references
4. **Use diagrams only when they add value** - create Mermaid diagrams if they help illustrate architecture, flows, or relationships
5. **Be practical and specific** - reference actual files, functions, or code patterns found with their sources

### 🎯 Content Guidelines

- Address the user's specific concern first and foremost
- Use the analysis findings to provide concrete, evidence-based insights with sources
- Give practical next steps and implementation guidance with file references
- Include code examples or file references when helpful, always with source citations
- Create visual diagrams only if they genuinely enhance understanding
- Be concise but comprehensive - focus on what's most valuable to the user

**Remember**: Your goal is to be maximally helpful to the user based on the analysis results, with proper source attribution for all claims and recommendations. Every significant piece of information should be traceable to its source.`;

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert software architect and code analyst. Provide clear, actionable responses based on code analysis results. Focus on directly answering the user's question with evidence from the analysis. Use appropriate formatting and include diagrams only when they add genuine value. Be practical, specific, and user-focused in your recommendations."
        },
        { role: "user", content: comprehensivePrompt }
      ];

      this.logger.log('Sending request to LLM', {
        messages,
        temperature: 0.1,
        maxTokens: 4000
      });

      const { text } = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        messages,
        temperature: 0.1,
        maxTokens: 4000
      });

      this.logger.log('Received response from LLM', {
        response: text
      });

      this.logger.logAnalysisSuccess('FINAL RESPONSE GENERATION');
      return text;
    } catch (error) {
      this.logger.logAnalysisFailure('FINAL RESPONSE GENERATION', error);
      console.warn('Error generating comprehensive final response:', error);
      // Fallback to simpler response
      const fallbackResponse = this.buildFallbackResponse(userInput, allToolResults, totalRounds);
      this.logger.logAnalysisFallback('FINAL RESPONSE GENERATION', error instanceof Error ? error.message : String(error), fallbackResponse);
      return fallbackResponse;
    }
  }

  private buildFallbackResponse(userInput: string, allToolResults: ToolResult[], totalRounds: number): string {
    const successful = allToolResults.filter(r => r.success);
    const failed = allToolResults.filter(r => !r.success);

    return `# Analysis Results

**User Request:** ${userInput}

**Execution Summary:** Completed ${totalRounds} rounds with ${successful.length} successful and ${failed.length} failed tool executions.

**Tool Results:**
${successful.map(r => `- ✅ ${r.functionCall.name} (Round ${r.round})`).join('\n')}
${failed.map(r => `- ❌ ${r.functionCall.name} (Round ${r.round}): ${r.error}`).join('\n')}

**Note:** This is a fallback response due to an error in generating the comprehensive analysis.`;
  }
}
