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
You are an expert code analyst specialized in extracting keywords from GitHub issues for searching within the CURRENT project codebase.

**CRITICAL CONTEXT:** You are analyzing an issue for the current project repository. Your keywords will be used to search for relevant files and code within THIS project, not external projects.

**Guidelines for Keyword Extraction:**
1. Focus on CONCEPTUAL and FUNCTIONAL keywords that describe what needs to be implemented or fixed in the current project
2. Prioritize:
   - Core technical concepts (e.g., 'indexing', 'MCP service', 'embedding', 'vector store')
   - Functionality descriptions (e.g., 'file watching', 'semantic search', 'code parsing')
   - Technology names (e.g., 'TypeScript', 'Node.js', 'API', 'service')
   - Architecture patterns (e.g., 'client-server', 'microservice', 'plugin')
3. AVOID:
   - Specific file names from external projects (e.g., 'cache-manager.ts' from Roo-Code)
   - External project paths or directory structures
   - Implementation details that are specific to other codebases
4. Focus on WHAT needs to be built/fixed, not HOW it's implemented in other projects

**Example:**
- Good: "codebase indexing", "MCP service", "embedding generation", "file processing"
- Bad: "cache-manager.ts", "Roo-Code/src/services", "orchestrator.ts"

Please analyze this GitHub issue and extract keywords for searching the CURRENT project:

**Issue Title:** ${issue.title}

**Issue Body:** ${issue.body || 'No description provided'}

**Labels:** ${issue.labels.map(l => l.name).join(', ') || 'None'}`;

    // Add URL content if available, but focus on concepts not implementation details
    if (issue.urlContent && issue.urlContent.length > 0) {
      const successfulUrls = issue.urlContent.filter(u => u.status === 'success');
      if (successfulUrls.length > 0) {
        prompt += `\n\n**Additional Context from URLs (for understanding requirements, NOT for extracting file names):**\n`;
        successfulUrls.forEach((urlData, index) => {
          prompt += `\n${index + 1}. **${urlData.title}** (${urlData.url})\n`;
          const content = urlData.content || '';
          if (content) {
            // Extract only the first portion and focus on conceptual understanding
            prompt += `${content.substring(0, 300)}${content.length > 300 ? '...' : ''}\n`;
          }
        });
        prompt += `\n**IMPORTANT:** Use this content to understand the REQUIREMENTS and CONCEPTS, but do NOT extract specific file names or implementation details from external projects.`;
      }
    }

    prompt += `\n\nRespond ONLY with a JSON object containing the following fields:
{
  "primary_keywords": ["keyword1", "keyword2", ...], // Core concepts and technologies mentioned (max 5, weight: 0.9)
  "secondary_keywords": ["keyword1", "keyword2", ...], // Related functional areas and patterns (max 5, weight: 0.6)
  "tertiary_keywords": ["keyword1", "keyword2", ...], // Supporting technologies and concepts (max 5, weight: 0.3)
}

Focus on CONCEPTUAL keywords that help find relevant code in the current project, not specific file names from external projects.

**Examples for this type of issue:**
- Primary: ["indexing", "MCP", "service", "embedding", "codebase"]
- Secondary: ["file processing", "vector store", "API", "client", "search"]
- Tertiary: ["TypeScript", "configuration", "integration", "performance", "scalability"]`;

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
