/**
 * Rule-Based Analysis Strategy
 *
 * Implements analysis using traditional rule-based approaches.
 * Serves as a fallback when LLM services are unavailable.
 * Now integrates with SymbolAnalyser for intelligent symbol analysis.
 */

import { GitHubIssue } from "../../../types/index";
import {
  BaseAnalysisStrategy,
  SearchKeywords,
  AnalysisContext,
  AnalysisResult
} from "../interfaces/IAnalysisStrategy";
import * as path from 'path';

// Import SymbolAnalyser and related types from context-worker
import { SymbolAnalyser } from "@autodev/context-worker/src/analyzer/analyzers/SymbolAnalyser";
import { SymbolAnalysisResult, SymbolInfo } from "@autodev/context-worker/src/analyzer/CodeAnalysisResult";
import { CodeCollector } from "@autodev/context-worker/src/analyzer/CodeCollector";
import { ILanguageServiceProvider, LanguageServiceProvider } from "@autodev/context-worker/src/base/common/languages/languageService";

export class RuleBasedAnalysisStrategy extends BaseAnalysisStrategy {
  readonly name = 'rule-based';
  private symbolAnalyser: SymbolAnalyser | null = null;
  private languageService: ILanguageServiceProvider | null = null;

  constructor() {
    super();
    this.initializeSymbolAnalyser();
  }

  /**
   * Initialize SymbolAnalyser for intelligent symbol analysis
   */
  private async initializeSymbolAnalyser(): Promise<void> {
    try {
      this.languageService = new LanguageServiceProvider();
      this.symbolAnalyser = new SymbolAnalyser(this.languageService);
      console.log('🔧 SymbolAnalyser initialized for RuleBasedAnalysisStrategy');
    } catch (error) {
      console.warn('Failed to initialize SymbolAnalyser:', error);
      this.symbolAnalyser = null;
    }
  }

  async generateKeywords(issue: GitHubIssue): Promise<SearchKeywords> {
    console.log('📋 Generating keywords using rule-based analysis...');
    
    const text = `${issue.title} ${issue.body || ''}`;

    return {
      primary: this.extractPrimaryKeywords(text),
      secondary: this.extractSecondaryKeywords(text),
      technical: this.extractTechnicalTerms(text),
      contextual: this.extractContextualKeywords(text)
    };
  }

