# CODEX Agent Tools Reference

The following table provides a comprehensive overview of all available tools that can be utilized in the CODEX agent environment. This reference is designed to facilitate future development and integration.

| Tool Name       | Description                                          | Parameters                                                             |
|-----------------|------------------------------------------------------|------------------------------------------------------------------------|
| `shell.execute` | Run a shell command in the workspace                 | `cmd`: string - The command to execute                                 |
| `file.read`     | Read a file from the workspace                       | `path`: string - Path to the file                                      |
| `file.write`    | Write text to a file, creating it if necessary       | `path`: string - Path to the file<br>`text`: string - Content to write |
| `process.start` | Launch a background process                          | `cmd`: string - The command to execute                                 |
| `process.stop`  | Terminate a running background process               | `pid`: integer - Process ID to terminate                               |
| `pip.install`   | Install a Python package during the run              | `packages`: array of strings - Package names to install                |
| `python.exec`   | Execute a short Python snippet and return its output | `code`: string - Python code to execute                                |
| `browser.open`  | Launch a headless browser to visit a URL             | `url`: string - URL to open                                            |
| `net.enable`    | Allow outbound network access                        | None                                                                   |
| `net.disable`   | Disable outbound network access                      | None                                                                   |
| `tests.run`     | Run the repository's test suite                      | None                                                                   |
| `diff.get`      | Show file diffs since the last commit                | None                                                                   |
| `tool.describe` | Return a list of available tools and their usage     | None                                                                   |

## Tool Categories

### File Operations
- `file.read` - Read file contents
- `file.write` - Create or update files

### Process Management
- `shell.execute` - Run shell commands
- `process.start` - Start background processes
- `process.stop` - Terminate running processes

### Python Integration
- `pip.install` - Install Python packages
- `python.exec` - Execute Python code

### Network & Web
- `browser.open` - Access web content
- `net.enable` - Enable network access
- `net.disable` - Disable network access

### Repository Management
- `tests.run` - Execute test suite
- `diff.get` - View code changes

### System
- `tool.describe` - Get tool documentation

```json
    [
  {
    "type": "function",
    "function": {
      "name": "shell.execute",
      "description": "Run a shell command in the workspace",
      "parameters": {
        "type": "object",
        "properties": {
          "cmd": {
            "type": "string"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "file.read",
      "description": "Read a file from the workspace",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "file.write",
      "description": "Write text to a file, creating it if necessary",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string"
          },
          "text": {
            "type": "string"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "process.start",
      "description": "Launch a background process",
      "parameters": {
        "type": "object",
        "properties": {
          "cmd": {
            "type": "string"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "process.stop",
      "description": "Terminate a running background process",
      "parameters": {
        "type": "object",
        "properties": {
          "pid": {
            "type": "integer"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "pip.install",
      "description": "Install a Python package during the run",
      "parameters": {
        "type": "object",
        "properties": {
          "packages": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "python.exec",
      "description": "Execute a short Python snippet and return its output",
      "parameters": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "browser.open",
      "description": "Launch a headless browser to visit a URL",
      "parameters": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "net.enable",
      "description": "Allow outbound network access",
      "parameters": {}
    }
  },
  {
    "type": "function",
    "function": {
      "name": "net.disable",
      "description": "Disable outbound network access",
      "parameters": {}
    }
  },
  {
    "type": "function",
    "function": {
      "name": "tests.run",
      "description": "Run the repository's test suite",
      "parameters": {}
    }
  },
  {
    "type": "function",
    "function": {
      "name": "diff.get",
      "description": "Show file diffs since the last commit",
      "parameters": {}
    }
  },
  {
    "type": "function",
    "function": {
      "name": "tool.describe",
      "description": "Return a list of available tools and their usage",
      "parameters": {}
    }
  }
]
```
