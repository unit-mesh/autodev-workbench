import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { CodeContext, GitHubIssue, IssueAnalysisResult } from "../types/index";
import { LLMService } from "./llm-service";
import { regexSearchFiles } from "@autodev/worker-core";
import { listFiles } from "@autodev/worker-core";

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

interface RipgrepSearchResult {
  keyword: string;
  results: string;
  fileMatches: Array<{
    file: string;
    matches: Array<{
      line: number;
      text: string;
      isMatch: boolean;
    }>;
  }>;
}

interface SearchKeywords {
  primary: string[];
  secondary: string[];
  technical: string[];
  contextual: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

interface AnalysisCache {
  codebaseAnalysis?: CacheEntry<ContextWorkerResult>;
  fileList?: CacheEntry<string[]>;
  fileContents?: Map<string, CacheEntry<string>>;
}

export class ContextAnalyzer {
  private workspacePath: string;
  private llmService: LLMService;
  private cache: AnalysisCache;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly FILE_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for file contents

  constructor(workspacePath: string = process.cwd()) {
    this.workspacePath = workspacePath;
    this.llmService = new LLMService();
    this.cache = {
      fileContents: new Map()
    };
  }

  private isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private setCacheEntry<T>(key: keyof AnalysisCache, data: T, ttl: number = this.CACHE_TTL): void {
    if (key === 'fileContents') return; // Handle file contents separately

    (this.cache as any)[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }

  private getCacheEntry<T>(key: keyof AnalysisCache): T | null {
    if (key === 'fileContents') return null; // Handle file contents separately

    const entry = (this.cache as any)[key] as CacheEntry<T> | undefined;
    return this.isCacheValid(entry) ? entry.data : null;
  }

  async analyzeCodebase(): Promise<ContextWorkerResult> {
    // Check cache first
    const cached = this.getCacheEntry<ContextWorkerResult>('codebaseAnalysis');
    if (cached) {
      console.log('Using cached codebase analysis');
      return cached;
    }

    try {
      // Use context-worker to analyze the codebase
      const result = await this.runContextWorker();

      // Cache the result
      this.setCacheEntry('codebaseAnalysis', result);

      return result;
    } catch (error: any) {
      console.warn(`Failed to run context-worker: ${error.message}`);
      // Fallback to basic analysis
      const fallbackResult = {
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

      // Cache the fallback result with shorter TTL
      this.setCacheEntry('codebaseAnalysis', fallbackResult, 60 * 1000); // 1 minute

      return fallbackResult;
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

  async getFilteredFileList(): Promise<string[]> {
    // Check cache first
    const cached = this.getCacheEntry<string[]>('fileList');
    if (cached) {
      console.log('Using cached file list');
      return cached;
    }

    try {
      // Use worker-core's listFiles with proper filtering
      const [files] = await listFiles(this.workspacePath, true, 5000);

      // Filter out unwanted files
      const filteredFiles = files.filter(file => {
        // Skip directories (they end with /)
        if (file.endsWith('/')) return false;

        // Skip files that should be ignored
        return !this.shouldSkipFileAdvanced(file);
      });

      // Cache the result
      this.setCacheEntry('fileList', filteredFiles);

      return filteredFiles;
    } catch (error) {
      console.warn(`Failed to get filtered file list: ${error}`);
      // Fallback to basic file listing
      return this.getAllFiles(this.workspacePath);
    }
  }

  private shouldSkipFileAdvanced(filePath: string): boolean {
    // Skip dist/, build/, and other generated directories
    const pathParts = filePath.split('/');
    const skipDirs = new Set(['dist', 'build', 'out', 'target', 'node_modules', '.git', '.next', 'coverage', '.nyc_output', '__pycache__', '.pytest_cache', '.cache']);

    for (const part of pathParts) {
      if (skipDirs.has(part) || part.startsWith('.')) {
        return true;
      }
    }

    // Skip certain file types
    const ext = path.extname(filePath).toLowerCase();
    const skipExts = new Set(['.map', '.min.js', '.min.css', '.bundle.js', '.chunk.js', '.lock', '.log', '.tmp', '.temp']);
    if (skipExts.has(ext)) {
      return true;
    }

    // Only include source code files
    const allowedExts = new Set(['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.md', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf']);
    return !allowedExts.has(ext);
  }

  async findRelevantCode(issue: GitHubIssue): Promise<CodeContext> {
    // Prioritize local data - get analysis and file list in parallel
    const [analysisResult, filteredFiles] = await Promise.all([
      this.analyzeCodebase(),
      this.getFilteredFileList()
    ]);

    // Generate intelligent keywords using LLM-like analysis
    const keywords = await this.generateSmartKeywords(issue);

    // Use optimized search with filtered file list
    const ripgrepResults = await this.searchWithRipgrepOptimized(keywords, filteredFiles);

    // Find relevant files using LLM-powered analysis
    const relevantFiles = await this.findRelevantFilesWithLLM(issue, keywords, ripgrepResults, analysisResult);

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

  private async searchWithRipgrepOptimized(keywords: SearchKeywords, filteredFiles: string[]): Promise<RipgrepSearchResult[]> {
    const allKeywords = [
      ...keywords.primary,
      ...keywords.secondary,
      ...keywords.technical,
      ...keywords.contextual
    ];

    const results: RipgrepSearchResult[] = [];

    // First, do a quick filename-based filtering
    const relevantFiles = this.filterFilesByKeywords(filteredFiles, allKeywords);

    console.log(`Filtered to ${relevantFiles.length} potentially relevant files from ${filteredFiles.length} total files`);

    for (const keyword of allKeywords.slice(0, 10)) { // Limit to top 10 keywords
      try {
        const searchResults = await this.executeRipgrepSearchOptimized(keyword, relevantFiles);
        if (searchResults) {
          results.push(searchResults);
        }
      } catch (error) {
        console.warn(`Ripgrep search failed for keyword "${keyword}":`, error);
      }
    }

    return results;
  }

  private filterFilesByKeywords(files: string[], keywords: string[]): string[] {
    const keywordSet = new Set(keywords.map(k => k.toLowerCase()));

    return files.filter(file => {
      const fileName = path.basename(file).toLowerCase();
      const dirName = path.dirname(file).toLowerCase();

      // Check if filename or directory contains any keywords
      for (const keyword of keywordSet) {
        if (fileName.includes(keyword) || dirName.includes(keyword)) {
          return true;
        }
      }

      // Always include certain important files
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

      return importantPatterns.some(pattern => pattern.test(file));
    });
  }

  private async searchWithRipgrep(keywords: SearchKeywords): Promise<RipgrepSearchResult[]> {
    const allKeywords = [
      ...keywords.primary,
      ...keywords.secondary,
      ...keywords.technical,
      ...keywords.contextual
    ];

    const results: RipgrepSearchResult[] = [];

    for (const keyword of allKeywords.slice(0, 10)) { // Limit to top 10 keywords
      try {
        const searchResults = await this.executeRipgrepSearch(keyword);
        if (searchResults) {
          results.push(searchResults);
        }
      } catch (error) {
        console.warn(`Ripgrep search failed for keyword "${keyword}":`, error);
      }
    }

    return results;
  }

  private async executeRipgrepSearchOptimized(pattern: string, relevantFiles: string[]): Promise<RipgrepSearchResult | null> {
    try {
      // If we have a small set of relevant files, search them directly
      if (relevantFiles.length <= 100) {
        return await this.searchInSpecificFiles(pattern, relevantFiles);
      }

      // Otherwise, use the regular search but with better filtering
      return await this.executeRipgrepSearch(pattern);
    } catch (error) {
      console.warn(`Optimized ripgrep search failed for pattern "${pattern}":`, error);
      return null;
    }
  }

  private async searchInSpecificFiles(pattern: string, files: string[]): Promise<RipgrepSearchResult | null> {
    const fileMatches: Array<{
      file: string;
      matches: Array<{
        line: number;
        text: string;
        isMatch: boolean;
      }>;
    }> = [];

    let totalMatches = 0;

    for (const file of files) {
      if (totalMatches >= 100) break; // Limit total matches

      try {
        const content = await this.getCachedFileContent(file);
        if (!content) continue;

        const lines = content.split('\n');
        const matches: Array<{
          line: number;
          text: string;
          isMatch: boolean;
        }> = [];

        const regex = new RegExp(pattern, 'gi');

        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            matches.push({
              line: i + 1,
              text: lines[i],
              isMatch: true
            });
            totalMatches++;

            if (totalMatches >= 100) break;
          }
        }

        if (matches.length > 0) {
          fileMatches.push({
            file: path.relative(this.workspacePath, file),
            matches
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    if (fileMatches.length === 0) {
      return null;
    }

    return {
      keyword: pattern,
      results: `Found ${totalMatches} matches in ${fileMatches.length} files`,
      fileMatches
    };
  }

  private async getCachedFileContent(filePath: string): Promise<string | null> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspacePath, filePath);

    // Check cache first
    const cached = this.cache.fileContents?.get(fullPath);
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const content = await fs.promises.readFile(fullPath, 'utf-8');

      // Cache the content
      if (!this.cache.fileContents) {
        this.cache.fileContents = new Map();
      }

      this.cache.fileContents.set(fullPath, {
        data: content,
        timestamp: Date.now(),
        ttl: this.FILE_CACHE_TTL
      });

      return content;
    } catch (error) {
      return null;
    }
  }

  private async executeRipgrepSearch(pattern: string): Promise<RipgrepSearchResult | null> {
    try {
      // Use worker-core's regexSearchFiles function
      const searchResults = await regexSearchFiles(
        this.workspacePath, // cwd
        this.workspacePath, // directoryPath
        pattern,           // regex pattern
        false,            // includeNodeModules
        undefined         // filePattern (search all files)
      );

      if (!searchResults || searchResults === "No results found") {
        return null;
      }

      // Parse the formatted results to extract file matches
      const fileMatches = this.parseRipgrepResults(searchResults);

      return {
        keyword: pattern,
        results: searchResults,
        fileMatches
      };
    } catch (error) {
      console.warn(`Ripgrep search failed for pattern "${pattern}":`, error);
      return null;
    }
  }

  private parseRipgrepResults(results: string): Array<{
    file: string;
    matches: Array<{
      line: number;
      text: string;
      isMatch: boolean;
    }>;
  }> {
    const fileMatches: Array<{
      file: string;
      matches: Array<{
        line: number;
        text: string;
        isMatch: boolean;
      }>;
    }> = [];

    const lines = results.split('\n');
    let currentFile: string | null = null;
    let currentMatches: Array<{
      line: number;
      text: string;
      isMatch: boolean;
    }> = [];

    for (const line of lines) {
      // Check if this is a file header (starts with #)
      if (line.startsWith('# ')) {
        // Save previous file if exists
        if (currentFile && currentMatches.length > 0) {
          fileMatches.push({
            file: currentFile,
            matches: [...currentMatches]
          });
        }

        // Start new file
        currentFile = line.substring(2).trim();
        currentMatches = [];
      } else if (line.match(/^\s*\d+\s*\|\s*/)) {
        // This is a line with line number
        const match = line.match(/^\s*(\d+)\s*\|\s*(.*)$/);
        if (match && currentFile) {
          const lineNumber = parseInt(match[1], 10);
          const text = match[2];

          currentMatches.push({
            line: lineNumber,
            text: text,
            isMatch: true // In the formatted output, all lines are matches or context
          });
        }
      }
    }

    // Don't forget the last file
    if (currentFile && currentMatches.length > 0) {
      fileMatches.push({
        file: currentFile,
        matches: [...currentMatches]
      });
    }

    return fileMatches;
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

  /**
   * Find relevant files using LLM to analyze code relevance
   */
  private async findRelevantFilesWithLLM(
    issue: GitHubIssue,
    keywords: SearchKeywords,
    ripgrepResults: RipgrepSearchResult[],
    analysisResult: ContextWorkerResult
  ): Promise<Array<{
    path: string;
    content: string;
    relevanceScore: number;
    reason?: string;
  }>> {
    console.log('🧠 Using LLM to analyze code relevance...');

    // First, get candidate files using traditional methods
    const candidateFiles = await this.findRelevantFilesAdvanced(keywords, ripgrepResults, analysisResult);

    // Then use LLM to analyze each candidate file
    const llmAnalyzedFiles: Array<{
      path: string;
      content: string;
      relevanceScore: number;
      reason?: string;
    }> = [];

    // Analyze top candidate files with LLM (limit to avoid API costs)
    const filesToAnalyze = candidateFiles.slice(0, 8);

    for (const file of filesToAnalyze) {
      try {
        console.log(`🔍 LLM analyzing: ${file.path}`);
        const llmAnalysis = await this.llmService.analyzeCodeRelevance(issue, file.path, file.content);

        if (llmAnalysis.is_relevant) {
          llmAnalyzedFiles.push({
            path: file.path,
            content: file.content,
            relevanceScore: llmAnalysis.relevance_score,
            reason: llmAnalysis.reason
          });

          console.log(`✅ ${file.path}: ${(llmAnalysis.relevance_score * 100).toFixed(1)}% relevant - ${llmAnalysis.reason.substring(0, 80)}...`);
        } else {
          console.log(`❌ ${file.path}: Not relevant - ${llmAnalysis.reason.substring(0, 80)}...`);
        }
      } catch (error) {
        console.warn(`⚠️  LLM analysis failed for ${file.path}: ${error.message}`);
        // Fall back to original scoring for this file
        llmAnalyzedFiles.push(file);
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

  private async findRelevantFilesAdvanced(
    keywords: SearchKeywords,
    ripgrepResults: RipgrepSearchResult[],
    analysisResult: ContextWorkerResult
  ): Promise<Array<{
    path: string;
    content: string;
    relevanceScore: number;
  }>> {
    const fileScores = new Map<string, number>();
    const fileContents = new Map<string, string>();

    // Score files based on ripgrep results
    for (const searchResult of ripgrepResults) {
      for (const fileMatch of searchResult.fileMatches) {
        const filePath = fileMatch.file;
        const currentScore = fileScores.get(filePath) || 0;

        // Calculate score based on number of matches and their quality
        let matchScore = fileMatch.matches.length;

        // Bonus for files with multiple different keywords
        const keywordBonus = 0.5;
        matchScore += keywordBonus;

        fileScores.set(filePath, currentScore + matchScore);

        // Store file content if we don't have it yet (use cached version)
        if (!fileContents.has(filePath)) {
          const content = await this.getCachedFileContent(filePath);
          if (content) {
            fileContents.set(filePath, content);
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

          // Load file content if needed (use cached version)
          if (!fileContents.has(relativePath)) {
            const content = await this.getCachedFileContent(symbol.filePath);
            if (content) {
              fileContents.set(relativePath, content);
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
