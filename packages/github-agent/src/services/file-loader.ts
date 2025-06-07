/**
 * Centralized file loading service with caching and size limits
 * Optimizes file I/O operations across the application
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileLoadOptions {
  maxSize?: number; // Default 10MB
  encoding?: BufferEncoding; // Default 'utf-8'
  useCache?: boolean; // Default true
}

interface CachedFile {
  content: string;
  mtime: number;
  size: number;
}

export class FileLoader {
  private static instance: FileLoader;
  private cache = new Map<string, CachedFile>();
  private readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

  static getInstance(): FileLoader {
    if (!FileLoader.instance) {
      FileLoader.instance = new FileLoader();
    }
    return FileLoader.instance;
  }

  /**
   * Load file content with caching and size validation
   */
  async loadFile(filePath: string, options: FileLoadOptions = {}): Promise<string | null> {
    const {
      maxSize = this.DEFAULT_MAX_SIZE,
      encoding = 'utf-8',
      useCache = true
    } = options;

    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
      
      // Check file stats first
      const stats = await fs.promises.stat(fullPath);
      
      // Size check
      if (stats.size > maxSize) {
        console.warn(`File too large: ${filePath} (${stats.size} bytes > ${maxSize} bytes)`);
        return null;
      }

      // Cache check
      if (useCache) {
        const cached = this.cache.get(fullPath);
        if (cached && cached.mtime === stats.mtime.getTime()) {
          return cached.content;
        }
      }

      // Load file
      const content = await fs.promises.readFile(fullPath, encoding);
      
      // Update cache
      if (useCache) {
        this.cache.set(fullPath, {
          content,
          mtime: stats.mtime.getTime(),
          size: stats.size
        });
      }

      return content;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load multiple files concurrently with batching
   */
  async loadFiles(filePaths: string[], options: FileLoadOptions = {}): Promise<Array<{
    path: string;
    content: string | null;
    error?: string;
  }>> {
    const BATCH_SIZE = 10; // Process 10 files at a time
    const results: Array<{ path: string; content: string | null; error?: string }> = [];

    for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
      const batch = filePaths.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (filePath) => {
        try {
          const content = await this.loadFile(filePath, options);
          return { path: filePath, content };
        } catch (error) {
          return { 
            path: filePath, 
            content: null, 
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Check if file exists and is readable
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats without loading content
   */
  async getStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.promises.stat(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Clear cache for specific file or all files
   */
  clearCache(filePath?: string): void {
    if (filePath) {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
      this.cache.delete(fullPath);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; totalSize: number } {
    let totalSize = 0;
    for (const cached of this.cache.values()) {
      totalSize += cached.size;
    }
    return {
      size: this.cache.size,
      totalSize
    };
  }
}

// Export singleton instance
export const fileLoader = FileLoader.getInstance();
