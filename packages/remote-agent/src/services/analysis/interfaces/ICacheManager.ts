/**
 * Cache Manager Interface
 * 
 * Defines the contract for cache management using the Strategy Pattern.
 * Supports different caching strategies (memory, file-based, distributed, etc.)
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
  tags?: string[]; // for cache invalidation by tags
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  serialize?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Generic cache manager interface
 */
export interface ICacheManager {
  /**
   * Get a value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Check if a key exists in cache
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete a specific key from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Clear cache entries by tags
   */
  clearByTags(tags: string[]): Promise<number>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Clean up expired entries
   */
  cleanup(): Promise<number>;

  /**
   * Get all keys matching a pattern
   */
  keys(pattern?: string): Promise<string[]>;
}

/**
 * Specialized cache manager for file contents
 */
export interface IFileCacheManager extends ICacheManager {
  /**
   * Get file content from cache or load from disk
   */
  getFileContent(filePath: string): Promise<string | null>;

  /**
   * Cache file content with automatic TTL based on file modification time
   */
  cacheFileContent(filePath: string, content: string): Promise<void>;

  /**
   * Invalidate cache for files that have been modified
   */
  invalidateModifiedFiles(): Promise<number>;

  /**
   * Preload files into cache
   */
  preloadFiles(filePaths: string[]): Promise<void>;
}

/**
 * Cache manager factory interface
 */
export interface ICacheManagerFactory {
  /**
   * Create a cache manager instance
   */
  createCacheManager(type: 'memory' | 'file' | 'redis', options?: any): ICacheManager;

  /**
   * Create a file cache manager instance
   */
  createFileCacheManager(workspacePath: string, options?: any): IFileCacheManager;
}

/**
 * Cache decorator interface for adding caching to any service
 */
export interface ICacheDecorator<T> {
  /**
   * Wrap a service with caching capabilities
   */
  decorate(service: T, cacheManager: ICacheManager): T;
}

/**
 * Cache key generator interface
 */
export interface ICacheKeyGenerator {
  /**
   * Generate a cache key for an issue analysis
   */
  generateIssueKey(issueNumber: number, updatedAt: string): string;

  /**
   * Generate a cache key for codebase analysis
   */
  generateCodebaseKey(workspacePath: string): string;

  /**
   * Generate a cache key for file list
   */
  generateFileListKey(workspacePath: string): string;

  /**
   * Generate a cache key for search results
   */
  generateSearchKey(keywords: string[], files: string[]): string;

  /**
   * Generate a cache key for LLM analysis
   */
  generateLLMKey(prompt: string, model: string): string;
}

/**
 * Default cache key generator implementation
 */
export class DefaultCacheKeyGenerator implements ICacheKeyGenerator {
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  generateIssueKey(issueNumber: number, updatedAt: string): string {
    return `issue:${issueNumber}:${this.hashString(updatedAt)}`;
  }

  generateCodebaseKey(workspacePath: string): string {
    return `codebase:${this.hashString(workspacePath)}`;
  }

  generateFileListKey(workspacePath: string): string {
    return `filelist:${this.hashString(workspacePath)}`;
  }

  generateSearchKey(keywords: string[], files: string[]): string {
    const keywordHash = this.hashString(keywords.sort().join(','));
    const fileHash = this.hashString(files.sort().join(','));
    return `search:${keywordHash}:${fileHash}`;
  }

  generateLLMKey(prompt: string, model: string): string {
    const promptHash = this.hashString(prompt);
    return `llm:${model}:${promptHash}`;
  }
}

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  defaultTTL: number;
  fileCacheTTL: number;
  maxSize?: number;
  cleanupInterval?: number;
  compressionThreshold?: number;
  enableStats?: boolean;
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  fileCacheTTL: 2 * 60 * 1000, // 2 minutes
  maxSize: 1000,
  cleanupInterval: 60 * 1000, // 1 minute
  compressionThreshold: 1024, // 1KB
  enableStats: true,
};