  async findRelevantFiles(
    context: AnalysisContext,
    keywords: SearchKeywords
  ): Promise<AnalysisResult['files']> {
    console.log('📋 Finding relevant files using rule-based analysis...');

    const fileScores = new Map<string, number>();
    const fileContents = new Map<string, string>();

    // Score files based on keyword matches in file paths
    for (const file of context.filteredFiles) {
      const score = this.calculateFilePathScore(file, keywords);
      if (score > 0) {
        fileScores.set(file, score);
      }
    }

    // Load content for top scoring files and calculate content scores
    const topFiles = Array.from(fileScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20) // Limit to top 20 files to avoid loading too many
      .map(([file]) => file);

    for (const file of topFiles) {
      try {
        const content = await this.loadFileContent(path.join(context.workspacePath, file));
        if (content) {
          fileContents.set(file, content);
          
          // Update score based on content
          const contentScore = this.calculateContentScore(content, keywords);
          const currentScore = fileScores.get(file) || 0;
          fileScores.set(file, currentScore + contentScore);
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    // Convert to result format
    const results: AnalysisResult['files'] = [];

    for (const [filePath, score] of fileScores.entries()) {
      const content = fileContents.get(filePath);
      if (content && score > 0.1) { // Minimum threshold
        results.push({
          path: filePath,
          content: content.substring(0, 2000), // Limit content size
          relevanceScore: Math.min(score / 10, 1), // Normalize score
        });
      }
    }

    // Sort by relevance score and return top files
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 15);
  }

  async findRelevantSymbols(
    context: AnalysisContext,
    keywords: SearchKeywords
  ): Promise<AnalysisResult['symbols']> {
    console.log('🔍 Finding relevant symbols using SymbolAnalyser...');

    const relevantSymbols: AnalysisResult['symbols'] = [];

    // Ensure SymbolAnalyser is initialized
    if (!this.symbolAnalyser) {
      await this.initializeSymbolAnalyser();
    }

    if (!this.symbolAnalyser) {
      console.warn('SymbolAnalyser not available, falling back to context analysis');
      return this.findRelevantSymbolsFallback(context, keywords);
    }

    try {
      // Create CodeCollector with workspace path
      const codeCollector = new CodeCollector(context.workspacePath);

      // Add relevant files to the collector (limit to avoid performance issues)
      const filesToAnalyze = context.filteredFiles
        .filter(file => this.isCodeFile(file))
        .slice(0, 50) // Limit to top 50 files for performance
        .map(file => {
          const fullPath = path.join(context.workspacePath, file);
          const language = codeCollector.inferLanguage(file) || 'unknown';
          return {
            file: fullPath,
            content: '', // Content will be loaded by SymbolAnalyser
            language: language
          };
        });

      codeCollector.setAllFiles(filesToAnalyze);

      // Perform symbol analysis
      const symbolAnalysisResult: SymbolAnalysisResult = await this.symbolAnalyser.analyze(codeCollector);

      console.log(`📊 Analyzed ${symbolAnalysisResult.symbols.length} symbols from ${filesToAnalyze.length} files`);

      // Find symbols that match keywords
      for (const symbol of symbolAnalysisResult.symbols) {
        const relevanceScore = this.calculateSymbolRelevanceWithKeywords(symbol, keywords);

        if (relevanceScore > 0.3) { // Lower threshold for better recall
          relevantSymbols.push({
            name: symbol.name,
            type: this.getSymbolKindName(symbol.kind),
            location: {
              file: path.relative(context.workspacePath, symbol.filePath),
              line: symbol.position.start.row,
              column: symbol.position.start.column,
            },
            description: symbol.comment || symbol.qualifiedName,
          });
        }
      }

      // Sort by relevance and return top results
      return relevantSymbols
        .sort((a, b) => {
          // Re-calculate scores for sorting
          const scoreA = this.calculateSymbolRelevanceWithKeywords(
            symbolAnalysisResult.symbols.find(s => s.name === a.name) || {} as SymbolInfo,
            keywords
          );
          const scoreB = this.calculateSymbolRelevanceWithKeywords(
            symbolAnalysisResult.symbols.find(s => s.name === b.name) || {} as SymbolInfo,
            keywords
          );
          return scoreB - scoreA;
        })
        .slice(0, 15); // Return top 15 symbols

    } catch (error) {
      console.error('Error in symbol analysis:', error);
      return this.findRelevantSymbolsFallback(context, keywords);
    }
  }

  /**
   * Fallback method when SymbolAnalyser is not available
   */
  private findRelevantSymbolsFallback(
    context: AnalysisContext,
    keywords: SearchKeywords
  ): AnalysisResult['symbols'] {
    const relevantSymbols: AnalysisResult['symbols'] = [];

    if (!context.analysisResult.symbolAnalysis) {
      return relevantSymbols;
    }

    for (const symbol of context.analysisResult.symbolAnalysis.symbols) {
      const relevanceScore = this.calculateSymbolRelevance(symbol, keywords);

      if (relevanceScore > 0.5) {
        relevantSymbols.push({
          name: symbol.name,
          type: this.getSymbolKindName(symbol.kind),
          location: {
            file: path.relative(context.workspacePath, symbol.filePath),
            line: symbol.position.start.row,
            column: symbol.position.start.column,
          },
          description: symbol.comment || symbol.qualifiedName,
        });
      }
    }

    return relevantSymbols.slice(0, 10);
  }

  async findRelevantApis(
    context: AnalysisContext,
    keywords: SearchKeywords
  ): Promise<AnalysisResult['apis']> {
    const relevantApis: AnalysisResult['apis'] = [];

    if (!context.analysisResult.symbolAnalysis) {
      return relevantApis;
    }

    // Look for API-related symbols
    for (const symbol of context.analysisResult.symbolAnalysis.symbols) {
      const symbolText = `${symbol.name} ${symbol.qualifiedName} ${symbol.comment || ''}`.toLowerCase();

      // Check if this looks like an API endpoint
      const isApiRelated = [
        'controller', 'route', 'endpoint', 'api', 'handler', 'service',
        'get', 'post', 'put', 'delete', 'patch', 'head', 'options'
      ].some(term => symbolText.includes(term));

      if (isApiRelated) {
        const relevanceScore = this.calculateSymbolRelevance(symbol, keywords);

        if (relevanceScore > 0.3) {
          relevantApis.push({
            path: path.relative(context.workspacePath, symbol.filePath),
            method: this.extractHttpMethod(symbol) || 'UNKNOWN',
            description: symbol.comment || symbol.qualifiedName,
          });
        }
      }
    }

    return relevantApis.slice(0, 8);
  }

  private extractSecondaryKeywords(text: string): string[] {
    // Extract method names, class names, variable names (camelCase, snake_case)
    const patterns = [
      /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/g, // camelCase
      /\b[a-z]+_[a-z_]+\b/g, // snake_case
      /\b[A-Z][a-zA-Z0-9]*\b/g, // PascalCase
    ];

    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found);
    });

