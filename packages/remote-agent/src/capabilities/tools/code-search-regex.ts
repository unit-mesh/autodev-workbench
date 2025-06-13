import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { regexSearchFiles } from "@autodev/worker-core";

export const installGrepSearchTool: ToolLike = (installer) => {
  installer("grep-search", "Search for code patterns using regex with ripgrep. Useful for finding function definitions, variable usages, or specific code constructs across files.", {
    search_path: z.string().describe("Directory path to search within the workspace (relative path). Use \".\" for current directory if no specific path is provided."),
    pattern: z.string().describe("Regex pattern to search code for. Examples: \"function myFunction\", \"class\\s+User\", \"import\\s+.*from\\s+['\\\"](react|vue)['\\\"]\". Use word boundaries (\\b) for exact matches and escape special characters.")
  }, async ({
    search_path,
    pattern
  }: {
    search_path: string;
    pattern: string;
  }) => {
    try {
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const searchDir = path.isAbsolute(search_path) ? search_path : path.join(workspacePath, search_path);

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

      let searchResults: string;

      try {
        searchResults = await regexSearchFiles(workspacePath, resolvedSearchDir, pattern, false, undefined);
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

      return {
        content: [
          {
            type: "text",
            text: searchResults
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
