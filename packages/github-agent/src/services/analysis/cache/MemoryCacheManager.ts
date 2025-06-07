/**
 * Memory Cache Manager
 * 
 * Implements in-memory caching using the Strategy Pattern.
 * Provides fast access with automatic cleanup and TTL support.
 */

import { 
  ICacheManager, 
  IFileCacheManager, 
  CacheEntry, 
  CacheOptions, 
  CacheStats,
  CacheConfig,
  DEFAULT_CACHE_CONFIG 
} from "../interfaces/ICacheManager";
import * as fs from 'fs';
import * as path from 'path';

export class MemoryCacheManager implements ICacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    
    if (this.config.cleanupInterval) {
      this.startCleanupTimer();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.config.defaultTTL;
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      tags: options.tags
    };

    this.cache.set(key, entry);

    // Enforce max size if configured
    if (this.config.maxSize && this.cache.size > this.config.maxSize) {
      await this.evictOldest();
    }
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  async clearByTags(tags: string[]): Promise<number> {
    let cleared = 0;
    const tagSet = new Set(tags);

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tagSet.has(tag))) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  async cleanup(): Promise<number> {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) {
      return allKeys;
    }

    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private async evictOldest(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.config.cleanupInterval);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

export class FileMemoryCacheManager extends MemoryCacheManager implements IFileCacheManager {
  private workspacePath: string;
  private fileStats = new Map<string, fs.Stats>();

  constructor(workspacePath: string, config: Partial<CacheConfig> = {}) {
    super(config);
    this.workspacePath = workspacePath;
  }

  async getFileContent(filePath: string): Promise<string | null> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspacePath, filePath);
    const cacheKey = `file:${fullPath}`;

    // Check if file has been modified
    try {
      const stats = await fs.promises.stat(fullPath);
      const cachedStats = this.fileStats.get(fullPath);
      
      if (cachedStats && stats.mtime.getTime() !== cachedStats.mtime.getTime()) {
        // File has been modified, invalidate cache
        await this.delete(cacheKey);
        this.fileStats.delete(fullPath);
      }
      
      this.fileStats.set(fullPath, stats);
    } catch (error) {
      // File doesn't exist or can't be accessed
      return null;
    }

    // Try to get from cache
    let content = await this.get<string>(cacheKey);
    
    if (content === null) {
      // Load from disk
      try {
        content = await fs.promises.readFile(fullPath, 'utf-8');
        await this.cacheFileContent(filePath, content);
      } catch (error) {
        return null;
      }
    }

    return content;
  }

  async cacheFileContent(filePath: string, content: string): Promise<void> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspacePath, filePath);
    const cacheKey = `file:${fullPath}`;
    
    await this.set(cacheKey, content, {
      ttl: this.config.fileCacheTTL,
      tags: ['file-content']
    });
  }

  async invalidateModifiedFiles(): Promise<number> {
    let invalidated = 0;
    
    for (const [fullPath, cachedStats] of this.fileStats.entries()) {
      try {
        const currentStats = await fs.promises.stat(fullPath);
        
        if (currentStats.mtime.getTime() !== cachedStats.mtime.getTime()) {
          const cacheKey = `file:${fullPath}`;
          await this.delete(cacheKey);
          this.fileStats.delete(fullPath);
          invalidated++;
        }
      } catch (error) {
        // File no longer exists, remove from cache
        const cacheKey = `file:${fullPath}`;
        await this.delete(cacheKey);
        this.fileStats.delete(fullPath);
        invalidated++;
      }
    }

    return invalidated;
  }

  async preloadFiles(filePaths: string[]): Promise<void> {
    const loadPromises = filePaths.map(async (filePath) => {
      try {
        await this.getFileContent(filePath);
      } catch (error) {
        console.warn(`Failed to preload file ${filePath}:`, error);
      }
    });

    await Promise.all(loadPromises);
  }
}
