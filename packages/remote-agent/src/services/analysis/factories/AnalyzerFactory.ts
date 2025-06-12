import { IAnalysisStrategy } from "../interfaces/IAnalysisStrategy";
import { ICacheManager, ICacheManagerFactory } from "../interfaces/ICacheManager";
import { ISearchProvider, ISearchProviderFactory } from "../interfaces/ISearchProvider";
import { LLMAnalysisStrategy } from "../strategies/LLMAnalysisStrategy";
import { RuleBasedAnalysisStrategy } from "../strategies/RuleBasedAnalysisStrategy";
import { HybridAnalysisStrategy } from "../strategies/HybridAnalysisStrategy";
import { MemoryCacheManager, FileMemoryCacheManager } from "../cache/MemoryCacheManager";
import { RipgrepSearchProvider } from "../search/RipgrepSearchProvider";
import { FileSystemSearchProvider } from "../search/FileSystemSearchProvider";
import { LLMService } from "../../llm";

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
    const llmStrategy = new LLMAnalysisStrategy(llmService, options);

    if (await llmStrategy.isAvailable()) {
      console.log('🧠 Using LLM analysis strategy');
      return llmStrategy;
    }

    console.log('🔄 LLM not available, using hybrid strategy');
    return new HybridAnalysisStrategy(llmService, options);
  }
}

export class CacheManagerFactory implements ICacheManagerFactory {
  createCacheManager(type: CacheType, options: any = {}): ICacheManager {
    switch (type) {
      case 'memory':
        return new MemoryCacheManager(options);
      case 'file':
        console.warn('File-based cache not implemented, using memory cache');
        return new MemoryCacheManager(options);
      case 'redis':
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
        return new HybridSearchProvider(this.workspacePath);
      default:
        throw new Error(`Unknown search provider type: ${type}`);
    }
  }

  async getBestProvider(): Promise<ISearchProvider> {
    const ripgrep = new RipgrepSearchProvider(this.workspacePath);
    if (await ripgrep.isAvailable()) {
      return ripgrep;
    }

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

    const strategy = await AnalysisStrategyFactory.create(
      type,
      workspacePath,
      llmService,
      options
    );

    const cacheFactory = new CacheManagerFactory();
    const cacheManager = cacheFactory.createCacheManager(cacheType, options.cacheConfig);

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

class HybridSearchProvider extends RipgrepSearchProvider {
  readonly name = 'hybrid';
  private fallbackProvider: FileSystemSearchProvider;

  constructor(workspacePath: string) {
    super(workspacePath);
    this.fallbackProvider = new FileSystemSearchProvider(workspacePath);
  }

  async search(pattern: string, files: string[], options: any = {}): Promise<any> {
    try {
      return await super.search(pattern, files, options);
    } catch (error) {
      console.warn('Ripgrep search failed, falling back to filesystem search:', error);
      return await this.fallbackProvider.search(pattern, files, options);
    }
  }

  async isAvailable(): Promise<boolean> {
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
