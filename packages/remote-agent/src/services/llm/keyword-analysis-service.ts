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
Analyze this GitHub issue and extract keywords for code search:

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

    prompt += `

Please extract keywords in the following categories and respond with JSON:

1. **primary_keywords**: Main concepts, feature names, error types (5-10 words)
2. **technical_terms**: Programming terms, frameworks, libraries, file extensions (5-15 words)
3. **error_patterns**: Specific error messages, exception types, error codes (3-8 phrases)
4. **component_names**: Likely class names, function names, module names (3-10 words)
5. **file_patterns**: Likely file names, directory patterns, file types (3-8 patterns)
6. **search_strategies**: Specific search terms that would help find related code (5-10 terms)
7. **file_priorities**: Prioritized file patterns with importance scores (1-10 scale)
8. **issue_type**: One of: "bug", "feature", "performance", "documentation", "testing", "security", "refactor"
9. **confidence**: Float between 0.0-1.0 indicating confidence in the analysis

Focus on terms that would help find relevant code files, functions, and components.
Pay special attention to any technical information from the URL content provided above.

For file_priorities, provide patterns with scores where:
- 10: Critical files that must be analyzed (e.g., main config, auth files for auth issues)
- 7-9: High priority files likely to contain relevant code
- 4-6: Medium priority files that might be relevant
- 1-3: Low priority files that could provide context

Example response format:
{
  "primary_keywords": ["authentication", "login", "user", "session"],
  "technical_terms": ["jwt", "token", "middleware", "express", "nodejs"],
  "error_patterns": ["401 unauthorized", "token expired", "invalid credentials"],
  "component_names": ["AuthMiddleware", "LoginController", "UserService"],
  "file_patterns": ["auth", "login", "user", "middleware", "controller"],
  "search_strategies": ["authenticate", "verify", "token", "session", "login"],
  "file_priorities": [
    {"pattern": "auth", "score": 10, "reason": "Core authentication logic"},
    {"pattern": "prisma", "score": 9, "reason": "Database connection for auth"},
    {"pattern": "middleware", "score": 7, "reason": "Auth middleware implementation"},
    {"pattern": "config", "score": 6, "reason": "Configuration files"},
    {"pattern": "test", "score": 2, "reason": "Test files for context only"}
  ],
  "issue_type": "bug",
  "confidence": 0.85
}

Respond only with valid JSON:`;

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

      // Validate and normalize the response
      return {
        primary_keywords: Array.isArray(parsed.primary_keywords) ? parsed.primary_keywords.slice(0, 10) : [],
        technical_terms: Array.isArray(parsed.technical_terms) ? parsed.technical_terms.slice(0, 15) : [],
        error_patterns: Array.isArray(parsed.error_patterns) ? parsed.error_patterns.slice(0, 8) : [],
        component_names: Array.isArray(parsed.component_names) ? parsed.component_names.slice(0, 10) : [],
        file_patterns: Array.isArray(parsed.file_patterns) ? parsed.file_patterns.slice(0, 8) : [],
        search_strategies: Array.isArray(parsed.search_strategies) ? parsed.search_strategies.slice(0, 10) : [],
        file_priorities: Array.isArray(parsed.file_priorities) ? parsed.file_priorities.slice(0, 10).map((fp: any) => ({
          pattern: typeof fp.pattern === 'string' ? fp.pattern : '',
          score: typeof fp.score === 'number' ? Math.min(Math.max(fp.score, 1), 10) : 5,
          reason: typeof fp.reason === 'string' ? fp.reason : ''
        })) : [],
        issue_type: typeof parsed.issue_type === 'string' ? parsed.issue_type : 'general',
        confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse LLM response: ${errorMessage}`);
    }
  }
}