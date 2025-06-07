/**
 * Clean Context Analyzer using Design Patterns
 * 
 * This is a much shorter, cleaner version that delegates complex logic to specialized components.
 * The file is now ~150 lines instead of the original 1,276 lines.
 */

import { CodeContext, GitHubIssue, IssueAnalysisResult } from "../types/index";
import { LLMService } from "./llm-service";

// Import the new design pattern implementations
import { IAnalysisStrategy, AnalysisContext } from "./analysis/interfaces/IAnalysisStrategy";
import { ICacheManager, DefaultCacheKeyGenerator } from "./analysis/interfaces/ICacheManager";
import { AnalyzerFactory, AnalyzerConfig } from "./analysis/factories/AnalyzerFactory";

/**
 * Simplified Context Analyzer - Clean Facade Pattern Implementation
 * 
 * This class is now much shorter and cleaner, delegating complex logic to specialized components.
 * All heavy lifting is done by the strategy implementations.
 */
export class ContextAnalyzer {
  private workspacePath: string;
  private analysisStrategy: IAnalysisStrategy;
  private cacheManager: ICacheManager;
  private cacheKeyGenerator: DefaultCacheKeyGenerator;
  private initialized: boolean = false;

  constructor(
    workspacePath: string = process.cwd(),
    config: Partial<AnalyzerConfig> = {}
  ) {
    this.workspacePath = workspacePath;
    this.cacheKeyGenerator = new DefaultCacheKeyGenerator();
    
    // Initialize components asynchronously
    this.initializeComponents(config);
  }

  /**
   * Initialize analysis components using Factory Pattern
   */
  private async initializeComponents(config: Partial<AnalyzerConfig>): Promise<void> {
    try {
      const analyzerConfig: AnalyzerConfig = {
        type: config.type || 'auto',
        workspacePath: this.workspacePath,
        cacheType: config.cacheType || 'memory',
        searchType: config.searchType || 'hybrid',
        llmService: config.llmService || new LLMService(),
        options: config.options || {}
      };

      const components = await AnalyzerFactory.create(analyzerConfig);
      
      this.analysisStrategy = components.strategy;
      this.cacheManager = components.cacheManager;
      this.initialized = true;
      
      console.log(`🔧 Initialized ContextAnalyzer with strategy: ${this.analysisStrategy.name}`);
    } catch (error) {
      console.error('Failed to initialize analysis components:', error);
      await this.initializeFallbackComponents();
    }
  }

  /**
   * Fallback initialization if main initialization fails
   */
  private async initializeFallbackComponents(): Promise<void> {
    const { RuleBasedAnalysisStrategy } = await import('./analysis/strategies/RuleBasedAnalysisStrategy');
    const { MemoryCacheManager } = await import('./analysis/cache/MemoryCacheManager');
    
    this.analysisStrategy = new RuleBasedAnalysisStrategy();
    this.cacheManager = new MemoryCacheManager();
    this.initialized = true;
    
    console.log('🔧 Initialized ContextAnalyzer with fallback components');
  }

  /**
   * Ensure components are initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeComponents({});
    }
  }

  /**
   * Main analysis method - now uses Strategy Pattern
   * 
   * This method is much simpler now, delegating all complex logic to strategies.
   */
  async findRelevantCode(issue: GitHubIssue): Promise<CodeContext> {
    await this.ensureInitialized();
    
    // Create cache key
    const issueKey = this.cacheKeyGenerator.generateIssueKey(issue.number, issue.updated_at);
    
    // Check cache first
    const cached = await this.cacheManager.get<CodeContext>(`relevantCode-${issueKey}`);
    if (cached) {
      console.log('📦 Using cached analysis');
      return cached;
    }

    console.log(`🔍 Analyzing with strategy: ${this.analysisStrategy.name}`);

    // Create analysis context - strategies handle all the complex logic
    const context: AnalysisContext = {
      workspacePath: this.workspacePath,
      filteredFiles: [], // Strategy will handle file discovery
      analysisResult: {}, // Strategy will handle codebase analysis
      issue
    };

    // Delegate everything to the strategy
    const keywords = await this.analysisStrategy.generateKeywords(issue);
    
    const [relevantFiles, relevantSymbols, relevantApis] = await Promise.all([
      this.analysisStrategy.findRelevantFiles(context, keywords),
      this.analysisStrategy.findRelevantSymbols(context, keywords),
      this.analysisStrategy.findRelevantApis(context, keywords)
    ]);

    // Convert to expected format
    const result: CodeContext = {
      files: relevantFiles.map(f => ({
        path: f.path,
        content: f.content,
        relevanceScore: f.relevanceScore
      })),
      symbols: relevantSymbols,
      apis: relevantApis,
    };

    // Cache the result
    await this.cacheManager.set(`relevantCode-${issueKey}`, result, {
      ttl: 10 * 60 * 1000,
      tags: ['analysis']
    });

    console.log(`✅ Found: ${result.files.length} files, ${result.symbols.length} symbols, ${result.apis.length} APIs`);
    return result;
  }

