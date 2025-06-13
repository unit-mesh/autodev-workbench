import { generateText, CoreMessage } from "ai";
import { GitHubIssue } from "../../types/index";
import { LLMProviderConfig } from "./llm-provider";
import { CodeRelevanceAnalysis, FallbackAnalysisService } from "../analysis/FallbackAnalysisService";
import { LLMLogger } from "./llm-logger";

export class CodeRelevanceAnalysisService {
  private logger: LLMLogger;
  private fallbackService: FallbackAnalysisService;

  constructor() {
    this.logger = new LLMLogger('code-relevance-analysis.log');
    this.fallbackService = new FallbackAnalysisService();
  }

  /**
   * Analyze if a specific code file is relevant to the GitHub issue using LLM
   */
  async analyzeCodeRelevance(
    issue: GitHubIssue & { urlContent?: any[] },
    filePath: string,
    fileContent: string,
    llmConfig: LLMProviderConfig | null
  ): Promise<CodeRelevanceAnalysis> {
    this.logger.logAnalysisStart('CODE RELEVANCE ANALYSIS', {
      issueNumber: issue.number,
      issueTitle: issue.title,
      filePath: filePath,
      fileContentLength: fileContent.length,
      fileContentPreview: fileContent.substring(0, 300) + (fileContent.length > 300 ? '...' : '')
    });

    if (!llmConfig) {
      const fallbackResult = this.fallbackService.analyzeCodeRelevance(issue, filePath, fileContent);
      this.logger.logAnalysisFallback('CODE RELEVANCE ANALYSIS', 'no LLM provider', { filePath, fallbackResult });
      return fallbackResult;
    }

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: 'You are an expert code analyst. Analyze whether a specific code file is relevant to a GitHub issue. ' +
            'The relevance does not require exact matching. If the code contains useful patterns, logic, structures, or approaches that could inspire or assist in solving the issue, consider it relevant.' +
            'Always respond with valid JSON in the specified format.'
        },
        {
          role: "user",
          content: this.buildCodeRelevancePrompt(issue, filePath, fileContent)
        }
      ];

      const { text } = await generateText({
        model: llmConfig.openai(llmConfig.fullModel),
        messages,
        temperature: 0.2, // Lower temperature for more consistent analysis
      });

      this.logger.log('LLM relevance response:', { filePath, response: text });
      const analysis = this.parseCodeRelevanceAnalysis(text);
      this.logger.log('Parsed relevance analysis:', { filePath, analysis });
      this.logger.logAnalysisSuccess('CODE RELEVANCE ANALYSIS');
      return analysis;
    } catch (error: any) {
      this.logger.logAnalysisFailure('CODE RELEVANCE ANALYSIS', error, { filePath });
      console.warn(`LLM code relevance analysis failed: ${error.message}`);

      const fallbackResult = this.fallbackService.analyzeCodeRelevance(issue, filePath, fileContent);
      this.logger.logAnalysisFallback('CODE RELEVANCE ANALYSIS', error.message, { filePath, fallbackResult });
      return fallbackResult;
    }
  }

  private buildCodeRelevancePrompt(issue: GitHubIssue & { urlContent?: any[] }, filePath: string, fileContent: string): string {
    // Limit file content to avoid token limits
    const limitedContent = fileContent.length > 3000 ?
      fileContent.substring(0, 3000) + '\n... (content truncated)' :
      fileContent;

    let prompt = `Analyze whether this code file is relevant to the GitHub issue.

**GitHub Issue:**
- Title: ${issue.title}
- Body: ${issue.body || 'No description provided'}
- Labels: ${issue.labels.map(l => l.name).join(', ') || 'None'}`;

    // Add URL content if available
    if (issue.urlContent && issue.urlContent.length > 0) {
      const successfulUrls = issue.urlContent.filter(u => u.status === 'success');
      if (successfulUrls.length > 0) {
        prompt += `\n\n**Additional Context from URLs:**\n`;
        successfulUrls.forEach((urlData, index) => {
          prompt += `\n${index + 1}. **${urlData.title}** (${urlData.url})\n`;
          const content = urlData.content || '';
          if (content) {
            prompt += `${content.substring(0, 800)}${content.length > 800 ? '...' : ''}\n`;
          }
        });
      }
    }

    prompt += `

**Code File:**
- Path: ${filePath}
- Content:
\`\`\`
${limitedContent}
\`\`\`

Please analyze if this code file is relevant to the issue and respond in the following JSON format:

{
  "is_relevant": true/false,
  "relevance_score": 0.85,
  "reason": "Detailed explanation of why this file is or isn't relevant",
  "specific_areas": [
    "List of specific functions, classes, or code sections that are relevant",
    "Include line numbers or function names if applicable"
  ],
  "confidence": 0.9
}

Consider:
1. Does the file contain code that could cause the reported issue?
2. Does the file implement functionality mentioned in the issue?
3. Are there error patterns, database connections, API endpoints, or other elements mentioned in the issue?
4. Could changes to this file help resolve the issue?

Be precise and specific in your analysis.`;

    return prompt;
  }

  private parseCodeRelevanceAnalysis(text: string): CodeRelevanceAnalysis {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        is_relevant: Boolean(parsed.is_relevant),
        relevance_score: typeof parsed.relevance_score === 'number' ?
          Math.max(0, Math.min(1, parsed.relevance_score)) : 0.5,
        reason: parsed.reason || 'No reason provided',
        specific_areas: Array.isArray(parsed.specific_areas) ? parsed.specific_areas : [],
        confidence: typeof parsed.confidence === 'number' ?
          Math.max(0, Math.min(1, parsed.confidence)) : 0.5
      };
    } catch (error) {
      console.warn(`Failed to parse LLM code relevance analysis: ${error.message}`);
      throw error;
    }
  }
}
