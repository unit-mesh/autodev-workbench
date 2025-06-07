/**
 * Regex caching utility to avoid recompiling the same patterns
 * Improves performance for frequently used regex patterns
 */

export class RegexCache {
  private static instance: RegexCache;
  private cache = new Map<string, RegExp>();

  static getInstance(): RegexCache {
    if (!RegexCache.instance) {
      RegexCache.instance = new RegexCache();
    }
    return RegexCache.instance;
  }

  /**
   * Get or create a cached regex pattern
   */
  getRegex(pattern: string, flags?: string): RegExp {
    const key = `${pattern}:::${flags || ''}`;
    
    if (!this.cache.has(key)) {
      this.cache.set(key, new RegExp(pattern, flags));
    }
    
    return this.cache.get(key)!;
  }

  /**
   * Pre-compile commonly used patterns
   */
  precompileCommonPatterns(): void {
    // URL patterns
    this.getRegex('https?:\\/\\/[^\\s)]+', 'g');
    
    // Code patterns
    this.getRegex('\\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\\b', 'g'); // camelCase
    this.getRegex('\\b[a-z]+_[a-z_]+\\b', 'g'); // snake_case
    this.getRegex('\\b[A-Z][a-zA-Z0-9]*\\b', 'g'); // PascalCase
    
    // File patterns
    this.getRegex('\\.(ts|js|tsx|jsx|py|java|cpp|c|h|cs|php|rb|go|rs|kt|swift)$');
    this.getRegex('\\.(json|yaml|yml|toml|xml|config)$');
    
    // Error patterns
    this.getRegex('\\berror\\s*:\\s*[^\\n]+', 'gi');
    this.getRegex('\\bfailed\\s*:\\s*[^\\n]+', 'gi');
    
    // Version patterns
    this.getRegex('\\b\\d+\\.\\d+\\.\\d+\\b', 'g');
    
    // Constants
    this.getRegex('\\b[A-Z_]{3,}\\b', 'g');
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const regexCache = RegexCache.getInstance();

// Pre-compile common patterns on module load
regexCache.precompileCommonPatterns();