  /**
   * Main issue analysis method - uses Template Method Pattern
   */
  async analyzeIssue(issue: GitHubIssue): Promise<IssueAnalysisResult> {
    console.log(`🎯 Analyzing issue #${issue.number}: ${issue.title}`);
    
    // Step 1: Find relevant code using strategy pattern
    const relatedCode = await this.findRelevantCode(issue);

    // Step 2: Generate suggestions and summary (delegated to strategies)
    const [suggestions, summary] = await Promise.all([
      this.generateSuggestions(issue, relatedCode),
      this.generateSummary(issue, relatedCode)
    ]);

    const result: IssueAnalysisResult = {
      issue,
      relatedCode,
      suggestions,
      summary,
    };

    console.log(`✅ Issue analysis complete for #${issue.number}`);
    return result;
  }

  /**
   * Generate suggestions - simplified, can be enhanced with strategy pattern
   */
  private async generateSuggestions(issue: GitHubIssue, codeContext: CodeContext): Promise<Array<{
    type: 'file' | 'function' | 'api' | 'symbol';
    description: string;
    location?: string;
    confidence: number;
  }>> {
    const suggestions: Array<{
      type: 'file' | 'function' | 'api' | 'symbol';
      description: string;
      location?: string;
      confidence: number;
    }> = [];

    // Generate suggestions based on relevant files
    for (const file of codeContext.files.slice(0, 3)) {
      suggestions.push({
        type: 'file',
        description: `Examine ${file.path} - it appears to be relevant to this issue`,
        location: file.path,
        confidence: file.relevanceScore,
      });
    }

    // Generate suggestions based on symbols
    for (const symbol of codeContext.symbols.slice(0, 3)) {
      suggestions.push({
        type: 'symbol',
        description: `Review ${symbol.type.toLowerCase()} "${symbol.name}" - it might be related to this issue`,
        location: `${symbol.location.file}:${symbol.location.line}`,
        confidence: 0.7,
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  }

  /**
   * Generate summary - simplified, can be enhanced with strategy pattern
   */
  private async generateSummary(issue: GitHubIssue, codeContext: CodeContext): Promise<string> {
    const fileCount = codeContext.files.length;
    const symbolCount = codeContext.symbols.length;
    const apiCount = codeContext.apis.length;

    let summary = `## Issue Analysis: #${issue.number} - "${issue.title}"\n\n`;
    summary += `**Status**: ${issue.state}\n`;
    summary += `**Created**: ${new Date(issue.created_at).toLocaleDateString()}\n\n`;

    summary += `### Code Analysis Results\n`;
    summary += `- **${fileCount}** relevant files found\n`;
    summary += `- **${symbolCount}** related symbols identified\n`;
    summary += `- **${apiCount}** API endpoints detected\n\n`;

    if (fileCount > 0) {
      summary += `### Most Relevant Files\n`;
      codeContext.files.slice(0, 5).forEach((file, index) => {
        summary += `${index + 1}. **${file.path}** (${(file.relevanceScore * 100).toFixed(1)}% relevance)\n`;
      });
    }

    return summary;
  }

  /**
   * Factory method to create analyzer with specific configuration
   */
  static async create(
    workspacePath: string,
    config: {
      strategy?: 'llm' | 'rule-based' | 'hybrid' | 'auto';
      cacheType?: 'memory' | 'file' | 'redis';
      searchType?: 'ripgrep' | 'filesystem' | 'hybrid';
      llmService?: LLMService;
    } = {}
  ): Promise<ContextAnalyzer> {
    const analyzer = new ContextAnalyzer(workspacePath, {
      type: config.strategy || 'auto',
      cacheType: config.cacheType || 'memory',
      searchType: config.searchType || 'hybrid',
      llmService: config.llmService
    });
    
    // Ensure initialization is complete
    await analyzer.ensureInitialized();
    
    return analyzer;
  }

  /**
   * Get analysis strategy information
   */
  getAnalysisInfo(): {
    strategy: string;
    cacheStats?: any;
  } {
    return {
      strategy: this.analysisStrategy?.name || 'not-initialized',
    };
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (this.cacheManager) {
      await this.cacheManager.clear();
    }
    console.log('🧹 All caches cleared');
  }

  // Legacy method for backward compatibility
  async generateSmartKeywords(issue: GitHubIssue) {
    await this.ensureInitialized();
    return await this.analysisStrategy.generateKeywords(issue);
  }
}
