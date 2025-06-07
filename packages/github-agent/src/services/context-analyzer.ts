import * as fs from 'fs';
import * as path from 'path';
import { CodeContext, GitHubIssue, IssueAnalysisResult } from "../types/index";

// Import context-worker types and functions
// Note: We'll need to import the actual context-worker functionality
// For now, we'll create a simplified interface

interface ContextWorkerResult {
  interfaceAnalysis?: any;
  extensionAnalysis?: any;
  markdownAnalysis?: any;
  symbolAnalysis?: any;
}

export class ContextAnalyzer {
  private workspacePath: string;

  constructor(workspacePath: string = process.cwd()) {
    this.workspacePath = workspacePath;
  }

  async analyzeCodebase(): Promise<ContextWorkerResult> {
    // This is a simplified implementation
    // In a real implementation, we would use the context-worker package
    try {
      // For now, we'll create a mock analysis
      // TODO: Integrate with actual context-worker
      return {
        interfaceAnalysis: {
          files: [],
          symbols: [],
          apis: []
        },
        symbolAnalysis: {
          symbols: []
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to analyze codebase: ${error.message}`);
    }
  }

  async findRelevantCode(issue: GitHubIssue): Promise<CodeContext> {
    const analysisResult = await this.analyzeCodebase();
    
    // Extract keywords from issue title and body
    const keywords = this.extractKeywords(issue.title, issue.body);
    
    // Find relevant files based on keywords
    const relevantFiles = await this.findRelevantFiles(keywords);
    
    // Find relevant symbols
    const relevantSymbols = this.findRelevantSymbols(keywords, analysisResult);
    
    // Find relevant APIs
    const relevantApis = this.findRelevantApis(keywords, analysisResult);

    return {
      files: relevantFiles,
      symbols: relevantSymbols,
      apis: relevantApis,
    };
  }

  async analyzeIssue(issue: GitHubIssue): Promise<IssueAnalysisResult> {
    const relatedCode = await this.findRelevantCode(issue);
    
    const suggestions = this.generateSuggestions(issue, relatedCode);
    const summary = this.generateSummary(issue, relatedCode);

    return {
      issue,
      relatedCode,
      suggestions,
      summary,
    };
  }

  private extractKeywords(title: string, body: string | null): string[] {
    const text = `${title} ${body || ''}`.toLowerCase();
    
    // Simple keyword extraction - in a real implementation, this could be more sophisticated
    const words = text.match(/\b\w{3,}\b/g) || [];
    
    // Filter out common words and return unique keywords
    const commonWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'way', 'she', 'use', 'her', 'now', 'oil', 'sit', 'set']);
    
    return [...new Set(words.filter(word => !commonWords.has(word)))];
  }

  private async findRelevantFiles(keywords: string[]): Promise<Array<{
    path: string;
    content: string;
    relevanceScore: number;
  }>> {
    const files: Array<{ path: string; content: string; relevanceScore: number; }> = [];
    
    try {
      const allFiles = await this.getAllFiles(this.workspacePath);
      
      for (const filePath of allFiles) {
        if (this.shouldSkipFile(filePath)) continue;
        
        try {
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const relevanceScore = this.calculateRelevanceScore(content, keywords);
          
          if (relevanceScore > 0.1) { // Only include files with some relevance
            files.push({
              path: path.relative(this.workspacePath, filePath),
              content: content.substring(0, 2000), // Limit content size
              relevanceScore,
            });
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
      
      // Sort by relevance score and return top 10
      return files.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
    } catch (error) {
      return [];
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.shouldSkipDirectory(entry.name)) {
            files.push(...await this.getAllFiles(fullPath));
          }
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return files;
  }

  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.nyc_output']);
    return skipDirs.has(name) || name.startsWith('.');
  }

  private shouldSkipFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const allowedExts = new Set(['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.md']);
    return !allowedExts.has(ext);
  }

  private calculateRelevanceScore(content: string, keywords: string[]): number {
    const contentLower = content.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      score += matches * (1 / content.length) * 1000; // Normalize by content length
    }
    
    return Math.min(score, 1); // Cap at 1
  }

  private findRelevantSymbols(keywords: string[], analysisResult: ContextWorkerResult): Array<{
    name: string;
    type: string;
    location: { file: string; line: number; column: number; };
    description?: string;
  }> {
    // This would use the actual symbol analysis from context-worker
    // For now, return empty array
    return [];
  }

  private findRelevantApis(keywords: string[], analysisResult: ContextWorkerResult): Array<{
    path: string;
    method: string;
    description?: string;
  }> {
    // This would use the actual API analysis from context-worker
    // For now, return empty array
    return [];
  }

  private generateSuggestions(issue: GitHubIssue, codeContext: CodeContext): Array<{
    type: 'file' | 'function' | 'api' | 'symbol';
    description: string;
    location?: string;
    confidence: number;
  }> {
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
        description: `Check ${file.path} - it appears to be relevant to this issue`,
        location: file.path,
        confidence: file.relevanceScore,
      });
    }

    // Generate suggestions based on symbols
    for (const symbol of codeContext.symbols.slice(0, 3)) {
      suggestions.push({
        type: 'symbol',
        description: `Review ${symbol.type} "${symbol.name}" - it might be related to this issue`,
        location: `${symbol.location.file}:${symbol.location.line}`,
        confidence: 0.7,
      });
    }

    return suggestions;
  }

  private generateSummary(issue: GitHubIssue, codeContext: CodeContext): string {
    const fileCount = codeContext.files.length;
    const symbolCount = codeContext.symbols.length;
    const apiCount = codeContext.apis.length;

    return `Issue #${issue.number}: "${issue.title}"\n\n` +
           `Found ${fileCount} relevant files, ${symbolCount} symbols, and ${apiCount} APIs that might be related to this issue.\n\n` +
           `The issue appears to be ${issue.state} and was created on ${new Date(issue.created_at).toLocaleDateString()}.\n\n` +
           `Based on the analysis, the most relevant files are:\n` +
           codeContext.files.slice(0, 3).map(f => `- ${f.path} (relevance: ${(f.relevanceScore * 100).toFixed(1)}%)`).join('\n');
  }
}
