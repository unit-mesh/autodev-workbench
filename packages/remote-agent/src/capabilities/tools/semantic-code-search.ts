import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

interface CodeSnippet {
  file: string;
  content: string;
  startLine: number;
  endLine: number;
  relevance: number;
  context?: string;
}

export const installSemanticCodeSearchTool: ToolLike = (installer) => {
  installer("semantic-code-search", "AI-powered semantic code search that understands intent and context", {
    query: z.string().describe("Natural language query describing what you're looking for"),
    scope: z.array(z.string()).optional().describe("Directories to search within (relative paths)"),
    language: z.array(z.string()).optional().describe("Programming languages to filter by (e.g., ['typescript', 'javascript'])"),
    max_results: z.number().optional().default(10).describe("Maximum number of results to return"),
    include_context: z.boolean().optional().default(true).describe("Include surrounding context in results"),
    search_mode: z.enum(["semantic", "hybrid", "exact"]).optional().default("semantic").describe("Search mode: semantic (AI), hybrid (AI + keywords), or exact (keywords only)")
  }, async ({
    query,
    scope = ["."],
    language = [],
    max_results = 10,
    include_context = true,
    search_mode = "semantic"
  }: {
    query: string;
    scope?: string[];
    language?: string[];
    max_results?: number;
    include_context?: boolean;
    search_mode?: "semantic" | "hybrid" | "exact";
  }) => {
    try {
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      
      // Validate scope paths
      const validScopes = scope.map(s => {
        const fullPath = path.isAbsolute(s) ? s : path.join(workspacePath, s);
        const resolved = path.resolve(fullPath);
        if (!resolved.startsWith(path.resolve(workspacePath))) {
          throw new Error(`Scope '${s}' is outside workspace`);
        }
        return resolved;
      });

      // Build file patterns based on languages
      const filePatterns = language.length > 0 
        ? language.map(lang => getFilePatternForLanguage(lang)).flat()
        : ["**/*"];

      // Collect files to search
      const files: string[] = [];
      for (const scopePath of validScopes) {
        for (const pattern of filePatterns) {
          const matches = await glob(pattern, {
            cwd: scopePath,
            ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
            absolute: true
          });
          files.push(...matches);
        }
      }

      // Perform search based on mode
      let results: CodeSnippet[] = [];
      
      if (search_mode === "semantic" || search_mode === "hybrid") {
        // Semantic search implementation
        results = await performSemanticSearch(query, files, {
          includeContext: include_context,
          maxResults: max_results,
          hybridMode: search_mode === "hybrid"
        });
      } else {
        // Exact keyword search
        results = await performKeywordSearch(query, files, {
          includeContext: include_context,
          maxResults: max_results
        });
      }

      // Format results
      const formattedResults = results.map((result, index) => {
        const relativePath = path.relative(workspacePath, result.file);
        let output = `\n### Result ${index + 1}: ${relativePath}\n`;
        output += `Lines ${result.startLine}-${result.endLine} (Relevance: ${(result.relevance * 100).toFixed(1)}%)\n\n`;
        output += "```" + getLanguageFromFile(result.file) + "\n";
        output += result.content;
        output += "\n```";
        
        if (result.context && include_context) {
          output += `\n**Context**: ${result.context}\n`;
        }
        
        return output;
      });

      const summary = {
        query,
        search_mode,
        total_files_searched: files.length,
        results_found: results.length,
        scope: scope.join(", "),
        languages: language.length > 0 ? language.join(", ") : "all"
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2) + "\n" + formattedResults.join("\n")
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing semantic search: ${error.message}`
          }
        ]
      };
    }
  });
};

// Helper function to get file patterns for languages
function getFilePatternForLanguage(language: string): string[] {
  const patterns: Record<string, string[]> = {
    typescript: ["**/*.ts", "**/*.tsx"],
    javascript: ["**/*.js", "**/*.jsx"],
    python: ["**/*.py"],
    java: ["**/*.java"],
    go: ["**/*.go"],
    rust: ["**/*.rs"],
    cpp: ["**/*.cpp", "**/*.cc", "**/*.cxx", "**/*.hpp", "**/*.h"],
    csharp: ["**/*.cs"],
    ruby: ["**/*.rb"],
    php: ["**/*.php"],
    swift: ["**/*.swift"],
    kotlin: ["**/*.kt", "**/*.kts"],
    scala: ["**/*.scala"],
    // Add more languages as needed
  };
  
  return patterns[language.toLowerCase()] || [`**/*.${language}`];
}

// Helper function to detect language from file extension
function getLanguageFromFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const extToLang: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".py": "python",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cs": "csharp",
    ".rb": "ruby",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    // Add more mappings as needed
  };
  
  return extToLang[ext] || "";
}

// Placeholder for semantic search implementation
async function performSemanticSearch(
  query: string, 
  files: string[], 
  options: {
    includeContext: boolean;
    maxResults: number;
    hybridMode: boolean;
  }
): Promise<CodeSnippet[]> {
  // This is a placeholder implementation
  // In a real implementation, this would:
  // 1. Use embeddings to convert query and code to vectors
  // 2. Perform similarity search
  // 3. Rank results by relevance
  // 4. Extract relevant code snippets
  
  const results: CodeSnippet[] = [];
  
  // For now, we'll do a simple demonstration
  for (const file of files.slice(0, options.maxResults)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      // Simple relevance scoring based on query terms
      const queryTerms = query.toLowerCase().split(/\s+/);
      let relevance = 0;
      let matchedLine = -1;
      
      lines.forEach((line, index) => {
        const lineLower = line.toLowerCase();
        const matches = queryTerms.filter(term => lineLower.includes(term)).length;
        if (matches > relevance) {
          relevance = matches;
          matchedLine = index;
        }
      });
      
      if (relevance > 0) {
        const startLine = Math.max(0, matchedLine - 2);
        const endLine = Math.min(lines.length - 1, matchedLine + 2);
        
        results.push({
          file,
          content: lines.slice(startLine, endLine + 1).join('\n'),
          startLine: startLine + 1,
          endLine: endLine + 1,
          relevance: relevance / queryTerms.length,
          context: options.includeContext ? `Found ${relevance} matching terms near line ${matchedLine + 1}` : undefined
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  // Sort by relevance
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, options.maxResults);
}

// Placeholder for keyword search implementation
async function performKeywordSearch(
  query: string,
  files: string[],
  options: {
    includeContext: boolean;
    maxResults: number;
  }
): Promise<CodeSnippet[]> {
  // This would use traditional keyword matching
  // Similar to grep but with better context extraction
  return performSemanticSearch(query, files, { ...options, hybridMode: false });
}