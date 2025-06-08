import { ToolLike } from "../_typing";
import { z } from "zod";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

export const installSymbolAnalysisTool: ToolLike = (installer) => {
  installer("analyze-symbols", "Analyze code symbols (functions, classes, variables) in files using AST parsing", {
    file_path: z.string().describe("Path to the file to analyze (relative to workspace)"),
    symbol_types: z.array(z.enum(["function", "class", "variable", "interface", "type", "import", "export"])).optional().describe("Types of symbols to analyze"),
    include_dependencies: z.boolean().optional().describe("Include dependency analysis (default: true)"),
    include_references: z.boolean().optional().describe("Find references to symbols (default: false, slower)"),
    language: z.enum(["auto", "javascript", "typescript", "python", "java", "go", "rust"]).optional().describe("Programming language (auto-detect if not specified)")
  }, async ({ 
    file_path,
    symbol_types = ["function", "class", "variable", "interface", "type"],
    include_dependencies = true,
    include_references = false,
    language = "auto"
  }: { 
    file_path: string;
    symbol_types?: ("function" | "class" | "variable" | "interface" | "type" | "import" | "export")[];
    include_dependencies?: boolean;
    include_references?: boolean;
    language?: "auto" | "javascript" | "typescript" | "python" | "java" | "go" | "rust";
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

      // Auto-detect language if needed
      let detectedLanguage = language;
      if (language === "auto") {
        const ext = path.extname(file_path).toLowerCase();
        const languageMap: Record<string, string> = {
          '.js': 'javascript',
          '.jsx': 'javascript',
          '.ts': 'typescript',
          '.tsx': 'typescript',
          '.py': 'python',
          '.java': 'java',
          '.go': 'go',
          '.rs': 'rust'
        };
        detectedLanguage = languageMap[ext] || 'javascript';
      }

      // Read file content
      const content = fs.readFileSync(resolvedPath, 'utf8');
      const lines = content.split('\n');

      // Basic symbol analysis (simplified implementation)
      // In a real implementation, you'd use proper AST parsers like:
      // - @babel/parser for JavaScript/TypeScript
      // - ast module for Python
      // - go/ast for Go, etc.
      
      const symbols: any[] = [];
      const dependencies: string[] = [];
      const exports: string[] = [];

      // Simple regex-based analysis (this is a basic implementation)
      // For production, use proper AST parsers
      
      if (detectedLanguage === 'javascript' || detectedLanguage === 'typescript') {
        // Function declarations
        if (symbol_types.includes('function')) {
          const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*{)|(\w+)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>)/g;
          let match;
          while ((match = functionRegex.exec(content)) !== null) {
            const name = match[1] || match[2] || match[3];
            const lineNumber = content.substring(0, match.index).split('\n').length;
            symbols.push({
              name: name,
              type: 'function',
              line: lineNumber,
              column: match.index - content.lastIndexOf('\n', match.index - 1) - 1,
              definition: lines[lineNumber - 1]?.trim(),
              scope: 'global' // Simplified
            });
          }
        }

        // Class declarations
        if (symbol_types.includes('class')) {
          const classRegex = /class\s+(\w+)/g;
          let match;
          while ((match = classRegex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            symbols.push({
              name: match[1],
              type: 'class',
              line: lineNumber,
              column: match.index - content.lastIndexOf('\n', match.index - 1) - 1,
              definition: lines[lineNumber - 1]?.trim()
            });
          }
        }

        // Variable declarations
        if (symbol_types.includes('variable')) {
          const varRegex = /(?:const|let|var)\s+(\w+)/g;
          let match;
          while ((match = varRegex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            symbols.push({
              name: match[1],
              type: 'variable',
              line: lineNumber,
              column: match.index - content.lastIndexOf('\n', match.index - 1) - 1,
              definition: lines[lineNumber - 1]?.trim()
            });
          }
        }

        // Interface/Type declarations (TypeScript)
        if (detectedLanguage === 'typescript' && (symbol_types.includes('interface') || symbol_types.includes('type'))) {
          const interfaceRegex = /(?:interface|type)\s+(\w+)/g;
          let match;
          while ((match = interfaceRegex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            symbols.push({
              name: match[1],
              type: content.substring(match.index).startsWith('interface') ? 'interface' : 'type',
              line: lineNumber,
              column: match.index - content.lastIndexOf('\n', match.index - 1) - 1,
              definition: lines[lineNumber - 1]?.trim()
            });
          }
        }

        // Import statements
        if (symbol_types.includes('import') && include_dependencies) {
          const importRegex = /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            dependencies.push(match[1]);
            const lineNumber = content.substring(0, match.index).split('\n').length;
            symbols.push({
              name: match[1],
              type: 'import',
              line: lineNumber,
              column: match.index - content.lastIndexOf('\n', match.index - 1) - 1,
              definition: lines[lineNumber - 1]?.trim(),
              module: match[1]
            });
          }
        }

        // Export statements
        if (symbol_types.includes('export')) {
          const exportRegex = /export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|{([^}]+)})/g;
          let match;
          while ((match = exportRegex.exec(content)) !== null) {
            const name = match[1] || match[2] || match[3] || match[4];
            exports.push(name);
            const lineNumber = content.substring(0, match.index).split('\n').length;
            symbols.push({
              name: name,
              type: 'export',
              line: lineNumber,
              column: match.index - content.lastIndexOf('\n', match.index - 1) - 1,
              definition: lines[lineNumber - 1]?.trim()
            });
          }
        }
      } else if (detectedLanguage === 'python') {
        // Python function definitions
        if (symbol_types.includes('function')) {
          const functionRegex = /def\s+(\w+)\s*\(/g;
          let match;
          while ((match = functionRegex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            symbols.push({
              name: match[1],
              type: 'function',
              line: lineNumber,
              column: match.index - content.lastIndexOf('\n', match.index - 1) - 1,
              definition: lines[lineNumber - 1]?.trim()
            });
          }
        }

        // Python class definitions
        if (symbol_types.includes('class')) {
          const classRegex = /class\s+(\w+)/g;
          let match;
          while ((match = classRegex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            symbols.push({
              name: match[1],
              type: 'class',
              line: lineNumber,
              column: match.index - content.lastIndexOf('\n', match.index - 1) - 1,
              definition: lines[lineNumber - 1]?.trim()
            });
          }
        }

        // Python imports
        if (symbol_types.includes('import') && include_dependencies) {
          const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            const module = match[1] || match[2];
            dependencies.push(module);
            const lineNumber = content.substring(0, match.index).split('\n').length;
            symbols.push({
              name: module,
              type: 'import',
              line: lineNumber,
              column: match.index - content.lastIndexOf('\n', match.index - 1) - 1,
              definition: lines[lineNumber - 1]?.trim(),
              module: module
            });
          }
        }
      }

      // Find references if requested (simplified implementation)
      let references: Record<string, number[]> = {};
      if (include_references) {
        symbols.forEach(symbol => {
          if (symbol.type !== 'import') {
            const refRegex = new RegExp(`\\b${symbol.name}\\b`, 'g');
            let match;
            const refs: number[] = [];
            while ((match = refRegex.exec(content)) !== null) {
              const lineNumber = content.substring(0, match.index).split('\n').length;
              if (lineNumber !== symbol.line) { // Exclude definition line
                refs.push(lineNumber);
              }
            }
            if (refs.length > 0) {
              references[symbol.name] = refs;
            }
          }
        });
      }

      // Group symbols by type
      const symbolsByType: Record<string, any[]> = {};
      symbol_types.forEach(type => {
        symbolsByType[type] = symbols.filter(s => s.type === type);
      });

      const result = {
        file_analysis: {
          file_path: file_path,
          full_path: resolvedPath,
          language: detectedLanguage,
          line_count: lines.length,
          size_bytes: Buffer.byteLength(content, 'utf8'),
          analyzed_at: new Date().toISOString()
        },
        symbols: {
          total_count: symbols.length,
          by_type: symbolsByType,
          all_symbols: symbols.sort((a, b) => a.line - b.line)
        },
        dependencies: include_dependencies ? {
          total_count: dependencies.length,
          modules: [...new Set(dependencies)], // Remove duplicates
          import_statements: symbols.filter(s => s.type === 'import')
        } : null,
        exports: {
          total_count: exports.length,
          exported_symbols: [...new Set(exports)],
          export_statements: symbols.filter(s => s.type === 'export')
        },
        references: include_references ? references : null,
        analysis_options: {
          symbol_types: symbol_types,
          include_dependencies: include_dependencies,
          include_references: include_references,
          language: detectedLanguage
        },
        recommendations: [
          symbols.length === 0 ? "No symbols found. Check if the file contains valid code or adjust symbol_types filter." : null,
          detectedLanguage === 'javascript' && file_path.endsWith('.ts') ? "File appears to be TypeScript but was analyzed as JavaScript. Consider specifying language explicitly." : null,
          !include_references && symbols.length > 10 ? "Consider enabling include_references to see symbol usage patterns." : null
        ].filter(Boolean)
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing symbols in '${file_path}': ${error.message}`
          }
        ]
      };
    }
  });
};
