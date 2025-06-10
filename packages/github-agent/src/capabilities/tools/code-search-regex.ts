import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { regexSearchFiles } from "@autodev/worker-core";

export const installGrepSearchTool: ToolLike = (installer) => {
  installer("grep-search", "Search for patterns in code using regex with ripgrep", {
    search_path: z.string().describe("Directory path to search within the workspace (relative path). Use \".\" for current directory if no specific path is provided."),
    pattern: z.string().describe("Regex pattern to search for")
  }, async ({
    search_path,
    pattern
  }: {
    search_path: string;
    pattern: string;
  }) => {
    try {
      // Resolve search path
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const searchDir = path.isAbsolute(search_path) ? search_path : path.join(workspacePath, search_path);

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

      // Execute search using ripgrep
      let searchResults: string;

      try {
        searchResults = await regexSearchFiles(
          workspacePath,
          resolvedSearchDir,
          pattern,
          false, // includeNodeModules
          undefined // filePattern
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
      const formattedResults = formatRipgrepResults(searchResults);

      return {
        content: [
          {
            type: "text",
            text: formattedResults
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
function formatRipgrepResults(searchResults: string): string {
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
          formattedOutput += `--- before 4 lines ---, result line, --- after 4 lines----\n\n`;
          inFileSection = false;
          continue;
        }

        formattedOutput += `${content}\n`;
      }
    }
  }

  return formattedOutput.trim();
}


