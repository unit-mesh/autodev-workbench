import { ToolLike } from "../../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { decodeHtmlEntities } from "../../../utils/html-entities";

export const installStrReplaceEditorTool: ToolLike = (installer) => {
  installer("str-replace-editor", "Edit files with precise changes using placeholders for unchanged code", {
    targetFile: z.string().describe("Path to file relative to the workspace root"),
    codeEdit: z.string().describe("Specify ONLY the lines of code to change. Use {{ ... }} to represent unchanged code."),
    instruction: z.string().optional().describe("A description of the changes being made"),
    createBackup: z.boolean().optional().describe("Create backup before editing (default: true)"),
    dryRun: z.boolean().optional().describe("Preview changes without applying them (default: false)")
  }, async (params: {
    targetFile: string;
    codeEdit: string;
    instruction?: string;
    createBackup?: boolean;
    dryRun?: boolean;
  }) => {
    try {
      const {
        targetFile,
        codeEdit,
        instruction = "Edit file",
        createBackup = true,
        dryRun = false
      } = params;

      // Resolve file path
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      if (!workspacePath) {
        return {
          content: [{
            type: "text",
            text: `Error: Workspace path is not defined`
          }]
        };
      }

      const fullPath = path.isAbsolute(targetFile) ? targetFile : path.join(workspacePath, targetFile);

      // Security check
      const resolvedPath = path.resolve(fullPath);
      const resolvedWorkspace = path.resolve(workspacePath);
      if (!resolvedPath.startsWith(resolvedWorkspace)) {
        return {
          content: [{
            type: "text",
            text: `Error: Access denied. File path '${targetFile}' is outside the workspace directory.`
          }]
        };
      }

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [{
            type: "text",
            text: `Error: File '${targetFile}' does not exist.`
          }]
        };
      }

      // Read file content
      const originalContent = fs.readFileSync(resolvedPath, 'utf8');

      // Decode HTML entities in the code edit content
      const decodedCodeEdit = decodeHtmlEntities(codeEdit);

      // Process the code edit with placeholders
      let modifiedContent = originalContent;

      // Parse the code edit by splitting on {{ ... }} placeholders
      const placeholderPattern = /\{\{\s*\.\.\.\s*\}\}/g;
      const editParts = decodedCodeEdit.split(placeholderPattern);

      if (editParts.length === 1 && !decodedCodeEdit.includes("{{ ... }}")) {
        // If no placeholders found, treat as a full file replacement
        modifiedContent = decodedCodeEdit;
      } else {
        // Process edits with placeholders
        let currentPos = 0;
        let resultContent = '';

        for (let i = 0; i < editParts.length; i++) {
          const part = editParts[i].trim();

          // Skip empty parts
          if (!part && i > 0 && i < editParts.length - 1) {
            continue;
          }

          if (i === 0) {
            // First part - must match from the beginning
            if (!originalContent.startsWith(part)) {
              // If first part doesn't match the start, preserve original beginning
              resultContent = originalContent.substring(0, currentPos);
            }
            currentPos = part.length;
          } else if (i === editParts.length - 1) {
            // Last part - must match to the end or be added
            if (originalContent.endsWith(part)) {
              currentPos = originalContent.length;
            } else {
              // Add the last part
              resultContent += part;
            }
          } else {
            // Middle part - find this part in the original
            const nextPos = originalContent.indexOf(part, currentPos);

            if (nextPos === -1) {
              // Part not found, just add it
              resultContent += part;
            } else {
              // Add the content between current position and the found part
              resultContent += originalContent.substring(currentPos, nextPos);
              // Add the part itself
              resultContent += part;
              // Update position
              currentPos = nextPos + part.length;
            }
          }
        }

        // Apply the changes
        modifiedContent = resultContent || modifiedContent;
      }

      // Prepare result
      const result = {
        instruction,
        file_path: targetFile,
        full_path: resolvedPath,
        original_lines: originalContent.split('\n').length,
        modified_lines: modifiedContent.split('\n').length,
        line_diff: modifiedContent.split('\n').length - originalContent.split('\n').length,
        dry_run: dryRun,
        backup_created: false,
        backup_path: null as string | null
      };

      if (!dryRun) {
        // Create backup if requested
        if (createBackup) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupPath = `${resolvedPath}.backup.${timestamp}`;
          fs.copyFileSync(resolvedPath, backupPath);
          result.backup_created = true;
          result.backup_path = backupPath;
        }

        // Write modified content
        fs.writeFileSync(resolvedPath, modifiedContent, 'utf8');
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: dryRun ? "Changes previewed successfully" : "File edited successfully",
            ...result
          }, null, 2)
        }]
      };

    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error in str-replace-editor: ${error.message}`
        }]
      };
    }
  });
};
