import { generateText, CoreMessage } from "ai";
import { LLMProviderConfig } from "../services/llm";
import { ToolResult } from "./tool-definition";
import { LLMLogger } from "../services/llm/llm-logger";

export class FinalReportGenerator {
  private llmConfig: LLMProviderConfig;
  private logger: LLMLogger;

  constructor(llmConfig: LLMProviderConfig) {
    this.llmConfig = llmConfig;
    this.logger = new LLMLogger('response-generator.log');
  }

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

    const toolResultsSummary = this.buildToolResultsSummary(successfulResults);
    const issueContext = this.extractIssueContext(userInput, toolResultsSummary);

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

  private extractIssueContext(userInput: string, toolResultsSummary: string): string {
    // Extract key context from user input to better understand the issue type
    const issueKeywords = {
      implementation: ['how to implement', 'how do I', 'how can I', 'implement', 'create', 'build'],
      debugging: ['error', 'bug', 'issue', 'problem', 'not working', 'fails', 'broken'],
      architecture: ['architecture', 'design', 'structure', 'organize', 'best practice'],
      integration: ['integrate', 'connect', 'combine', 'merge', 'link'],
      optimization: ['optimize', 'improve', 'performance', 'faster', 'better']
    };

    const lowerInput = userInput.toLowerCase();
    const detectedTypes: string[] = [];

    Object.entries(issueKeywords).forEach(([type, keywords]) => {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        detectedTypes.push(type);
      }
    });

    return detectedTypes.length > 0 ? detectedTypes.join(', ') : 'general inquiry';
  }

  private buildToolResultsSummary(successfulResults: ToolResult[]): string {
    return successfulResults
      .map(result => {
        const toolName = result.functionCall.name;
        let content = '';
        let sources = '';

        if (result.result?.content && Array.isArray(result.result.content)) {
          const textContent = result.result.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('\n');
          content = textContent;
        } else if (result.result?.content) {
          content = String(result.result.content);
        }

        // Extract sources from tool results
        sources = this.extractSourcesFromToolResult(result);

        return `## ${toolName} (Round ${result.round})
${content}
${sources ? `\n**Sources:** ${sources}` : ''}`;
      })
      .join('\n\n');
  }

  private extractSourcesFromToolResult(result: ToolResult): string {
    const toolName = result.functionCall.name;
    const sources: string[] = [];

    // Extract file paths from file-related tools
    if (toolName.includes('read-file') || toolName.includes('grep-search') || toolName.includes('analyze-basic-context')) {
      const params = result.functionCall.parameters;
      if (params.target_file || params.file_path) {
        sources.push(`File: ${params.target_file || params.file_path}`);
      }
      if (params.target_directories && Array.isArray(params.target_directories)) {
        sources.push(`Directories: ${params.target_directories.join(', ')}`);
      }
    }

    // Extract URLs from web search tools
    if (toolName.includes('google-search') || toolName.includes('extract-webpage')) {
      const params = result.functionCall.parameters;
      if (params.url) {
        sources.push(`Web: ${params.url}`);
      }
      if (params.search_term) {
        sources.push(`Search: "${params.search_term}"`);
      }
    }

    // Extract GitHub URLs from GitHub tools
    if (toolName.includes('github-')) {
      const params = result.functionCall.parameters;
      if (params.issue_url) {
        sources.push(`GitHub Issue: ${params.issue_url}`);
      }
      if (params.repo_url) {
        sources.push(`GitHub Repo: ${params.repo_url}`);
      }
    }

    // Extract project paths from analysis tools
    if (toolName.includes('analyze-') || toolName.includes('list-directory')) {
      const params = result.functionCall.parameters;
      if (params.workspace_path || params.directory_path) {
        sources.push(`Project: ${params.workspace_path || params.directory_path}`);
      }
    }

    return sources.join(', ');
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
