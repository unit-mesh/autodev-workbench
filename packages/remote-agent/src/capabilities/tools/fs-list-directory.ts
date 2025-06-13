import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const installListDirectoryTool: ToolLike = (installer) => {
  installer("list-directory", "List files and directories in a given path", {
    directory_path: z.string().describe("Path to the directory to list (relative to workspace or absolute)"),
    recursive: z.boolean().optional().describe("List files recursively (default: false)"),
    max_depth: z.number().optional().describe("Maximum recursion depth (default: 3)"),
    include_hidden: z.boolean().optional().describe("Include hidden files (default: false)"),
    filter: z.string().optional().describe("Filter files by pattern (e.g. *.ts)")
  }, async ({ 
    directory_path, 
    recursive = false,
    max_depth = 3,
    include_hidden = false,
    filter
  }) => {
    try {
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const fullPath = path.isAbsolute(directory_path) ? directory_path : path.join(workspacePath, directory_path);
      
      // Security check
      const resolvedPath = path.resolve(fullPath);
      const resolvedWorkspace = path.resolve(workspacePath);
      if (!resolvedPath.startsWith(resolvedWorkspace)) {
        return { content: [{ type: "text", text: `Error: Access denied. Path '${directory_path}' is outside workspace.` }] };
      }

      // Basic validation
      if (!fs.existsSync(resolvedPath)) {
        return { content: [{ type: "text", text: `Error: Path '${directory_path}' does not exist.` }] };
      }

      const stats = fs.statSync(resolvedPath);
      if (!stats.isDirectory()) {
        return { content: [{ type: "text", text: `Error: '${directory_path}' is not a directory.` }] };
      }

      interface FileInfo {
        name: string;
        type: "file" | "directory" | "symlink";
        depth: number;
      }

      const files: FileInfo[] = [];

      function listDirectory(dirPath: string, currentDepth: number = 0): void {
        if (recursive && currentDepth > max_depth) return;

        try {
          const entries = fs.readdirSync(dirPath);
          
          for (const entry of entries) {
            // Skip hidden files if not included
            if (!include_hidden && entry.startsWith('.')) continue;
            
            // Apply filter if specified
            if (filter && !new RegExp(filter.replace('*', '.*')).test(entry)) continue;

            const entryPath = path.join(dirPath, entry);
            
            try {
              const entryStats = fs.lstatSync(entryPath);
              const isSymlink = entryStats.isSymbolicLink();
              const isDirectory = isSymlink ? fs.statSync(entryPath).isDirectory() : entryStats.isDirectory();

              files.push({
                name: entry,
                type: isSymlink ? "symlink" : (isDirectory ? "directory" : "file"),
                depth: currentDepth
              });

              if (recursive && isDirectory && currentDepth < max_depth) {
                listDirectory(entryPath, currentDepth + 1);
              }
            } catch (error) {
              console.warn(`Warning: Cannot access ${entryPath}: ${error}`);
            }
          }
        } catch (error) {
          console.warn(`Warning: Cannot read directory ${dirPath}: ${error}`);
        }
      }

      listDirectory(resolvedPath);

      // Sort files by name
      files.sort((a, b) => a.name.localeCompare(b.name));

      let output = "";
      for (const file of files) {
        const name = file.type === "directory" ? `${file.name}/` : file.name;
        const indent = "  ".repeat(file.depth);
        output += `${indent}${name}\n`;
      }

      return { content: [{ type: "text", text: output }] };
    } catch (error: any) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
  });
};