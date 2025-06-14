# TRAE Agent Tool Reference

This document provides a reference guide for all available tools in the TRAE agent system.

## Tools Overview

| Tool Name              | Description                                                        | Required Parameters                                | Key Capabilities                                                                                                   |
|------------------------|--------------------------------------------------------------------|----------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| `search_codebase`      | Embedding-based semantic search for finding relevant code snippets | `query`                                            | - Semantic search across codebase<br>- Optional directory targeting<br>- Matches conceptual patterns in code       |
| `search_by_regex`      | Fast text-based search using ripgrep for exact pattern matches     | `query`                                            | - Regular expression search<br>- Limited to 50 matches<br>- High performance text search                           |
| `view_files`           | Batch view multiple file contents (up to 10 files)                 | `files` array with file paths and line ranges      | - View multiple files simultaneously<br>- Specify line ranges<br>- Up to 10 files per request                      |
| `list_dir`             | List contents of a directory                                       | `dir_path`                                         | - View directory structure<br>- Configurable depth (max 5)<br>- Distinguishes files from directories               |
| `write_to_file`        | Create new files or rewrite existing ones                          | `file_path`, `content`, `rewrite`                  | - Create new files (rewrite=false)<br>- Rewrite existing files (rewrite=true)<br>- Parent directories auto-created |
| `update_file`          | Edit files using search/replace blocks                             | `file_path`, `replace_blocks`                      | - Edit existing files<br>- Pattern-based text replacement<br>- Efficient for targeted changes                      |
| `edit_file_fast_apply` | Edit existing files (under 1000 lines)                             | `file_path`, `content`                             | - Full file content replacement<br>- Good for smaller files<br>- Optional instruction and language metadata        |
| `rename_file`          | Move or rename files                                               | `file_path`, `rename_file_path`                    | - File relocation<br>- File renaming                                                                               |
| `delete_file`          | Delete one or more files                                           | `file_paths` array                                 | - Multiple file deletion<br>- Safe removal of files                                                                |
| `run_command`          | Execute system commands                                            | `command`, `args`, `blocking`, `requires_approval` | - Execute system commands<br>- Support for blocking/non-blocking execution<br>- Configurable approval requirements |
| `check_command_status` | Check status of non-blocking commands                              | `command_id` (optional)                            | - Monitor command execution<br>- View command output<br>- Check for errors                                         |
| `stop_command`         | Terminate a running command                                        | `command_id`                                       | - Stop running processes<br>- Clean up resources                                                                   |

## Detailed Tool Usage Guidelines

### Search Tools

- **`search_codebase`**: Use for semantic, concept-based searches. Formulate queries with terms likely to appear in
  code.
- **`search_by_regex`**: Use for exact pattern matching when you know specific text patterns to look for.

### File Operations

- **`view_files`**: Use after search tools to view complete context of specific code blocks.
- **`list_dir`**: Use to explore project structure and discover relevant files.
- **`write_to_file`**: Use create mode for new files, rewrite mode for complete file replacement.
- **`update_file`**: Preferred for targeted edits with search/replace blocks.
- **`edit_file_fast_apply`**: Best for smaller files when complete rewrite is needed.
- **`rename_file`**: Use for moving or renaming files while preserving content.
- **`delete_file`**: Safe removal of files, supports batch operations.

### Command Execution

- **`run_command`**: Primary tool for executing system commands, with proper configuration for blocking vs non-blocking.
- **`check_command_status`**: Monitor progress of non-blocking commands and view their output.
- **`stop_command`**: Terminate commands when needed, such as when restarting after code changes.

## Best Practices

1. **Search before modifying**: Always use search tools to locate relevant code before making changes
2. **Choose the right edit tool**: Select the most appropriate tool based on the scope of changes
3. **Use absolute paths**: Always use absolute file paths in all tool parameters
4. **Configure command execution carefully**: Set blocking/non-blocking appropriately for the type of command

