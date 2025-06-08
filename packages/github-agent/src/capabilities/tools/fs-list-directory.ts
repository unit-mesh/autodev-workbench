import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const installListDirectoryTool: ToolLike = (installer) => {
  installer("list-directory", "List files and directories in a given path with detailed information", {
    directory_path: z.string().describe("Path to the directory to list (relative to workspace or absolute)"),
    recursive: z.boolean().optional().describe("List files recursively (default: false)"),
    max_depth: z.number().optional().describe("Maximum recursion depth (default: 3)"),
    include_hidden: z.boolean().optional().describe("Include hidden files and directories (default: false)"),
    file_types: z.array(z.string()).optional().describe("Filter by file extensions (e.g., ['.js', '.ts', '.py'])"),
    sort_by: z.enum(["name", "size", "modified", "type"]).optional().describe("Sort results by (default: name)"),
    include_stats: z.boolean().optional().describe("Include detailed file statistics (default: true)")
  }, async ({ 
    directory_path, 
    recursive = false,
    max_depth = 3,
    include_hidden = false,
    file_types,
    sort_by = "name",
    include_stats = true
  }: { 
    directory_path: string; 
    recursive?: boolean;
    max_depth?: number;
    include_hidden?: boolean;
    file_types?: string[];
    sort_by?: "name" | "size" | "modified" | "type";
    include_stats?: boolean;
  }) => {
    try {
      // Resolve path relative to workspace
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const fullPath = path.isAbsolute(directory_path) ? directory_path : path.join(workspacePath, directory_path);
      
      // Security check - ensure path is within workspace
      const resolvedPath = path.resolve(fullPath);
      const resolvedWorkspace = path.resolve(workspacePath);
      if (!resolvedPath.startsWith(resolvedWorkspace)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Access denied. Directory path '${directory_path}' is outside the workspace directory.`
            }
          ]
        };
      }

      // Check if directory exists
      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Directory '${directory_path}' does not exist.`
            }
          ]
        };
      }

      // Check if it's actually a directory
      const stats = fs.statSync(resolvedPath);
      if (!stats.isDirectory()) {
        return {
          content: [
            {
              type: "text",
              text: `Error: '${directory_path}' is not a directory.`
            }
          ]
        };
      }

      interface FileInfo {
        name: string;
        path: string;
        relative_path: string;
        type: "file" | "directory" | "symlink";
        size?: number;
        modified?: string;
        created?: string;
        permissions?: string;
        extension?: string;
        depth: number;
      }

      const files: FileInfo[] = [];

      function listDirectory(dirPath: string, currentDepth: number = 0): void {
        if (recursive && currentDepth > max_depth) return;

        try {
          const entries = fs.readdirSync(dirPath);
          
          for (const entry of entries) {
            // Skip hidden files if not requested
            if (!include_hidden && entry.startsWith('.')) continue;

            const entryPath = path.join(dirPath, entry);
            const relativePath = path.relative(resolvedWorkspace, entryPath);
            
            try {
              const entryStats = fs.lstatSync(entryPath);
              const isSymlink = entryStats.isSymbolicLink();
              const isDirectory = isSymlink ? fs.statSync(entryPath).isDirectory() : entryStats.isDirectory();
              const isFile = !isDirectory && !isSymlink;

              // Filter by file types if specified
              if (file_types && file_types.length > 0 && isFile) {
                const ext = path.extname(entry).toLowerCase();
                if (!file_types.some(type => type.toLowerCase() === ext)) continue;
              }

              const fileInfo: FileInfo = {
                name: entry,
                path: entryPath,
                relative_path: relativePath,
                type: isSymlink ? "symlink" : (isDirectory ? "directory" : "file"),
                depth: currentDepth
              };

              if (include_stats) {
                fileInfo.size = isFile ? entryStats.size : undefined;
                fileInfo.modified = entryStats.mtime.toISOString();
                fileInfo.created = entryStats.birthtime.toISOString();
                fileInfo.permissions = entryStats.mode.toString(8);
                if (isFile) {
                  fileInfo.extension = path.extname(entry);
                }
              }

              files.push(fileInfo);

              // Recurse into directories if requested
              if (recursive && isDirectory && currentDepth < max_depth) {
                listDirectory(entryPath, currentDepth + 1);
              }
            } catch (entryError) {
              // Skip entries that can't be accessed
              console.warn(`Warning: Cannot access ${entryPath}: ${entryError}`);
            }
          }
        } catch (dirError) {
          console.warn(`Warning: Cannot read directory ${dirPath}: ${dirError}`);
        }
      }

      listDirectory(resolvedPath);

      // Sort files
      files.sort((a, b) => {
        switch (sort_by) {
          case "size":
            return (b.size || 0) - (a.size || 0);
          case "modified":
            return new Date(b.modified || 0).getTime() - new Date(a.modified || 0).getTime();
          case "type":
            if (a.type !== b.type) {
              const typeOrder = { directory: 0, file: 1, symlink: 2 };
              return typeOrder[a.type] - typeOrder[b.type];
            }
            return a.name.localeCompare(b.name);
          case "name":
          default:
            return a.name.localeCompare(b.name);
        }
      });

      const result = {
        directory_path: directory_path,
        full_path: resolvedPath,
        total_items: files.length,
        directories: files.filter(f => f.type === "directory").length,
        files: files.filter(f => f.type === "file").length,
        symlinks: files.filter(f => f.type === "symlink").length,
        recursive: recursive,
        max_depth: recursive ? max_depth : 0,
        include_hidden: include_hidden,
        file_types_filter: file_types || null,
        sort_by: sort_by,
        items: files
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
            text: `Error listing directory '${directory_path}': ${error.message}`
          }
        ]
      };
    }
  });
};
