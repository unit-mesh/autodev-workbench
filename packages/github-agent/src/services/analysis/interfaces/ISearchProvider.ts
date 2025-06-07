/**
 * Search Provider Interface
 * 
 * Defines the contract for different search implementations using the Strategy Pattern.
 * Supports ripgrep, file system search, and other search backends.
 */

export interface SearchMatch {
  line: number;
  text: string;
  isMatch: boolean;
  context?: {
    before: string[];
    after: string[];
  };
}

export interface FileMatch {
  file: string;
  matches: SearchMatch[];
  score?: number;
}

export interface SearchResult {
  keyword: string;
  results: string;
  fileMatches: FileMatch[];
  totalMatches: number;
  searchTime: number;
  provider: string;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  maxResults?: number;
  includeContext?: boolean;
  contextLines?: number;
  filePattern?: string;
  excludePattern?: string;
  timeout?: number;
}

export interface SearchFilter {
  extensions?: string[];
  excludeDirectories?: string[];
  includeDirectories?: string[];
  maxFileSize?: number;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
}

/**
 * Search provider interface
 */
export interface ISearchProvider {
  /**
   * Unique identifier for this search provider
   */
  readonly name: string;

  /**
   * Search for a pattern in the given files
   */
  search(
    pattern: string,
    files: string[],
    options?: SearchOptions
  ): Promise<SearchResult>;

  /**
   * Search for multiple patterns in parallel
   */
  searchMultiple(
    patterns: string[],
    files: string[],
    options?: SearchOptions
  ): Promise<SearchResult[]>;

  /**
   * Search in a specific directory
   */
  searchInDirectory(
    pattern: string,
    directory: string,
    filter?: SearchFilter,
    options?: SearchOptions
  ): Promise<SearchResult>;

  /**
   * Check if this search provider is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get search capabilities
   */
  getCapabilities(): SearchCapabilities;
}

export interface SearchCapabilities {
  supportsRegex: boolean;
  supportsContextLines: boolean;
  supportsParallelSearch: boolean;
  supportsFileFiltering: boolean;
  maxConcurrentSearches: number;
  estimatedPerformance: 'fast' | 'medium' | 'slow';
}

/**
 * Base search provider with common functionality
 */
export abstract class BaseSearchProvider implements ISearchProvider {
  abstract readonly name: string;

  abstract search(
    pattern: string,
    files: string[],
    options?: SearchOptions
  ): Promise<SearchResult>;

  async searchMultiple(
    patterns: string[],
    files: string[],
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    // Default implementation: search patterns sequentially
    const results: SearchResult[] = [];
    
    for (const pattern of patterns) {
      try {
        const result = await this.search(pattern, files, options);
        results.push(result);
      } catch (error) {
        console.warn(`Search failed for pattern "${pattern}":`, error);
      }
    }
    
    return results;
  }

  abstract searchInDirectory(
    pattern: string,
    directory: string,
    filter?: SearchFilter,
    options?: SearchOptions
  ): Promise<SearchResult>;

  async isAvailable(): Promise<boolean> {
    return true; // Base implementation assumes availability
  }

  abstract getCapabilities(): SearchCapabilities;

  /**
   * Helper method to filter files based on search filter
   */
  protected filterFiles(files: string[], filter?: SearchFilter): string[] {
    if (!filter) return files;

    return files.filter(file => {
      // Check file extension
      if (filter.extensions && filter.extensions.length > 0) {
        const ext = file.split('.').pop()?.toLowerCase();
        if (!ext || !filter.extensions.includes(ext)) {
          return false;
        }
      }

      // Check excluded directories
      if (filter.excludeDirectories) {
        for (const excludeDir of filter.excludeDirectories) {
          if (file.includes(excludeDir)) {
            return false;
          }
        }
      }

      // Check included directories
      if (filter.includeDirectories && filter.includeDirectories.length > 0) {
        let included = false;
        for (const includeDir of filter.includeDirectories) {
          if (file.includes(includeDir)) {
            included = true;
            break;
          }
        }
        if (!included) return false;
      }

      return true;
    });
  }

  /**
   * Helper method to calculate search score
   */
  protected calculateSearchScore(matches: SearchMatch[]): number {
    if (matches.length === 0) return 0;
    
    // Score based on number of matches and their quality
    let score = matches.length;
    
    // Bonus for exact matches
    const exactMatches = matches.filter(m => m.isMatch).length;
    score += exactMatches * 0.5;
    
    // Normalize to 0-1 range
    return Math.min(score / 10, 1);
  }

  /**
   * Helper method to escape regex special characters
   */
  protected escapeRegex(pattern: string): string {
    return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Helper method to create search result
   */
  protected createSearchResult(
    keyword: string,
    fileMatches: FileMatch[],
    searchTime: number,
    results?: string
  ): SearchResult {
    const totalMatches = fileMatches.reduce((sum, fm) => sum + fm.matches.length, 0);
    
    return {
      keyword,
      results: results || `Found ${totalMatches} matches in ${fileMatches.length} files`,
      fileMatches,
      totalMatches,
      searchTime,
      provider: this.name
    };
  }
}

/**
 * Search provider factory interface
 */
export interface ISearchProviderFactory {
  /**
   * Create a search provider instance
   */
  createProvider(type: 'ripgrep' | 'filesystem' | 'hybrid'): ISearchProvider;

  /**
   * Get the best available search provider
   */
  getBestProvider(): Promise<ISearchProvider>;

  /**
   * Get all available search providers
   */
  getAvailableProviders(): Promise<ISearchProvider[]>;
}

/**
 * Search result aggregator for combining results from multiple providers
 */
export interface ISearchResultAggregator {
  /**
   * Aggregate search results from multiple providers
   */
  aggregate(results: SearchResult[]): SearchResult;

  /**
   * Merge file matches from different providers
   */
  mergeFileMatches(fileMatches: FileMatch[]): FileMatch[];

  /**
   * Calculate combined relevance score
   */
  calculateCombinedScore(results: SearchResult[]): number;
}