    return [...new Set(matches)].slice(0, 15);
  }

  private extractContextualKeywords(text: string): string[] {
    // Extract error messages, log patterns, specific values
    const patterns = [
      /"[^"]+"/g, // quoted strings
      /'[^']+'/g, // single quoted strings
      /`[^`]+`/g, // backtick strings
      /\b\d+\.\d+\.\d+\b/g, // version numbers
      /\b[A-Z_]{3,}\b/g, // constants
      /\berror\s*:\s*[^\n]+/gi, // error messages
      /\bfailed\s*:\s*[^\n]+/gi, // failure messages
    ];

    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found.map(m => m.replace(/['"` ]/g, '')));
    });

    return [...new Set(matches.filter(m => m.length > 2))].slice(0, 10);
  }

  private calculateFilePathScore(filePath: string, keywords: SearchKeywords): number {
    const allKeywords = [
      ...keywords.primary,
      ...keywords.secondary,
      ...keywords.technical,
      ...keywords.contextual
    ];

    let score = 0;
    const fileName = path.basename(filePath).toLowerCase();
    const dirName = path.dirname(filePath).toLowerCase();

    // Check if filename or directory contains any keywords
    for (const keyword of allKeywords) {
      const keywordLower = keyword.toLowerCase();
      if (fileName.includes(keywordLower)) {
        score += 2; // Higher score for filename matches
      }
      if (dirName.includes(keywordLower)) {
        score += 1; // Lower score for directory matches
      }
    }

    // Bonus for important file patterns
    const importantPatterns = [
      /\.(ts|js|tsx|jsx)$/,
      /package\.json$/,
      /readme\.md$/i,
      /index\./,
      /main\./,
      /app\./,
      /server\./,
      /client\./,
      /api\./,
      /route/,
      /controller/,
      /service/,
      /component/,
      /util/,
      /helper/,
      /lib/,
      /core/
    ];

    if (importantPatterns.some(pattern => pattern.test(filePath))) {
      score += 0.5;
    }

    return score;
  }

  private calculateContentScore(content: string, keywords: SearchKeywords): number {
    const allKeywords = [
      ...keywords.primary,
      ...keywords.secondary,
      ...keywords.technical,
      ...keywords.contextual
    ];

    let score = 0;
    const contentLower = content.toLowerCase();

    for (const keyword of allKeywords) {
      const keywordLower = keyword.toLowerCase();
      const matches = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
      
      // Score based on frequency, but with diminishing returns
      score += Math.min(matches * 0.1, 2);
    }

    // Normalize by content length to avoid bias towards longer files
    return score / Math.max(content.length / 1000, 1);
  }

  private async loadFileContent(filePath: string): Promise<string | null> {
    try {
      const fs = await import('fs');
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  private getSymbolKindName(kind: number): string {
    const kindMap: Record<number, string> = {
      1: 'File', 2: 'Module', 3: 'Namespace', 4: 'Package', 5: 'Class',
      6: 'Method', 7: 'Property', 8: 'Field', 9: 'Constructor', 10: 'Enum',
      11: 'Interface', 12: 'Function', 13: 'Variable', 14: 'Constant',
      15: 'String', 16: 'Number', 17: 'Boolean', 18: 'Array', 19: 'Object',
      20: 'Key', 21: 'Null', 22: 'EnumMember', 23: 'Struct', 24: 'Event',
      25: 'Operator', 26: 'TypeParameter',
    };

    return kindMap[kind] || 'Unknown';
  }

  private extractHttpMethod(symbol: any): string | null {
    const text = `${symbol.name} ${symbol.qualifiedName}`.toLowerCase();
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

    for (const method of methods) {
      if (text.includes(method)) {
        return method.toUpperCase();
      }
    }

    return null;
  }

  /**
   * Enhanced symbol relevance calculation with keyword matching
   */
  private calculateSymbolRelevanceWithKeywords(symbol: SymbolInfo, keywords: SearchKeywords): number {
    const allKeywords = [
      ...keywords.primary.map(k => ({ keyword: k, weight: 3.0 })),
      ...keywords.secondary.map(k => ({ keyword: k, weight: 2.0 })),
      ...keywords.technical.map(k => ({ keyword: k, weight: 2.5 })),
      ...keywords.contextual.map(k => ({ keyword: k, weight: 1.5 }))
    ];

    let score = 0;
    const symbolName = symbol.name.toLowerCase();
    const qualifiedName = symbol.qualifiedName.toLowerCase();
    const comment = (symbol.comment || '').toLowerCase();
    const filePath = symbol.filePath.toLowerCase();

    for (const { keyword, weight } of allKeywords) {
      const keywordLower = keyword.toLowerCase();

      // Exact name match (highest score)
      if (symbolName === keywordLower) {
        score += weight * 4;
        continue;
      }

      // Name contains keyword
      if (symbolName.includes(keywordLower)) {
        score += weight * 2;
      }

      // Qualified name contains keyword
      if (qualifiedName.includes(keywordLower)) {
        score += weight * 1.5;
      }

      // Comment contains keyword
      if (comment.includes(keywordLower)) {
        score += weight * 1;
      }

      // File path contains keyword
      if (filePath.includes(keywordLower)) {
        score += weight * 0.5;
      }

      // Fuzzy matching for camelCase/snake_case
      if (this.fuzzyMatch(symbolName, keywordLower)) {
        score += weight * 1.5;
      }
    }

    // Bonus for important symbol types
    const symbolKind = symbol.kind;
    if (symbolKind === 5 || symbolKind === 11) { // Class or Interface
      score *= 1.2;
    } else if (symbolKind === 6 || symbolKind === 12) { // Method or Function
      score *= 1.1;
    }

    return score;
  }

  /**
   * Fuzzy matching for camelCase and snake_case patterns
   */
  private fuzzyMatch(symbolName: string, keyword: string): boolean {
    // Convert camelCase to words
    const symbolWords = symbolName
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .filter(w => w.length > 0);

    const keywordWords = keyword
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .filter(w => w.length > 0);

    // Check if any keyword word matches any symbol word
    return keywordWords.some(kw =>
      symbolWords.some(sw => sw.includes(kw) || kw.includes(sw))
    );
  }

  /**
   * Check if a file is a code file that should be analyzed for symbols
   */
  private isCodeFile(filePath: string): boolean {
    const codeExtensions = [
      '.ts', '.js', '.tsx', '.jsx',
      '.py', '.java', '.cpp', '.c', '.h',
      '.cs', '.php', '.rb', '.go', '.rs',
      '.kt', '.swift', '.scala', '.clj'
    ];

    return codeExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }
}
