import { GitHubIssue } from "../../types/index";
import { IssueAnalysisResult } from "../../types/index";

// Interfaces for different analysis types
export interface LLMKeywordAnalysis {
  primary_keywords: string[];
  technical_terms: string[];
  error_patterns: string[];
  component_names: string[];
  file_patterns: string[];
  search_strategies: string[];
  issue_type: string;
  confidence: number;
}

export interface CodeRelevanceAnalysis {
  is_relevant: boolean;
  relevance_score: number;
  reason: string;
  specific_areas: string[];
  confidence: number;
}

export interface StructuredAnalysisPlan {
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

export interface LLMAnalysisReport {
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
  recommendations: Array<{
    type: 'file' | 'function' | 'api' | 'symbol';
    description: string;
    location?: string;
    confidence: number;
  }>;
  confidence: number;
}

// Configuration for analysis
interface AnalysisConfig {
  maxKeywords: number;
  relevanceThreshold: number;
  scoreNormalizer: number;
  fallbackConfidence: number;
  maxPrimaryKeywords: number;
  maxTechnicalTerms: number;
  maxErrorPatterns: number;
  maxComponentNames: number;
  maxFilePatterns: number;
  maxSearchStrategies: number;
}

// Builder for CodeRelevanceAnalysis results
class RelevanceAnalysisBuilder {
  private result: Partial<CodeRelevanceAnalysis> = {};

  setRelevant(isRelevant: boolean): this {
    this.result.is_relevant = isRelevant;
    return this;
  }

  setScore(score: number): this {
    this.result.relevance_score = Math.max(0, Math.min(1, score));
    return this;
  }

  setReason(reason: string): this {
    this.result.reason = reason;
    return this;
  }

  setSpecificAreas(areas: string[]): this {
    this.result.specific_areas = areas;
    return this;
  }

  setConfidence(confidence: number): this {
    this.result.confidence = Math.max(0, Math.min(1, confidence));
    return this;
  }

  build(): CodeRelevanceAnalysis {
    return {
      is_relevant: this.result.is_relevant ?? false,
      relevance_score: this.result.relevance_score ?? 0,
      reason: this.result.reason ?? 'No analysis performed',
      specific_areas: this.result.specific_areas ?? [],
      confidence: this.result.confidence ?? 0
    };
  }
}

// Keyword extraction utility
class KeywordExtractor {
  private config: AnalysisConfig;

  constructor(config: AnalysisConfig) {
    this.config = config;
  }

