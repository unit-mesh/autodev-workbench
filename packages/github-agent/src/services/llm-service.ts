import { generateText, CoreMessage } from "ai";
import { GitHubIssue } from "../types/index";
import { IssueAnalysisResult } from "../types/index";
import * as fs from "fs";
import * as path from "path";
import { configureLLMProvider, hasLLMProvider, LLMProviderConfig } from "./llm-provider";

interface LLMKeywordAnalysis {
  primary_keywords: string[];
  technical_terms: string[];
  error_patterns: string[];
  component_names: string[];
  file_patterns: string[];
  search_strategies: string[];
  issue_type: string;
  confidence: number;
}

interface LLMAnalysisReport {
  summary: string;
  current_issues: string[];
  detailed_plan: {
    title: string;
    steps: Array<{
      step_number: number;
      title: string;
      description: string;
      files_to_modify: string[];
      changes_needed: string[];
    }>;
  };
  recommendations: string[];
  confidence: number;
}

interface StructuredAnalysisPlan {
  title: string;
  current_issues: Array<{
    issue: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  detailed_plan: Array<{
    step_number: number;
    title: string;
    file_to_modify: string;
    changes_needed: string[];
    description: string;
  }>;
  language: 'zh' | 'en';
}

interface CodeRelevanceAnalysis {
  is_relevant: boolean;
  relevance_score: number; // 0.0 - 1.0
  reason: string;
  specific_areas: string[]; // Specific parts of the code that are relevant
  confidence: number;
}

export class LLMService {
  private llmConfig: LLMProviderConfig | null;
  private logFile: string;

  constructor() {
    // Configure LLM provider
    this.llmConfig = configureLLMProvider();

    // Set up log file
    this.logFile = path.join(process.cwd(), 'llm-service.log');

    if (this.llmConfig) {
      console.log(`🤖 Using LLM provider: ${this.llmConfig.providerName}`);
    } else {
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
      console.log(`📝 Logged to ${this.logFile}: ${message}`);
    } catch (error) {
      console.warn(`Failed to write to log file: ${error.message}`);
    }
  }

