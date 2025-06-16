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

    // const resultsByRound = this.groupResultsByRound(allToolResults);
    const successfulResults = allToolResults.filter(r => r.success);
    const failedResults = allToolResults.filter(r => !r.success);

    // const executionSummary = this.buildExecutionSummary(resultsByRound, totalRounds);
    const toolResultsSummary = this.buildToolResultsSummary(successfulResults);
    const issueContext = this.extractIssueContext(userInput, toolResultsSummary);

    const comprehensivePrompt = `You are an expert GitHub issue analyst and software architect. Your task is to provide a comprehensive response that DIRECTLY ADDRESSES the user's specific issue/question while also providing a detailed development action plan.

## 📝 User's Specific Issue/Question
${userInput}

## 🔍 Analysis Results from Code Investigation
${toolResultsSummary}

${failedResults.length > 0 ? `## ⚠️ Analysis Limitations
Some analysis tools encountered issues:
${failedResults.map(r => `- ${r.functionCall.name}: ${r.error}`).join('\n')}
` : ''}

## ✅ Required Response Format

Your response must include these sections in order:

### 1. Direct Answer to User's Question
- **Directly address the user's specific question/issue first**
- Provide a clear, concise answer based on the analysis findings
- If it's a "how to" question, give the specific steps
- If it's a "why" question, explain the root cause
- If it's a "what" question, provide the specific information requested

### 2. Visual Architecture/Flow Diagram
Create a Mermaid diagram that illustrates:
- Current system architecture (if analyzing existing code)
- Proposed solution flow (if implementing new features)
- Data flow or process flow relevant to the user's issue
- Component relationships and dependencies

Use appropriate Mermaid diagram types:
- \`graph TD\` for flowcharts and process flows
- \`sequenceDiagram\` for interaction flows
- \`classDiagram\` for class relationships
- \`gitgraph\` for development workflows

Example format:
\`\`\`mermaid
graph TD
    A["Current State"] --> B["Identified Issue"]
    B --> C["Proposed Solution"]
    C --> D["Expected Outcome"]
\`\`\`

### 3. Evidence-Based Findings
List 3-5 key findings from the code analysis that support your answer:
- Reference specific files, functions, or code patterns found
- Explain how each finding relates to the user's question
- Include relevant code snippets when helpful

### 4. Step-by-Step Development Plan
Provide a detailed, actionable plan:
1. **Immediate Actions** - What to do first
2. **Core Implementation** - Main development tasks
3. **Integration Steps** - How to connect with existing code
4. **Testing Strategy** - How to verify the solution works
5. **Deployment Considerations** - Production readiness steps

For each step, include:
- Specific files to modify/create
- Code examples or templates
- Expected outcomes
- Potential challenges

### 5. Implementation Timeline & Priorities
- **High Priority** (Must do first)
- **Medium Priority** (Important but can wait)
- **Low Priority** (Nice to have)
- **Future Enhancements** (Post-implementation improvements)

### 6. Risk Assessment & Alternatives
- Potential risks in the proposed approach
- Mitigation strategies
- Alternative solutions if the main approach fails
- Rollback plan if needed

## 🎯 Response Guidelines

**CRITICAL**: Start by directly answering the user's question before diving into technical details.

- **Be user-centric** - Address their specific concern first
- **Use visual aids** - Include relevant Mermaid diagrams
- **Provide evidence** - Reference actual code findings
- **Be actionable** - Give concrete next steps
- **Consider context** - Respect the existing codebase architecture
- **Think holistically** - Balance immediate needs with long-term maintainability

Remember: The user asked a specific question - answer it clearly first, then provide the comprehensive development plan to implement the solution.`;

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert software architect and GitHub issue analyst. Your primary goal is to directly answer the user's specific question while providing comprehensive technical guidance. Always start with a direct answer to their question, then provide detailed implementation guidance with visual diagrams. Use Mermaid diagrams to illustrate architecture, flows, and relationships. Be specific, actionable, and evidence-based in your recommendations."
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
