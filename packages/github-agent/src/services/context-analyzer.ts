import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { CodeContext, GitHubIssue, IssueAnalysisResult } from "../types/index";
import { LLMService } from "./llm-service";

// Import context-worker functionality
// We'll use the actual context-worker package for analysis
interface ContextWorkerResult {
  interfaceAnalysis?: {
    interfaces: any[];
    multiImplementers: any[];
    stats: any;
  };
  extensionAnalysis?: {
    extensions: any[];
    multiExtensions: any[];
    hierarchy: any;
    stats: any;
  };
  markdownAnalysis?: {
    codeBlocks: any[];
    totalCount: number;
  };
  symbolAnalysis?: {
    symbols: Array<{
      name: string;
      qualifiedName: string;
      kind: number;
      filePath: string;
      comment: string;
      position: {
        start: { row: number, column: number };
        end: { row: number, column: number };
      };
    }>;
    fileSymbols: Record<string, any>;
    stats: any;
  };
}

interface RipgrepResult {
  type: 'match' | 'context';
  data: {
    path?: {
      text: string;
    };
    lines?: {
      text: string;
    };
    line_number?: number;
    absolute_offset?: number;
    submatches?: Array<{
      match: { text: string };
      start: number;
      end: number;
    }>;
  };
}

interface SearchKeywords {
  primary: string[];
  secondary: string[];
  technical: string[];
  contextual: string[];
}

export class ContextAnalyzer {
  private workspacePath: string;
  private llmService: LLMService;

  constructor(workspacePath: string = process.cwd()) {
    this.workspacePath = workspacePath;
    this.llmService = new LLMService();
  }

  async analyzeCodebase(): Promise<ContextWorkerResult> {
    try {
      // Use context-worker to analyze the codebase
      const result = await this.runContextWorker();
      return result;
    } catch (error: any) {
      console.warn(`Failed to run context-worker: ${error.message}`);
      // Fallback to basic analysis
      return {
        symbolAnalysis: {
          symbols: [],
          fileSymbols: {},
          stats: {
            totalSymbols: 0,
            classesByFile: [],
            methodsByFile: [],
            symbolsByKind: []
          }
        }
      };
    }
  }

