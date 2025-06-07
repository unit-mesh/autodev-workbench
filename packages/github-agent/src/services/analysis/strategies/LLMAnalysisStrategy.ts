/**
 * LLM Analysis Strategy
 * 
 * Implements analysis using Large Language Models for intelligent code analysis.
 * Uses the Strategy Pattern to provide LLM-powered analysis capabilities.
 */

import { GitHubIssue } from "../../../types/index";
import { LLMService } from "../../llm-service";
import { 
  IAnalysisStrategy, 
  BaseAnalysisStrategy, 
  SearchKeywords, 
  AnalysisContext, 
  AnalysisResult 
} from "../interfaces/IAnalysisStrategy";
import * as path from 'path';

export class LLMAnalysisStrategy extends BaseAnalysisStrategy {
  readonly name = 'llm';
  
  private llmService: LLMService;
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
    this.batchSize = options.batchSize || 3;
    this.maxFilesToAnalyze = options.maxFilesToAnalyze || 8;
  }

  async generateKeywords(issue: GitHubIssue): Promise<SearchKeywords> {
    try {
      console.log('🧠 Generating keywords using LLM...');
      const llmAnalysis = await this.llmService.analyzeIssueForKeywords(issue);

      return {
        primary: llmAnalysis.primary_keywords,
        secondary: llmAnalysis.component_names,
        technical: llmAnalysis.technical_terms,
        contextual: [
          ...llmAnalysis.error_patterns,
          ...llmAnalysis.file_patterns,
          ...llmAnalysis.search_strategies
        ]
      };
    } catch (error: Error) {
      console.warn(`LLM keyword extraction failed, falling back to rule-based: ${error.message}`);
      return this.fallbackKeywordGeneration(issue);
    }
  }

  async findRelevantFiles(
    context: AnalysisContext,
    keywords: SearchKeywords
  ): Promise<AnalysisResult['files']> {
    console.log('🧠 Using LLM to analyze file relevance...');

    // First, get candidate files using traditional methods
    const candidateFiles = await this.findCandidateFiles(context, keywords);

    // Then use LLM to analyze candidate files in parallel batches
    const llmAnalyzedFiles: AnalysisResult['files'] = [];

    // Analyze top candidate files with LLM (limit to avoid API costs)
    const filesToAnalyze = candidateFiles.slice(0, this.maxFilesToAnalyze);

    // Process files in parallel batches to balance speed and API limits
    for (let i = 0; i < filesToAnalyze.length; i += this.batchSize) {
      const batch = filesToAnalyze.slice(i, i + this.batchSize);

      console.log(`🔍 LLM analyzing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(filesToAnalyze.length / this.batchSize)}: ${batch.map(f => f.path).join(', ')}`);

      const batchPromises = batch.map(async (file) => {
        try {
          const llmAnalysis = await this.llmService.analyzeCodeRelevance(
            context.issue,
            file.path,
            file.content
          );
          return { file, llmAnalysis, error: null };
        } catch (error: Error) {
          console.warn(`⚠️  LLM analysis failed for ${file.path}: ${error.message}`);
          return { file, llmAnalysis: null, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const { file, llmAnalysis, error } of batchResults) {
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
          // Fall back to original scoring for failed files
          llmAnalyzedFiles.push(file);
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
      // Test if LLM service is accessible
      const testIssue: GitHubIssue = {
        id: 0,
        number: 0,
        title: 'test',
        body: 'test',
        state: 'open',
        user: null,
        labels: [],
        assignees: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        html_url: 'test'
      };
      
      await this.llmService.analyzeIssueForKeywords(testIssue);
      return true;
    } catch (error: Error) {
      console.warn('LLM service not available:', error.message);
      return false;
    }
  }

  private async findCandidateFiles(context: AnalysisContext, keywords: SearchKeywords): Promise<Array<{
    path: string;
    content: string;
    relevanceScore: number;
  }>> {
    // This would use the search provider to find candidate files
    // For now, return a simplified implementation
    return [];
  }

  private fallbackKeywordGeneration(issue: GitHubIssue): SearchKeywords {
    const text = `${issue.title} ${issue.body || ''}`;

    return {
      primary: this.extractPrimaryKeywords(text),
      secondary: this.extractSecondaryKeywords(text),
      technical: this.extractTechnicalTerms(text),
      contextual: this.extractContextualKeywords(text)
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
