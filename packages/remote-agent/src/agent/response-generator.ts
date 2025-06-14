import { generateText, CoreMessage } from "ai";
import { LLMProviderConfig } from "../services/llm";
import { ToolResult } from "./tool-definition";
import { LLMLogger } from "../services/llm/llm-logger";

export class ResponseGenerator {
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

    const comprehensivePrompt = `You are tasked with generating a comprehensive, high-confidence analysis based on the user's request and the outcomes of multiple tool executions across ${totalRounds} rounds.

## 📝 User Request
${userInput}

## 🧪 Execution Summary
${executionSummary}

## 📊 Tool Results Summary
${toolResultsSummary}

${failedResults.length > 0 ? `---

## ❌ Failed Tool Executions
${failedResults.map(r => `- ${r.functionCall.name}: ${r.error}`).join('\n')}
` : ''}

## ✅ Instructions for Final Response

Please provide a **clear, well-structured response** that fulfills the following requirements:

1. **Answer the user's question directly** using all relevant outputs from tools and rounds.
2. **Synthesize insights** from the ${successfulResults.length} successful tool results, especially where multiple executions converge or reinforce the same conclusions.
3. **Cite specific results clearly**, referencing:
   - Function names
   - Tool names
   - File paths (if available)
   Use formulations like: *"According to \`functionName\` from ToolX..."* or *"The result from \`/path/to/file\` suggests..."*
4. **Highlight high-confidence findings**, supported by:
   - Repeated confirmation across different tools or rounds
   - Minimal or no errors
   - Consistent patterns across diverse tool types
5. **Provide actionable recommendations** (e.g., code changes, refactor suggestions, architectural decisions), clearly derived from the analysis.
6. **Explicitly state any known limitations**, uncertainties, or gaps in coverage. For example:
   - Tools that failed to execute
   - Results that contradict each other
   - Scenarios or edge cases not handled

## 🎯 Goals

- Be **precise**, **transparent**, and **traceable**.
- Emphasize how the multi-step, multi-tool analysis improves overall confidence.
- Avoid vague or generic statements unless clearly justified by tool results.`;

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert GitHub issue analyst with access to comprehensive multi-tool analysis results. Provide detailed, actionable insights that synthesize information from multiple sources and analysis rounds."
        },
        { role: "user", content: comprehensivePrompt }
      ];

      this.logger.log('Sending request to LLM', {
        messages,
        temperature: 0.3,
        maxTokens: 3000
      });

      const { text } = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        messages,
        temperature: 0.3,
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
