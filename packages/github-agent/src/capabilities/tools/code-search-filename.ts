import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const installFileSearchTool: ToolLike = (installer) => {
  installer("file-search", "Search for files by name patterns, extensions, or paths", {
    pattern: z.string().describe("File name pattern (supports wildcards like *.js, test*, etc.)"),
    search_path: z.string().optional().describe("Path to search in (relative to workspace, default: current directory)"),
    recursive: z.boolean().optional().describe("Search recursively in subdirectories (default: true)"),
    max_depth: z.number().optional().describe("Maximum recursion depth (default: 10)"),
    case_sensitive: z.boolean().optional().describe("Case sensitive search (default: false)"),
    include_hidden: z.boolean().optional().describe("Include hidden files and directories (default: false)"),
    file_types: z.array(z.string()).optional().describe("Filter by file extensions (e.g., ['js', 'ts', 'py'])"),
    exclude_patterns: z.array(z.string()).optional().describe("Patterns to exclude (e.g., ['node_modules', '.git'])"),
    max_results: z.number().optional().describe("Maximum number of results to return (default: 100)"),
    include_stats: z.boolean().optional().describe("Include file statistics (size, modified date, etc.) (default: true)")
  }, async ({ 
    pattern, 
    search_path,
    recursive = true,
    max_depth = 10,
    case_sensitive = false,
    include_hidden = false,
    file_types,
    exclude_patterns = ['node_modules', '.git', 'dist', 'build', 'coverage'],
    max_results = 100,
    include_stats = true
  }: { 
    pattern: string; 
    search_path?: string;
    recursive?: boolean;
    max_depth?: number;
    case_sensitive?: boolean;
    include_hidden?: boolean;
    file_types?: string[];
    exclude_patterns?: string[];
    max_results?: number;
    include_stats?: boolean;
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

      // Convert pattern to regex
      function patternToRegex(pattern: string, caseSensitive: boolean): RegExp {
        // Escape special regex characters except * and ?
        let regexPattern = pattern
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        
        // Anchor the pattern to match the full filename
        regexPattern = `^${regexPattern}$`;
        
        const flags = caseSensitive ? '' : 'i';
        return new RegExp(regexPattern, flags);
      }

      const searchRegex = patternToRegex(pattern, case_sensitive);
      const results: any[] = [];

      // Recursive file search function
      function searchFiles(dirPath: string, currentDepth: number = 0): void {
        if (currentDepth > max_depth) return;
        if (results.length >= max_results) return;

        try {
          const entries = fs.readdirSync(dirPath);
          
          for (const entry of entries) {
            if (results.length >= max_results) break;

            // Skip hidden files if not requested
            if (!include_hidden && entry.startsWith('.')) continue;

            const entryPath = path.join(dirPath, entry);
            const relativePath = path.relative(workspacePath, entryPath);
            
            // Check exclude patterns
            const shouldExclude = exclude_patterns.some(excludePattern => {
              const excludeRegex = patternToRegex(excludePattern, false);
              return excludeRegex.test(entry) || relativePath.includes(excludePattern);
            });
            
            if (shouldExclude) continue;

            try {
              const stats = fs.lstatSync(entryPath);
              const isDirectory = stats.isDirectory();
              const isFile = stats.isFile();
              const isSymlink = stats.isSymbolicLink();

              // Check if filename matches pattern
              const matchesPattern = searchRegex.test(entry);
              
              // Check file type filter
              let matchesFileType = true;
              if (file_types && file_types.length > 0 && isFile) {
                const ext = path.extname(entry).toLowerCase().replace('.', '');
                matchesFileType = file_types.some(type => type.toLowerCase() === ext);
              }

              // Add to results if it matches
              if (matchesPattern && matchesFileType) {
                const fileInfo: any = {
                  name: entry,
                  path: entryPath,
                  relative_path: relativePath,
                  type: isSymlink ? "symlink" : (isDirectory ? "directory" : "file"),
                  depth: currentDepth,
                  matches_pattern: true
                };

                if (include_stats) {
                  fileInfo.size = isFile ? stats.size : undefined;
                  fileInfo.modified = stats.mtime.toISOString();
                  fileInfo.created = stats.birthtime.toISOString();
                  fileInfo.permissions = stats.mode.toString(8);
                  if (isFile) {
                    fileInfo.extension = path.extname(entry);
                  }
                }

                results.push(fileInfo);
              }

              // Recurse into directories if requested
              if (recursive && isDirectory && currentDepth < max_depth) {
                searchFiles(entryPath, currentDepth + 1);
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

      // Start search
      const startTime = Date.now();
      searchFiles(resolvedSearchDir);
      const executionTime = Date.now() - startTime;

      // Sort results by relevance (exact matches first, then by depth, then by name)
      results.sort((a, b) => {
        // Exact matches first
        const aExact = a.name === pattern;
        const bExact = b.name === pattern;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by depth (shallower first)
        if (a.depth !== b.depth) return a.depth - b.depth;
        
        // Then by name
        return a.name.localeCompare(b.name);
      });

      // Group results by type
      const filesByType = {
        files: results.filter(r => r.type === "file"),
        directories: results.filter(r => r.type === "directory"),
        symlinks: results.filter(r => r.type === "symlink")
      };

      // Group by directory
      const filesByDirectory: Record<string, any[]> = {};
      results.forEach(result => {
        const dir = path.dirname(result.relative_path) || '.';
        if (!filesByDirectory[dir]) {
          filesByDirectory[dir] = [];
        }
        filesByDirectory[dir].push(result);
      });

      const searchResult = {
        query: {
          pattern: pattern,
          search_path: search_path || ".",
          resolved_search_path: resolvedSearchDir,
          recursive: recursive,
          max_depth: max_depth,
          case_sensitive: case_sensitive,
          include_hidden: include_hidden,
          file_types: file_types || null,
          exclude_patterns: exclude_patterns,
          max_results: max_results
        },
        execution_time_ms: executionTime,
        total_matches: results.length,
        matches_by_type: {
          files: filesByType.files.length,
          directories: filesByType.directories.length,
          symlinks: filesByType.symlinks.length
        },
        matches_by_directory: Object.keys(filesByDirectory).map(dir => ({
          directory: dir,
          count: filesByDirectory[dir].length,
          files: filesByDirectory[dir]
        })),
        all_matches: results,
        truncated: results.length >= max_results,
        pattern_regex: searchRegex.source
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
            text: `Error performing file search: ${error.message}`
          }
        ]
      };
    }
  });
};
