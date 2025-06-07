/**
 * Analyzer Factory
 * 
 * Implements the Factory Pattern to create different types of analyzers
 * and analysis components based on configuration and availability.
 */

import { IAnalysisStrategy } from "../interfaces/IAnalysisStrategy";
import { ICacheManager, ICacheManagerFactory } from "../interfaces/ICacheManager";
import { ISearchProvider, ISearchProviderFactory } from "../interfaces/ISearchProvider";
import { LLMAnalysisStrategy } from "../strategies/LLMAnalysisStrategy";
import { RuleBasedAnalysisStrategy } from "../strategies/RuleBasedAnalysisStrategy";
import { HybridAnalysisStrategy } from "../strategies/HybridAnalysisStrategy";
import { MemoryCacheManager, FileMemoryCacheManager } from "../cache/MemoryCacheManager";
import { RipgrepSearchProvider } from "../search/RipgrepSearchProvider";
import { FileSystemSearchProvider } from "../search/FileSystemSearchProvider";
import { LLMService } from "../../llm-service";

export type AnalyzerType = 'llm' | 'rule-based' | 'hybrid' | 'auto';
export type CacheType = 'memory' | 'file' | 'redis';
export type SearchType = 'ripgrep' | 'filesystem' | 'hybrid';

export interface AnalyzerConfig {
  type: AnalyzerType;
  workspacePath: string;
  cacheType?: CacheType;
  searchType?: SearchType;
  llmService?: LLMService;
  options?: {
    batchSize?: number;
    maxFilesToAnalyze?: number;
    cacheConfig?: any;
    searchOptions?: any;
  };
}

export interface AnalyzerComponents {
  strategy: IAnalysisStrategy;
  cacheManager: ICacheManager;
  searchProvider: ISearchProvider;
}

/**
 * Factory for creating analysis strategies
 */
export class AnalysisStrategyFactory {
  static async create(
    type: AnalyzerType,
    workspacePath: string,
    llmService?: LLMService,
    options: any = {}
  ): Promise<IAnalysisStrategy> {
    switch (type) {
      case 'llm':
        return new LLMAnalysisStrategy(llmService, options);
      
      case 'rule-based':
        return new RuleBasedAnalysisStrategy();
      
      case 'hybrid':
        return new HybridAnalysisStrategy(llmService, options);
      
      case 'auto':
        return await this.createAutoStrategy(workspacePath, llmService, options);
      
      default:
        throw new Error(`Unknown analyzer type: ${type}`);
    }
  }

  private static async createAutoStrategy(
    workspacePath: string,
    llmService?: LLMService,
    options: any = {}
  ): Promise<IAnalysisStrategy> {
    // Try LLM first, fall back to hybrid, then rule-based
    const llmStrategy = new LLMAnalysisStrategy(llmService, options);
    
    if (await llmStrategy.isAvailable()) {
      console.log('🧠 Using LLM analysis strategy');
      return llmStrategy;
    }

    console.log('🔄 LLM not available, using hybrid strategy');
    return new HybridAnalysisStrategy(llmService, options);
  }
}

/**
 * Factory for creating cache managers
 */
export class CacheManagerFactory implements ICacheManagerFactory {
  createCacheManager(type: CacheType, options: any = {}): ICacheManager {
    switch (type) {
      case 'memory':
        return new MemoryCacheManager(options);
      
      case 'file':
        // For file-based caching, we could implement a file-backed cache
        // For now, fall back to memory cache
        console.warn('File-based cache not implemented, using memory cache');
        return new MemoryCacheManager(options);
      
      case 'redis':
        // For Redis caching, we could implement a Redis-backed cache
        // For now, fall back to memory cache
        console.warn('Redis cache not implemented, using memory cache');
        return new MemoryCacheManager(options);
      
      default:
        throw new Error(`Unknown cache type: ${type}`);
    }
  }

