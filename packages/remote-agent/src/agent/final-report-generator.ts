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

    // const executionSummary = this.buildExecutionSummary(resultsByRound, totalRounds);
    const toolResultsSummary = this.buildToolResultsSummary(successfulResults);

    const comprehensivePrompt = `You are an expert GitHub issue analyst tasked with providing a comprehensive PROPOSED ACTION PLAN based on the analysis results. The plan should detail what the user should do next to address their issue.

## 📝 Original User Request
${userInput}

## 🔍 Analysis Data Available
${toolResultsSummary}

${failedResults.length > 0 ? `## ⚠️ Analysis Limitations
Some tools failed to execute:
${failedResults.map(r => `- ${r.functionCall.name}: ${r.error}`).join('\n')}
` : ''}

## ✅ Required Response Format

Generate a **proposed action plan** with these sections:

### 1. Executive Summary
A 2-3 sentence summary of what was found and what needs to be done to address the user's request.

### 2. Key Findings from Analysis
List 3-5 concrete, evidence-based findings from the analysis that inform the action plan:
- Each finding should be clearly stated
- Reference specific evidence found (e.g., "Analysis of \`file.js\` reveals...")
- Explain how each finding impacts the proposed solution

### 3. Proposed Action Plan
Present a step-by-step plan of action:
- Numbered steps in recommended sequence
- Each step should be concrete and actionable
- Include code snippets, file paths, or configuration changes when applicable
- Indicate expected outcomes for each step

### 4. Technical Implementation Details
When relevant, provide:
- Specific code changes recommended
- Dependencies to add/remove
- Configuration updates
- Integration points with existing codebase

### 5. Considerations & Alternative Approaches
Briefly note:
- Potential challenges or risks in the proposed approach
- Alternative approaches if the main plan encounters obstacles
- Additional information that might be needed
- Future improvements to consider after implementation

## 🎯 Response Guidelines

- **Be specific and actionable** - focus on concrete next steps
- **Reference evidence** discovered during analysis
- **Present a logical sequence** of actions
- **Consider the project context** revealed by the analysis
- **Prioritize practical solutions** that can be implemented immediately
- **Keep it concise** - aim for clarity and usefulness

Remember: The response should provide a clear, actionable plan that the user can follow to address their issue.`;

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert software architect and GitHub issue analyst. Your role is to provide a clear, actionable plan based on thorough code analysis. Focus on specific next steps the user should take rather than describing the analysis process. Present a logical sequence of actions that addresses the user's request in the context of their project architecture."
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
