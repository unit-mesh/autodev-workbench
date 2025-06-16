import { ToolLike } from "../../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

import {
  SymbolAnalyser, CodeCollector, SymbolInfo,
  LanguageServiceProvider, SymbolKind, ILanguageServiceProvider, InstantiationService
} from "@autodev/context-worker";

export const installSearchKeywordsTool: ToolLike = (installer) => {
  installer("search-keywords", "Search for specific programming language symbols (classes, functions, methods, variables, interfaces, etc.) in a source code file using advanced AST-based SymbolAnalyser. This tool finds code structure elements, not text keywords.", {
    file_path: z.string().describe("Path to the source code file to analyze for programming symbols"),
    symbols: z.array(z.string()).describe("Array of programming symbol names to search for (e.g., class names, function names, method names, variable names, interface names)"),
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

      // Check if path exists
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

      // Check if path is a directory
      const stats = fs.statSync(resolvedPath);
      if (stats.isDirectory()) {
        return {
          content: [
            {
              type: "text",
              text: `Error: '${file_path}' is a directory, not a file. Please provide a specific file path.`
            }
          ]
        };
      }

      // Check if it's a regular file
      if (!stats.isFile()) {
        return {
          content: [
            {
              type: "text",
              text: `Error: '${file_path}' is not a regular file.`
            }
          ]
        };
      }

      console.log('🔧 Initializing SymbolAnalyser for programming symbol search...');

      const service = new InstantiationService();
      service.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider);

      // Initialize SymbolAnalyser and CodeCollector
      const languageServiceProvider = service.get(ILanguageServiceProvider);
      await languageServiceProvider.ready(); // Wait for language service to be ready

      const symbolAnalyser = new SymbolAnalyser(languageServiceProvider)
      const codeCollector = new CodeCollector(workspacePath);

      console.log(`🔍 Analyzing file: ${resolvedPath}`);

      // Read file content and check language support
      const content = fs.readFileSync(resolvedPath, 'utf8');
      const language = codeCollector.inferLanguage(resolvedPath);

      if (!language) {
        return {
          content: [
            {
              type: "text",
              text: `Error: File '${file_path}' has unsupported language or file type.`
            }
          ]
        };
      }

      // Set files in collector - this is the correct way based on CodeAnalyzer
      codeCollector.setAllFiles([{
        file: resolvedPath,
        content: content,
        language: language
      }]);

      console.log(`🔍 Language detected: ${language}`);
      console.log(`📄 File content length: ${content.length} characters`);
      console.log(`📁 Files in collector: ${codeCollector.getAllFiles().length}`);

      // Perform symbol analysis
      const symbolAnalysisResult = await symbolAnalyser.analyze(codeCollector);
      console.log(`📊 SymbolAnalyser found ${symbolAnalysisResult.symbols.length} programming symbols`);

      // If no symbols found, provide helpful information
      if (symbolAnalysisResult.symbols.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                description: "AST-based programming symbol search results",
                searched_for: symbols,
                found_count: 0,
                total_symbols_in_file: 0,
                file_path: path.relative(workspacePath, resolvedPath),
                language: language,
                symbol_types_found: [],
                results: [],
                note: `No symbols were found in the ${language} file. This could be due to:
1. The file contains only simple code without classes, functions, or interfaces
2. The tree-sitter parser for ${language} may not be properly configured
3. The symbol extraction queries may need adjustment for this specific code structure

File content preview (first 200 chars):
${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`
              }, null, 2)
            }
          ]
        };
      }

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

      console.log(`🎯 Found ${matchedSymbols.length} matching programming symbols out of ${symbolAnalysisResult.symbols.length} total symbols`);

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
          [SymbolKind.Constant]: 'constant',
          [SymbolKind.EnumMember]: 'enum_member',
          [SymbolKind.Struct]: 'struct',
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
          qualified_name: symbolInfo.qualifiedName,
          symbol_kind: symbolInfo.kind
        };
      }).sort((a, b) => a.line - b.line);

      const summary = {
        description: "AST-based programming symbol search results",
        searched_for: symbols,
        found_count: results.length,
        total_symbols_in_file: symbolAnalysisResult.symbols.length,
        file_path: path.relative(workspacePath, resolvedPath),
        language: language,
        symbol_types_found: [...new Set(results.map(r => r.type))],
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
      console.error('Error in programming symbol search:', error);
      return {
        content: [
          {
            type: "text",
            text: `Error searching programming symbols in '${file_path}': ${error.message}`
          }
        ]
      };
    }
  });
};
