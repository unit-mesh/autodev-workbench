/**
 * Rule-Based Analysis Strategy
 * 
 * Implements analysis using traditional rule-based approaches.
 * Serves as a fallback when LLM services are unavailable.
 */

import { GitHubIssue } from "../../../types/index";
import { 
  IAnalysisStrategy, 
  BaseAnalysisStrategy, 
  SearchKeywords, 
  AnalysisContext, 
  AnalysisResult 
} from "../interfaces/IAnalysisStrategy";
import * as path from 'path';

export class RuleBasedAnalysisStrategy extends BaseAnalysisStrategy {
  readonly name = 'rule-based';

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
}
