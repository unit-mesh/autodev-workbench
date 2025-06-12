# 🤖 AI工具使用指南

## 🎯 如何帮助AI理解工具使用

### 1. 工具描述优化对比

#### ❌ 当前描述 (AI难以理解)
```typescript
installer("read-file", "Read the contents of a file", {
  file_path: z.string().describe("Path to the file")
});
```

#### ✅ 优化后描述 (AI容易理解)
```typescript
installer("read-file", 
  "Read file contents for code analysis, config inspection, or log review. Supports encoding options and line-range reading for large files. Essential first step before code modifications.",
  {
    file_path: z.string().describe("File path relative to workspace. Examples: 'src/index.ts' (code), 'package.json' (config), 'logs/error.log' (logs)"),
    encoding: z.enum(["utf8", "binary", "base64"]).optional().describe("Text files: utf8 (default), Images: base64, Binary files: binary"),
    line_range: z.object({
      start: z.number().describe("Start line (1-based). Use when file is large or you need specific section"),
      end: z.number().describe("End line (-1 for file end). Prevents memory issues with large files")
    }).optional().describe("Read specific lines only. Recommended for files >1000 lines")
  }
);
```

### 2. 工具使用决策树

```
用户请求分析：
├── 查看代码/文件？ → read-file
├── 修改代码？ → read-file → str-replace-editor → diagnostics  
├── 查找功能？ → codebase-retrieval → read-file
├── 运行程序？ → launch-process → read-process
├── 调试错误？ → diagnostics → codebase-retrieval → web-search
├── GitHub操作？ → github-* 系列工具
└── 不确定？ → codebase-retrieval (万能搜索)
```

### 3. 常见任务的工具组合模式

#### 任务1: 代码审查
```typescript
const CODE_REVIEW_PATTERN = {
  description: "Review code for issues and improvements",
  tools: [
    {
      step: 1,
      tool: "codebase-retrieval",
      purpose: "Find relevant files to review",
      prompt: "Find files related to [feature/component]"
    },
    {
      step: 2, 
      tool: "read-file",
      purpose: "Read each identified file",
      parameters: { encoding: "utf8" }
    },
    {
      step: 3,
      tool: "diagnostics", 
      purpose: "Check for errors and warnings",
      parameters: { paths: ["identified_files"] }
    },
    {
      step: 4,
      tool: "web-search",
      purpose: "Research best practices if issues found",
      condition: "if problems detected"
    }
  ]
};
```

#### 任务2: 功能实现
```typescript
const FEATURE_IMPLEMENTATION_PATTERN = {
  description: "Implement new feature or fix bug",
  tools: [
    {
      step: 1,
      tool: "codebase-retrieval",
      purpose: "Understand existing codebase structure",
      prompt: "Find similar functionality or related code"
    },
    {
      step: 2,
      tool: "read-file", 
      purpose: "Study existing implementation patterns",
      multiple: true
    },
    {
      step: 3,
      tool: "str-replace-editor",
      purpose: "Implement changes",
      parameters: { 
        dry_run: true,  // Always preview first
        create_backup: true 
      }
    },
    {
      step: 4,
      tool: "diagnostics",
      purpose: "Verify implementation",
      required: true
    },
    {
      step: 5,
      tool: "launch-process",
      purpose: "Test the changes",
      parameters: { command: "npm test" }
    }
  ]
};
```

#### 任务3: 问题调试
```typescript
const DEBUGGING_PATTERN = {
  description: "Debug errors and issues",
  tools: [
    {
      step: 1,
      tool: "diagnostics",
      purpose: "Get current error state",
      priority: "critical"
    },
    {
      step: 2,
      tool: "read-file",
      purpose: "Examine problematic files",
      condition: "if specific files mentioned in errors"
    },
    {
      step: 3,
      tool: "codebase-retrieval", 
      purpose: "Find related code that might cause issues",
      condition: "if error source unclear"
    },
    {
      step: 4,
      tool: "web-search",
      purpose: "Research error messages and solutions",
      parameters: { query: "error_message + technology_stack" }
    },
    {
      step: 5,
      tool: "str-replace-editor",
      purpose: "Apply fixes",
      condition: "after finding solution"
    }
  ]
};
```

### 4. 工具选择的智能提示