  createFileCacheManager(workspacePath: string, options: any = {}): FileMemoryCacheManager {
    return new FileMemoryCacheManager(workspacePath, options);
  }
}

/**
 * Factory for creating search providers
 */
export class SearchProviderFactory implements ISearchProviderFactory {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  createProvider(type: SearchType): ISearchProvider {
    switch (type) {
      case 'ripgrep':
        return new RipgrepSearchProvider(this.workspacePath);
      
      case 'filesystem':
        return new FileSystemSearchProvider(this.workspacePath);
      
      case 'hybrid':
        // Hybrid provider that tries ripgrep first, falls back to filesystem
        return new HybridSearchProvider(this.workspacePath);
      
      default:
        throw new Error(`Unknown search provider type: ${type}`);
    }
  }

  async getBestProvider(): Promise<ISearchProvider> {
    // Try ripgrep first (fastest)
    const ripgrep = new RipgrepSearchProvider(this.workspacePath);
    if (await ripgrep.isAvailable()) {
      return ripgrep;
    }

    // Fall back to filesystem search
    console.log('Ripgrep not available, using filesystem search');
    return new FileSystemSearchProvider(this.workspacePath);
  }

  async getAvailableProviders(): Promise<ISearchProvider[]> {
    const providers: ISearchProvider[] = [];
    
    const ripgrep = new RipgrepSearchProvider(this.workspacePath);
    if (await ripgrep.isAvailable()) {
      providers.push(ripgrep);
    }

    providers.push(new FileSystemSearchProvider(this.workspacePath));
    
    return providers;
  }
}

/**
 * Main analyzer factory that creates complete analyzer instances
 */
export class AnalyzerFactory {
  static async create(config: AnalyzerConfig): Promise<AnalyzerComponents> {
    const {
      type,
      workspacePath,
      cacheType = 'memory',
      searchType = 'ripgrep',
      llmService,
      options = {}
    } = config;

    // Create strategy
    const strategy = await AnalysisStrategyFactory.create(
      type,
      workspacePath,
      llmService,
      options
    );

    // Create cache manager
    const cacheFactory = new CacheManagerFactory();
    const cacheManager = cacheFactory.createCacheManager(cacheType, options.cacheConfig);

    // Create search provider
    const searchFactory = new SearchProviderFactory(workspacePath);
    let searchProvider: ISearchProvider;
    
    if (searchType === 'hybrid') {
      searchProvider = await searchFactory.getBestProvider();
    } else {
      searchProvider = searchFactory.createProvider(searchType);
    }

    return {
      strategy,
      cacheManager,
      searchProvider
    };
  }

  static async createAuto(workspacePath: string, llmService?: LLMService): Promise<AnalyzerComponents> {
    return this.create({
      type: 'auto',
      workspacePath,
      cacheType: 'memory',
      searchType: 'hybrid',
      llmService
    });
  }
}

/**
 * Hybrid search provider that combines multiple search strategies
 */
class HybridSearchProvider extends RipgrepSearchProvider {
  readonly name = 'hybrid';
  
  private fallbackProvider: FileSystemSearchProvider;

  constructor(workspacePath: string) {
    super(workspacePath);
    this.fallbackProvider = new FileSystemSearchProvider(workspacePath);
  }

  async search(pattern: string, files: string[], options: any = {}): Promise<any> {
    try {
      // Try ripgrep first
      return await super.search(pattern, files, options);
    } catch (error) {
      console.warn('Ripgrep search failed, falling back to filesystem search:', error);
      // Fall back to filesystem search
      return await this.fallbackProvider.search(pattern, files, options);
    }
  }

  async isAvailable(): Promise<boolean> {
    // Hybrid is always available since it has filesystem fallback
    return true;
  }

  getCapabilities(): any {
    return {
      supportsRegex: true,
      supportsContextLines: true,
      supportsParallelSearch: true,
      supportsFileFiltering: true,
      maxConcurrentSearches: 5,
      estimatedPerformance: 'medium'
    };
  }
}