  extractBasicKeywords(text: string): string[] {
    const words = text.match(/\b\w{3,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'way', 'she', 'use', 'this', 'that', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);
    
    return [...new Set(words.filter(word => 
      !stopWords.has(word) && 
      word.length > 3 &&
      !/^\d+$/.test(word)
    ))];
  }

  extractTechnicalTerms(text: string): string[] {
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

  extractErrorPatterns(text: string): string[] {
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

  extractComponentNames(text: string): string[] {
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

  extractFilePatterns(text: string): string[] {
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

  detectIssueType(text: string): string {
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

  extractAndMatch(issueText: string, fileContent: string, maxKeywords: number = 10): {
    keywords: string[];
    matchCount: number;
    foundKeywords: string[];
  } {
    const keywords = this.extractBasicKeywords(issueText.toLowerCase());
    const contentLower = fileContent.toLowerCase();
    
    let matchCount = 0;
    const foundKeywords: string[] = [];

    for (const keyword of keywords.slice(0, maxKeywords)) {
      if (contentLower.includes(keyword.toLowerCase())) {
        matchCount++;
        foundKeywords.push(keyword);
      }
    }

    return { keywords, matchCount, foundKeywords };
  }
}

/**
 * Fallback Analysis Service - handles all rule-based analysis when LLM is not available
 */
export class FallbackAnalysisService {
  private config: AnalysisConfig;
  private keywordExtractor: KeywordExtractor;

  constructor() {
    this.config = {
      maxKeywords: 10,
      relevanceThreshold: 0.2,
      scoreNormalizer: 5,
      fallbackConfidence: 0.4,
      maxPrimaryKeywords: 8,
      maxTechnicalTerms: 12,
      maxErrorPatterns: 5,
      maxComponentNames: 8,
      maxFilePatterns: 6,
      maxSearchStrategies: 10
    };
    
    this.keywordExtractor = new KeywordExtractor(this.config);
  }

  /**
   * Extract keywords from GitHub issue using rule-based approach
   */
  extractKeywords(issue: GitHubIssue): LLMKeywordAnalysis {
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();

    const primary = this.keywordExtractor.extractBasicKeywords(text);
    const technical = this.keywordExtractor.extractTechnicalTerms(text);
    const errors = this.keywordExtractor.extractErrorPatterns(text);

    return {
      primary_keywords: primary.slice(0, this.config.maxPrimaryKeywords),
      technical_terms: technical.slice(0, this.config.maxTechnicalTerms),
      error_patterns: errors.slice(0, this.config.maxErrorPatterns),
      component_names: this.keywordExtractor.extractComponentNames(text).slice(0, this.config.maxComponentNames),
      file_patterns: this.keywordExtractor.extractFilePatterns(text).slice(0, this.config.maxFilePatterns),
      search_strategies: [...primary, ...technical].slice(0, this.config.maxSearchStrategies),
      issue_type: this.keywordExtractor.detectIssueType(text),
      confidence: 0.6 // Lower confidence for fallback
    };
  }

  /**
   * Analyze code relevance using rule-based approach
   */
  analyzeCodeRelevance(issue: GitHubIssue, filePath: string, fileContent: string): CodeRelevanceAnalysis {
    const issueText = `${issue.title} ${issue.body || ''}`;
    const { matchCount, foundKeywords } = this.keywordExtractor.extractAndMatch(
      issueText,
      fileContent,
      this.config.maxKeywords
    );

    const relevanceScore = Math.min(matchCount / this.config.scoreNormalizer, 1);
    const isRelevant = relevanceScore > this.config.relevanceThreshold;

    return new RelevanceAnalysisBuilder()
      .setRelevant(isRelevant)
      .setScore(relevanceScore)
      .setReason(this.buildRelevanceReason(isRelevant, matchCount, foundKeywords))
      .setSpecificAreas(this.buildSpecificAreas(foundKeywords))
      .setConfidence(this.config.fallbackConfidence)
      .build();
  }

  /**
   * Generate structured analysis plan using rule-based approach
   */
  generateStructuredAnalysisPlan(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    language: 'zh' | 'en'
  ): StructuredAnalysisPlan {
    const relevantFiles = analysisResult.relatedCode.files.slice(0, 5);
    const isZh = language === 'zh';

    return {
      title: isZh ? '分析和优化计划' : 'Analysis and Optimization Plan',
      current_issues: [
        {
          issue: isZh ? `需要调查 ${relevantFiles.length} 个文件` : `Need to investigate ${relevantFiles.length} files`,
          description: isZh ? '基于问题描述识别的相关文件需要详细分析' : 'Related files identified based on issue description need detailed analysis',
          severity: 'medium' as const
        },
        {
          issue: isZh ? '需要详细分析以识别具体问题' : 'Detailed analysis needed to identify specific problems',
          description: isZh ? '当前分析基于关键词匹配，需要更深入的代码审查' : 'Current analysis based on keyword matching, deeper code review needed',
          severity: 'medium' as const
        }
      ],
      detailed_plan: [
        {
          step_number: 1,
          title: isZh ? '审查相关文件' : 'Review relevant files',
          file_to_modify: relevantFiles.map(f => f.path).join(', '),
          changes_needed: isZh
            ? ['审查代码逻辑', '检查潜在错误', '验证实现']
            : ['Review code logic', 'Check for potential bugs', 'Verify implementation'],
          description: isZh ? '检查已识别的文件是否存在潜在问题' : 'Examine the identified files for potential issues'
        },
        {
          step_number: 2,
          title: isZh ? '实施修复' : 'Implement fixes',
          file_to_modify: '',
          changes_needed: isZh
            ? ['应用错误修复', '添加缺失功能', '改进错误处理']
            : ['Apply bug fixes', 'Add missing functionality', 'Improve error handling'],
          description: isZh ? '基于发现的问题应用必要的更改' : 'Apply necessary changes based on findings'
        }
      ],
      language
    };
  }

  /**
   * Generate analysis report using rule-based approach
   */
  generateAnalysisReport(issue: GitHubIssue, analysisResult: IssueAnalysisResult): LLMAnalysisReport {
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

  private buildRelevanceReason(isRelevant: boolean, matchCount: number, foundKeywords: string[]): string {
    return isRelevant
      ? `File contains ${matchCount} keywords from the issue: ${foundKeywords.join(', ')}`
      : 'File does not contain significant keywords from the issue';
  }

  private buildSpecificAreas(foundKeywords: string[]): string[] {
    return foundKeywords.length > 0
      ? [`Keywords found: ${foundKeywords.join(', ')}`]
      : [];
  }

  // Expose keyword extractor methods for backward compatibility
  public extractBasicKeywords(text: string): string[] {
    return this.keywordExtractor.extractBasicKeywords(text);
  }

  public extractTechnicalTerms(text: string): string[] {
    return this.keywordExtractor.extractTechnicalTerms(text);
  }

  public extractErrorPatterns(text: string): string[] {
    return this.keywordExtractor.extractErrorPatterns(text);
  }

  public extractComponentNames(text: string): string[] {
    return this.keywordExtractor.extractComponentNames(text);
  }

  public extractFilePatterns(text: string): string[] {
    return this.keywordExtractor.extractFilePatterns(text);
  }

  public detectIssueType(text: string): string {
    return this.keywordExtractor.detectIssueType(text);
  }
}
