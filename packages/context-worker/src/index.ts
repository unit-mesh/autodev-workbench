/**
 * Context Worker Library Exports
 *
 * This file exports the main components of the context-worker package
 * for use by other packages in the monorepo.
 */

// Core analyzer exports
export { SymbolAnalyser } from './analyzer/analyzers/SymbolAnalyser';
export { CodeCollector } from './analyzer/CodeCollector';
export {
  SymbolAnalysisResult,
  SymbolInfo,
  FileSymbols,
  CodeAnalysisResult
} from './analyzer/CodeAnalysisResult';

// Language service exports
export {
  ILanguageServiceProvider,
  LanguageServiceProvider
} from './base/common/languages/languageService';

// Symbol extraction exports
export {
  CodeSymbol,
  SymbolExtractor,
  SymbolKind
} from './code-context/base/SymbolExtractor';

export {
  InstantiationService,
  providerContainer
} from './base/common/instantiation/instantiationService';
export * from './base/common/instantiation/instantiation';

// Language utilities
export { inferLanguage } from './base/common/languages/languages';

// Other analyzer interfaces
export { ICodeAnalyzer } from './analyzer/analyzers/ICodeAnalyzer';

// File system utilities
export { FileSystemScanner } from './analyzer/FileSystemScanner';