#### 基于文件类型的工具推荐
```typescript
const FILE_TYPE_TOOL_MAPPING = {
  ".ts/.js": {
    primary: ["read-file", "diagnostics", "str-replace-editor"],
    analysis: ["search-keywords", "codebase-retrieval"],
    testing: ["launch-process"]
  },
  
  ".json": {
    primary: ["read-file", "str-replace-editor"],
    validation: ["diagnostics"],
    purpose: "Configuration files - be careful with syntax"
  },
  
  ".md": {
    primary: ["read-file", "str-replace-editor"],
    enhancement: ["render-mermaid", "web-search"],
    purpose: "Documentation - consider adding diagrams"
  },
  
  ".log": {
    primary: ["read-file"],
    parameters: { line_range: "recommended for large logs" },
    analysis: ["code-search-regex"],
    purpose: "Log analysis - use line ranges for efficiency"
  }
};
```

#### 基于用户意图的工具推荐
```typescript
const INTENT_TOOL_MAPPING = {
  "understand": ["codebase-retrieval", "read-file", "render-mermaid"],
  "fix": ["diagnostics", "read-file", "str-replace-editor", "web-search"],
  "implement": ["codebase-retrieval", "read-file", "str-replace-editor", "diagnostics"],
  "test": ["launch-process", "read-process", "diagnostics"],
  "deploy": ["launch-process", "read-terminal", "github-*"],
  "document": ["read-file", "render-mermaid", "str-replace-editor"]
};
```

### 5. 参数设置最佳实践

#### 安全第一的参数设置
```typescript
const SAFE_PARAMETER_DEFAULTS = {
  "str-replace-editor": {
    dry_run: true,        // 总是先预览
    create_backup: true,  // 总是备份
    "建议": "先预览，确认后再执行"
  },
  
  "launch-process": {
    timeout: 30000,       // 合理的超时时间
    wait: false,          // 长期任务用后台模式
    "建议": "开发服务器用background，构建任务用wait"
  },
  
  "read-file": {
    max_size: 1048576,    // 1MB限制
    encoding: "utf8",     // 默认文本编码
    "建议": "大文件使用line_range"
  }
};
```

#### 性能优化的参数设置
```typescript
const PERFORMANCE_OPTIMIZATIONS = {
  "大文件处理": {
    tool: "read-file",
    parameters: {
      line_range: { start: 1, end: 100 },
      max_size: 1048576
    },
    reason: "避免内存问题"
  },
  
  "批量操作": {
    approach: "分批处理",
    example: "多个文件修改时，逐个处理并验证",
    reason: "便于错误定位和回滚"
  },
  
  "长期进程": {
    tool: "launch-process", 
    parameters: { wait: false, background: true },
    follow_up: ["read-process", "list-processes"],
    reason: "避免阻塞其他操作"
  }
};
```

### 6. 错误处理和恢复指南

#### 常见错误的处理策略
```typescript
const ERROR_HANDLING_GUIDE = {
  "ENOENT (文件不存在)": {
    immediate_action: "使用 codebase-retrieval 搜索文件",
    alternative: "使用 list-directory 查看目录结构",
    prevention: "使用相对路径，检查工作目录"
  },
  
  "权限错误": {
    immediate_action: "检查文件权限",
    tools: ["diagnostics", "web-search"],
    solution: "查找权限问题解决方案"
  },
  
  "语法错误": {
    immediate_action: "使用 diagnostics 获取详细错误",
    tools: ["read-file", "web-search", "str-replace-editor"],
    workflow: "查看→搜索解决方案→修复→验证"
  },
  
  "进程超时": {
    immediate_action: "使用 kill-process 终止",
    investigation: ["list-processes", "read-process"],
    prevention: "调整timeout参数或使用background模式"
  }
};
```

### 7. 工具效果验证

#### AI应该如何验证工具使用效果
```typescript
const VERIFICATION_CHECKLIST = {
  "str-replace-editor": [
    "检查返回的操作统计",
    "使用 diagnostics 验证语法正确性", 
    "如果是配置文件，测试功能是否正常"
  ],
  
  "launch-process": [
    "检查进程是否成功启动",
    "使用 read-process 查看初始输出",
    "确认进程状态为 running"
  ],
  
  "diagnostics": [
    "检查错误数量是否减少",
    "关注新出现的警告",
    "验证修复是否引入新问题"
  ]
};
```

## 🎓 AI学习建议

### 1. 工具熟练度培养
- **初级**: 掌握单个工具的基本使用
- **中级**: 学会工具组合和参数优化
- **高级**: 能够根据上下文智能选择最佳工具链

### 2. 上下文理解能力
- 理解用户的真实意图，而不仅仅是字面意思
- 考虑项目类型、技术栈、开发阶段
- 记住之前的操作历史和结果

### 3. 错误恢复能力
- 当工具失败时，能够分析原因并选择替代方案
- 学会从错误中学习，避免重复同样的问题
- 保持操作的可逆性和安全性

这个指南帮助AI更好地理解工具的使用场景、最佳实践和组合模式，从而提供更智能、更有效的帮助。
