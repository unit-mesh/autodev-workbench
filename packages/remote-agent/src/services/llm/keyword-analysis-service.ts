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
You are a coding assistant who helps the user answer questions about code in their workspace by providing a list of relevant keywords they can search for to answer the question.
The user will provide you with potentially relevant information from the workspace. This information may be incomplete.

DO NOT ask the user for additional information or clarification.
DO NOT try to answer the user's question directly.

**Additional Rules**
Think step by step:

1. Read the user's question to understand what they are asking about their workspace.
2. If the question contains pronouns such as 'it' or 'that', try to understand what the pronoun refers to by looking at the rest of the question and the conversation history.
3. If the question contains an ambiguous word such as 'this', try to understand what it refers to by looking at the rest of the question, the user's active selection, and the conversation history.
4. Output a precise version of the question that resolves all pronouns and ambiguous words like 'this' to the specific nouns they stand for. Be sure to preserve the exact meaning of the question by only changing ambiguous pronouns and words like 'this'.
5. Then output a short markdown list of up to 8 relevant keywords that the user could try searching for to answer their question. These keywords could be used as file names, symbol names, abbreviations, or comments in the relevant code. Put the most relevant keywords to the question first. Do not include overly generic keywords. Do not repeat keywords.
6. For each keyword in the markdown list of related keywords, if applicable add a comma-separated list of variations after it. For example, for 'encode', possible variations include 'encoding', 'encoded', 'encoder', 'encoders'. Consider synonyms and plural forms. Do not repeat variations.

Please analyze this GitHub issue and extract keywords:

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
            prompt += `${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}\n`;
          }
        });
      }
    }

    prompt += `\n\nPlease respond with a JSON object containing the following fields:
{
  "primary_keywords": ["keyword1", "keyword2", ...], // Most relevant keywords (weight: 0.9)
  "secondary_keywords": ["keyword1", "keyword2", ...], // Related keywords (weight: 0.6)
  "tertiary_keywords": ["keyword1", "keyword2", ...], // Additional context keywords (weight: 0.3)
}`;

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
