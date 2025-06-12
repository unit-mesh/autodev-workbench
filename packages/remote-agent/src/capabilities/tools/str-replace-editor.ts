import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const installStrReplaceEditorTool: ToolLike = (installer) => {
  installer("str-replace-editor", "Advanced file editor for precise string replacements and insertions with line number support", {
    command: z.enum(["str_replace", "insert"]).describe("The editing command to execute"),
    path: z.string().describe("Full path to file relative to the workspace root"),
    
    // String replacement parameters
    old_str_1: z.string().optional().describe("Required for str_replace: The exact string to replace"),
    new_str_1: z.string().optional().describe("Required for str_replace: The replacement string"),
    old_str_start_line_number_1: z.number().optional().describe("Required for str_replace: 1-based line number where old_str_1 starts"),
    old_str_end_line_number_1: z.number().optional().describe("Required for str_replace: 1-based line number where old_str_1 ends (inclusive)"),
    
    // Multiple replacements support
    old_str_2: z.string().optional().describe("Optional second replacement: The exact string to replace"),
    new_str_2: z.string().optional().describe("Optional second replacement: The replacement string"),
    old_str_start_line_number_2: z.number().optional().describe("Optional second replacement: 1-based start line number"),
    old_str_end_line_number_2: z.number().optional().describe("Optional second replacement: 1-based end line number"),
    
    old_str_3: z.string().optional().describe("Optional third replacement: The exact string to replace"),
    new_str_3: z.string().optional().describe("Optional third replacement: The replacement string"),
    old_str_start_line_number_3: z.number().optional().describe("Optional third replacement: 1-based start line number"),
    old_str_end_line_number_3: z.number().optional().describe("Optional third replacement: 1-based end line number"),
    
    // Insertion parameters
    insert_line_1: z.number().optional().describe("Required for insert: 1-based line number after which to insert (0 for beginning)"),
    insert_line_2: z.number().optional().describe("Optional second insertion: 1-based line number after which to insert"),
    insert_line_3: z.number().optional().describe("Optional third insertion: 1-based line number after which to insert"),
    
    // Validation options
    create_backup: z.boolean().optional().describe("Create backup before editing (default: true)"),
    dry_run: z.boolean().optional().describe("Preview changes without applying them (default: false)")
  }, async (params: {
    command: "str_replace" | "insert";
    path: string;
    old_str_1?: string;
    new_str_1?: string;
    old_str_start_line_number_1?: number;
    old_str_end_line_number_1?: number;
    old_str_2?: string;
    new_str_2?: string;
    old_str_start_line_number_2?: number;
    old_str_end_line_number_2?: number;
    old_str_3?: string;
    new_str_3?: string;
    old_str_start_line_number_3?: number;
    old_str_end_line_number_3?: number;
    insert_line_1?: number;
    insert_line_2?: number;
    insert_line_3?: number;
    create_backup?: boolean;
    dry_run?: boolean;
  }) => {
    try {
      const {
        command,
        path: filePath,
        create_backup = true,
        dry_run = false,
        ...editParams
      } = params;

      // Resolve file path
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workspacePath, filePath);
      
      // Security check
      const resolvedPath = path.resolve(fullPath);
      const resolvedWorkspace = path.resolve(workspacePath);
      if (!resolvedPath.startsWith(resolvedWorkspace)) {
        return {
          content: [{
            type: "text",
            text: `Error: Access denied. File path '${filePath}' is outside the workspace directory.`
          }]
        };
      }

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [{
            type: "text",
            text: `Error: File '${filePath}' does not exist.`
          }]
        };
      }

      // Read file content
      const originalContent = fs.readFileSync(resolvedPath, 'utf8');
      const lines = originalContent.split('\n');
      
      let modifiedContent = originalContent;
      const operations: string[] = [];
      
      if (command === "str_replace") {
        // Process string replacements
        const replacements = [];
        
        // Collect all replacement operations
        for (let i = 1; i <= 3; i++) {
          const oldStr = editParams[`old_str_${i}` as keyof typeof editParams] as string;
          const newStr = editParams[`new_str_${i}` as keyof typeof editParams] as string;
          const startLine = editParams[`old_str_start_line_number_${i}` as keyof typeof editParams] as number;
          const endLine = editParams[`old_str_end_line_number_${i}` as keyof typeof editParams] as number;
          
          if (oldStr !== undefined && newStr !== undefined && startLine !== undefined && endLine !== undefined) {
            replacements.push({ oldStr, newStr, startLine, endLine, index: i });
          }
        }
        
        if (replacements.length === 0) {
          return {
            content: [{
              type: "text",
              text: "Error: No valid replacement parameters provided for str_replace command."
            }]
          };
        }
        
        // Sort replacements by line number (descending) to avoid line number shifts
        replacements.sort((a, b) => b.startLine - a.startLine);
        
        // Apply replacements
        for (const replacement of replacements) {
          const { oldStr, newStr, startLine, endLine, index } = replacement;
          
          // Validate line numbers
          if (startLine < 1 || endLine < 1 || startLine > lines.length || endLine > lines.length) {
            return {
              content: [{
                type: "text",
                text: `Error: Invalid line numbers for replacement ${index}. File has ${lines.length} lines, but specified range is ${startLine}-${endLine}.`
              }]
            };
          }
          
          if (startLine > endLine) {
            return {
              content: [{
                type: "text",
                text: `Error: Start line ${startLine} cannot be greater than end line ${endLine} for replacement ${index}.`
              }]
            };
          }
          
          // Extract the target text from specified lines
          const targetLines = lines.slice(startLine - 1, endLine);
          const targetText = targetLines.join('\n');
          
          // Verify the old string matches exactly
          if (targetText !== oldStr) {
            return {
              content: [{
                type: "text",
                text: `Error: String mismatch for replacement ${index}. Expected:\n"${oldStr}"\n\nBut found:\n"${targetText}"\n\nAt lines ${startLine}-${endLine}.`
              }]
            };
          }
          
          // Perform replacement
          const beforeLines = lines.slice(0, startLine - 1);
          const afterLines = lines.slice(endLine);
          const newLines = newStr.split('\n');
          
          lines.splice(0, lines.length, ...beforeLines, ...newLines, ...afterLines);
          operations.push(`Replaced ${endLine - startLine + 1} lines (${startLine}-${endLine}) with ${newLines.length} lines`);
        }
        
        modifiedContent = lines.join('\n');
        
      } else if (command === "insert") {
        // Process insertions
        const insertions = [];
        
        // Collect all insertion operations
        for (let i = 1; i <= 3; i++) {
          const insertLine = editParams[`insert_line_${i}` as keyof typeof editParams] as number;
          const newStr = editParams[`new_str_${i}` as keyof typeof editParams] as string;
          
          if (insertLine !== undefined && newStr !== undefined) {
            insertions.push({ insertLine, newStr, index: i });
          }
        }
        
        if (insertions.length === 0) {
          return {
            content: [{
              type: "text",
              text: "Error: No valid insertion parameters provided for insert command."
            }]
          };
        }
        
        // Sort insertions by line number (descending) to avoid line number shifts
        insertions.sort((a, b) => b.insertLine - a.insertLine);
        
        // Apply insertions
        for (const insertion of insertions) {
          const { insertLine, newStr, index } = insertion;
          
          // Validate line number
          if (insertLine < 0 || insertLine > lines.length) {
            return {
              content: [{
                type: "text",
                text: `Error: Invalid insertion line ${insertLine} for insertion ${index}. File has ${lines.length} lines.`
              }]
            };
          }
          
          // Insert new content
          const newLines = newStr.split('\n');
          lines.splice(insertLine, 0, ...newLines);
          operations.push(`Inserted ${newLines.length} lines after line ${insertLine}`);
        }
        
        modifiedContent = lines.join('\n');
      }
      
      // Prepare result
      const result = {
        command,
        file_path: filePath,
        full_path: resolvedPath,
        operations,
        original_lines: originalContent.split('\n').length,
        modified_lines: modifiedContent.split('\n').length,
        dry_run,
        backup_created: false,
        backup_path: null as string | null
      };
      
      if (!dry_run) {
        // Create backup if requested
        if (create_backup) {
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
          text: JSON.stringify(result, null, 2)
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
