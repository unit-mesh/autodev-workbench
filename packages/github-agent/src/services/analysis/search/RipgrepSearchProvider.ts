/**
 * Ripgrep Search Provider
 * 
 * Implements search using ripgrep for fast text searching.
 * Uses the Strategy Pattern to provide high-performance search capabilities.
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
import { regexSearchFiles } from "@autodev/worker-core";
import * as path from 'path';

export class RipgrepSearchProvider extends BaseSearchProvider {
  readonly name = 'ripgrep';
  
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

    try {
      // If we have a small set of files, search them directly
      if (files.length <= 100) {
        return await this.searchInSpecificFiles(pattern, files, options);
      }

      // Otherwise, use the regular ripgrep search
      return await this.searchWithRipgrep(pattern, options);
    } catch (error) {
      console.warn(`Ripgrep search failed for pattern "${pattern}":`, error);
      
      // Return empty result on failure
      return this.createSearchResult(pattern, [], Date.now() - startTime);
    }
  }

  async searchInDirectory(
    pattern: string,
    directory: string,
    filter?: SearchFilter,
    _options: SearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const searchResults = await regexSearchFiles(
        this.workspacePath,
        directory,
        pattern,
        false, // includeNodeModules
        filter?.extensions ? `*.{${filter.extensions.join(',')}}` : undefined
      );

      if (!searchResults || searchResults === "No results found") {
        return this.createSearchResult(pattern, [], Date.now() - startTime);
      }

      const fileMatches = this.parseRipgrepResults(searchResults);
      return this.createSearchResult(pattern, fileMatches, Date.now() - startTime, searchResults);
    } catch (error) {
      console.warn(`Ripgrep directory search failed for pattern "${pattern}":`, error);
      return this.createSearchResult(pattern, [], Date.now() - startTime);
    }
  }

  async searchMultiple(
    patterns: string[],
    files: string[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    // Ripgrep can handle multiple patterns efficiently
    const results: SearchResult[] = [];
    
    // Process patterns in parallel batches to avoid overwhelming the system
    const batchSize = 5;
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
      // Test if ripgrep is available by doing a simple search
      await regexSearchFiles(
        this.workspacePath,
        this.workspacePath,
        'test_pattern_that_should_not_exist_12345',
        false
      );
      return true;
    } catch (error) {
      console.warn('Ripgrep not available:', error.message);
      return false;
    }
  }

  getCapabilities(): SearchCapabilities {
    return {
      supportsRegex: true,
      supportsContextLines: true,
      supportsParallelSearch: true,
      supportsFileFiltering: true,
      maxConcurrentSearches: 10,
      estimatedPerformance: 'fast'
    };
  }

  private async searchWithRipgrep(
    pattern: string,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();

    const searchResults = await regexSearchFiles(
      this.workspacePath,
      this.workspacePath,
      pattern,
      false, // includeNodeModules
      options.filePattern
    );

    if (!searchResults || searchResults === "No results found") {
      return this.createSearchResult(pattern, [], Date.now() - startTime);
    }

    const fileMatches = this.parseRipgrepResults(searchResults);
    return this.createSearchResult(pattern, fileMatches, Date.now() - startTime, searchResults);
  }

  private async searchInSpecificFiles(
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

    for (const file of files) {
      if (totalMatches >= (options.maxResults || 100)) break;

      try {
        const content = await this.loadFileContent(file);
        if (!content) continue;

        const lines = content.split('\n');
        const matches: SearchMatch[] = [];

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
            
            totalMatches++;
            if (totalMatches >= (options.maxResults || 100)) break;
          }
        }

        if (matches.length > 0) {
          fileMatches.push({
            file: path.relative(this.workspacePath, file),
            matches,
            score: this.calculateSearchScore(matches)
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return this.createSearchResult(pattern, fileMatches, Date.now() - startTime);
  }

  private parseRipgrepResults(results: string): FileMatch[] {
    const fileMatches: FileMatch[] = [];
    const lines = results.split('\n');
    let currentFile: string | null = null;
    let currentMatches: SearchMatch[] = [];

    for (const line of lines) {
      // Check if this is a file header (starts with #)
      if (line.startsWith('# ')) {
        // Save previous file if exists
        if (currentFile && currentMatches.length > 0) {
          fileMatches.push({
            file: currentFile,
            matches: [...currentMatches],
            score: this.calculateSearchScore(currentMatches)
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
            isMatch: true
          });
        }
      }
    }

    // Don't forget the last file
    if (currentFile && currentMatches.length > 0) {
      fileMatches.push({
        file: currentFile,
        matches: [...currentMatches],
        score: this.calculateSearchScore(currentMatches)
      });
    }

    return fileMatches;
  }

  private async loadFileContent(filePath: string): Promise<string | null> {
    try {
      const fs = await import('fs');
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspacePath, filePath);
      return await fs.promises.readFile(fullPath, 'utf-8');
    } catch (error) {
      return null;
    }
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
