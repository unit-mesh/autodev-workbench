import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const installListDirectoryTool: ToolLike = (installer) => {
  installer("list-directory", "List files and directories in a given path with detailed information", {
    directory_path: z.string().describe("Path to the directory to list (relative to workspace or absolute)"),
    recursive: z.boolean().optional().describe("List files recursively (default: false)"),
    max_depth: z.number().optional().describe("Maximum recursion depth (default: 3)"),
    include_stats: z.boolean().optional().describe("Include detailed file statistics (default: true)")
  }, async ({ 
    directory_path, 
    recursive = false,
    max_depth = 3,
    include_stats = true
  }: { 
    directory_path: string; 
    recursive?: boolean;
    max_depth?: number;
    include_hidden?: boolean;
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

      // eslint-disable-next-line no-inner-declarations
      function listDirectory(dirPath: string, currentDepth: number = 0): void {
        if (recursive && currentDepth > max_depth) return;

        try {
          const entries = fs.readdirSync(dirPath);
          
          for (const entry of entries) {
            const entryPath = path.join(dirPath, entry);
            const relativePath = path.relative(resolvedWorkspace, entryPath);
            
            try {
              const entryStats = fs.lstatSync(entryPath);
              const isSymlink = entryStats.isSymbolicLink();
              const isDirectory = isSymlink ? fs.statSync(entryPath).isDirectory() : entryStats.isDirectory();
              const isFile = !isDirectory && !isSymlink;

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

      // Format output similar to Linux ls -la
      const formatFileSize = (size?: number): string => {
        if (!size) return "     -";
        if (size < 1024) return `${size.toString().padStart(6)}`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1).padStart(5)}K`;
        if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1).padStart(5)}M`;
        return `${(size / (1024 * 1024 * 1024)).toFixed(1).padStart(5)}G`;
      };

      const formatPermissions = (mode?: string): string => {
        if (!mode) return "----------";
        const octal = parseInt(mode, 8);
        const type = files.find(f => f.permissions === mode)?.type;
        let result = type === "directory" ? "d" : type === "symlink" ? "l" : "-";

        // Owner permissions
        result += (octal & 0o400) ? "r" : "-";
        result += (octal & 0o200) ? "w" : "-";
        result += (octal & 0o100) ? "x" : "-";

        // Group permissions
        result += (octal & 0o040) ? "r" : "-";
        result += (octal & 0o020) ? "w" : "-";
        result += (octal & 0o010) ? "x" : "-";

        // Other permissions
        result += (octal & 0o004) ? "r" : "-";
        result += (octal & 0o002) ? "w" : "-";
        result += (octal & 0o001) ? "x" : "-";

        return result;
      };

      const formatDate = (dateStr?: string): string => {
        if (!dateStr) return "                ";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 180) {
          // Recent files: show month, day, time
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit'
          }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        } else {
          // Older files: show month, day, year
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          });
        }
      };

      // Build the output string
      let output = `Directory: ${resolvedPath}\n`;
      output += `Total: ${files.length} items (${files.filter(f => f.type === "directory").length} dirs, ${files.filter(f => f.type === "file").length} files`;
      if (files.filter(f => f.type === "symlink").length > 0) {
        output += `, ${files.filter(f => f.type === "symlink").length} symlinks`;
      }
      output += `)\n\n`;

      if (include_stats) {
        // Header similar to ls -la
        output += "Permissions  Size   Modified         Name\n";
        output += "----------  ------  ---------------  ----\n";

        for (const file of files) {
          const permissions = formatPermissions(file.permissions);
          const size = formatFileSize(file.size);
          const modified = formatDate(file.modified);
          const name = file.type === "directory" ? `${file.name}/` : file.name;
          const indent = "  ".repeat(file.depth);

          output += `${permissions}  ${size}  ${modified}  ${indent}${name}\n`;
        }
      } else {
        // Simple format without stats
        for (const file of files) {
          const name = file.type === "directory" ? `${file.name}/` : file.name;
          const indent = "  ".repeat(file.depth);
          output += `${indent}${name}\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: output
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
