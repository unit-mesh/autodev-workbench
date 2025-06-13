import { generateText } from "ai";
import { LLMProviderConfig } from "../services/llm";
import { ToolResult } from "./tool-definition";
import { LLMLogger } from "../services/llm/llm-logger";

export class ResponseGenerator {
  private llmConfig: LLMProviderConfig;

  constructor(llmConfig: LLMProviderConfig) {
    this.llmConfig = llmConfig;
  }

  async generateComprehensiveFinalResponse(
    userInput: string,
    lastLLMResponse: string,
    allToolResults: ToolResult[],
    totalRounds: number
  ): Promise<string> {
    const resultsByRound = this.groupResultsByRound(allToolResults);
    const successfulResults = allToolResults.filter(r => r.success);
    const failedResults = allToolResults.filter(r => !r.success);

    const executionSummary = this.buildExecutionSummary(resultsByRound, totalRounds);
    const toolResultsSummary = this.buildToolResultsSummary(successfulResults);

    const comprehensivePrompt = `Based on the user's request and the results from multiple tool executions across ${totalRounds} rounds, provide a comprehensive, high-confidence analysis.

User Request:
${userInput}

Execution Summary:
${executionSummary}

Tool Results Summary:
${toolResultsSummary}

${failedResults.length > 0 ? `Failed Tools:
${failedResults.map(r => `- ${r.functionCall.name}: ${r.error}`).join('\n')}

` : ''}Please generate a well-structured, detailed final response that:

1. **Directly answers the user's question** using all available information across tools and rounds.
2. **Synthesizes insights** from the tools that returned successful results (${successfulResults.length} in total), especially where **consensus was observed** across multiple tool executions.
3. **Cites key results explicitly** (e.g., function name, tool name, or file path) to enhance traceability and confidence. Prefer formulations like:
4. **Highlights high-confidence findings** based on:
   - Repeated confirmation across tools
   - Low error rate
   - Converging results from different tool types
5. **Includes actionable recommendations** for next steps or code changes, clearly derived from the tools' output.
6. **Clearly state any known limitations, edge cases, or missing information**, especially where tool execution failed or returned uncertain results.

Be precise, transparent about assumptions, and emphasize where the multi-step analysis improves reliability or coverage.`;

    try {
      const { text } = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        messages: [
          {
            role: "system",
            content: "You are an expert GitHub issue analyst with access to comprehensive multi-tool analysis results. Provide detailed, actionable insights that synthesize information from multiple sources and analysis rounds."
          },
          { role: "user", content: comprehensivePrompt }
        ],
        temperature: 0.3,
        maxTokens: 3000
      });

      const logger = new LLMLogger("final-result.log");
      logger.log('Generated comprehensive final response:', comprehensivePrompt)

      return text;
    } catch (error) {
      console.warn('Error generating comprehensive final response:', error);
      // Fallback to simpler response
      return this.buildFallbackResponse(userInput, allToolResults, totalRounds);
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
