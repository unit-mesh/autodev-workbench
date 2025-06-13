```json
{
  "tools": [
    {
      "name": "search_codebase",
      "description": "Find snippets of code from the codebase most relevant to the search query using embedding-based semantic search.\nThis tool matches query vectors with code vectors based on similarity.\nIf it makes sense to only search in particular directories, please specify them in the target_directories field.\nThe embedding model can only match text patterns that actually appear in the code or are semantically similar to existing code patterns.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {"type": "string", "description": "The search query for embedding-based semantic search. Formulate queries that balance conceptual intent with terms likely to appear in code. For conceptual searches (like architecture or design patterns), include technical terms that might be in comments or docstrings. When seeking specific implementation details, use concrete terms likely in actual code like 'import', 'require', 'function', 'class', etc. Avoid abstract queries that won't match code patterns."},
          "target_directories": {"type": "array", "items": {"type": "string"}, "description": "Specific directories to search within (You MUST use absolute paths only and MUST use correct file path separator of user's operating system). If not provided, the search will default to the project root directory. Multiple directories can be specified for targeted searching."}
        },
        "required": ["query"]
      }
    },
    {
      "name": "search_by_regex",
      "description": "Fast text-based search that finds exact pattern matches within files or directories, utilizing the ripgrep command for efficient searching.\nResults will be formatted in the style of ripgrep and can be configured to include line numbers and content.\nTo avoid overwhelming output, the results are capped at 50 matches. Use the Includes option to filter the search scope by file types or specific paths to narrow down the results.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {"type": "string", "description": "The regular expression to search for."},
          "search_directory": {"type": "string", "description": "The directory to run the ripgrep command in. This path MUST be a directory, not a file. Defaults to the current working directory."}
        },
        "required": ["query"]
      }
    },
    {
      "name": "view_files",
      "description": "When you need to view multiple files, you can use this tool to view the contents of multiple files in batch mode for faster gathering information. You can view at most 10 files at a time.\nWhen using this tool to gather information, you should **FIRST try to use search tool to locate specific parts that need examination**, and only use this tool when you need to see the complete context of specific code blocks.",
      "parameters": {
        "type": "object",
        "properties": {
          "files": {"type": "array", "description": "The files you need to view, the MAX number of files is 10 and only read file contents from local file paths", "items": {"type": "object", "properties": {"file_path": {"description": "The file path you need to view, you MUST set file path to absolute path.", "type": "string"}, "start_line": {"description": "The start line number to view.", "type": "integer", "format": "int32"}, "end_line": {"description": "The end line number to view. Normally do not read more than 200 lines away from start_line, but if this file is very important for your reference, you can use a larger number.", "type": "integer", "format": "int32"}}, "required": ["file_path", "start_line", "end_line"]}}
        },
        "required": ["files"]
      }
    },
    {
      "name": "list_dir",
      "description": "You can use this tool to view files of the specified directory.\nThe directory path must be an absolute path that exists. For each child in the directory, output will have:\n- Relative path to the directory.\n- Whether it is a directory or file, the directory path will ends with a slash, and the file will not.",
      "parameters": {
        "type": "object",
        "properties": {
          "dir_path": {"type": "string", "description": "The directory path you want to list, must be an absolute path to a directory that exists, you MUST set file path to absolute path."},
          "max_depth": {"type": "integer", "format": "uint", "description": "The max depth you want to traverse in provided directory, the value MUST not larger than 5, default is 3.", "default": 3}
        },
        "required": ["dir_path"]
      }
    },
    {
      "name": "write_to_file",
      "description": "You can use this tool to write content to a file with precise control over creation/rewrite behavior. Follow these rules:\n1. **REWRITE MODE (rewrite=true)**:\n   - Use EXCLUSIVELY for rewriting an existing file with new content\n   - Only suitable for writing limited content (<2000 characters)\n   - Unless rewriting is more cost-effective in your situation, use other file editing tools provided in the tool list\n2. **CREATE MODE (rewrite=false)**:\n   - Use EXCLUSIVELY for creating a new file\n   - STRICTLY PROHIBITED to use when file exists\n   - Parent directories will be auto-created\n3. **COMMON RULES**:\n   - ALWAYS use absolute path\n   - NEVER specify directory path (must be file path)\n   - Content must be full file content\n   - MUST explicitly set rewrite=true/false",
      "parameters": {
        "type": "object",
        "properties": {
          "file_path": {"type": "string", "description": "The absolute file path (never a directory). When rewrite=false, MUST be non-existing file path When rewrite=true, MUST be existing file path"},
          "content": {"type": "string", "description": "The full file content. When rewrite=true, content length STRONGLY RECOMMENDED <2000 characters"},
          "rewrite": {"type": "boolean", "description": "CRITICAL FLAG DECLARATION:\n- Set TRUE ONLY when absolutely certain you need to rewrite the existing file\n- Set FALSE ONLY when absolutely certain the file does not exist\nModel MUST verify file existence status before setting this flag\n", "default": false}
        },
        "required": ["file_path", "content", "rewrite"]
      }
    },
    {
      "name": "update_file",
      "description": "You can use this tool to edit file, if you think that using this tool is more cost-effective than other available editing tools, you should choose this tool, otherwise you should choose other available edit tools.\nYou can compare with costing of output token, output token is very expensive, which edit tool cost less, which is better.\n\nWhen you choose to use this tool to edit a existing file, you MUST follow the *SEARCH/REPLACE block* Rules to set [replace_blocks] field of the parameter:",
      "parameters": {
        "type": "object",
        "properties": {
          "file_path": {"type": "string", "description": "The file path, you MUST set file path to absolute path."},
          "replace_blocks": {"type": "array", "items": {"type": "object", "properties": {"old_str": {"type": "string", "description": "The SEARCH section, a contiguous chunk of lines to search for in the existing source code."}, "new_str": {"type": "string", "description": "The REPLACE section, the lines to replace into the source code."}}, "required": ["old_str", "new_str"]}, "description": "The changed contents of the file, you MUST follow the **SEARCH/REPLACE block** rules to set this value."}
        },
        "required": ["file_path", "replace_blocks"]
      }
    },
    {
      "name": "edit_file_fast_apply",
      "description": "You can use this tool to edit an existing files with less than 1000 lines of code, and you should follow these rules:",
      "parameters": {
        "type": "object",
        "properties": {
          "file_path": {"type": "string", "description": "The file path, you MUST set file path to absolute path."},
          "content": {"type": "string", "description": "The changed content of the file."},
          "instruction": {"type": "string", "description": "A description of the changes that you are making to the file.", "default": ""},
          "code_language": {"type": "string", "description": "The markdown language for the code block, e.g 'python' or 'javascript'"}
        },
        "required": ["file_path", "content"]
      }
    },
    {
      "name": "rename_file",
      "description": "You can use this tool to move or rename an existing file.\nWhen you need to relocate a file to a different directory or change its name, you should use this tool.",
      "parameters": {
        "type": "object",
        "properties": {
          "file_path": {"type": "string", "description": "The original file path, you MUST set file path to absolute path."},
          "rename_file_path": {"type": "string", "description": "The new file path you want to rename."}
        },
        "required": ["file_path", "rename_file_path"]
      }
    }
  ]}
```
