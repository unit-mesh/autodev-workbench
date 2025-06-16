import { ToolLike } from "../../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Helper function to count items in directory
function countItems(dirPath: string): { files: number; directories: number; total_size: number } {
  let files = 0;
  let directories = 0;
  let total_size = 0;

  try {
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      const entryStats = fs.statSync(entryPath);

      if (entryStats.isDirectory()) {
        directories++;
        const subCounts = countItems(entryPath);
        files += subCounts.files;
        directories += subCounts.directories;
        total_size += subCounts.total_size;
      } else {
        files++;
        total_size += entryStats.size;
      }
    }
  } catch (error) {
    // If we can't read the directory, return current counts
  }

  return { files, directories, total_size };
}

// Helper function to copy directory recursively
function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export const installDeleteFileTool: ToolLike = (installer) => {
  installer("delete-file", "Delete a file or directory with safety checks", {
    file_path: z.string().describe("Path to the file or directory to delete (relative to workspace or absolute)"),
    recursive: z.boolean().optional().describe("Delete directories recursively (default: false)"),
    backup: z.boolean().optional().describe("Create backup before deletion (default: true)"),
    confirm_deletion: z.boolean().describe("Explicit confirmation required for deletion (safety measure)"),
    dry_run: z.boolean().optional().describe("Show what would be deleted without actually deleting (default: false)")
  }, async ({
    file_path,
    recursive = false,
    backup = true,
    confirm_deletion,
    dry_run = false
  }: {
    file_path: string;
    recursive?: boolean;
    backup?: boolean;
    confirm_deletion: boolean;
    dry_run?: boolean;
  }) => {
    try {
      // Safety check - require explicit confirmation
      if (!confirm_deletion) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Deletion requires explicit confirmation. Set 'confirm_deletion' to true to proceed.`
            }
          ]
        };
      }

      // Resolve path relative to workspace
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
              text: `Error: Access denied. File path '${file_path}' is outside the workspace directory.`
            }
          ]
        };
      }

      // Check if file/directory exists
      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: File or directory '${file_path}' does not exist.`
            }
          ]
        };
      }

      const stats = fs.statSync(resolvedPath);
      const isDirectory = stats.isDirectory();
      const isFile = stats.isFile();

      // Safety check for important files/directories
      const dangerousPatterns = [
        /node_modules$/,
        /\.git$/,
        /package\.json$/,
        /package-lock\.json$/,
        /yarn\.lock$/,
        /\.env$/,
        /config/,
        /src$/,
        /dist$/,
        /build$/
      ];

      const isDangerous = dangerousPatterns.some(pattern => pattern.test(resolvedPath));
      if (isDangerous && !dry_run) {
        return {
          content: [
            {
              type: "text",
              text: `Warning: '${file_path}' appears to be an important file/directory. Use dry_run first to verify what will be deleted.`
            }
          ]
        };
      }

      // Check if directory deletion requires recursive flag
      if (isDirectory && !recursive) {
        const entries = fs.readdirSync(resolvedPath);
        if (entries.length > 0) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Directory '${file_path}' is not empty. Set 'recursive' to true to delete recursively.`
              }
            ]
          };
        }
      }

      // Collect information about what will be deleted
      const deletionInfo: any = {
        path: file_path,
        full_path: resolvedPath,
        type: isDirectory ? "directory" : "file",
        size: isFile ? stats.size : null,
        last_modified: stats.mtime.toISOString(),
        dry_run: dry_run
      };

      if (isDirectory && recursive) {
        // Count items in directory
        const counts = countItems(resolvedPath);
        deletionInfo.contents = {
          files: counts.files,
          directories: counts.directories,
          total_size: counts.total_size
        };
      }

      // Create backup if requested and not dry run
      let backupPath: string | null = null;
      if (backup && !dry_run) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = `${resolvedPath}.backup.${timestamp}`;

        if (isDirectory) {
          // Copy directory recursively
          copyDir(resolvedPath, backupPath);
        } else {
          fs.copyFileSync(resolvedPath, backupPath);
        }
        deletionInfo.backup_created = backupPath;
      }

      // Perform deletion if not dry run
      if (!dry_run) {
        if (isDirectory) {
          fs.rmSync(resolvedPath, { recursive: recursive, force: true });
        } else {
          fs.unlinkSync(resolvedPath);
        }
        deletionInfo.deleted = true;
      } else {
        deletionInfo.deleted = false;
        deletionInfo.message = "Dry run - no files were actually deleted";
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(deletionInfo, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting '${file_path}': ${error.message}`
          }
        ]
      };
    }
  });
};