  private async runContextWorker(): Promise<ContextWorkerResult> {
    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['@autodev/context-worker', '--path', this.workspacePath, '--non-interactive'], {
        cwd: this.workspacePath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            // Try to read the generated analysis files
            const result = this.readAnalysisResults();
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to read analysis results: ${error}`));
          }
        } else {
          reject(new Error(`Context worker failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private readAnalysisResults(): ContextWorkerResult {
    const result: ContextWorkerResult = {};

    try {
      // Read interface analysis
      const interfaceFile = path.join(this.workspacePath, 'interface_analysis_result.json');
      if (fs.existsSync(interfaceFile)) {
        const interfaceData = JSON.parse(fs.readFileSync(interfaceFile, 'utf-8'));
        result.interfaceAnalysis = interfaceData.interfaceAnalysis;
        result.extensionAnalysis = interfaceData.extensionAnalysis;
        result.markdownAnalysis = interfaceData.markdownAnalysis;
      }

      // Read symbol analysis
      const symbolFile = path.join(this.workspacePath, 'symbol_analysis_result.json');
      if (fs.existsSync(symbolFile)) {
        const symbolData = JSON.parse(fs.readFileSync(symbolFile, 'utf-8'));
        result.symbolAnalysis = symbolData;
      }
    } catch (error) {
      console.warn(`Failed to read analysis files: ${error}`);
    }

    return result;
  }

  async findRelevantCode(issue: GitHubIssue): Promise<CodeContext> {
    const analysisResult = await this.analyzeCodebase();

    // Generate intelligent keywords using LLM-like analysis
    const keywords = await this.generateSmartKeywords(issue);

    // Use ripgrep for fast text search
    const ripgrepResults = await this.searchWithRipgrep(keywords);

    // Find relevant files based on multiple search strategies
    const relevantFiles = await this.findRelevantFilesAdvanced(keywords, ripgrepResults, analysisResult);

    // Find relevant symbols using symbol analysis
    const relevantSymbols = this.findRelevantSymbols(keywords, analysisResult);

    // Find relevant APIs
    const relevantApis = this.findRelevantApis(keywords, analysisResult);

    return {
      files: relevantFiles,
      symbols: relevantSymbols,
      apis: relevantApis,
    };
  }

  async generateSmartKeywords(issue: GitHubIssue): Promise<SearchKeywords> {
    try {
      // Use LLM for intelligent keyword extraction
      const llmAnalysis = await this.llmService.analyzeIssueForKeywords(issue);

      return {
        primary: llmAnalysis.primary_keywords,
        secondary: llmAnalysis.component_names,
        technical: llmAnalysis.technical_terms,
        contextual: [...llmAnalysis.error_patterns, ...llmAnalysis.file_patterns, ...llmAnalysis.search_strategies]
      };
    } catch (error) {
      console.warn(`LLM keyword extraction failed, falling back to rule-based: ${error.message}`);

      // Fallback to rule-based extraction
      const text = `${issue.title} ${issue.body || ''}`;

      const primary = this.extractPrimaryKeywords(text);
      const secondary = this.extractSecondaryKeywords(text);
      const technical = this.extractTechnicalTerms(text);
      const contextual = this.extractContextualKeywords(text);

      return {
        primary,
        secondary,
        technical,
        contextual
      };
    }
  }

  private extractPrimaryKeywords(text: string): string[] {
    // Extract main concepts, error messages, feature names
    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'way', 'she', 'use', 'her', 'now', 'oil', 'sit', 'set', 'this', 'that', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);

    return [...new Set(words.filter(word =>
      !stopWords.has(word) &&
      word.length > 3 &&
      !/^\d+$/.test(word) // exclude pure numbers
    ))].slice(0, 10);
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

  private extractTechnicalTerms(text: string): string[] {
    // Extract technical terms, file extensions, framework names
    const technicalPatterns = [
      /\b\w+\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|h|cs|php|rb|md)\b/g, // file extensions
      /\b(function|class|interface|method|api|endpoint|route|component|service|controller|model|view|database|table|column|field|property|attribute|parameter|argument|variable|constant|enum|struct|union|namespace|package|module|import|export|async|await|promise|callback|event|listener|handler|middleware|decorator|annotation|generic|template|abstract|static|final|private|public|protected|override|virtual|extends|implements|inherits|throws|catch|try|finally|if|else|switch|case|default|for|while|do|break|continue|return|yield|new|delete|this|super|null|undefined|true|false)\b/gi, // programming keywords
      /\b(react|vue|angular|node|express|spring|django|flask|rails|laravel|symfony|asp\.net|blazor|xamarin|flutter|ionic|cordova|electron|webpack|vite|rollup|babel|typescript|javascript|python|java|kotlin|swift|objective-c|c\+\+|c#|go|rust|php|ruby|scala|clojure|haskell|erlang|elixir|dart|lua|perl|r|matlab|julia|fortran|cobol|assembly|sql|nosql|mongodb|postgresql|mysql|sqlite|redis|elasticsearch|docker|kubernetes|aws|azure|gcp|firebase|heroku|vercel|netlify|github|gitlab|bitbucket|jenkins|travis|circleci|jest|mocha|jasmine|cypress|selenium|puppeteer|playwright|storybook|figma|sketch|adobe|photoshop|illustrator|indesign|premiere|after effects|blender|unity|unreal|godot|construct|gamemaker|rpg maker|twine|ink|yarn|articy|chatmapper|dialogue system|narrative|story|plot|character|dialogue|conversation|chat|message|notification|alert|popup|modal|tooltip|dropdown|menu|navigation|sidebar|header|footer|layout|grid|flexbox|css|html|xml|json|yaml|toml|ini|csv|tsv|markdown|latex|pdf|docx|xlsx|pptx|zip|tar|gz|rar|7z|iso|dmg|exe|msi|deb|rpm|apk|ipa)\b/gi, // frameworks and technologies
    ];

    const matches: string[] = [];
    technicalPatterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found);
    });

    return [...new Set(matches.map(m => m.toLowerCase()))].slice(0, 20);
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

