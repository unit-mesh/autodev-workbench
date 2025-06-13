/**
 * LLM Analysis Strategy
 *
 * Implements analysis using Large Language Models for intelligent code analysis.
 * Uses the Strategy Pattern to provide LLM-powered analysis capabilities.
 */

import { GitHubIssue } from "../../../types/index";
import { LLMService } from "../../llm/llm-service";
import {
  BaseAnalysisStrategy,
  SearchKeywords,
  AnalysisContext,
  AnalysisResult
} from "../interfaces/IAnalysisStrategy";
import { FilePriorityManager } from "../priority/FilePriorityManager";
import * as path from 'path';
import { BM25 } from './BM25';

export class LLMAnalysisStrategy extends BaseAnalysisStrategy {
  readonly name = 'llm';

  private llmService: LLMService;
  private priorityManager: FilePriorityManager;
  private batchSize: number;
  private maxFilesToAnalyze: number;

  constructor(
    llmService?: LLMService,
    options: {
      batchSize?: number;
      maxFilesToAnalyze?: number;
    } = {}
  ) {
    super();
    this.llmService = llmService || new LLMService();
    this.priorityManager = new FilePriorityManager();
    this.batchSize = options.batchSize || 3;
    this.maxFilesToAnalyze = options.maxFilesToAnalyze || 8;
  }

  async generateKeywords(issue: GitHubIssue): Promise<SearchKeywords> {
    try {
      console.log('🧠 Generating keywords using LLM...');
      const llmAnalysis = await this.llmService.analyzeIssueForKeywords(issue);

      const keywords = {
        primary: llmAnalysis.primary_keywords,
        secondary: llmAnalysis.secondary_keywords,
        tertiary: llmAnalysis.tertiary_keywords,
      };

      console.log(`✅ LLM keywords generated: ${JSON.stringify(keywords)}`);
      return keywords;
    } catch (error: any) {
      console.warn(`LLM keyword extraction failed, falling back to rule-based: ${error.message}`);
      return this.fallbackKeywordGeneration(issue);
    }
  }

