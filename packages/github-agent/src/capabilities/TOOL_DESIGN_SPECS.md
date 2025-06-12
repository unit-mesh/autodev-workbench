# GitHub Agent 工具设计规范

## 工具设计原则

### 1. 统一接口设计
```typescript
export interface ToolSpec {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: ParameterSpec[];
  examples: UsageExample[];
  capabilities: string[];
  limitations: string[];
  security: SecuritySpec;
}
```

### 2. 参数规范
```typescript
interface ParameterSpec {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  required: boolean;
  description: string;
  default?: any;
  validation?: ValidationRule[];
  examples: any[];
}
```

## 🔧 需要实现的工具详细设计

### 1. 进程管理工具套件

#### launch-process
```typescript
{
  name: "launch-process",
  description: "Launch processes with advanced control (background/interactive)",
  parameters: {
    command: {
      type: "string",
      required: true,
      description: "Shell command to execute",
      examples: ["npm start", "python server.py", "git status"]
    },
    wait: {
      type: "boolean", 
      required: true,
      description: "Wait for completion (true) or run in background (false)",
      examples: [true, false]
    },
    max_wait_seconds: {
      type: "number",
      required: true,
      description: "Maximum wait time for completion",
      default: 600,
      examples: [30, 300, 600]
    },
    cwd: {
      type: "string",
      required: false,
      description: "Working directory for command execution",
      examples: ["./packages/web", "/tmp"]
    },
    env: {
      type: "object",
      required: false,
      description: "Environment variables",
      examples: [{"NODE_ENV": "development"}]
    }
  },
  capabilities: [
    "Interactive process management",
    "Background process execution", 
    "Real-time output streaming",
    "Process lifecycle control"
  ]
}
```

#### list-processes
```typescript
{
  name: "list-processes", 
  description: "List all active processes launched by the agent",
  parameters: {
    filter: {
      type: "enum",
      values: ["all", "running", "completed", "failed"],
      required: false,
      default: "all",
      description: "Filter processes by status"
    },
    include_system: {
      type: "boolean",
      required: false, 
      default: false,
      description: "Include system processes in listing"
    }
  },
  capabilities: [
    "Process status monitoring",
    "Resource usage tracking",
    "Process hierarchy visualization"
  ]
}
```

#### read-process
```typescript
{
  name: "read-process",
  description: "Read output from a specific process",
  parameters: {
    terminal_id: {
      type: "number",
      required: true,
      description: "Process terminal ID to read from",
      examples: [1, 2, 3]
    },
    wait: {
      type: "boolean",
      required: true, 
      description: "Wait for new output if process still running",
      examples: [true, false]
    },
    max_wait_seconds: {
      type: "number",
      required: true,
      description: "Maximum time to wait for output",
      default: 60,
      examples: [10, 60, 300]
    },
    lines: {
      type: "number",
      required: false,
      description: "Number of recent lines to read (0 = all)",
      default: 0,
      examples: [10, 50, 100]
    }
  }
}
```

#### write-process
```typescript
{
  name: "write-process",
  description: "Send input to an interactive process",
  parameters: {
    terminal_id: {
      type: "number", 
      required: true,
      description: "Target process terminal ID"
    },
    input_text: {
      type: "string",
      required: true,
      description: "Text to send to process stdin",
      examples: ["y\n", "exit\n", "help\n"]
    },
    add_newline: {
      type: "boolean",
      required: false,
      default: true,
      description: "Automatically add newline to input"
    }
  }
}
```

### 2. 终端交互工具

#### read-terminal
```typescript
{
  name: "read-terminal",
  description: "Read output from the active terminal session",
  parameters: {
    only_selected: {
      type: "boolean",
      required: false,
      default: false,
      description: "Read only selected text in terminal"
    },
    lines: {
      type: "number", 
      required: false,
      description: "Number of recent lines to read",
      examples: [10, 50, 100]
    },
    include_history: {
      type: "boolean",
      required: false,
      default: true,
      description: "Include command history in output"
    }
  }
}
```

