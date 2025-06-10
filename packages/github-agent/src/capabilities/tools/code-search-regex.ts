import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { regexSearchFiles } from "@autodev/worker-core";

export const installGrepSearchTool: ToolLike = (installer) => {
  installer("grep-search", "Search for patterns in code using regex with ripgrep or grep", {
    pattern: z.string().describe("Regex pattern to search for"),
    search_path: z.string().optional().describe("Path to search in (relative to workspace, default: current directory)"),
    file_types: z.array(z.string()).optional().describe("File extensions to include (e.g., ['js', 'ts', 'py'])"),
    exclude_patterns: z.array(z.string()).optional().describe("Patterns to exclude (e.g., ['node_modules', '.git'])"),
    case_sensitive: z.boolean().optional().describe("Case sensitive search (default: false)"),
    whole_word: z.boolean().optional().describe("Match whole words only (default: false)"),
    max_results: z.number().optional().describe("Maximum number of results to return (default: 100)"),
    context_lines: z.number().optional().describe("Number of context lines to show around matches (default: 4)"),
    use_ripgrep: z.boolean().optional().describe("Use ripgrep if available (faster, default: true)")
  }, async ({ 
    pattern, 
    search_path,
    file_types,
    exclude_patterns = ['node_modules', '.git', 'dist', 'build', 'coverage'],
    case_sensitive = false,
    whole_word = false,
    max_results = 100,
    context_lines = 4,
    use_ripgrep = true
  }: { 
    pattern: string; 
    search_path?: string;
    file_types?: string[];
    exclude_patterns?: string[];
    case_sensitive?: boolean;
    whole_word?: boolean;
    max_results?: number;
    context_lines?: number;
    use_ripgrep?: boolean;
  }) => {
    try {
      // Resolve search path
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const searchDir = search_path 
        ? (path.isAbsolute(search_path) ? search_path : path.join(workspacePath, search_path))
        : workspacePath;

      // Security check - ensure search path is within workspace
      const resolvedSearchDir = path.resolve(searchDir);
      const resolvedWorkspace = path.resolve(workspacePath);
      if (!resolvedSearchDir.startsWith(resolvedWorkspace)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Search path '${search_path}' is outside the workspace directory.`
            }
          ]
        };
      }

      // Check if search directory exists
      if (!fs.existsSync(resolvedSearchDir)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Search path '${search_path}' does not exist.`
            }
          ]
        };
      }

      // Prepare file pattern for ripgrep
      let filePattern: string | undefined;
      if (file_types && file_types.length > 0) {
        filePattern = `*.{${file_types.map(ext => ext.replace(/^\./, '')).join(',')}}`;
      }

      // Adjust pattern for case sensitivity and whole word matching
      let searchPattern = pattern;
      if (whole_word) {
        searchPattern = `\\b${pattern}\\b`;
      }
      if (!case_sensitive) {
        searchPattern = `(?i)${searchPattern}`;
      }

      // Execute search using ripgrep
      const startTime = Date.now();
      let searchResults: string;

      try {
        searchResults = await regexSearchFiles(
          workspacePath,
          resolvedSearchDir,
          searchPattern,
          false, // includeNodeModules
          filePattern
        );
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ripgrep search: ${error.message}`
            }
          ]
        };
      }

      const executionTime = Date.now() - startTime;

      // Check if we have results
      if (!searchResults || searchResults === "No results found") {
        return {
          content: [
            {
              type: "text",
              text: "No matches found for the given pattern."
            }
          ]
        };
      }

      // Format results according to the specified format
      const formattedResults = formatRipgrepResults(searchResults, context_lines);

      // Parse for structured data (optional, for backward compatibility)
      const matches = parseRipgrepForMatches(searchResults, workspacePath);
      const limitedMatches = matches.slice(0, max_results);

      // Group by file for structured data
      const fileGroups: Record<string, any[]> = {};
      limitedMatches.forEach(match => {
        if (!fileGroups[match.file]) {
          fileGroups[match.file] = [];
        }
        fileGroups[match.file].push(match);
      });

      const searchResult = {
        query: {
          pattern: pattern,
          search_path: search_path || ".",
          resolved_search_path: resolvedSearchDir,
          case_sensitive: case_sensitive,
          whole_word: whole_word,
          file_types: file_types || null,
          exclude_patterns: exclude_patterns,
          max_results: max_results,
          context_lines: context_lines
        },
        tool_used: "ripgrep",
        execution_time_ms: executionTime,
        total_matches: limitedMatches.length,
        files_with_matches: Object.keys(fileGroups).length,
        formatted_results: formattedResults,
        matches_by_file: fileGroups,
        all_matches: limitedMatches,
        success: true,
        error: null
      };

      return {
        content: [
          {
            type: "text",
            text: formattedResults + "\n\n" + JSON.stringify(searchResult, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing regex search: ${error.message}`
          }
        ]
      };
    }
  });
};

/**
 * Format ripgrep results according to the specified format:
 * ## filepath: xxx
 * --- before 4 lines ---
 * result line
 * --- after 4 lines----
 */
function formatRipgrepResults(searchResults: string, contextLines: number): string {
  const lines = searchResults.split('\n');
  let formattedOutput = '';
  let currentFile = '';
  let inFileSection = false;

  for (const line of lines) {
    // Check if this is a file header (starts with # and contains a file path)
    if (line.startsWith('# ')) {
      currentFile = line.substring(2).trim();
      formattedOutput += `## filepath: ${currentFile}\n`;
      inFileSection = true;
      continue;
    }

    // Skip empty lines between files
    if (!line.trim() && !inFileSection) {
      continue;
    }

    // Process content lines (format: "linenum | content")
    if (inFileSection && line.includes(' | ')) {
      const parts = line.split(' | ');
      if (parts.length >= 2) {
        const lineNum = parts[0].trim();
        const content = parts.slice(1).join(' | ');

        // Check if this is a separator line
        if (line.includes('----')) {
          formattedOutput += `--- context lines (${contextLines} before/after) ---\n\n`;
          inFileSection = false;
          continue;
        }

        formattedOutput += `${content}\n`;
      }
    }
  }

  return formattedOutput.trim();
}

/**
 * Parse ripgrep results to extract structured match data
 */
function parseRipgrepForMatches(searchResults: string, workspacePath: string): any[] {
  const matches: any[] = [];
  const lines = searchResults.split('\n');
  let currentFile = '';

  for (const line of lines) {
    // Check if this is a file header
    if (line.startsWith('# ')) {
      currentFile = line.substring(2).trim();
      continue;
    }

    // Process content lines that contain matches
    if (currentFile && line.includes(' | ') && !line.includes('----')) {
      const parts = line.split(' | ');
      if (parts.length >= 2) {
        const lineNumStr = parts[0].trim();
        const content = parts.slice(1).join(' | ');
        const lineNum = parseInt(lineNumStr);

        if (!isNaN(lineNum)) {
          matches.push({
            file: currentFile,
            line_number: lineNum,
            line_content: content.trim(),
            match_text: content.trim()
          });
        }
      }
    }
  }

  return matches;
}