  async findRelevantFiles(
    context: AnalysisContext,
    keywords: SearchKeywords & { priorities?: any[] }
  ): Promise<AnalysisResult['files']> {
    console.log('🧠 Using LLM to analyze file relevance...');
    const candidateFiles = await this.findCandidateFiles(context, keywords);
    const llmAnalyzedFiles: AnalysisResult['files'] = [];
    const filesToAnalyze = candidateFiles.slice(0, this.maxFilesToAnalyze).filter(it => it.relevanceScore > 0.6)
    for (let i = 0; i < filesToAnalyze.length; i += this.batchSize) {
      const batch = filesToAnalyze.slice(i, i + this.batchSize);

      console.log(`🔍 LLM analyzing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(filesToAnalyze.length / this.batchSize)}: ${batch.map(f => f.path).join(', ')}`);

      const batchPromises = batch.map(async (file) => {
        const basicRelevance = this.calculateBasicRelevance(file, keywords, context.issue);
        if (basicRelevance < 0.2) {
          console.log(`⏭️  Skipping file with low basic relevance: ${file.path} (${basicRelevance.toFixed(2)})`);
          return { file, llmAnalysis: null, error: null, skipped: true };
        }

        try {
          const llmAnalysis = await this.llmService.analyzeCodeRelevance(
            context.issue,
            file.path,
            file.content
          );
          return { file, llmAnalysis, error: null, skipped: false };
        } catch (error: any) {
          console.warn(`⚠️  LLM analysis failed for ${file.path}: ${error.message}`);
          return { file, llmAnalysis: null, error, skipped: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const { file, llmAnalysis, skipped } of batchResults) {
        if (skipped) {
          continue;
        }

        if (llmAnalysis && llmAnalysis.is_relevant) {
          llmAnalyzedFiles.push({
            path: file.path,
            content: file.content,
            relevanceScore: llmAnalysis.relevance_score,
            reason: llmAnalysis.reason
          });
          console.log(`✅ ${file.path}: ${(llmAnalysis.relevance_score * 100).toFixed(1)}% relevant - ${llmAnalysis.reason.substring(0, 80)}...`);
        } else if (llmAnalysis) {
          console.log(`❌ ${file.path}: Not relevant - ${llmAnalysis.reason.substring(0, 80)}...`);
        } else {
          if (file.content) {
            llmAnalyzedFiles.push({
              path: file.path,
              content: file.content,
              relevanceScore: file.relevanceScore,
              reason: 'LLM analysis failed, using traditional scoring'
            });
          }
        }
      }
    }

    // If LLM analysis found no relevant files, fall back to traditional method
    if (llmAnalyzedFiles.length === 0) {
      console.log('🔄 No LLM-relevant files found, falling back to traditional analysis');
      return candidateFiles.slice(0, 5);
    }

    // Sort by LLM relevance score and return top files
    return llmAnalyzedFiles
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  async findRelevantSymbols(
    context: AnalysisContext,
    keywords: SearchKeywords
  ): Promise<AnalysisResult['symbols']> {
    const relevantSymbols: AnalysisResult['symbols'] = [];

    if (!context.analysisResult.symbolAnalysis) {
      return relevantSymbols;
    }

    // Use LLM to enhance symbol analysis
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

    // Look for API-related symbols using LLM-enhanced detection
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

  calculateConfidence(result: AnalysisResult): number {
    // LLM-based analysis typically has higher confidence
    const baseConfidence = super.calculateConfidence(result);

    // Boost confidence for LLM analysis if we have reasons
    const hasReasons = result.files.some(f => f.reason);
    const reasonBonus = hasReasons ? 0.2 : 0;

    return Math.min(baseConfidence + reasonBonus, 1);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simply check if LLM service is available without making actual calls
      return this.llmService.isAvailable();
    } catch (error: any) {
      console.warn('LLM service not available:', error.message);
      return false;
    }
  }

  private async findCandidateFiles(context: AnalysisContext, keywords: SearchKeywords): Promise<Array<{
    path: string;
    content: string;
    relevanceScore: number;
  }>> {
    console.log('🔍 Finding candidate files for LLM analysis...');

    const fileScores = new Map<string, number>();

    // First pass: Score files based on file paths only (no I/O)
    for (const file of context.filteredFiles) {
      const score = this.calculateFilePathScore(file, keywords);
      if (score > 0.2) { // Lower threshold to include more documentation files
        fileScores.set(file, score);
      }
    }

    // Sort by path score and only load content for top candidates
    const topCandidates = Array.from(fileScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, this.maxFilesToAnalyze * 2) // Only load 2x the files we'll actually analyze
      .map(([file]) => file);

    console.log(`📁 Loading content for top ${topCandidates.length} candidates (filtered from ${context.filteredFiles.length} files)...`);

    // Second pass: Load content only for promising candidates
    const candidates: Array<{
      path: string;
      content: string;
      relevanceScore: number;
    }> = [];

    for (const file of topCandidates) {
      try {
        const content = await this.loadFileContent(path.join(context.workspacePath, file));
        if (content) {
          // Calculate final score combining path and content
          const pathScore = fileScores.get(file) || 0;
          const contentScore = this.calculateContentScore(content, keywords);
          const finalScore = pathScore + contentScore;

          if (finalScore > 0.3) { // Lower threshold to include more documentation files
            candidates.push({
              path: file,
              content: content.substring(0, 4000), // Limit content size for LLM analysis
              relevanceScore: Math.min(finalScore / 10, 1), // Normalize score
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    // Sort by final relevance score
    const sortedCandidates = candidates
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    console.log(`✅ Found ${sortedCandidates.length} candidate files for LLM analysis (loaded content for ${topCandidates.length} files)`);
    return sortedCandidates;
  }

  /**
   * Apply advanced priority-based filtering using BM25 for content scoring
   * Ensures we always return some files, even if none pass strict filtering
   */
  private applyAdvancedPriorityFiltering(
    candidateFiles: Array<{ path: string; relevanceScore: number; content?: string }>,
    issue: GitHubIssue,
    keywords: SearchKeywords
  ): Array<{ path: string; content?: string; relevanceScore: number }> {
    console.log('🎯 Applying BM25-based content scoring...');

    if (candidateFiles.length === 0) {
      console.log('⚠️ No candidate files to filter');
      return [];
    }

    const bm25 = new BM25();
    const processedFiles = new Map<string, { path: string; content?: string; relevanceScore: number }>();
    const chunkSize = 100; // Number of lines per chunk

    // Process each file
    for (const file of candidateFiles) {
      if (!file.content) continue;

      // Split content into chunks
      const lines = file.content.split('\n');
      const chunks: string[] = [];

      for (let i = 0; i < lines.length; i += chunkSize) {
        chunks.push(lines.slice(i, i + chunkSize).join('\n'));
      }

      // Add chunks to BM25 index
      chunks.forEach((chunk, index) => {
        bm25.addDocument(`${file.path}:${index}`, chunk);
      });

      // Calculate scores for each keyword type
      const primaryQuery = keywords.primary.join(' ');
      const secondaryQuery = keywords.secondary.join(' ');
      const tertiaryQuery = keywords.tertiary.join(' ');

      // Score chunks with different weights
      const chunkScores = chunks.map((_, index) => {
        const chunkId = `${file.path}:${index}`;
        const primaryScore = bm25.score(chunkId, primaryQuery) * 1.0;
        const secondaryScore = bm25.score(chunkId, secondaryQuery) * 0.7;
        const tertiaryScore = bm25.score(chunkId, tertiaryQuery) * 0.5;
        return primaryScore + secondaryScore + tertiaryScore;
      });

      // Get top 10 chunks
      const topChunks = chunkScores
        .map((score, index) => ({ score, index }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // If we have relevant chunks, add the file with its content
      if (topChunks.length > 0 && topChunks[0].score > 0) {
        const relevantContent = topChunks
          .map(({ index }) => chunks[index])
          .join('\n\n');

        processedFiles.set(file.path, {
          path: file.path,
          content: relevantContent,
          relevanceScore: topChunks[0].score
        });
      } else {
        // If no relevant chunks found, just add the path
        processedFiles.set(file.path, {
          path: file.path,
          relevanceScore: 0
        });
      }
    }

    // Convert to array and sort by relevance score
    const results = Array.from(processedFiles.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    console.log(`✅ BM25 scoring complete: ${results.length} files processed`);
    return results;
  }

  /**
   * Calculate basic relevance score to avoid unnecessary LLM calls
   */
  private calculateBasicRelevance(
    file: { path: string; content?: string; relevanceScore?: number },
    keywords: SearchKeywords & { priorities?: any[] },
    issue: GitHubIssue
  ): number {
    let score = 0;

    // Use existing relevance score as base
    if (file.relevanceScore) {
      score += file.relevanceScore * 0.5;
    }

    // Check file path relevance
    const pathScore = this.calculateFilePathScore(file.path, keywords);
    score += pathScore * 0.1;

    // Check content relevance if available
    if (file.content) {
      const contentScore = this.calculateContentScore(file.content, keywords);
      score += contentScore * 0.3;

      // Quick check for issue-specific terms
      const issueText = `${issue.title} ${issue.body || ''}`.toLowerCase();
      const content = file.content.toLowerCase();

      // Look for exact matches of key terms from the issue
      const keyTerms = this.extractKeyTermsFromIssue(issueText);
      for (const term of keyTerms) {
        if (content.includes(term)) {
          score += 0.2;
        }
      }
    }

    // Boost score for high-priority file patterns
    const highPriorityPatterns = [
      /auth/i, /prisma/i, /database/i, /config/i, /api/i, /server/i, /client/i,
      /error/i, /exception/i, /handler/i, /middleware/i, /service/i
    ];

    for (const pattern of highPriorityPatterns) {
      if (pattern.test(file.path)) {
        score += 0.1;
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Extract key terms from issue text for quick relevance checking
   */
  private extractKeyTermsFromIssue(issueText: string): string[] {
    const terms: string[] = [];

    // Extract quoted strings
    const quotedMatches = issueText.match(/"[^"]+"|'[^']+'/g) || [];
    terms.push(...quotedMatches.map(m => m.replace(/['"]/g, '').toLowerCase()));

    // Extract error patterns
    const errorMatches = issueText.match(/error[:\s]+[^\n.!?]+/gi) || [];
    terms.push(...errorMatches.map(m => m.toLowerCase()));

    // Extract technical terms (camelCase, PascalCase, snake_case)
    const techMatches = issueText.match(/\b[a-zA-Z][a-zA-Z0-9_]*[A-Z][a-zA-Z0-9_]*\b/g) || [];
    terms.push(...techMatches.map(m => m.toLowerCase()));

    return [...new Set(terms)].filter(term => term.length > 3);
  }

  private fallbackKeywordGeneration(issue: GitHubIssue): SearchKeywords {
    const text = `${issue.title} ${issue.body || ''}`;

    return {
      primary: this.extractPrimaryKeywords(text),
      secondary: this.extractSecondaryKeywords(text),
      tertiary: this.extractContextualKeywords(text)
    };
  }

  private extractSecondaryKeywords(text: string): string[] {
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

  private calculateFilePathScore(filePath: string, keywords: SearchKeywords & { priorities?: any[] }): number {
    let score = 0;
    const fileName = path.basename(filePath).toLowerCase();
    const dirName = path.dirname(filePath).toLowerCase();
    const fullPath = filePath.toLowerCase();

    // LLM-generated priorities get highest weight (if available)
    if (keywords.priorities && Array.isArray(keywords.priorities)) {
      for (const priority of keywords.priorities) {
        const pattern = priority.pattern.toLowerCase();
        const priorityScore = priority.score || 1;

        // Check if file matches the priority pattern
        if (fileName.includes(pattern) || dirName.includes(pattern) || fullPath.includes(pattern)) {
          // Scale the LLM priority score to our scoring system
          score += Math.min(priorityScore * 0.5, 5); // Cap at 5 points for LLM priorities
        }
      }
    }

    // Primary keywords get highest weight
    for (const keyword of keywords.primary) {
      const keywordLower = keyword.toLowerCase();
      if (fileName.includes(keywordLower)) {
        score += 3; // Highest score for primary keywords in filename
      } else if (dirName.includes(keywordLower)) {
        score += 1.5; // Medium score for primary keywords in directory
      }
    }

    // Secondary keywords get medium weight
    for (const keyword of keywords.secondary) {
      const keywordLower = keyword.toLowerCase();
      if (fileName.includes(keywordLower)) {
        score += 2;
      } else if (dirName.includes(keywordLower)) {
        score += 1;
      }
    }

    // Technical terms get lower weight but still important
    for (const keyword of keywords.tertiary) {
      const keywordLower = keyword.toLowerCase();
      if (fullPath.includes(keywordLower)) {
        score += 1;
      }
    }

    // Bonus for important file types and patterns
    const codeFilePatterns = [
      /\.(ts|js|tsx|jsx|py|java|cpp|c|h|cs|php|rb|go|rs|kt|swift)$/,
      /\.(json|yaml|yml|toml|xml|config)$/,
      /\.(md|txt|rst)$/i
    ];

    const importantFilePatterns = [
      /index\./,
      /main\./,
      /app\./,
      /server\./,
      /client\./,
      /api\./,
      /package\.json$/,
      /readme\.md$/i,
      /config\./,
      /setup\./,
      /init\./
    ];

    const importantDirPatterns = [
      /\/(src|lib|core|api|routes|controllers|services|components|utils|helpers|models|types|interfaces)\//,
      /\/(test|tests|spec|specs)\//,
      /\/(config|configs|settings)\//,
      /\/(docs|documentation|doc)\//
    ];

    if (codeFilePatterns.some(pattern => pattern.test(filePath))) {
      score += 1;
    }

    if (importantFilePatterns.some(pattern => pattern.test(filePath))) {
      score += 1.5;
    }

    if (importantDirPatterns.some(pattern => pattern.test(filePath))) {
      score += 0.8;
    }

    // Penalty for less relevant files
    const excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.next/,
      /\.nuxt/,
      /vendor/,
      /target/,
      /bin/,
      /obj/,
      /\.vscode/,
      /\.idea/,
      /\.(log|tmp|cache|lock)$/,
      /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/
    ];

    if (excludePatterns.some(pattern => pattern.test(filePath))) {
      score *= 0.1; // Heavy penalty for excluded patterns
    }

    return score;
  }

  private calculateContentScore(content: string, keywords: SearchKeywords): number {
    const allKeywords = [
      ...keywords.primary,
      ...keywords.secondary,
      ...keywords.tertiary
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
}
