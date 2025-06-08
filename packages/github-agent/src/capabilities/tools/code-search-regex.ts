import { ToolLike } from "../_typing";
import { z } from "zod";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

export const installGrepSearchTool: ToolLike = (installer) => {
  installer("grep-search", "Search for patterns in code using regex with ripgrep or grep", {
    pattern: z.string().describe("Regex pattern to search for"),
    search_path: z.string().optional().describe("Path to search in (relative to workspace, default: current directory)"),
    file_types: z.array(z.string()).optional().describe("File extensions to include (e.g., ['js', 'ts', 'py'])"),
    exclude_patterns: z.array(z.string()).optional().describe("Patterns to exclude (e.g., ['node_modules', '.git'])"),
    case_sensitive: z.boolean().optional().describe("Case sensitive search (default: false)"),
    whole_word: z.boolean().optional().describe("Match whole words only (default: false)"),
    max_results: z.number().optional().describe("Maximum number of results to return (default: 100)"),
    context_lines: z.number().optional().describe("Number of context lines to show around matches (default: 2)"),
    use_ripgrep: z.boolean().optional().describe("Use ripgrep if available (faster, default: true)")
  }, async ({ 
    pattern, 
    search_path,
    file_types,
    exclude_patterns = ['node_modules', '.git', 'dist', 'build', 'coverage'],
    case_sensitive = false,
    whole_word = false,
    max_results = 100,
    context_lines = 2,
    use_ripgrep = true
  }: { 
    pattern: string; 
    search_path?: string;
    file_types?: string[];
    exclude_patterns?: string[];
    case_sensitive?: boolean;
    whole_word?: boolean;
    max_results?: number;
    context_lines?: number;
    use_ripgrep?: boolean;
  }) => {
    try {
      // Resolve search path
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const searchDir = search_path 
        ? (path.isAbsolute(search_path) ? search_path : path.join(workspacePath, search_path))
        : workspacePath;

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

      // Check if ripgrep is available
      let hasRipgrep = false;
      if (use_ripgrep) {
        try {
          await new Promise((resolve, reject) => {
            const rg = spawn('rg', ['--version'], { stdio: 'pipe' });
            rg.on('close', (code) => {
              if (code === 0) {
                hasRipgrep = true;
              }
              resolve(code);
            });
            rg.on('error', () => resolve(1));
          });
        } catch (error) {
          hasRipgrep = false;
        }
      }

      const toolUsed = hasRipgrep && use_ripgrep ? 'ripgrep' : 'grep';
      let command: string;
      let args: string[] = [];

      if (hasRipgrep && use_ripgrep) {
        // Use ripgrep
        command = 'rg';
        
        // Basic ripgrep arguments
        args.push('--json'); // JSON output for easier parsing
        args.push('--with-filename');
        args.push('--line-number');
        args.push(`--context=${context_lines}`);
        args.push(`--max-count=${max_results}`);
        
        // Case sensitivity
        if (!case_sensitive) {
          args.push('--ignore-case');
        }
        
        // Whole word matching
        if (whole_word) {
          args.push('--word-regexp');
        }
        
        // File type filters
        if (file_types && file_types.length > 0) {
          file_types.forEach(ext => {
            args.push('--type-add');
            args.push(`custom:*.${ext.replace(/^\./, '')}`);
          });
          args.push('--type=custom');
        }
        
        // Exclude patterns
        exclude_patterns.forEach(pattern => {
          args.push('--glob');
          args.push(`!${pattern}`);
        });
        
        args.push(pattern);
        args.push(resolvedSearchDir);
      } else {
        // Use grep
        command = 'grep';
        
        args.push('-r'); // recursive
        args.push('-n'); // line numbers
        args.push(`-C${context_lines}`); // context lines
        
        if (!case_sensitive) {
          args.push('-i');
        }
        
        if (whole_word) {
          args.push('-w');
        }
        
        // Exclude patterns
        exclude_patterns.forEach(pattern => {
          args.push('--exclude-dir=' + pattern);
        });
        
        // File type filters (basic implementation)
        if (file_types && file_types.length > 0) {
          const includePattern = file_types.map(ext => `*.${ext.replace(/^\./, '')}`).join(' ');
          args.push('--include=' + includePattern);
        }
        
        args.push(pattern);
        args.push(resolvedSearchDir);
      }

      // Execute search
      const result = await new Promise<{
        stdout: string;
        stderr: string;
        exit_code: number;
        execution_time: number;
      }>((resolve, reject) => {
        const startTime = Date.now();
        
        const childProcess = spawn(command, args, { 
          cwd: resolvedSearchDir,
          stdio: 'pipe'
        });

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        childProcess.on('close', (code) => {
          const executionTime = Date.now() - startTime;
          resolve({
            stdout: stdout,
            stderr: stderr,
            exit_code: code || 0,
            execution_time: executionTime
          });
        });

        childProcess.on('error', (error) => {
          reject(error);
        });
      });

      // Parse results
      let matches: any[] = [];
      
      if (hasRipgrep && use_ripgrep && result.stdout) {
        // Parse ripgrep JSON output
        const lines = result.stdout.trim().split('\n');
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.type === 'match') {
              matches.push({
                file: path.relative(workspacePath, json.data.path.text),
                line_number: json.data.line_number,
                line_content: json.data.lines.text.trim(),
                match_start: json.data.submatches[0]?.start || 0,
                match_end: json.data.submatches[0]?.end || 0,
                match_text: json.data.submatches[0]?.match?.text || ''
              });
            }
          } catch (parseError) {
            // Skip invalid JSON lines
          }
        }
      } else if (result.stdout) {
        // Parse grep output
        const lines = result.stdout.split('\n');
        let currentFile = '';
        
        for (const line of lines) {
          if (line.includes(':')) {
            const parts = line.split(':');
            if (parts.length >= 3) {
              const filePath = parts[0];
              const lineNumber = parseInt(parts[1]);
              const content = parts.slice(2).join(':');
              
              if (!isNaN(lineNumber)) {
                matches.push({
                  file: path.relative(workspacePath, filePath),
                  line_number: lineNumber,
                  line_content: content.trim(),
                  match_text: content.trim() // Simplified for grep
                });
              }
            }
          }
        }
      }

      // Limit results
      matches = matches.slice(0, max_results);

      // Group by file
      const fileGroups: Record<string, any[]> = {};
      matches.forEach(match => {
        if (!fileGroups[match.file]) {
          fileGroups[match.file] = [];
        }
        fileGroups[match.file].push(match);
      });

      const searchResult = {
        query: {
          pattern: pattern,
          search_path: search_path || ".",
          resolved_search_path: resolvedSearchDir,
          case_sensitive: case_sensitive,
          whole_word: whole_word,
          file_types: file_types || null,
          exclude_patterns: exclude_patterns,
          max_results: max_results,
          context_lines: context_lines
        },
        tool_used: toolUsed,
        execution_time_ms: result.execution_time,
        total_matches: matches.length,
        files_with_matches: Object.keys(fileGroups).length,
        matches_by_file: fileGroups,
        all_matches: matches,
        success: result.exit_code === 0 || result.exit_code === 1, // grep returns 1 when no matches found
        error: result.stderr || null
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(searchResult, null, 2)
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