```json
{
  "tools": [
    {
      "name": "search_codebase",
      "description": "Find snippets of code from the codebase most relevant to the search query using embedding-based semantic search.\nThis tool matches query vectors with code vectors based on similarity.\nIf it makes sense to only search in particular directories, please specify them in the target_directories field.\nThe embedding model can only match text patterns that actually appear in the code or are semantically similar to existing code patterns.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "The search query for embedding-based semantic search. Formulate queries that balance conceptual intent with terms likely to appear in code. For conceptual searches (like architecture or design patterns), include technical terms that might be in comments or docstrings. When seeking specific implementation details, use concrete terms likely in actual code like 'import', 'require', 'function', 'class', etc. Avoid abstract queries that won't match code patterns."
          },
          "target_directories": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Specific directories to search within (You MUST use absolute paths only and MUST use correct file path separator of user's operating system). If not provided, the search will default to the project root directory. Multiple directories can be specified for targeted searching."
          }
        },
        "required": [
          "query"
        ]
      }
    },
    {
      "name": "search_by_regex",
      "description": "Fast text-based search that finds exact pattern matches within files or directories, utilizing the ripgrep command for efficient searching.\nResults will be formatted in the style of ripgrep and can be configured to include line numbers and content.\nTo avoid overwhelming output, the results are capped at 50 matches. Use the Includes option to filter the search scope by file types or specific paths to narrow down the results.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "The regular expression to search for."
          },
          "search_directory": {
            "type": "string",
            "description": "The directory to run the ripgrep command in. This path MUST be a directory, not a file. Defaults to the current working directory."
          }
        },
        "required": [
          "query"
        ]
      }
    },
    {
      "name": "view_files",
      "description": "When you need to view multiple files, you can use this tool to view the contents of multiple files in batch mode for faster gathering information. You can view at most 10 files at a time.\nWhen using this tool to gather information, you should **FIRST try to use search tool to locate specific parts that need examination**, and only use this tool when you need to see the complete context of specific code blocks.",
      "parameters": {
        "type": "object",
        "properties": {
          "files": {
            "type": "array",
            "description": "The files you need to view, the MAX number of files is 10 and only read file contents from local file paths",
            "items": {
              "type": "object",
              "properties": {
                "file_path": {
                  "description": "The file path you need to view, you MUST set file path to absolute path.",
                  "type": "string"
                },
                "start_line": {
                  "description": "The start line number to view.",
                  "type": "integer",
                  "format": "int32"
                },
                "end_line": {
                  "description": "The end line number to view. Normally do not read more than 200 lines away from start_line, but if this file is very important for your reference, you can use a larger number.",
                  "type": "integer",
                  "format": "int32"
                }
              },
              "required": [
                "file_path",
                "start_line",
                "end_line"
              ]
            }
          }
        },
        "required": [
          "files"
        ]
      }
    },
    {
      "name": "list_dir",
      "description": "You can use this tool to view files of the specified directory.\nThe directory path must be an absolute path that exists. For each child in the directory, output will have:\n- Relative path to the directory.\n- Whether it is a directory or file, the directory path will ends with a slash, and the file will not.",
      "parameters": {
        "type": "object",
        "properties": {
          "dir_path": {
            "type": "string",
            "description": "The directory path you want to list, must be an absolute path to a directory that exists, you MUST set file path to absolute path."
          },
          "max_depth": {
            "type": "integer",
            "format": "uint",
            "description": "The max depth you want to traverse in provided directory, the value MUST not larger than 5, default is 3.",
            "default": 3
          }
        },
        "required": [
          "dir_path"
        ]
      }
    },
    {
      "name": "write_to_file",
      "description": "You can use this tool to write content to a file with precise control over creation/rewrite behavior. Follow these rules:\n1. **REWRITE MODE (rewrite=true)**:\n   - Use EXCLUSIVELY for rewriting an existing file with new content\n   - Only suitable for writing limited content (<2000 characters)\n   - Unless rewriting is more cost-effective in your situation, use other file editing tools provided in the tool list\n2. **CREATE MODE (rewrite=false)**:\n   - Use EXCLUSIVELY for creating a new file\n   - STRICTLY PROHIBITED to use when file exists\n   - Parent directories will be auto-created\n3. **COMMON RULES**:\n   - ALWAYS use absolute path\n   - NEVER specify directory path (must be file path)\n   - Content must be full file content\n   - MUST explicitly set rewrite=true/false",
      "parameters": {
        "type": "object",
        "properties": {
          "file_path": {
            "type": "string",
            "description": "The absolute file path (never a directory). When rewrite=false, MUST be non-existing file path When rewrite=true, MUST be existing file path"
          },
          "content": {
            "type": "string",
            "description": "The full file content. When rewrite=true, content length STRONGLY RECOMMENDED <2000 characters"
          },
          "rewrite": {
            "type": "boolean",
            "description": "CRITICAL FLAG DECLARATION:\n- Set TRUE ONLY when absolutely certain you need to rewrite the existing file\n- Set FALSE ONLY when absolutely certain the file does not exist\nModel MUST verify file existence status before setting this flag\n",
            "default": false
          }
        },
        "required": [
          "file_path",
          "content",
          "rewrite"
        ]
      }
    },
    {
      "name": "update_file",
      "description": "You can use this tool to edit file, if you think that using this tool is more cost-effective than other available editing tools, you should choose this tool, otherwise you should choose other available edit tools.\nYou can compare with costing of output token, output token is very expensive, which edit tool cost less, which is better.\n\nWhen you choose to use this tool to edit a existing file, you MUST follow the *SEARCH/REPLACE block* Rules to set [replace_blocks] field of the parameter:",
      "parameters": {
        "type": "object",
        "properties": {
          "file_path": {
            "type": "string",
            "description": "The file path, you MUST set file path to absolute path."
          },
          "replace_blocks": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "old_str": {
                  "type": "string",
                  "description": "The SEARCH section, a contiguous chunk of lines to search for in the existing source code."
                },
                "new_str": {
                  "type": "string",
                  "description": "The REPLACE section, the lines to replace into the source code."
                }
              },
              "required": [
                "old_str",
                "new_str"
              ]
            },
            "description": "The changed contents of the file, you MUST follow the **SEARCH/REPLACE block** rules to set this value."
          }
        },
        "required": [
          "file_path",
          "replace_blocks"
        ]
      }
    },
    {
      "name": "edit_file_fast_apply",
      "description": "You can use this tool to edit an existing files with less than 1000 lines of code, and you should follow these rules:",
      "parameters": {
        "type": "object",
        "properties": {
          "file_path": {
            "type": "string",
            "description": "The file path, you MUST set file path to absolute path."
          },
          "content": {
            "type": "string",
            "description": "The changed content of the file."
          },
          "instruction": {
            "type": "string",
            "description": "A description of the changes that you are making to the file.",
            "default": ""
          },
          "code_language": {
            "type": "string",
            "description": "The markdown language for the code block, e.g 'python' or 'javascript'"
          }
        },
        "required": [
          "file_path",
          "content"
        ]
      }
    },
    {
      "name": "rename_file",
      "description": "You can use this tool to move or rename an existing file.\nWhen you need to relocate a file to a different directory or change its name, you should use this tool.",
      "parameters": {
        "type": "object",
        "properties": {
          "file_path": {
            "type": "string",
            "description": "The original file path, you MUST set file path to absolute path."
          },
          "rename_file_path": {
            "type": "string",
            "description": "The new file path you want to rename."
          }
        },
        "required": [
          "file_path",
          "rename_file_path"
        ]
      }
    },
    {
      "name": "delete_file",
      "description": "You can use this tool to delete files, you can delete multi files in one toolcall, and you MUST make sure the files is exist before deleting.\nWhen you need to delete file, you MUST use this tool to delete file instead of using shell.",
      "parameters": {
        "type": "object",
        "properties": {
          "file_paths": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "The list of file paths you want to delete, you MUST set file path to absolute path."
          }
        },
        "required": [
          "file_paths"
        ]
      }
    },
    {
      "name": "run_command",
      "description": "You can use this tool to PROPOSE a command to run on behalf of the user.\nEnsure the command is properly formatted and does not contain any harmful instructions.\nEnsure the command is compatible with the current operating system (macos).\nMake sure to separate the arguments into 'args'; placing the full command with all arguments under \"command\" will not work.\nIf you want to run command in special directory, you should set [cwd] to the directory path instead of using command to change directory.\nIf you need to start a web server or any long-running process, you MUST set [blocking] to false. Additionally, remember to set [wait_ms_before_async] to a reasonable value to ensure the command does not fail quickly with an error.",
      "parameters": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "Name of the command to run."
          },
          "args": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "The list of arguments to pass to the command. Make sure to pass the arguments as an array. Do NOT wrap the square brackets in quotation marks. If there are no arguments, this field should be left empty."
          },
          "command_type": {
            "type": "string",
            "description": "The command type which you have classified, the available type is: [web_server, long_running_process, short_running_process, other]."
          },
          "cwd": {
            "type": "string",
            "description": "The working directory to run the command in, the value MUST be absolute path, if not provided, it will be the current working directory."
          },
          "blocking": {
            "type": "boolean",
            "description": "When [blocking] is set to `true`, the command will run until it completes, and during this period, the user won't be able to interact with the Agent. You MUST ensure this value is set according to the following rules:"
          },
          "wait_ms_before_async": {
            "type": "integer",
            "format": "uint",
            "description": "This configuration applies only when [blocking] is set to false.\nIt defines the number of milliseconds to pause after initiating the command before letting it proceed in full asynchronous mode.\nThis delay is beneficial for commands that are meant to run asynchronously but might fail almost immediately with an error; the wait allows you to detect and observe any errors that occur during this initial period.\nIf you prefer not to wait, set this value to 0.",
            "minimum": 0
          },
          "requires_approval": {
            "type": "boolean",
            "description": "Whether the user must approval the command before it is executed. Set to 'false' for safe operations like read/write files/directories, create/initialize/build projects, install project dependencies, running development servers."
          }
        },
        "required": [
          "command",
          "args",
          "blocking",
          "requires_approval"
        ]
      }
    },
    {
      "name": "check_command_status",
      "description": "You can use this tool to get the status of a previously executed command by its Command ID ( non-blocking command ).\nReturns the current status (running, done), exit code (if done), output lines as specified by output priority, and any error if present.\nIf the user asks about runtime errors, compilation errors, terminal errors, etc., you can also use the provided tool to obtain the current terminal command without setting the Command ID.\nIf there is a non-blocking command is initializing in previous toolcall, you should use this tool to get the current status of that command.",
      "parameters": {
        "type": "object",
        "properties": {
          "command_id": {
            "type": "string",
            "description": "ID of the command to get status for."
          },
          "wait_ms_before_check": {
            "type": "integer",
            "description": "If you expect the command to take longer to complete, you can specify a waiting period in milliseconds before checking its status.\nIf you prefer not to wait, set this value to 0."
          },
          "output_character_count": {
            "type": "integer",
            "format": "uint",
            "description": "Number of characters to view. Make this as small as possible to avoid excessive memory usage.",
            "minimum": 0,
            "default": 1000
          },
          "skip_character_count": {
            "type": "integer",
            "format": "uint",
            "description": "Number of characters to skip from the output_priority position.",
            "minimum": 0,
            "default": 0
          },
          "output_priority": {
            "type": "string",
            "description": "Priority for displaying command output. Must be one of: 'top' (show oldest lines), 'bottom' (show newest lines), or 'split' (prioritize oldest and newest lines, excluding middle).",
            "default": "bottom"
          }
        }
      }
    },
    {
      "name": "stop_command",
      "description": "This tool allows you to terminate a currently running command( the command MUST be previously executed command. ). You should use this tool when:\n- You need to restart a command after updating the code;\n- The user requests to stop the running command;",
      "parameters": {
        "type": "object",
        "properties": {
          "command_id": {
            "type": "string",
            "description": "The command id of the running command that you need to terminate. you MUST use correct command id from previously executed command info."
          }
        },
        "required": [
          "command_id"
        ]
      }
    }
  ]
}
```
