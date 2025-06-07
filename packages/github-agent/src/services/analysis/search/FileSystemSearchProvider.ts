/**
 * File System Search Provider
 * 
 * Implements search using direct file system access.
 * Serves as a fallback when ripgrep is not available.
 */

import {
  BaseSearchProvider,
  SearchResult,
  SearchOptions,
  SearchFilter,
  SearchCapabilities,
  FileMatch,
  SearchMatch
} from "../interfaces/ISearchProvider";
import * as fs from 'fs';
import * as path from 'path';

export class FileSystemSearchProvider extends BaseSearchProvider {
  readonly name = 'filesystem';
  
  private workspacePath: string;

  constructor(workspacePath: string) {
    super();
    this.workspacePath = workspacePath;
  }

  async search(
    pattern: string,
    files: string[],
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const fileMatches: FileMatch[] = [];
    let totalMatches = 0;

    const regex = new RegExp(
      options.regex ? pattern : this.escapeRegex(pattern),
      options.caseSensitive ? 'g' : 'gi'
    );

    // Filter files if needed
    const filteredFiles = this.filterFiles(files);

    for (const file of filteredFiles) {
      if (totalMatches >= (options.maxResults || 100)) break;

      try {
        const content = await this.loadFileContent(file);
        if (!content) continue;

        const matches = await this.searchInContent(content, regex, options);
        
        if (matches.length > 0) {
          fileMatches.push({
            file: path.relative(this.workspacePath, file),
            matches,
            score: this.calculateSearchScore(matches)
          });
          
          totalMatches += matches.length;
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return this.createSearchResult(pattern, fileMatches, Date.now() - startTime);
  }

  async searchInDirectory(
    pattern: string,
    directory: string,
    filter?: SearchFilter,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    // Get all files in directory
    const files = await this.getAllFilesInDirectory(directory, filter);

    // Search in the files
    return await this.search(pattern, files, options);
  }

  async searchMultiple(
    patterns: string[],
    files: string[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    // File system search is slower, so we limit parallel searches
    const results: SearchResult[] = [];
    
    // Process patterns in smaller batches
    const batchSize = 2;
    for (let i = 0; i < patterns.length; i += batchSize) {
      const batch = patterns.slice(i, i + batchSize);
      
      const batchPromises = batch.map(pattern => 
        this.search(pattern, files, options).catch(error => {
          console.warn(`Search failed for pattern "${pattern}":`, error);
          return this.createSearchResult(pattern, [], 0);
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test if we can access the workspace directory
      await fs.promises.access(this.workspacePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  getCapabilities(): SearchCapabilities {
    return {
      supportsRegex: true,
      supportsContextLines: true,
      supportsParallelSearch: false, // Limited parallel support
      supportsFileFiltering: true,
      maxConcurrentSearches: 2,
      estimatedPerformance: 'slow'
    };
  }

  private async searchInContent(
    content: string,
    regex: RegExp,
    options: SearchOptions = {}
  ): Promise<SearchMatch[]> {
    const matches: SearchMatch[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (regex.test(line)) {
        matches.push({
          line: i + 1,
          text: line,
          isMatch: true,
          context: options.includeContext ? {
            before: this.getContextLines(lines, i, -(options.contextLines || 2)),
            after: this.getContextLines(lines, i, options.contextLines || 2)
          } : undefined
        });
        
        if (matches.length >= (options.maxResults || 100)) break;
      }
    }

    return matches;
  }

  private async loadFileContent(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspacePath, filePath);
      
      // Check file size to avoid loading huge files
      const stats = await fs.promises.stat(fullPath);
      if (stats.size > 10 * 1024 * 1024) { // 10MB limit
        console.warn(`Skipping large file: ${filePath} (${stats.size} bytes)`);
        return null;
      }
      
      return await fs.promises.readFile(fullPath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  private async getAllFilesInDirectory(
    directory: string,
    filter?: SearchFilter
  ): Promise<string[]> {
    const files: string[] = [];
    const fullPath = path.isAbsolute(directory) ? directory : path.join(this.workspacePath, directory);
    
    try {
      await this.walkDirectory(fullPath, files, filter);
    } catch (error) {
      console.warn(`Failed to walk directory ${directory}:`, error);
    }
    
    return files;
  }

  private async walkDirectory(
    dir: string,
    files: string[],
    filter?: SearchFilter,
    depth: number = 0
  ): Promise<void> {
    // Limit recursion depth to avoid infinite loops
    if (depth > 10) return;
    
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Check if directory should be excluded
          if (this.shouldSkipDirectory(entry.name, filter)) {
            continue;
          }
          
          await this.walkDirectory(fullPath, files, filter, depth + 1);
        } else if (entry.isFile()) {
          // Check if file should be included
          if (this.shouldIncludeFile(fullPath, filter)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  private shouldSkipDirectory(name: string, filter?: SearchFilter): boolean {
    // Default directories to skip
    const defaultSkipDirs = new Set([
      'node_modules', '.git', 'dist', 'build', '.next', 'coverage', 
      '.nyc_output', '__pycache__', '.pytest_cache', '.cache', 'target'
    ]);
    
    if (defaultSkipDirs.has(name) || name.startsWith('.')) {
      return true;
    }
    
    // Check filter exclude directories
    if (filter?.excludeDirectories) {
      return filter.excludeDirectories.some(excludeDir => name.includes(excludeDir));
    }
    
    return false;
  }

  private shouldIncludeFile(filePath: string, filter?: SearchFilter): boolean {
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase().substring(1); // Remove the dot
    
    // Check file extension filter
    if (filter?.extensions && filter.extensions.length > 0) {
      if (!filter.extensions.includes(ext)) {
        return false;
      }
    } else {
      // Default allowed extensions
      const allowedExts = new Set([
        'ts', 'js', 'tsx', 'jsx', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'h', 
        'cs', 'php', 'rb', 'md', 'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'
      ]);
      
      if (!allowedExts.has(ext)) {
        return false;
      }
    }
    
    // Check file size filter
    if (filter?.maxFileSize) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > filter.maxFileSize) {
          return false;
        }
      } catch (error) {
        return false;
      }
    }
    
    // Check modification date filters
    if (filter?.modifiedAfter || filter?.modifiedBefore) {
      try {
        const stats = fs.statSync(filePath);
        
        if (filter.modifiedAfter && stats.mtime < filter.modifiedAfter) {
          return false;
        }
        
        if (filter.modifiedBefore && stats.mtime > filter.modifiedBefore) {
          return false;
        }
      } catch (error) {
        return false;
      }
    }
    
    return true;
  }

  private getContextLines(lines: string[], currentIndex: number, offset: number): string[] {
    const contextLines: string[] = [];
    const start = Math.max(0, currentIndex + (offset < 0 ? offset : 1));
    const end = Math.min(lines.length, currentIndex + (offset < 0 ? 0 : offset + 1));

    for (let i = start; i < end; i++) {
      if (i !== currentIndex) {
        contextLines.push(lines[i]);
      }
    }

    return contextLines;
  }
}
