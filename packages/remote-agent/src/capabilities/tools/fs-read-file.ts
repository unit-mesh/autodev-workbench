import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const installReadFileTool: ToolLike = (installer) => {
  installer("read-file", "Read the contents of a file from the filesystem", {
    file_path: z.string().describe("Path to the file to read (relative to workspace or absolute)"),
    encoding: z.enum(["utf8", "binary", "base64"]).optional().describe("File encoding (default: utf8)"),
    max_size: z.number().optional().describe("Maximum file size to read in bytes (default: 1MB)"),
    line_range: z.object({
      start: z.number().describe("Start line number (1-based)"),
      end: z.number().describe("End line number (1-based, -1 for end of file)")
    }).optional().describe("Read only specific line range")
  }, async ({ 
    file_path, 
    encoding = "utf8",
    max_size = 1024 * 1024, // 1MB default
    line_range
  }: { 
    file_path: string; 
    encoding?: "utf8" | "binary" | "base64";
    max_size?: number;
    line_range?: { start: number; end: number };
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

      // Check file size
      const stats = fs.statSync(resolvedPath);
      if (stats.size > max_size) {
        return {
          content: [
            {
              type: "text",
              text: `Error: File '${file_path}' is too large (${stats.size} bytes). Maximum allowed size is ${max_size} bytes.`
            }
          ]
        };
      }

      // Read file content
      let content: string;
      if (encoding === "binary" || encoding === "base64") {
        const buffer = fs.readFileSync(resolvedPath);
        content = encoding === "base64" ? buffer.toString("base64") : buffer.toString("binary");
      } else {
        content = fs.readFileSync(resolvedPath, "utf8");
      }

      // Handle line range if specified
      if (line_range && encoding === "utf8") {
        const lines = content.split('\n');
        const startIdx = Math.max(0, line_range.start - 1);
        const endIdx = line_range.end === -1 ? lines.length : Math.min(lines.length, line_range.end);
        
        if (startIdx >= lines.length) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Start line ${line_range.start} is beyond file length (${lines.length} lines).`
              }
            ]
          };
        }

        content = lines.slice(startIdx, endIdx).join('\n');
      }

      const result = {
        file_path: file_path,
        full_path: resolvedPath,
        size: stats.size,
        encoding: encoding,
        line_count: encoding === "utf8" ? content.split('\n').length : null,
        last_modified: stats.mtime.toISOString(),
        content: content,
        ...(line_range && { 
          line_range: {
            start: line_range.start,
            end: line_range.end === -1 ? (encoding === "utf8" ? content.split('\n').length : -1) : line_range.end,
            total_lines: encoding === "utf8" ? fs.readFileSync(resolvedPath, "utf8").split('\n').length : null
          }
        })
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
            text: `Error reading file '${file_path}': ${error.message}`
          }
        ]
      };
    }
  });
};