  async analyzeIssueForKeywords(issue: GitHubIssue & { urlContent?: any[] }): Promise<LLMKeywordAnalysis> {
    // Check if LLM provider is available
    if (!this.llmConfig) {
      this.log('LLM provider not available, using fallback');
      return this.fallbackKeywordExtraction(issue);
    }

    const prompt = this.buildKeywordExtractionPrompt(issue);

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
    this.log('Generated prompt:', { prompt: prompt.substring(0, 2000) + (prompt.length > 2000 ? '...' : '') });

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert code analyst. Analyze GitHub issues and extract relevant keywords for code search. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
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
      const fallbackResult = this.fallbackKeywordExtraction(issue);
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
7. **issue_type**: One of: "bug", "feature", "performance", "documentation", "testing", "security", "refactor"
8. **confidence**: Float between 0.0-1.0 indicating confidence in the analysis

Focus on terms that would help find relevant code files, functions, and components.
Pay special attention to any technical information from the URL content provided above.

Example response format:
{
  "primary_keywords": ["authentication", "login", "user", "session"],
  "technical_terms": ["jwt", "token", "middleware", "express", "nodejs"],
  "error_patterns": ["401 unauthorized", "token expired", "invalid credentials"],
  "component_names": ["AuthMiddleware", "LoginController", "UserService"],
  "file_patterns": ["auth", "login", "user", "middleware", "controller"],
  "search_strategies": ["authenticate", "verify", "token", "session", "login"],
  "issue_type": "bug",
  "confidence": 0.85
}

Respond only with valid JSON:`;
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
        issue_type: typeof parsed.issue_type === 'string' ? parsed.issue_type : 'general',
        confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5
      };
    } catch (error) {
      throw new Error(`Failed to parse LLM response: ${error.message}`);
    }
  }

  private fallbackKeywordExtraction(issue: GitHubIssue): LLMKeywordAnalysis {
    // Fallback to rule-based extraction if LLM fails
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    
    const primary = this.extractBasicKeywords(text);
    const technical = this.extractTechnicalTerms(text);
    const errors = this.extractErrorPatterns(text);
    
    return {
      primary_keywords: primary.slice(0, 8),
      technical_terms: technical.slice(0, 12),
      error_patterns: errors.slice(0, 5),
      component_names: this.extractComponentNames(text).slice(0, 8),
      file_patterns: this.extractFilePatterns(text).slice(0, 6),
      search_strategies: [...primary, ...technical].slice(0, 10),
      issue_type: this.detectIssueType(text),
      confidence: 0.6 // Lower confidence for fallback
    };
  }

  private extractBasicKeywords(text: string): string[] {
    const words = text.match(/\b\w{3,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'way', 'she', 'use', 'this', 'that', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);
    
    return [...new Set(words.filter(word => 
      !stopWords.has(word) && 
      word.length > 3 &&
      !/^\d+$/.test(word)
    ))];
  }

  private extractTechnicalTerms(text: string): string[] {
    const patterns = [
      /\b\w+\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|h|cs|php|rb|md)\b/g,
      /\b(function|class|interface|method|api|endpoint|route|component|service|controller|model|view|database|table|column|field|property|attribute|parameter|argument|variable|constant|enum|struct|union|namespace|package|module|import|export|async|await|promise|callback|event|listener|handler|middleware|decorator|annotation|generic|template|abstract|static|final|private|public|protected|override|virtual|extends|implements|inherits|throws|catch|try|finally|if|else|switch|case|default|for|while|do|break|continue|return|yield|new|delete|this|super|null|undefined|true|false)\b/gi,
      /\b(react|vue|angular|node|express|spring|django|flask|rails|laravel|symfony|asp\.net|blazor|xamarin|flutter|ionic|cordova|electron|webpack|vite|rollup|babel|typescript|javascript|python|java|kotlin|swift|objective-c|c\+\+|c#|go|rust|php|ruby|scala|clojure|haskell|erlang|elixir|dart|lua|perl|r|matlab|julia|fortran|cobol|assembly|sql|nosql|mongodb|postgresql|mysql|sqlite|redis|elasticsearch|docker|kubernetes|aws|azure|gcp|firebase|heroku|vercel|netlify|github|gitlab|bitbucket|jenkins|travis|circleci|jest|mocha|jasmine|cypress|selenium|puppeteer|playwright)\b/gi,
    ];
    
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found);
    });
    
    return [...new Set(matches.map(m => m.toLowerCase()))];
  }

  private extractErrorPatterns(text: string): string[] {
    const patterns = [
      /"[^"]+error[^"]*"/gi,
      /'[^']+error[^']*'/gi,
      /\berror\s*:\s*[^\n]+/gi,
      /\bfailed\s*:\s*[^\n]+/gi,
      /\bexception\s*:\s*[^\n]+/gi,
      /\b\d{3}\s+(error|unauthorized|forbidden|not found|internal server error)/gi,
    ];
    
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found.map(m => m.replace(/['"]/g, '').trim()));
    });
    
    return [...new Set(matches.filter(m => m.length > 5))];
  }

  private extractComponentNames(text: string): string[] {
    const patterns = [
      /\b[A-Z][a-zA-Z0-9]*Component\b/g,
      /\b[A-Z][a-zA-Z0-9]*Service\b/g,
      /\b[A-Z][a-zA-Z0-9]*Controller\b/g,
      /\b[A-Z][a-zA-Z0-9]*Manager\b/g,
      /\b[A-Z][a-zA-Z0-9]*Handler\b/g,
      /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/g, // camelCase
    ];
    
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found);
    });
    
    return [...new Set(matches)];
  }

  private extractFilePatterns(text: string): string[] {
    const patterns = [
      /\b\w+\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|h|cs|php|rb|md|json|yaml|yml|xml|html|css|scss|sass|less)\b/g,
      /\b[a-z]+[-_][a-z]+\b/g, // kebab-case and snake_case
    ];
    
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found.map(m => m.toLowerCase()));
    });
    
    return [...new Set(matches)];
  }

  private detectIssueType(text: string): string {
    if (text.includes('bug') || text.includes('error') || text.includes('fail') || text.includes('crash')) {
      return 'bug';
    } else if (text.includes('feature') || text.includes('enhancement') || text.includes('add') || text.includes('implement')) {
      return 'feature';
    } else if (text.includes('performance') || text.includes('slow') || text.includes('optimize')) {
      return 'performance';
    } else if (text.includes('test') || text.includes('spec') || text.includes('coverage')) {
      return 'testing';
    } else if (text.includes('doc') || text.includes('readme') || text.includes('comment')) {
      return 'documentation';
    } else if (text.includes('security') || text.includes('vulnerability') || text.includes('auth')) {
      return 'security';
    }
    
    return 'general';
  }

  async generateAnalysisReport(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult
  ): Promise<LLMAnalysisReport> {
    const prompt = this.buildAnalysisReportPrompt(issue, analysisResult);

    if (!this.llmConfig) {
      return this.fallbackAnalysisReport(issue, analysisResult);
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
      console.warn(`LLM analysis report generation failed: ${error.message}`);
      return this.fallbackAnalysisReport(issue, analysisResult);
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
    const relevantFiles = analysisResult.relatedCode.files.slice(0, 5);

    if (language === 'zh') {
      return {
        title: '分析和优化计划',
        current_issues: [
          {
            issue: '需要进一步分析代码问题',
            description: `在 ${relevantFiles.length} 个相关文件中发现潜在问题`,
            severity: 'medium'
          },
          {
            issue: '缺少详细的错误处理机制',
            description: '基于问题描述，可能需要改进错误处理逻辑',
            severity: 'medium'
          }
        ],
        detailed_plan: [
          {
            step_number: 1,
            title: '检查相关文件',
            file_to_modify: relevantFiles[0]?.path || '待确定',
            changes_needed: [
              '审查代码逻辑',
              '检查潜在的错误',
              '验证实现方式'
            ],
            description: '详细检查已识别的相关文件，寻找可能导致问题的代码段'
          },
          {
            step_number: 2,
            title: '实施修复方案',
            file_to_modify: '根据分析结果确定',
            changes_needed: [
              '应用错误修复',
              '添加缺失功能',
              '改进错误处理'
            ],
            description: '基于分析结果实施必要的代码修改'
          }
        ],
        language: 'zh'
      };
    } else {
      return {
        title: 'Analysis and Optimization Plan',
        current_issues: [
          {
            issue: 'Code analysis required for further investigation',
            description: `Potential issues found in ${relevantFiles.length} relevant files`,
            severity: 'medium'
          },
          {
            issue: 'Missing detailed error handling mechanisms',
            description: 'Based on issue description, error handling logic may need improvement',
            severity: 'medium'
          }
        ],
        detailed_plan: [
          {
            step_number: 1,
            title: 'Review relevant files',
            file_to_modify: relevantFiles[0]?.path || 'To be determined',
            changes_needed: [
              'Review code logic',
              'Check for potential bugs',
              'Verify implementation'
            ],
            description: 'Thoroughly examine the identified relevant files for potential problematic code segments'
          },
          {
            step_number: 2,
            title: 'Implement fixes',
            file_to_modify: 'Based on analysis results',
            changes_needed: [
              'Apply bug fixes',
              'Add missing functionality',
              'Improve error handling'
            ],
            description: 'Implement necessary code modifications based on analysis findings'
          }
        ],
        language: 'en'
      };
    }
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
    const prompt = this.buildCodeRelevancePrompt(issue, filePath, fileContent);

    this.log('=== CODE RELEVANCE ANALYSIS START ===');
    this.log('Analyzing file relevance:', {
      issueNumber: issue.number,
      issueTitle: issue.title,
      filePath: filePath,
      fileContentLength: fileContent.length,
      fileContentPreview: fileContent.substring(0, 300) + (fileContent.length > 300 ? '...' : '')
    });

    if (!this.llmConfig) {
      const fallbackResult = this.fallbackCodeRelevanceAnalysis(issue, filePath, fileContent);
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
          content: prompt
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
      const fallbackResult = this.fallbackCodeRelevanceAnalysis(issue, filePath, fileContent);
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

  private fallbackCodeRelevanceAnalysis(
    issue: GitHubIssue,
    filePath: string,
    fileContent: string
  ): CodeRelevanceAnalysis {
    const issueText = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const contentLower = fileContent.toLowerCase();

    // Simple keyword matching fallback
    const keywords = this.extractBasicKeywords(issueText);
    let matchCount = 0;
    const foundKeywords: string[] = [];

    for (const keyword of keywords.slice(0, 10)) {
      if (contentLower.includes(keyword.toLowerCase())) {
        matchCount++;
        foundKeywords.push(keyword);
      }
    }

    const relevanceScore = Math.min(matchCount / 5, 1); // Normalize to 0-1
    const isRelevant = relevanceScore > 0.2;

    return {
      is_relevant: isRelevant,
      relevance_score: relevanceScore,
      reason: isRelevant ?
        `File contains ${matchCount} keywords from the issue: ${foundKeywords.join(', ')}` :
        'File does not contain significant keywords from the issue',
      specific_areas: foundKeywords.length > 0 ?
        [`Keywords found: ${foundKeywords.join(', ')}`] : [],
      confidence: 0.4 // Lower confidence for fallback analysis
    };
  }

  private fallbackAnalysisReport(issue: GitHubIssue, analysisResult: IssueAnalysisResult): LLMAnalysisReport {
    const relevantFiles = analysisResult.relatedCode.files.slice(0, 5);

    return {
      summary: `Analysis of issue "${issue.title}" found ${relevantFiles.length} relevant files and ${analysisResult.relatedCode.symbols.length} related symbols.`,
      current_issues: [
        `Issue requires investigation in ${relevantFiles.length} files`,
        'Detailed analysis needed to identify specific problems',
        'Code changes may be required based on issue description'
      ],
      detailed_plan: {
        title: 'Basic Analysis Plan',
        steps: [
          {
            step_number: 1,
            title: 'Review relevant files',
            description: 'Examine the identified files for potential issues',
            files_to_modify: relevantFiles.map(f => f.path),
            changes_needed: ['Review code logic', 'Check for potential bugs', 'Verify implementation']
          },
          {
            step_number: 2,
            title: 'Implement fixes',
            description: 'Apply necessary changes based on findings',
            files_to_modify: [],
            changes_needed: ['Apply bug fixes', 'Add missing functionality', 'Improve error handling']
          }
        ]
      },
      recommendations: analysisResult.suggestions,
      confidence: 0.5
    };
  }
}
