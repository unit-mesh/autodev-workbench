import { generateText, CoreMessage } from "ai";
import { GitHubIssue } from "../../types/index";
import { LLMProviderConfig } from "./llm-provider";
import { LLMKeywordAnalysis, FallbackAnalysisService } from "../analysis/FallbackAnalysisService";
import { LLMLogger } from "./llm-logger";

export class KeywordAnalysisService {
  private logger: LLMLogger;
  private fallbackService: FallbackAnalysisService;

  constructor() {
    this.logger = new LLMLogger('keyword-analysis.log');
    this.fallbackService = new FallbackAnalysisService();
  }

  /**
   * Analyze issue for keywords using LLM or fallback to rule-based analysis
   */
  async analyzeIssueForKeywords(
    issue: GitHubIssue & { urlContent?: any[] },
    llmConfig: LLMProviderConfig | null
  ): Promise<LLMKeywordAnalysis> {
    // Check if LLM provider is available
    if (!llmConfig) {
      this.logger.log('LLM provider not available, using fallback');
      return this.fallbackService.extractKeywords(issue);
    }

    this.logger.logAnalysisStart('KEYWORD ANALYSIS', {
      number: issue.number,
      title: issue.title,
      body: issue.body?.substring(0, 500) + (issue.body && issue.body.length > 500 ? '...' : ''),
      urlContent: issue.urlContent?.map(u => ({
        url: u.url,
        status: u.status,
        title: u.title,
        contentLength: u.content?.length || 0,
        contentPreview: u.content ? (u.content.substring(0, 200) + (u.content.length > 200 ? '...' : '')) : 'No content'
      }))
    });

    const promptStr = this.buildKeywordExtractionPrompt(issue);
    this.logger.log('Generated prompt:', { prompt: promptStr.substring(0, 2000) + (promptStr.length > 2000 ? '...' : '') });

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert code analyst. Analyze GitHub issues and extract relevant keywords for code search. Always respond with valid JSON."
        },
        {
          role: "user",
          content: promptStr
        }
      ];

      const { text } = await generateText({
        model: llmConfig.openai(llmConfig.fullModel),
        messages,
        temperature: 0.3, // Lower temperature for more consistent results
      });

      this.logger.log('LLM response:', { response: text });

      // Parse the LLM response
      const analysis = this.parseKeywordAnalysis(text);
      this.logger.log('Parsed analysis:', analysis);
      this.logger.logAnalysisSuccess('KEYWORD ANALYSIS');
      return analysis;
    } catch (error: any) {
      this.logger.logAnalysisFailure('KEYWORD ANALYSIS', error);
      console.warn(`LLM keyword analysis failed: ${error.message}`);

      // Fallback to rule-based extraction
      const fallbackResult = this.fallbackService.extractKeywords(issue);
      this.logger.logAnalysisFallback('KEYWORD ANALYSIS', error.message, fallbackResult);
      return fallbackResult;
    }
  }

  private buildKeywordExtractionPrompt(issue: GitHubIssue & { urlContent?: any[] }): string {
    let prompt = `
You are an expert code analyst specialized in extracting keywords from GitHub issues. Your task is to analyze a GitHub issue and identify precise, technical keywords that directly relate to the issue's technical focus.

**Guidelines for Keyword Extraction:**
1. Focus ONLY on technical terms that appear in the issue's title, description, and any code snippets or URLs.
2. Prioritize specific technical terms like:
   - File paths mentioned in the issue (e.g., 'web-search.ts')
   - Function names, class names, and method names (e.g., 'analyzeIssueForKeywords')
   - Technical concepts directly mentioned (e.g., 'URL processing', 'GitHub link conversion')
   - Programming language specific terms
3. Extract exact variable names, function names, and technical terms used in the issue - don't generalize them.
4. Exclude generic terms that aren't specific to the technical issue at hand.
5. For any file paths or code references in the issue, include them exactly as written.

Please analyze this GitHub issue and extract precise technical keywords:

**Issue Title:** ${issue.title}

**Issue Body:** ${issue.body || 'No description provided'}

**Labels:** ${issue.labels.map(l => l.name).join(', ') || 'None'}`;

    // Add URL content if available
    if (issue.urlContent && issue.urlContent.length > 0) {
      const successfulUrls = issue.urlContent.filter(u => u.status === 'success');
      if (successfulUrls.length > 0) {
        prompt += `\n\n**Additional Context from URLs:**\n`;
        successfulUrls.forEach((urlData, index) => {
          prompt += `\n${index + 1}. **${urlData.title}** (${urlData.url})\n`;
          const content = urlData.content || '';
          if (content) {
            // Extract only the first portion to avoid overwhelming the model
            prompt += `${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n`;
          }
        });
      }
    }

    prompt += `\n\nRespond ONLY with a JSON object containing the following fields:
{
  "primary_keywords": ["keyword1", "keyword2", ...], // Exact technical terms mentioned in the issue (max 5, weight: 0.9)
  "secondary_keywords": ["keyword1", "keyword2", ...], // Related technical concepts (max 5, weight: 0.6)
  "tertiary_keywords": ["keyword1", "keyword2", ...], // Implementation-related terms (max 5, weight: 0.3)
}

Include any file paths, function names, or code references exactly as they appear in the issue.`;

    return prompt;
  }

  private parseKeywordAnalysis(text: string): LLMKeywordAnalysis {
    try {
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        primary_keywords: Array.isArray(parsed.primary_keywords) ? parsed.primary_keywords.slice(0, 8) : [],
        secondary_keywords: Array.isArray(parsed.secondary_keywords) ? parsed.secondary_keywords.slice(0, 8) : [],
        tertiary_keywords: Array.isArray(parsed.tertiary_keywords) ? parsed.tertiary_keywords.slice(0, 8) : [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse LLM response: ${errorMessage}`);
    }
  }
}
