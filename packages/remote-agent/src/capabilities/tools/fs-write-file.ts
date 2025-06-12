import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const installWriteFileTool: ToolLike = (installer) => {
  installer("write-file", "Write content to a file, creating directories if needed", {
    file_path: z.string().describe("Path to the file to write (relative to workspace or absolute)"),
    content: z.string().describe("Content to write to the file"),
    encoding: z.enum(["utf8", "binary", "base64"]).optional().describe("File encoding (default: utf8)"),
    mode: z.enum(["create", "overwrite", "append"]).optional().describe("Write mode (default: overwrite)"),
    create_dirs: z.boolean().optional().describe("Create parent directories if they don't exist (default: true)"),
    backup: z.boolean().optional().describe("Create backup of existing file (default: false)")
  }, async ({ 
    file_path, 
    content,
    encoding = "utf8",
    mode = "overwrite",
    create_dirs = true,
    backup = false
  }: { 
    file_path: string; 
    content: string;
    encoding?: "utf8" | "binary" | "base64";
    mode?: "create" | "overwrite" | "append";
    create_dirs?: boolean;
    backup?: boolean;
  }) => {
    try {
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

      const fileExists = fs.existsSync(resolvedPath);
      
      // Handle create mode
      if (mode === "create" && fileExists) {
        return {
          content: [
            {
              type: "text",
              text: `Error: File '${file_path}' already exists and mode is set to 'create'.`
            }
          ]
        };
      }

      // Create backup if requested and file exists
      let backupPath: string | null = null;
      if (backup && fileExists) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = `${resolvedPath}.backup.${timestamp}`;
        fs.copyFileSync(resolvedPath, backupPath);
      }

      // Create parent directories if needed
      if (create_dirs) {
        const dirPath = path.dirname(resolvedPath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }

      // Prepare content based on encoding
      let writeContent: string | Buffer;
      if (encoding === "base64") {
        writeContent = Buffer.from(content, "base64");
      } else if (encoding === "binary") {
        writeContent = Buffer.from(content, "binary");
      } else {
        writeContent = content;
      }

      // Write file based on mode
      let bytesWritten: number;
      if (mode === "append") {
        if (encoding === "utf8") {
          fs.appendFileSync(resolvedPath, writeContent, "utf8");
          bytesWritten = Buffer.byteLength(content, "utf8");
        } else {
          fs.appendFileSync(resolvedPath, writeContent);
          bytesWritten = (writeContent as Buffer).length;
        }
      } else {
        if (encoding === "utf8") {
          fs.writeFileSync(resolvedPath, writeContent, "utf8");
          bytesWritten = Buffer.byteLength(content, "utf8");
        } else {
          fs.writeFileSync(resolvedPath, writeContent);
          bytesWritten = (writeContent as Buffer).length;
        }
      }

      // Get file stats
      const stats = fs.statSync(resolvedPath);

      const result = {
        file_path: file_path,
        full_path: resolvedPath,
        operation: mode,
        encoding: encoding,
        bytes_written: bytesWritten,
        file_size: stats.size,
        created: !fileExists,
        modified: fileExists,
        last_modified: stats.mtime.toISOString(),
        backup_created: backup && backupPath ? backupPath : null,
        directories_created: create_dirs && !fs.existsSync(path.dirname(resolvedPath)),
        line_count: encoding === "utf8" ? content.split('\n').length : null
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
            text: `Error writing file '${file_path}': ${error.message}`
          }
        ]
      };
    }
  });
};
