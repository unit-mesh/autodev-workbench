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

    const resultsByRound = this.groupResultsByRound(allToolResults);
    const successfulResults = allToolResults.filter(r => r.success);
    const failedResults = allToolResults.filter(r => !r.success);

    const executionSummary = this.buildExecutionSummary(resultsByRound, totalRounds);
    const toolResultsSummary = this.buildToolResultsSummary(successfulResults);

    const comprehensivePrompt = `You are an expert GitHub issue analyst. Based on the comprehensive multi-tool analysis, provide a focused, actionable response to the user's request.

## 📝 User Request
${userInput}

## 🔍 Analysis Data Available
${toolResultsSummary}

${failedResults.length > 0 ? `## ⚠️ Analysis Limitations
Some tools failed to execute:
${failedResults.map(r => `- ${r.functionCall.name}: ${r.error}`).join('\n')}
` : ''}

## ✅ Required Response Format

Generate a **results-focused analysis** that directly answers the user's question with these sections:

### 1. Executive Summary
Provide a 2-3 sentence summary that directly answers the user's core question based on your analysis findings.

### 2. Key Findings
List 3-5 concrete, evidence-based findings from the tool results that are most relevant to solving the user's issue. For each finding:
- State the finding clearly
- Reference the specific tool/file that provided evidence (e.g., "According to \`github-analyze-issue\`...")
- Explain why this finding matters for the issue

### 3. Actionable Recommendations
Provide specific, implementable steps the user should take to address their issue:
- Prioritize recommendations by impact and feasibility
- Include code snippets, file paths, or configuration changes when applicable
- Reference existing project architecture and constraints found in the analysis

### 4. Technical Implementation Details
When relevant, provide:
- Specific code changes needed
- Dependencies to add/remove
- Configuration updates
- Integration points with existing codebase

### 5. Risk Assessment & Considerations
Briefly note:
- Potential challenges or blockers identified
- Alternative approaches if the primary recommendation has issues
- Any assumptions made due to limited analysis coverage

## 🎯 Response Guidelines

- **Focus on solutions, not analysis process**
- **Be specific and actionable** - avoid generic advice
- **Cite evidence** from tool results to support recommendations
- **Consider the project context** revealed by the analysis
- **Prioritize practicality** over theoretical perfection
- **Keep it concise** - aim for clarity over comprehensiveness

Remember: The user wants to know WHAT to do and HOW to do it based on the issue analysis, not HOW the analysis was conducted.`;

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert software architect and GitHub issue analyst. Your role is to provide direct, actionable solutions based on comprehensive code analysis. Focus on delivering practical recommendations rather than describing the analysis process. Always prioritize implementable solutions that fit the existing project architecture."
        },
        { role: "user", content: comprehensivePrompt }
      ];

      this.logger.log('Sending request to LLM', {
        messages,
        temperature: 0.1,
        maxTokens: 3000
      });

      const { text } = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        messages,
        temperature: 0.1,
        maxTokens: 3000
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

  private groupResultsByRound(results: ToolResult[]): Map<number, ToolResult[]> {
    const grouped = new Map<number, ToolResult[]>();

    results.forEach(result => {
      const round = result.round || 1;
      if (!grouped.has(round)) {
        grouped.set(round, []);
      }
      grouped.get(round)!.push(result);
    });

    return grouped;
  }

  private buildExecutionSummary(resultsByRound: Map<number, ToolResult[]>, totalRounds: number): string {
    const summary: string[] = [];
    summary.push(`Completed ${totalRounds} rounds of tool execution:`);

    for (let round = 1; round <= totalRounds; round++) {
      const roundResults = resultsByRound.get(round) || [];
      const successful = roundResults.filter(r => r.success).length;
      const total = roundResults.length;
      const tools = roundResults.map(r => r.functionCall.name).join(', ');

      summary.push(`  Round ${round}: ${successful}/${total} tools successful (${tools})`);
    }

    return summary.join('\n');
  }

  private buildToolResultsSummary(successfulResults: ToolResult[]): string {
    return successfulResults
      .map(result => {
        if (result.result?.content && Array.isArray(result.result.content)) {
          const textContent = result.result.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('\n');
          return `Tool ${result.functionCall.name} (Round ${result.round}):\n${textContent}`;
        }
        return `Tool ${result.functionCall.name} (Round ${result.round}): Completed successfully`;
      })
      .join('\n\n');
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
