import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Import SymbolAnalyser and related types from context-worker
import {
  SymbolAnalyser,
  CodeCollector,
  SymbolAnalysisResult,
  SymbolInfo,
  ILanguageServiceProvider,
  LanguageServiceProvider,
  SymbolKind
} from "@autodev/context-worker";

export const installSymbolSearchTool: ToolLike = (installer) => {
  installer("search-symbols", "Search for specific symbols in a file using SymbolAnalyser", {
    file_path: z.string().describe("Path to the file to analyze"),
    symbols: z.array(z.string()).describe("Array of symbol names to search for"),
  }, async ({
    file_path,
    symbols,
  }: {
    file_path: string;
    symbols: string[];
  }) => {
    try {
      // Resolve file path
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const fullPath = path.isAbsolute(file_path) ? file_path : path.join(workspacePath, file_path);

      // Security check - ensure path is within workspace
      const resolvedPath = path.resolve(fullPath);
      const resolvedWorkspace = path.resolve(workspacePath);
      if (!resolvedPath.startsWith(resolvedWorkspace)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: File path '${file_path}' is outside the workspace directory.`
            }
          ]
        };
      }

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: File '${file_path}' does not exist.`
            }
          ]
        };
      }

      console.log('🔧 Initializing SymbolAnalyser for symbol search...');

      // Initialize SymbolAnalyser
      const languageService = new LanguageServiceProvider();
      const symbolAnalyser = new SymbolAnalyser(languageService);
      const codeCollector = new CodeCollector(workspacePath);

      // Add the file to the collector
      const content = fs.readFileSync(resolvedPath, 'utf8');
      const language = codeCollector.inferLanguage(resolvedPath) || 'unknown';
      codeCollector.setAllFiles([{
        file: resolvedPath,
        content: content,
        language: language
      }]);

      // Perform symbol analysis
      const symbolAnalysisResult = await symbolAnalyser.analyze(codeCollector);
      console.log(`📊 SymbolAnalyser found ${symbolAnalysisResult.symbols.length} symbols`);

      // Filter symbols based on the requested symbol names
      const matchedSymbols: SymbolInfo[] = [];
      const symbolsLowerCase = symbols.map(s => s.toLowerCase());

      for (const symbol of symbolAnalysisResult.symbols) {
        // Check if symbol name matches any of the requested symbols (case-insensitive)
        if (symbolsLowerCase.includes(symbol.name.toLowerCase()) ||
            symbolsLowerCase.some(searchSymbol =>
              symbol.name.toLowerCase().includes(searchSymbol) ||
              symbol.qualifiedName.toLowerCase().includes(searchSymbol)
            )) {
          matchedSymbols.push(symbol);
        }
      }

      console.log(`🎯 Found ${matchedSymbols.length} matching symbols out of ${symbolAnalysisResult.symbols.length} total symbols`);

      // Helper function to convert SymbolKind to string
      const getSymbolTypeName = (kind: number): string => {
        const kindMap: Record<number, string> = {
          [SymbolKind.Module]: 'module',
          [SymbolKind.Class]: 'class',
          [SymbolKind.Method]: 'method',
          [SymbolKind.Field]: 'property',
          [SymbolKind.Enum]: 'enum',
          [SymbolKind.Interface]: 'interface',
          [SymbolKind.Function]: 'function',
          [SymbolKind.Variable]: 'variable',
          [SymbolKind.Constant]: 'variable',
          [SymbolKind.EnumMember]: 'property',
          [SymbolKind.Struct]: 'class',
          [SymbolKind.Import]: 'import'
        };
        return kindMap[kind] || 'unknown';
      };

      // Convert matched symbols to simplified format with declaration lines
      const lines = content.split('\n');
      const results = matchedSymbols.map(symbolInfo => {
        const lineNumber = symbolInfo.position.start.row + 1; // Convert to 1-based line numbers
        const declarationLine = lines[symbolInfo.position.start.row]?.trim() || '';

        return {
          name: symbolInfo.name,
          type: getSymbolTypeName(symbolInfo.kind),
          line: lineNumber,
          declaration: declarationLine,
          file_path: path.relative(workspacePath, symbolInfo.filePath),
          qualified_name: symbolInfo.qualifiedName
        };
      }).sort((a, b) => a.line - b.line);

      const summary = {
        searched_for: symbols,
        found_count: results.length,
        total_symbols_in_file: symbolAnalysisResult.symbols.length,
        file_path: path.relative(workspacePath, resolvedPath),
        results: results
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error('Error in symbol search:', error);
      return {
        content: [
          {
            type: "text",
            text: `Error searching symbols in '${file_path}': ${error.message}`
          }
        ]
      };
    }
  });
};
