# Cursor Agent vs Augment Agent 工具定义对比（Claude Tools Use Protocol）

## 概述
本文档基于 Claude Tools Use 协议格式，对比 Cursor Agent 与 Augment Agent 的工具定义。

## 文件系统工具对比

| 功能类型 | Cursor Agent 定义 | Augment Agent 定义 |
|---------|------------------|-------------------|
| **列出目录** | `list_dir`<br>参数：<br>- `relative_workspace_path: string`<br>- `explanation: string`<br>描述：List the contents of a directory. The quick tool to use for discovery, before using more targeted tools like semantic search or file reading. | `list-directory`<br>参数：<br>- `path: string`<br>- `options?: { includeHidden?: boolean, recursive?: boolean }`<br>描述：List files and directories with icons and metadata |
| **读取文件** | `read_file`<br>参数：<br>- `target_file: string`<br>- `should_read_entire_file: boolean`<br>- `start_line_one_indexed: integer`<br>- `end_line_one_indexed_inclusive: integer`<br>- `explanation: string`<br>描述：Read the contents of a file. Max 1500 lines at a time, min 500 lines. Each call should assess if contents are sufficient and proactively call again if needed. | `read-file`<br>参数：<br>- `path: string`<br>- `encoding?: string`<br>- `lineRange?: { start: number, end: number }`<br>描述：Read file content with optional encoding and line range support |
| **写入文件** | `edit_file`<br>参数：<br>- `target_file: string`<br>- `instructions: string`<br>- `code_edit: string`<br>描述：Use // ... existing code ... to represent unchanged code. Minimize unchanged code repetition while maintaining sufficient context. | `write-file`<br>参数：<br>- `path: string`<br>- `content: string`<br>- `options?: { createDirectories?: boolean, backup?: boolean }`<br>描述：Write content to file with directory creation and backup options |
| **删除文件** | `delete_file`<br>参数：<br>- `target_file: string`<br>- `explanation: string`<br>描述：Deletes a file at the specified path. Fails gracefully if file doesn't exist or operation is rejected. | `delete-file`<br>参数：<br>- `path: string`<br>描述：Delete a file from the filesystem |
| **精确编辑** | *不适用* | `str-replace-editor`<br>参数：<br>- `command: "str_replace" \| "view" \| "insert"`<br>- `path: string`<br>- `old_str_1?: string`<br>- `new_str_1?: string`<br>- `old_str_start_line_number_1?: number`<br>- `old_str_end_line_number_1?: number`<br>- `insert_line_1?: number`<br>- `dryRun?: boolean`<br>描述：Advanced file editor for precise string replacements and insertions with line validation |

## 搜索工具对比

| 功能类型 | Cursor Agent 定义 | Augment Agent 定义 |
|---------|------------------|-------------------|
| **语义搜索** | `codebase_search`<br>参数：<br>- `query: string`<br>- `target_directories?: string[]`<br>- `explanation: string`<br>描述：Find snippets of code from the codebase most relevant to the search query. This is a semantic search tool. Please just reuse the user's exact query with their wording. | `semantic-code-search`<br>参数：<br>- `query: string`<br>- `filePattern?: string`<br>- `maxResults?: number`<br>描述：Intelligent code search with semantic understanding |
| **正则搜索** | `grep_search`<br>参数：<br>- `query: string`<br>- `include_pattern?: string`<br>- `exclude_pattern?: string`<br>- `case_sensitive?: boolean`<br>- `explanation: string`<br>描述：Run fast regex searches using ripgrep. Results capped at 50 matches. Always escape special regex characters: ( ) [ ] { } + * ? ^ $ \| . \\ | `code-search-regex`<br>参数：<br>- `pattern: string`<br>- `fileTypes?: string[]`<br>- `caseSensitive?: boolean`<br>描述：Regular expression code search across multiple files |
| **文件搜索** | `file_search`<br>参数：<br>- `query: string`<br>- `explanation: string`<br>描述：Fast file search based on fuzzy matching against file path. Response capped to 10 results. | *不适用* |
| **AST搜索** | *不适用* | `search-keywords`<br>参数：<br>- `file_path: string`<br>- `keywords: string[]`<br>描述：Search for specific programming language symbols using AST-based SymbolAnalyser |

## 终端和进程管理工具对比

| 功能类型 | Cursor Agent 定义 | Augment Agent 定义 |
|---------|------------------|-------------------|
| **执行命令** | `run_terminal_cmd`<br>参数：<br>- `command: string`<br>- `is_background: boolean`<br>- `explanation: string`<br>描述：If in new shell, cd to appropriate directory. If in same shell, look in chat history for current directory. Pass non-interactive flags. Append \| cat for pagers. | `run-terminal-command`<br>参数：<br>- `command: string`<br>- `cwd?: string`<br>- `timeout?: number`<br>- `analyzeOutput?: boolean`<br>- `verbose?: boolean`<br>描述：Enhanced command execution with output analysis and error suggestions |
| **启动进程** | *不适用* | `launch-process`<br>参数：<br>- `command: string`<br>- `args?: string[]`<br>- `options?: { background?: boolean, cwd?: string }`<br>描述：Launch processes with wait/background modes |
| **列出进程** | *不适用* | `list-processes`<br>参数：*无*<br>描述：List all active processes with status |
| **读取进程** | *不适用* | `read-process`<br>参数：<br>- `processId: string`<br>- `lines?: number`<br>描述：Read output from specific process |
| **写入进程** | *不适用* | `write-process`<br>参数：<br>- `processId: string`<br>- `input: string`<br>描述：Send input to interactive processes |
| **终止进程** | *不适用* | `kill-process`<br>参数：<br>- `processId: string`<br>- `signal?: string`<br>描述：Terminate processes by ID |

