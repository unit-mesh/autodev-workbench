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
