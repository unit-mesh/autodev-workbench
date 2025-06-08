import { generateText, CoreMessage } from "ai";
import { GitHubIssue } from "../../types/index";
import { IssueAnalysisResult } from "../../types/index";
import * as fs from "fs";
import * as path from "path";
import { configureLLMProvider, LLMProviderConfig } from "./llm-provider";
import {
  FallbackAnalysisService,
  LLMKeywordAnalysis,
  CodeRelevanceAnalysis,
  StructuredAnalysisPlan,
  LLMAnalysisReport
} from "../analysis/FallbackAnalysisService";

// Remove duplicate interfaces and classes - now imported from FallbackAnalysisService

export class LLMService {
  private llmConfig: LLMProviderConfig | null;
  private logFile: string;
  private fallbackService: FallbackAnalysisService;

  constructor() {
    // Configure LLM provider
    this.llmConfig = configureLLMProvider();

    // Set up log file
    this.logFile = path.join(process.cwd(), 'llm-service.log');

    // Initialize fallback analysis service
    this.fallbackService = new FallbackAnalysisService();

    // Only log LLM provider info in verbose mode to reduce noise
    if (this.llmConfig && process.env.VERBOSE_LLM_LOGS === 'true') {
      console.log(`🤖 Using LLM provider: ${this.llmConfig.providerName}`);
    } else if (!this.llmConfig && process.env.VERBOSE_LLM_LOGS === 'true') {
      console.warn('⚠️  No LLM provider available. LLM features will be disabled.');
    }
  }

  /**
   * Check if LLM service is available
   */
  isAvailable(): boolean {
    return this.llmConfig !== null;
  }

  /**
   * Get the current LLM provider name
   */
  getProviderName(): string {
    return this.llmConfig?.providerName || 'None';
  }

  private log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;

