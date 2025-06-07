/**
 * Analysis Module Index
 * 
 * Exports all the design pattern implementations for the analysis system.
 * This provides a clean interface for importing analysis components.
 */

// Interfaces
export * from './interfaces/IAnalysisStrategy';
export * from './interfaces/ICacheManager';
export * from './interfaces/ISearchProvider';

// Strategies
export * from './strategies/LLMAnalysisStrategy';
export * from './strategies/RuleBasedAnalysisStrategy';
export * from './strategies/HybridAnalysisStrategy';

// Cache Managers
export * from './cache/MemoryCacheManager';

// Search Providers
export * from './search/RipgrepSearchProvider';
export * from './search/FileSystemSearchProvider';

// Factories
export * from './factories/AnalyzerFactory';

// Re-export the main analyzer
export { ContextAnalyzer } from '../context-analyzer';