### 3. 代码库智能工具

#### codebase-retrieval  
```typescript
{
  name: "codebase-retrieval",
  description: "AI-powered semantic code search and context retrieval",
  parameters: {
    information_request: {
      type: "string",
      required: true,
      description: "Natural language description of code you're looking for",
      examples: [
        "Find authentication middleware functions",
        "Locate database connection setup",
        "Show error handling patterns"
      ]
    },
    scope: {
      type: "enum",
      values: ["project", "directory", "file"],
      required: false,
      default: "project",
      description: "Search scope limitation"
    },
    max_results: {
      type: "number",
      required: false,
      default: 10,
      description: "Maximum number of code snippets to return"
    },
    include_context: {
      type: "boolean",
      required: false,
      default: true,
      description: "Include surrounding context for each result"
    }
  }
}
```

### 4. 诊断工具

#### diagnostics
```typescript
{
  name: "diagnostics",
  description: "Get IDE diagnostics (errors, warnings, type issues)",
  parameters: {
    paths: {
      type: "array",
      items: "string",
      required: true,
      description: "File paths to get diagnostics for",
      examples: [["src/index.ts"], ["src/", "tests/"]]
    },
    severity: {
      type: "enum", 
      values: ["error", "warning", "info", "hint"],
      required: false,
      description: "Minimum severity level to include"
    },
    include_suggestions: {
      type: "boolean",
      required: false,
      default: true,
      description: "Include fix suggestions when available"
    }
  }
}
```

### 5. 可视化工具

#### render-mermaid
```typescript
{
  name: "render-mermaid",
  description: "Render Mermaid diagrams with interactive controls",
  parameters: {
    diagram_definition: {
      type: "string",
      required: true,
      description: "Mermaid diagram code to render",
      examples: [
        "graph TD; A-->B; B-->C;",
        "sequenceDiagram; Alice->>Bob: Hello"
      ]
    },
    title: {
      type: "string",
      required: false,
      default: "Mermaid Diagram",
      description: "Diagram title"
    },
    theme: {
      type: "enum",
      values: ["default", "dark", "forest", "neutral"],
      required: false,
      default: "default",
      description: "Diagram theme"
    }
  }
}
```

#### open-browser
```typescript
{
  name: "open-browser", 
  description: "Open URLs in default browser",
  parameters: {
    url: {
      type: "string",
      required: true,
      description: "URL to open in browser",
      examples: ["http://localhost:3000", "https://github.com"]
    },
    new_window: {
      type: "boolean",
      required: false,
      default: false,
      description: "Open in new window/tab"
    }
  }
}
```

### 6. 记忆管理工具

#### remember
```typescript
{
  name: "remember",
  description: "Store information for long-term memory across sessions",
  parameters: {
    memory: {
      type: "string",
      required: true,
      description: "Concise memory to store (1 sentence recommended)",
      examples: [
        "User prefers TypeScript over JavaScript",
        "Project uses React with Vite build system"
      ]
    },
    category: {
      type: "enum",
      values: ["preference", "context", "fact", "pattern"],
      required: false,
      default: "context",
      description: "Memory category for organization"
    },
    importance: {
      type: "enum",
      values: ["low", "medium", "high"],
      required: false,
      default: "medium", 
      description: "Memory importance level"
    }
  }
}
```

## 🚀 优化建议

### 1. 工具组合模式
```typescript
interface ToolChain {
  tools: ToolCall[];
  dependencies: ToolDependency[];
  errorHandling: ErrorStrategy;
  rollback: RollbackStrategy;
}
```

### 2. 交互式会话
```typescript
interface InteractiveSession {
  sessionId: string;
  tools: string[];
  state: SessionState;
  history: ToolCall[];
}
```

### 3. 性能监控
```typescript
interface ToolMetrics {
  executionTime: number;
  memoryUsage: number;
  successRate: number;
  errorPatterns: string[];
}
```

这个设计规范为未来实现提供了清晰的指导和标准化的接口。