  private async searchWithRipgrep(keywords: SearchKeywords): Promise<RipgrepResult[]> {
    const allKeywords = [
      ...keywords.primary,
      ...keywords.secondary,
      ...keywords.technical,
      ...keywords.contextual
    ];

    const results: RipgrepResult[] = [];

    for (const keyword of allKeywords.slice(0, 10)) { // Limit to top 10 keywords
      try {
        const keywordResults = await this.executeRipgrep(keyword);
        results.push(...keywordResults);
      } catch (error) {
        console.warn(`Ripgrep search failed for keyword "${keyword}":`, error);
      }
    }

    return results;
  }

  private async executeRipgrep(pattern: string): Promise<RipgrepResult[]> {
    return new Promise((resolve, reject) => {
      const args = [
        '--json',
        '--smart-case',
        '--context', '2',
        '--max-count', '5',
        '--type-not', 'binary',
        '--glob', '!node_modules/**',
        '--glob', '!.git/**',
        '--glob', '!dist/**',
        '--glob', '!build/**',
        '--glob', '!coverage/**',
        pattern,
        this.workspacePath
      ];

      const child = spawn('rg', args, {
        cwd: this.workspacePath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 || code === 1) { // 0 = found, 1 = not found
          try {
            const results = stdout
              .split('\n')
              .filter(line => line.trim())
              .map(line => JSON.parse(line) as RipgrepResult);
            resolve(results);
          } catch (error) {
            resolve([]); // Return empty array if parsing fails
          }
        } else {
          reject(new Error(`Ripgrep failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        // If ripgrep is not installed, return empty results
        resolve([]);
      });
    });
  }

  async analyzeIssue(issue: GitHubIssue): Promise<IssueAnalysisResult> {
    const relatedCode = await this.findRelevantCode(issue);

    const suggestions = await this.generateSuggestions(issue, relatedCode);
    const summary = await this.generateSummary(issue, relatedCode);

    return {
      issue,
      relatedCode,
      suggestions,
      summary,
    };
  }

  private async findRelevantFilesAdvanced(
    keywords: SearchKeywords,
    ripgrepResults: RipgrepResult[],
    analysisResult: ContextWorkerResult
  ): Promise<Array<{
    path: string;
    content: string;
    relevanceScore: number;
  }>> {
    const fileScores = new Map<string, number>();
    const fileContents = new Map<string, string>();

    // Score files based on ripgrep results
    for (const result of ripgrepResults) {
      if (result.type === 'match' && result.data.path) {
        const filePath = result.data.path.text;
        const currentScore = fileScores.get(filePath) || 0;

        // Higher score for exact matches
        let matchScore = 1;
        if (result.data.submatches) {
          matchScore += result.data.submatches.length * 0.5;
        }

        fileScores.set(filePath, currentScore + matchScore);

        // Store file content if we don't have it yet
        if (!fileContents.has(filePath)) {
          try {
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspacePath, filePath);
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            fileContents.set(filePath, content);
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }

    // Score files based on symbol analysis
    if (analysisResult.symbolAnalysis) {
      for (const symbol of analysisResult.symbolAnalysis.symbols) {
        const symbolRelevance = this.calculateSymbolRelevance(symbol, keywords);
        if (symbolRelevance > 0) {
          const relativePath = path.relative(this.workspacePath, symbol.filePath);
          const currentScore = fileScores.get(relativePath) || 0;
          fileScores.set(relativePath, currentScore + symbolRelevance);

          // Load file content if needed
          if (!fileContents.has(relativePath)) {
            try {
              const content = await fs.promises.readFile(symbol.filePath, 'utf-8');
              fileContents.set(relativePath, content);
            } catch (error) {
              // Skip files that can't be read
            }
          }
        }
      }
    }

    // Convert to result format
    const results: Array<{
      path: string;
      content: string;
      relevanceScore: number;
    }> = [];

    for (const [filePath, score] of fileScores.entries()) {
      const content = fileContents.get(filePath);
      if (content) {
        results.push({
          path: filePath,
          content: content.substring(0, 2000), // Limit content size
          relevanceScore: Math.min(score / 10, 1), // Normalize score
        });
      }
    }

    // Sort by relevance score and return top 15
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 15);
  }

  private calculateSymbolRelevance(symbol: any, keywords: SearchKeywords): number {
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
        // Higher score for name matches
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

  private findRelevantSymbols(keywords: SearchKeywords, analysisResult: ContextWorkerResult): Array<{
    name: string;
    type: string;
    location: { file: string; line: number; column: number; };
    description?: string;
  }> {
    const relevantSymbols: Array<{
      name: string;
      type: string;
      location: { file: string; line: number; column: number; };
      description?: string;
    }> = [];

    if (!analysisResult.symbolAnalysis) {
      return relevantSymbols;
    }

    for (const symbol of analysisResult.symbolAnalysis.symbols) {
      const relevanceScore = this.calculateSymbolRelevance(symbol, keywords);

      if (relevanceScore > 0.5) {
        relevantSymbols.push({
          name: symbol.name,
          type: this.getSymbolKindName(symbol.kind),
          location: {
            file: path.relative(this.workspacePath, symbol.filePath),
            line: symbol.position.start.row,
            column: symbol.position.start.column,
          },
          description: symbol.comment || symbol.qualifiedName,
        });
      }
    }

    // Sort by relevance and return top 10
    return relevantSymbols.slice(0, 10);
  }

  private findRelevantApis(keywords: SearchKeywords, analysisResult: ContextWorkerResult): Array<{
    path: string;
    method: string;
    description?: string;
  }> {
    const relevantApis: Array<{
      path: string;
      method: string;
      description?: string;
    }> = [];

    // Look for API-related symbols (controllers, routes, endpoints)
    if (analysisResult.symbolAnalysis) {
      for (const symbol of analysisResult.symbolAnalysis.symbols) {
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
              path: path.relative(this.workspacePath, symbol.filePath),
              method: this.extractHttpMethod(symbol) || 'UNKNOWN',
              description: symbol.comment || symbol.qualifiedName,
            });
          }
        }
      }
    }

    return relevantApis.slice(0, 8);
  }

  private getSymbolKindName(kind: number): string {
    // Map symbol kind numbers to readable names
    const kindMap: Record<number, string> = {
      1: 'File',
      2: 'Module',
      3: 'Namespace',
      4: 'Package',
      5: 'Class',
      6: 'Method',
      7: 'Property',
      8: 'Field',
      9: 'Constructor',
      10: 'Enum',
      11: 'Interface',
      12: 'Function',
      13: 'Variable',
      14: 'Constant',
      15: 'String',
      16: 'Number',
      17: 'Boolean',
      18: 'Array',
      19: 'Object',
      20: 'Key',
      21: 'Null',
      22: 'EnumMember',
      23: 'Struct',
      24: 'Event',
      25: 'Operator',
      26: 'TypeParameter',
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

    // Analyze issue type and generate targeted suggestions
    const issueType = await this.analyzeIssueType(issue);

    // Generate suggestions based on relevant files
    for (const file of codeContext.files.slice(0, 5)) {
      const suggestion = this.generateFileSuggestion(file, issueType);
      suggestions.push(suggestion);
    }

    // Generate suggestions based on symbols
    for (const symbol of codeContext.symbols.slice(0, 5)) {
      const suggestion = this.generateSymbolSuggestion(symbol, issueType);
      suggestions.push(suggestion);
    }

    // Generate suggestions based on APIs
    for (const api of codeContext.apis.slice(0, 3)) {
      suggestions.push({
        type: 'api',
        description: `Review API endpoint ${api.method} ${api.path} - it might be related to this issue`,
        location: api.path,
        confidence: 0.6,
      });
    }

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  async analyzeIssueType(issue: GitHubIssue): Promise<string> {
    try {
      // Use LLM for intelligent issue type detection
      const llmAnalysis = await this.llmService.analyzeIssueForKeywords(issue);
      return llmAnalysis.issue_type;
    } catch (error) {
      console.warn(`LLM issue type analysis failed, falling back to rule-based: ${error.message}`);

      // Fallback to rule-based detection
      const text = `${issue.title} ${issue.body || ''}`.toLowerCase();

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
  }

  private generateFileSuggestion(file: any, issueType: string): {
    type: 'file';
    description: string;
    location: string;
    confidence: number;
  } {
    let description = `Examine ${file.path}`;

    switch (issueType) {
      case 'bug':
        description += ' - this file might contain the bug or related logic';
        break;
      case 'feature':
        description += ' - this file might need modifications for the new feature';
        break;
      case 'performance':
        description += ' - this file might have performance bottlenecks';
        break;
      case 'testing':
        description += ' - this file might need test coverage or contain test-related code';
        break;
      default:
        description += ' - it appears to be relevant to this issue';
    }

    return {
      type: 'file',
      description,
      location: file.path,
      confidence: Math.min(file.relevanceScore + 0.1, 1),
    };
  }

  private generateSymbolSuggestion(symbol: any, issueType: string): {
    type: 'symbol';
    description: string;
    location: string;
    confidence: number;
  } {
    let description = `Review ${symbol.type.toLowerCase()} "${symbol.name}"`;

    switch (issueType) {
      case 'bug':
        description += ' - it might contain the bug or be affected by it';
        break;
      case 'feature':
        description += ' - it might need to be extended or modified';
        break;
      case 'performance':
        description += ' - it might be a performance bottleneck';
        break;
      default:
        description += ' - it appears to be related to this issue';
    }

    return {
      type: 'symbol',
      description,
      location: `${symbol.location.file}:${symbol.location.line}`,
      confidence: 0.7,
    };
  }

  private async generateSummary(issue: GitHubIssue, codeContext: CodeContext): Promise<string> {
    const fileCount = codeContext.files.length;
    const symbolCount = codeContext.symbols.length;
    const apiCount = codeContext.apis.length;
    const issueType = await this.analyzeIssueType(issue);

    let summary = `## Issue Analysis: #${issue.number} - "${issue.title}"\n\n`;

    summary += `**Issue Type**: ${issueType.charAt(0).toUpperCase() + issueType.slice(1)}\n`;
    summary += `**Status**: ${issue.state}\n`;
    summary += `**Created**: ${new Date(issue.created_at).toLocaleDateString()}\n`;
    if (issue.labels.length > 0) {
      summary += `**Labels**: ${issue.labels.map(l => l.name).join(', ')}\n`;
    }
    summary += '\n';

    summary += `### Code Analysis Results\n`;
    summary += `- **${fileCount}** relevant files found\n`;
    summary += `- **${symbolCount}** related symbols identified\n`;
    summary += `- **${apiCount}** API endpoints detected\n\n`;

    if (fileCount > 0) {
      summary += `### Most Relevant Files\n`;
      codeContext.files.slice(0, 5).forEach((file, index) => {
        summary += `${index + 1}. **${file.path}** (${(file.relevanceScore * 100).toFixed(1)}% relevance)\n`;
      });
      summary += '\n';
    }

    if (symbolCount > 0) {
      summary += `### Key Symbols\n`;
      codeContext.symbols.slice(0, 5).forEach((symbol, index) => {
        summary += `${index + 1}. **${symbol.name}** (${symbol.type}) in ${symbol.location.file}:${symbol.location.line}\n`;
      });
      summary += '\n';
    }

    summary += `### Recommendations\n`;
    switch (issueType) {
      case 'bug':
        summary += `- Focus on error handling and edge cases in the identified files\n`;
        summary += `- Check for recent changes that might have introduced the bug\n`;
        summary += `- Look for similar patterns in the codebase\n`;
        break;
      case 'feature':
        summary += `- Consider the impact on existing functionality\n`;
        summary += `- Plan for proper testing of the new feature\n`;
        summary += `- Review related components that might need updates\n`;
        break;
      case 'performance':
        summary += `- Profile the identified code sections\n`;
        summary += `- Look for optimization opportunities\n`;
        summary += `- Consider caching or algorithmic improvements\n`;
        break;
      default:
        summary += `- Review the identified files and symbols carefully\n`;
        summary += `- Consider the broader context and dependencies\n`;
        summary += `- Test thoroughly after making changes\n`;
    }

    return summary;
  }
}
