/**
 * Analysis Strategy Interface
 * 
 * Defines the contract for different analysis strategies using the Strategy Pattern.
 * This allows for flexible switching between LLM-based, rule-based, and hybrid approaches.
 */

import { GitHubIssue, CodeContext } from "../../../types/index";

export interface SearchKeywords {
  primary: string[];
  secondary: string[];
  technical: string[];
  contextual: string[];
}

export interface AnalysisContext {
  workspacePath: string;
  filteredFiles: string[];
  analysisResult: any; // ContextWorkerResult
  issue: GitHubIssue;
}

export interface AnalysisResult {
  files: Array<{
    path: string;
    content: string;
    relevanceScore: number;
    reason?: string;
  }>;
  symbols: Array<{
    name: string;
    type: string;
    location: { file: string; line: number; column: number; };
    description?: string;
  }>;
  apis: Array<{
    path: string;
    method: string;
    description?: string;
  }>;
  confidence: number;
  strategy: string;
}

/**
 * Strategy interface for different analysis approaches
 */
export interface IAnalysisStrategy {
  /**
   * Unique identifier for this strategy
   */
  readonly name: string;

  /**
   * Generate keywords from the issue
   */
  generateKeywords(issue: GitHubIssue): Promise<SearchKeywords>;

  /**
   * Find relevant files based on the analysis context
   */
  findRelevantFiles(context: AnalysisContext, keywords: SearchKeywords): Promise<AnalysisResult['files']>;

  /**
   * Find relevant symbols
   */
  findRelevantSymbols(context: AnalysisContext, keywords: SearchKeywords): Promise<AnalysisResult['symbols']>;

  /**
   * Find relevant APIs
   */
  findRelevantApis(context: AnalysisContext, keywords: SearchKeywords): Promise<AnalysisResult['apis']>;

  /**
   * Calculate confidence score for the analysis
   */
  calculateConfidence(result: AnalysisResult): number;

  /**
   * Check if this strategy is available (e.g., LLM service is accessible)
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Base class providing common functionality for analysis strategies
 */
export abstract class BaseAnalysisStrategy implements IAnalysisStrategy {
  abstract readonly name: string;

  abstract generateKeywords(issue: GitHubIssue): Promise<SearchKeywords>;
  abstract findRelevantFiles(context: AnalysisContext, keywords: SearchKeywords): Promise<AnalysisResult['files']>;
  abstract findRelevantSymbols(context: AnalysisContext, keywords: SearchKeywords): Promise<AnalysisResult['symbols']>;
  abstract findRelevantApis(context: AnalysisContext, keywords: SearchKeywords): Promise<AnalysisResult['apis']>;

  calculateConfidence(result: AnalysisResult): number {
    // Default confidence calculation based on result quality
    const fileScore = Math.min(result.files.length / 5, 1) * 0.4;
    const symbolScore = Math.min(result.symbols.length / 10, 1) * 0.3;
    const apiScore = Math.min(result.apis.length / 5, 1) * 0.3;
    
    return fileScore + symbolScore + apiScore;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Base strategies are always available
  }

  /**
   * Helper method to extract primary keywords using rule-based approach
   */
  protected extractPrimaryKeywords(text: string): string[] {
    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 
      'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 
      'did', 'man', 'way', 'she', 'use', 'this', 'that', 'with', 'have', 
      'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 
      'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 
      'over', 'such', 'take', 'than', 'them', 'well', 'were'
    ]);

    return [...new Set(words.filter(word =>
      !stopWords.has(word) &&
      word.length > 3 &&
      !/^\d+$/.test(word)
    ))].slice(0, 10);
  }

  /**
   * Helper method to extract technical terms
   */
  protected extractTechnicalTerms(text: string): string[] {
    const technicalPatterns = [
      /\b\w+\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|h|cs|php|rb|md)\b/g,
      /\b(function|class|interface|method|api|endpoint|route|component|service|controller|model|view|database|table|column|field|property|attribute|parameter|argument|variable|constant|enum|struct|union|namespace|package|module|import|export|async|await|promise|callback|event|listener|handler|middleware|decorator|annotation|generic|template|abstract|static|final|private|public|protected|override|virtual|extends|implements|inherits|throws|catch|try|finally|if|else|switch|case|default|for|while|do|break|continue|return|yield|new|delete|this|super|null|undefined|true|false)\b/gi,
      /\b(react|vue|angular|node|express|spring|django|flask|rails|laravel|symfony|asp\.net|blazor|xamarin|flutter|ionic|cordova|electron|webpack|vite|rollup|babel|typescript|javascript|python|java|kotlin|swift|objective-c|c\+\+|c#|go|rust|php|ruby|scala|clojure|haskell|erlang|elixir|dart|lua|perl|r|matlab|julia|fortran|cobol|assembly|sql|nosql|mongodb|postgresql|mysql|sqlite|redis|elasticsearch|docker|kubernetes|aws|azure|gcp|firebase|heroku|vercel|netlify|github|gitlab|bitbucket|jenkins|travis|circleci|jest|mocha|jasmine|cypress|selenium|puppeteer|playwright|storybook)\b/gi,
    ];

    const matches: string[] = [];
    technicalPatterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found);
    });

    return [...new Set(matches.map(m => m.toLowerCase()))].slice(0, 20);
  }

  /**
   * Helper method to calculate symbol relevance
   */
  protected calculateSymbolRelevance(symbol: any, keywords: SearchKeywords): number {
    const allKeywords = [
      ...keywords.primary,
      ...keywords.secondary,
      ...keywords.technical,
      ...keywords.contextual
    ];

    let score = 0;
    const symbolText = `${symbol.name} ${symbol.qualifiedName} ${symbol.comment || ''}`.toLowerCase();

    for (const keyword of allKeywords) {
      if (symbolText.includes(keyword.toLowerCase())) {
        if (symbol.name.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2;
        } else if (symbol.qualifiedName.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1.5;
        } else {
          score += 0.5;
        }
      }
    }

    return score;
  }
}