## 集成工具对比

| 功能类型 | Cursor Agent 定义 | Augment Agent 定义 |
|---------|------------------|-------------------|
| **Web搜索** | `web_search`<br>参数：<br>- `search_term: string`<br>- `explanation: string`<br>描述：Search the web for real-time information. Use when you need up-to-date information or to verify current facts. | `web-search`<br>参数：<br>- `query: string`<br>- `numResults?: number`<br>描述：Search the web for information |
| **获取规则** | `fetch_rules`<br>参数：<br>- `rule_names: string[]`<br>描述：Fetches rules provided by the user to help with navigating the codebase. | *不适用* |
| **笔记本编辑** | `edit_notebook`<br>参数：<br>- `target_notebook: string`<br>- `cell_idx: number`<br>- `is_new_cell: boolean`<br>- `cell_language: string`<br>- `old_string: string`<br>- `new_string: string`<br>描述：Edit jupyter notebook cell. Supports editing existing cells and creating new cells. | *不适用* |

## GitHub/GitLab 工具对比

| 功能类型 | Cursor Agent 定义 | Augment Agent 定义 |
|---------|------------------|-------------------|
| **Issue操作** | *不适用* | `github-get-issue`<br>参数：<br>- `owner: string`<br>- `repo: string`<br>- `issueNumber: number`<br><br>`github-create-issue`<br>参数：<br>- `owner: string`<br>- `repo: string`<br>- `title: string`<br>- `body: string`<br>- `labels?: string[]`<br>- `assignees?: string[]` |
| **代码搜索** | *不适用* | `github-find-code`<br>参数：<br>- `description: string`<br>- `owner: string`<br>- `repo: string`<br>描述：Find code based on natural language description |
| **MR操作** | *不适用* | `gitlab-mr-create`<br>参数：<br>- `projectId: string`<br>- `sourceBranch: string`<br>- `targetBranch: string`<br>- `title: string`<br>- `description?: string` |

## 关键协议差异

### Claude Tools Use 协议特征（Cursor）
```typescript
{
  name: string,
  description: string,
  input_schema: {
    type: "object",
    properties: {
      [key: string]: {
        type: string,
        description: string,
        enum?: string[]
      }
    },
    required: string[]
  }
}
```

### MCP 协议特征（Augment）
```typescript
{
  name: string,
  description: string,
  inputSchema: z.ZodObject<{
    [key: string]: z.ZodType
  }>
}
```

## 执行策略差异

| 特性 | Cursor Agent | Augment Agent |
|------|-------------|---------------|
| **并行执行** | 默认并行，显式要求："Prioritize calling tools in parallel whenever possible" | 支持但不强制，基于工具依赖关系 |
| **错误处理** | 工具调用失败后立即反思并调整策略 | 标准错误返回，由调用方处理 |
| **上下文保持** | 强调shell会话状态跟踪，记住工作目录 | 每次调用独立，通过参数传递上下文 |
| **结果验证** | "After receiving tool results, carefully reflect on their quality" | 返回结构化结果，验证由上层处理 |

## 工具数量统计

| 类别 | Cursor Agent | Augment Agent |
|------|-------------|---------------|
| 文件系统 | 4 | 5 |
| 搜索 | 3 | 3 |
| 终端/进程 | 1 | 6 |
| 集成 | 3 | 12+ |
| **总计** | 11 | 26+ |

## 设计哲学差异

### Cursor Agent
- **最小化原则**：每个工具都是必需的
- **智能提示**：工具主动建议下一步操作
- **用户体验**：保留用户原始措辞，避免信息过载
- **深度集成**：与IDE环境紧密结合

### Augment Agent
- **完整性原则**：覆盖所有可能的操作
- **标准化接口**：基于MCP协议规范
- **模块化设计**：工具可独立扩展
- **平台化思维**：支持多种开发平台

## 核心洞察

1. **Cursor 强调的是"如何做"（How）**：每个工具都有明确的使用指导和最佳实践
2. **Augment 强调的是"做什么"（What）**：提供丰富的功能选项，让用户决定如何组合

3. **Cursor 的工具是"智能的"**：理解上下文，主动提供帮助
4. **Augment 的工具是"强大的"**：功能完备，覆盖广泛

5. **Cursor 优化了人机交互**：减少认知负担
6. **Augment 优化了系统能力**：提供全面支持