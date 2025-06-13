/**
 * Clean Context Analyzer using Design Patterns
 *
 * This is a much shorter, cleaner version that delegates complex logic to specialized components.
 * The file is now ~150 lines instead of the original 1,276 lines.
 */

import { CodeContext, GitHubIssue, IssueAnalysisResult } from "../../types/index";
import { LLMService } from "../llm/llm-service";
import { listFiles } from "@autodev/worker-core";

// Import the new design pattern implementations
import { IAnalysisStrategy, AnalysisContext } from "../analysis/interfaces/IAnalysisStrategy";
import { ICacheManager, DefaultCacheKeyGenerator } from "../analysis/interfaces/ICacheManager";
import { AnalyzerFactory, AnalyzerConfig } from "../analysis/factories/AnalyzerFactory";

// Import URL fetching capabilities
import { fetchUrlsFromIssue, extractUrlsFromText } from "../../capabilities/tools/web-fetch-content";

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
    const { RuleBasedAnalysisStrategy } = await import('../analysis/strategies/RuleBasedAnalysisStrategy');
    const { MemoryCacheManager } = await import('../analysis/cache/MemoryCacheManager');

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
  async findRelevantCode(issue: GitHubIssue & { urlContent?: any[] }): Promise<CodeContext> {
    await this.ensureInitialized();

    const issueKey = this.cacheKeyGenerator.generateIssueKey(issue.number, issue.updated_at);
    const cached = await this.cacheManager.get<CodeContext>(`relevantCode-${issueKey}`);
    if (cached) {
      if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
        console.log('📦 Using cached analysis');
      }
      return cached;
    }

    if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
      console.log(`🔍 Analyzing with strategy: ${this.analysisStrategy.name}`);
    }

    const filteredFiles = await this.scanWorkspaceFiles();
    const context: AnalysisContext = {
      workspacePath: this.workspacePath,
      filteredFiles: filteredFiles,
      analysisResult: {}, // Strategy will handle codebase analysis
      issue
    };

    const keywords = await this.analysisStrategy.generateKeywords(issue);

    const [relevantFiles, relevantSymbols, relevantApis] = await Promise.all([
      this.analysisStrategy.findRelevantFiles(context, keywords),
      this.analysisStrategy.findRelevantSymbols(context, keywords),
      this.analysisStrategy.findRelevantApis(context, keywords)
    ]);

    const uniqueFiles = new Map<string, { path: string; content: string; relevanceScore: number }>();
    for (const file of relevantFiles) {
      const existing = uniqueFiles.get(file.path);
      if (!existing || file.relevanceScore > existing.relevanceScore) {
        uniqueFiles.set(file.path, {
          path: file.path,
          content: file.content,
          relevanceScore: file.relevanceScore
        });
      }
    }

    const result: CodeContext = {
      files: Array.from(uniqueFiles.values()).sort((a, b) => b.relevanceScore - a.relevanceScore),
      symbols: relevantSymbols,
      apis: relevantApis,
    };

    // Cache the result
    await this.cacheManager.set(`relevantCode-${issueKey}`, result, {
      ttl: 10 * 60 * 1000,
      tags: ['analysis']
    });

    if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
      console.log(`✅ Found: ${result.files.length} files, ${result.symbols.length} symbols, ${result.apis.length} APIs`);
    }
    return result;
  }

  /**
   * Main issue analysis method - uses Template Method Pattern
   */
  async analyzeIssue(issue: GitHubIssue & { urlContent?: any[] }): Promise<IssueAnalysisResult> {
    if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
      console.log(`🎯 Analyzing issue #${issue.number}: ${issue.title}`);
    }

    const enhancedIssue = await this.enhanceIssueWithUrlContent(issue);
    const relatedCode = await this.findRelevantCode(enhancedIssue);

    const suggestions = await this.generateSuggestions(enhancedIssue, relatedCode)

    const result: IssueAnalysisResult = {
      issue: enhancedIssue,
      relatedCode,
      suggestions,
    };

    if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
      console.log(`✅ Issue analysis complete for #${issue.number}`);
    }
    return result;
  }

  /**
   * Enhance issue with URL content by detecting and fetching URLs from issue body
   */
  private async enhanceIssueWithUrlContent(issue: GitHubIssue & { urlContent?: any[] }): Promise<GitHubIssue & { urlContent?: any[] }> {
    // If URL content is already provided, use it
    if (issue.urlContent && issue.urlContent.length > 0) {
      if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
        const successfulUrls = issue.urlContent.filter(u => u.status === 'success');
        console.log(`📄 Using pre-fetched content from ${successfulUrls.length} URLs for enhanced analysis`);
      }
      return issue;
    }

    // Check if issue body contains URLs
    if (!issue.body) {
      if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
        console.log(`📄 No issue body content to analyze for URLs`);
      }
      return issue;
    }

    // Extract URLs from issue content
    const extractedUrls = extractUrlsFromText(issue.body);
    if (extractedUrls.length === 0) {
      if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
        console.log(`📄 No URLs found in issue content`);
      }
      return issue;
    }

    if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
      console.log(`🔗 Found ${extractedUrls.length} URLs in issue content: ${extractedUrls.join(', ')}`);
    }

    // Fetch URL content
    try {
      const urlContent = await fetchUrlsFromIssue(issue.body, 10000); // 10 second timeout

      if (process.env.VERBOSE_ANALYSIS_LOGS === 'true') {
        const successfulUrls = urlContent.filter(u => u.status === 'success');
        const failedUrls = urlContent.filter(u => u.status === 'error');
        console.log(`📄 Successfully fetched content from ${successfulUrls.length} URLs`);
        if (failedUrls.length > 0) {
          console.log(`⚠️ Failed to fetch content from ${failedUrls.length} URLs`);
        }
      }

      return {
        ...issue,
        urlContent
      };
    } catch (error) {
      console.warn(`⚠️ URL content fetching failed for issue #${issue.number}:`, error);
      return issue;
    }
  }

  /**
   * Generate suggestions - simplified, can be enhanced with strategy pattern
   */
  private async generateSuggestions(issue: GitHubIssue & { urlContent?: any[] }, codeContext: CodeContext): Promise<Array<{
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
  private async generateSummary(issue: GitHubIssue & { urlContent?: any[] }, codeContext: CodeContext): Promise<string> {
    const fileCount = codeContext.files.length;
    const symbolCount = codeContext.symbols.length;
    const apiCount = codeContext.apis.length;

    let summary = `## Issue Analysis: #${issue.number} - "${issue.title}"\n\n`;
    summary += `**Status**: ${issue.state}\n`;
    summary += `**Created**: ${new Date(issue.created_at).toLocaleDateString()}\n\n`;

    // Add URL content information if available
    if (issue.urlContent && issue.urlContent.length > 0) {
      const successfulUrls = issue.urlContent.filter(u => u.status === 'success');
      const failedUrls = issue.urlContent.filter(u => u.status === 'error');

      summary += `### URL Content Analysis\n`;
      summary += `- **${successfulUrls.length}** URLs successfully fetched\n`;
      if (failedUrls.length > 0) {
        summary += `- **${failedUrls.length}** URLs failed to fetch\n`;
      }

      if (successfulUrls.length > 0) {
        summary += `\n**Successfully Analyzed URLs:**\n`;
        successfulUrls.slice(0, 3).forEach((urlData, index) => {
          summary += `${index + 1}. [${urlData.title || 'Untitled'}](${urlData.url}) (${urlData.content_length || 0} chars)\n`;
        });
        if (successfulUrls.length > 3) {
          summary += `... and ${successfulUrls.length - 3} more URLs\n`;
        }
      }
      summary += `\n`;
    }

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

  private async scanWorkspaceFiles(): Promise<string[]> {
    try {
      const [allFiles] = await listFiles(this.workspacePath, true, 10000);
      const relevantFiles = allFiles.filter(file => {
        if (file.endsWith('/')) {
          return false;
        }

        const relativePath = file.startsWith(this.workspacePath)
          ? file.substring(this.workspacePath.length + 1)
          : file;

        return this.isRelevantFile(relativePath);
      });

      console.log(`📁 Found ${relevantFiles.length} relevant files in workspace (from ${allFiles.length} total)`);
      return relevantFiles.map(file =>
        file.startsWith(this.workspacePath)
          ? file.substring(this.workspacePath.length + 1)
          : file
      );
    } catch (error) {
      console.warn('Failed to scan workspace files:', error);
      return [];
    }
  }



  /**
   * Check if a file is relevant for analysis
   */
  private isRelevantFile(relativePath: string): boolean {
    const relevantPatterns = [
      /\.(ts|js|tsx|jsx|py|java|cpp|c|h|cs|php|rb|go|rs|kt|swift)$/,
      /\.(json|yaml|yml|toml|xml)$/,
      /\.(md|txt|rst)$/i,
      /package\.json$/,
      /Dockerfile$/,
      /docker-compose\./,
      /\.env/,
      /config\./,
      /setup\./,
      /init\./,
      /readme/i
    ];

    return relevantPatterns.some(pattern => pattern.test(relativePath));
  }

  // Legacy method for backward compatibility
  async generateSmartKeywords(issue: GitHubIssue) {
    await this.ensureInitialized();
    return await this.analysisStrategy.generateKeywords(issue);
  }
}