    try {
      fs.appendFileSync(this.logFile, logEntry);
      // Only log to console in verbose mode - reduce noise
      if (process.env.VERBOSE_LLM_LOGS === 'true') {
        console.log(`📝 Logged to ${this.logFile}: ${message}`);
      }
    } catch (error) {
      // Silently fail if can't write to log file to avoid noise
    }
  }

  async analyzeIssueForKeywords(issue: GitHubIssue & { urlContent?: any[] }): Promise<LLMKeywordAnalysis> {
    // Check if LLM provider is available
    if (!this.llmConfig) {
      this.log('LLM provider not available, using fallback');
      return this.fallbackService.extractKeywords(issue);
    }

    // const prompt = this.buildKeywordExtractionPrompt(issue);

    // Log the input data
    this.log('=== KEYWORD ANALYSIS START ===');
    this.log('Issue data:', {
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
    this.log('Generated prompt:', { prompt: promptStr.substring(0, 2000) + (promptStr.length > 2000 ? '...' : '') });

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
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        messages,
        temperature: 0.3, // Lower temperature for more consistent results
      });

      this.log('LLM response:', { response: text });

      // Parse the LLM response
      const analysis = this.parseKeywordAnalysis(text);
      this.log('Parsed analysis:', analysis);
      this.log('=== KEYWORD ANALYSIS SUCCESS ===');
      return analysis;
    } catch (error: any) {
      this.log('LLM keyword analysis failed:', { error: error.message, stack: error.stack });
      console.warn(`LLM keyword analysis failed: ${error.message}`);
      // Fallback to rule-based extraction
      const fallbackResult = this.fallbackService.extractKeywords(issue);
      this.log('Using fallback analysis:', fallbackResult);
      this.log('=== KEYWORD ANALYSIS FALLBACK ===');
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

  // All fallback methods moved to FallbackAnalysisService

  async generateAnalysisReport(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult
  ): Promise<LLMAnalysisReport> {
    const prompt = this.buildAnalysisReportPrompt(issue, analysisResult);

    if (!this.llmConfig) {
      return this.fallbackService.generateAnalysisReport(issue, analysisResult);
    }

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert software architect and code analyst. Generate comprehensive analysis reports for GitHub issues based on code analysis results. Always respond with valid JSON in the specified format."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const { text } = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        messages,
        temperature: 0.3,
      });

      const report = this.parseAnalysisReport(text);
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`LLM analysis report generation failed: ${errorMessage}`);
      return this.fallbackService.generateAnalysisReport(issue, analysisResult);
    }
  }

  private buildStructuredAnalysisPlanPrompt(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    language: 'zh' | 'en'
  ): string {
    const relevantFiles = analysisResult.relatedCode.files.slice(0, 10);
    const relevantSymbols = analysisResult.relatedCode.symbols.slice(0, 8);

    if (language === 'zh') {
      return `基于以下GitHub问题和代码分析结果，生成结构化的分析和优化计划。

**GitHub 问题:**
- 标题: ${issue.title}
- 描述: ${issue.body || '无描述'}
- 标签: ${issue.labels.map(l => l.name).join(', ') || '无'}
- 状态: ${issue.state}

**代码分析结果:**
- 找到相关文件: ${relevantFiles.length}个
- 主要文件: ${relevantFiles.map(f => f.path).join(', ')}
- 相关符号: ${relevantSymbols.map(s => s.name).join(', ')}
- 当前摘要: ${analysisResult.summary}

**当前建议:**
${analysisResult.suggestions.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}

请生成以下JSON格式的结构化分析计划:

{
  "title": "分析和优化计划",
  "current_issues": [
    {
      "issue": "具体问题描述",
      "description": "问题的详细说明和影响",
      "severity": "high|medium|low"
    }
  ],
  "detailed_plan": [
    {
      "step_number": 1,
      "title": "步骤标题",
      "file_to_modify": "需要修改的文件路径",
      "changes_needed": [
        "具体需要的修改1",
        "具体需要的修改2"
      ],
      "description": "详细的实施说明"
    }
  ],
  "language": "zh"
}

重点关注:
1. 从代码分析中识别具体问题
2. 提供可操作的步骤和文件级别的详细信息
3. 确保修改建议具体且实用
4. 明确指出需要修改哪些文件以及需要什么样的修改`;
    } else {
      return `Based on the following GitHub issue and code analysis results, generate a structured analysis and optimization plan.

**GitHub Issue:**
- Title: ${issue.title}
- Body: ${issue.body || 'No description provided'}
- Labels: ${issue.labels.map(l => l.name).join(', ') || 'None'}
- State: ${issue.state}

**Code Analysis Results:**
- Relevant Files Found: ${relevantFiles.length}
- Top Files: ${relevantFiles.map(f => f.path).join(', ')}
- Relevant Symbols: ${relevantSymbols.map(s => s.name).join(', ')}
- Current Summary: ${analysisResult.summary}

**Current Suggestions:**
${analysisResult.suggestions.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}

Please generate a structured analysis plan in the following JSON format:

{
  "title": "Analysis and Optimization Plan",
  "current_issues": [
    {
      "issue": "Specific issue description",
      "description": "Detailed explanation and impact of the issue",
      "severity": "high|medium|low"
    }
  ],
  "detailed_plan": [
    {
      "step_number": 1,
      "title": "Step title",
      "file_to_modify": "Path to file that needs modification",
      "changes_needed": [
        "Specific change needed 1",
        "Specific change needed 2"
      ],
      "description": "Detailed implementation instructions"
    }
  ],
  "language": "en"
}

Focus on:
1. Identifying specific problems from the code analysis
2. Providing actionable steps with file-level details
3. Ensuring modification suggestions are specific and practical
4. Clearly stating which files need changes and what kind of changes are needed`;
    }
  }

  private buildAnalysisReportPrompt(issue: GitHubIssue, analysisResult: IssueAnalysisResult): string {
    const relevantFiles = analysisResult.relatedCode.files.slice(0, 10);
    const relevantSymbols = analysisResult.relatedCode.symbols.slice(0, 8);

    return `Analyze the following GitHub issue and code analysis results to generate a comprehensive analysis report.

**GitHub Issue:**
- Title: ${issue.title}
- Body: ${issue.body || 'No description provided'}
- Labels: ${issue.labels.map(l => l.name).join(', ') || 'None'}
- State: ${issue.state}

**Code Analysis Results:**
- Relevant Files Found: ${relevantFiles.length}
- Top Files: ${relevantFiles.map(f => f.path).join(', ')}
- Relevant Symbols: ${relevantSymbols.map(s => s.name).join(', ')}
- Current Summary: ${analysisResult.summary}

**Current Suggestions:**
${analysisResult.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Please generate a comprehensive analysis report in the following JSON format:

{
  "summary": "Brief summary of the issue and analysis findings",
  "current_issues": [
    "List of specific issues identified from the analysis",
    "Each item should be a clear, actionable problem statement"
  ],
  "detailed_plan": {
    "title": "Overall plan title",
    "steps": [
      {
        "step_number": 1,
        "title": "Step title",
        "description": "Detailed description of what needs to be done",
        "files_to_modify": ["list", "of", "files"],
        "changes_needed": ["specific", "changes", "required"]
      }
    ]
  },
  "recommendations": [
    "High-level recommendations for addressing the issue",
    "Best practices and considerations"
  ],
  "confidence": 0.85
}

Focus on:
1. Identifying specific problems from the code analysis
2. Creating actionable steps with file-level details
3. Providing practical recommendations
4. Being specific about what files need changes and what changes are needed`;
  }

  private parseStructuredAnalysisPlan(text: string, language: 'zh' | 'en'): StructuredAnalysisPlan {
    try {
      // Clean the text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.title || !parsed.current_issues || !parsed.detailed_plan) {
        throw new Error('Missing required fields in structured analysis plan');
      }

      return {
        title: parsed.title || (language === 'zh' ? '分析和优化计划' : 'Analysis and Optimization Plan'),
        current_issues: Array.isArray(parsed.current_issues) ? parsed.current_issues.map((item: any) => ({
          issue: item.issue || item,
          description: item.description || '',
          severity: ['high', 'medium', 'low'].includes(item.severity) ? item.severity : 'medium'
        })) : [],
        detailed_plan: Array.isArray(parsed.detailed_plan) ? parsed.detailed_plan.map((step: any, index: number) => ({
          step_number: step.step_number || index + 1,
          title: step.title || `Step ${index + 1}`,
          file_to_modify: step.file_to_modify || '',
          changes_needed: Array.isArray(step.changes_needed) ? step.changes_needed : [],
          description: step.description || ''
        })) : [],
        language: language
      };
    } catch (error) {
      console.warn(`Failed to parse LLM structured analysis plan: ${error.message}`);
      throw error;
    }
  }

  private fallbackStructuredAnalysisPlan(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    language: 'zh' | 'en'
  ): StructuredAnalysisPlan {
    return this.fallbackService.generateStructuredAnalysisPlan(issue, analysisResult, language);
  }

  private parseAnalysisReport(text: string): LLMAnalysisReport {
    try {
      // Clean the text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.summary || !parsed.current_issues || !parsed.detailed_plan || !parsed.recommendations) {
        throw new Error('Missing required fields in analysis report');
      }

      return {
        summary: parsed.summary,
        current_issues: Array.isArray(parsed.current_issues) ? parsed.current_issues : [],
        detailed_plan: {
          title: parsed.detailed_plan?.title || 'Analysis and Implementation Plan',
          steps: Array.isArray(parsed.detailed_plan?.steps) ? parsed.detailed_plan.steps : []
        },
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7
      };
    } catch (error) {
      console.warn(`Failed to parse LLM analysis report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze if a specific code file is relevant to the GitHub issue using LLM
   */
  async analyzeCodeRelevance(
    issue: GitHubIssue & { urlContent?: any[] },
    filePath: string,
    fileContent: string
  ): Promise<CodeRelevanceAnalysis> {
    // const prompt = this.buildCodeRelevancePrompt(issue, filePath, fileContent);

    this.log('=== CODE RELEVANCE ANALYSIS START ===');
    this.log('Analyzing file relevance:', {
      issueNumber: issue.number,
      issueTitle: issue.title,
      filePath: filePath,
      fileContentLength: fileContent.length,
      fileContentPreview: fileContent.substring(0, 300) + (fileContent.length > 300 ? '...' : '')
    });

    if (!this.llmConfig) {
      const fallbackResult = this.fallbackService.analyzeCodeRelevance(issue, filePath, fileContent);
      this.log('Using fallback relevance analysis (no LLM provider):', { filePath, fallbackResult });
      this.log('=== CODE RELEVANCE ANALYSIS FALLBACK ===');
      return fallbackResult;
    }

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert code analyst. Analyze whether a specific code file is relevant to a GitHub issue. Always respond with valid JSON in the specified format."
        },
        {
          role: "user",
          content: this.buildCodeRelevancePrompt(issue, filePath, fileContent)
        }
      ];

      const { text } = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        messages,
        temperature: 0.2, // Lower temperature for more consistent analysis
      });

      this.log('LLM relevance response:', { filePath, response: text });
      const analysis = this.parseCodeRelevanceAnalysis(text);
      this.log('Parsed relevance analysis:', { filePath, analysis });
      this.log('=== CODE RELEVANCE ANALYSIS SUCCESS ===');
      return analysis;
    } catch (error) {
      this.log('LLM code relevance analysis failed:', { filePath, error: error.message, stack: error.stack });
      console.warn(`LLM code relevance analysis failed: ${error.message}`);
      const fallbackResult = this.fallbackService.analyzeCodeRelevance(issue, filePath, fileContent);
      this.log('Using fallback relevance analysis:', { filePath, fallbackResult });
      this.log('=== CODE RELEVANCE ANALYSIS FALLBACK ===');
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

  // All fallback methods moved to FallbackAnalysisService
}
