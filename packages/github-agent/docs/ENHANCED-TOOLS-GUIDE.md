# AutoDev GitHub Agent 增强工具使用指南

## 🚀 新增核心工具

### 1. 语义代码搜索 (semantic-code-search)

**功能描述**: 使用 AI 驱动的语义理解来搜索代码，能够理解自然语言查询的意图和上下文。

**使用示例**:

```json
{
  "tool": "semantic-code-search",
  "arguments": {
    "query": "find all functions that handle user authentication",
    "scope": ["src", "lib"],
    "language": ["typescript", "javascript"],
    "max_results": 10,
    "search_mode": "semantic"
  }
}
```

**参数说明**:
- `query`: 自然语言描述你要查找的内容
- `scope`: 搜索范围（目录列表）
- `language`: 编程语言过滤
- `max_results`: 最大结果数
- `search_mode`: 搜索模式
  - `semantic`: AI 语义搜索
  - `hybrid`: AI + 关键词混合
  - `exact`: 仅关键词匹配

**优势对比**:
- ✅ 理解代码意图，不仅仅是关键词匹配
- ✅ 支持自然语言查询
- ✅ 智能排序和相关性评分
- ✅ 包含上下文信息

### 2. 智能任务代理 (intelligent-agent)

**功能描述**: 自主规划和执行复杂的多步骤任务，减少用户的微观管理。

**使用示例**:

```json
{
  "tool": "intelligent-agent",
  "arguments": {
    "task": "analyze the authentication module and fix any security vulnerabilities",
    "context": "Focus on JWT token validation and session management",
    "constraints": [
      "Do not modify the API interface",
      "Maintain backward compatibility",
      "Add comprehensive tests"
    ],
    "max_steps": 8,
    "auto_execute": false
  }
}
```

**参数说明**:
- `task`: 任务的清晰描述
- `context`: 额外的上下文或要求
- `constraints`: 执行约束条件
- `max_steps`: 最大步骤数限制
- `auto_execute`: 是否自动执行（false 时仅返回计划）
- `verbose`: 是否提供详细进度更新

**工作流程**:
1. 📋 分析任务并创建执行计划
2. 🔍 识别所需工具和步骤
3. 🚀 按顺序执行每个步骤
4. 📊 生成详细的执行报告

**适用场景**:
- 复杂的代码重构任务
- Bug 修复流程自动化
- 新功能实现
- 代码质量改进

### 3. 项目记忆管理 (project-memory)

**功能描述**: 跨会话持久化项目上下文和知识，建立长期的项目理解。

**使用示例**:

#### 保存记忆
```json
{
  "tool": "project-memory",
  "arguments": {
    "operation": "save",
    "key": "api-endpoints",
    "value": {
      "auth": "/api/v1/auth",
      "users": "/api/v1/users",
      "products": "/api/v1/products"
    },
    "category": "knowledge",
    "tags": ["api", "endpoints", "backend"]
  }
}
```

#### 检索记忆
```json
{
  "tool": "project-memory",
  "arguments": {
    "operation": "retrieve",
    "key": "api-endpoints"
  }
}
```

#### 搜索记忆
```json
{
  "tool": "project-memory",
  "arguments": {
    "operation": "search",
    "search_query": "authentication"
  }
}
```

**操作类型**:
- `save`: 保存新的记忆条目
- `retrieve`: 检索特定记忆
- `update`: 更新现有记忆
- `delete`: 删除记忆条目
- `list`: 列出所有记忆
- `search`: 搜索相关记忆

**记忆分类**:
- `command`: 常用命令
- `pattern`: 代码模式
- `preference`: 项目偏好
- `knowledge`: 项目知识
- `general`: 通用信息

**存储位置**: `.autodev/memory.json`

## 🔧 工具组合使用示例

### 场景 1: 智能 Bug 修复

```javascript
// 步骤 1: 使用语义搜索找到相关代码
await agent.use("semantic-code-search", {
  query: "user login validation logic that might have security issues",
  search_mode: "semantic"
});

// 步骤 2: 保存发现到记忆中
await agent.use("project-memory", {
  operation: "save",
  key: "security-hotspots",
  value: { files: ["auth/login.ts", "middleware/validate.ts"] },
  category: "pattern",
  tags: ["security", "review-needed"]
});

// 步骤 3: 使用智能代理修复问题
await agent.use("intelligent-agent", {
  task: "Fix the security vulnerabilities in the login validation",
  context: "Focus on input validation and SQL injection prevention",
  auto_execute: true
});
```

### 场景 2: 项目知识积累

```javascript
// 记录项目约定
await agent.use("project-memory", {
  operation: "save",
  key: "coding-standards",
  value: {
    "naming": "camelCase for variables, PascalCase for classes",
    "imports": "absolute imports from @/",
    "testing": "Jest with 80% coverage requirement"
  },
  category: "preference"
});

// 记录常用命令
await agent.use("project-memory", {
  operation: "save",
  key: "dev-commands",
  value: {
    "start": "npm run dev",
    "test": "npm test -- --coverage",
    "build": "npm run build:prod"
  },
  category: "command"
});
```

### 场景 3: 代码库理解

```javascript
// 使用智能代理分析项目结构
await agent.use("intelligent-agent", {
  task: "Analyze the project architecture and create a comprehensive overview",
  constraints: ["Focus on main modules", "Include dependency relationships"],
  auto_execute: true
});

// 保存分析结果
await agent.use("project-memory", {
  operation: "save",
  key: "architecture-overview",
  value: { /* 分析结果 */ },
  category: "knowledge",
  tags: ["architecture", "documentation"]
});
```

## 📊 工具对比优势

### vs Claude Code

| 功能 | AutoDev Enhanced | Claude Code |
|------|-----------------|-------------|
| 语义搜索 | ✅ 专门工具 | ❌ 无 |
| 任务自动化 | ✅ intelligent-agent | ✅ Agent |
| 项目记忆 | ✅ 结构化存储 | ✅ CLAUDE.md |
| GitHub 集成 | ✅ 深度集成 | ⚠️ 基础 |
| 可扩展性 | ✅ 插件架构 | ❌ 固定工具 |

### vs Cascade

| 功能 | AutoDev Enhanced | Cascade |
|------|-----------------|---------|
| 代码理解 | ✅ 语义搜索 | ✅ codebase_search |
| 符号分析 | 🔄 开发中 | ✅ view_code_item |
| 任务编排 | ✅ 智能代理 | ❌ 无 |
| 记忆管理 | ✅ 文件存储 | ✅ 数据库 |
| 工具组合 | ✅ 灵活组合 | ✅ MCP 标准 |

## 🎯 最佳实践

### 1. 渐进式采用

开始时先使用单个工具，熟悉后再组合使用：

```
语义搜索 → 项目记忆 → 智能代理
```

### 2. 建立项目知识库

定期使用 `project-memory` 记录：
- 项目约定和标准
- 常见问题解决方案
- 重要的代码位置
- 团队决策和理由

### 3. 智能代理使用技巧

- 先用 `auto_execute: false` 查看计划
- 提供清晰的任务描述和约束
- 使用较小的 `max_steps` 开始
- 逐步增加任务复杂度

### 4. 搜索策略

- 简单查找用 `exact` 模式
- 概念查找用 `semantic` 模式
- 不确定时用 `hybrid` 模式

## 🚧 即将推出

### 短期规划
- 🔄 代码智能分析工具
- 🔄 可视化渲染工具
- 🔄 增强的文件编辑器

### 中期规划
- 📅 AI 代码审查
- 📅 自动化测试生成
- 📅 依赖关系分析

### 长期愿景
- 🌟 完整的 AI 编程助手
- 🌟 团队协作功能
- 🌟 插件生态系统

## 💡 反馈和贡献

我们欢迎您的反馈和贡献！

- 🐛 发现问题？[提交 Issue](https://github.com/unit-mesh/autodev-workbench/issues)
- 💡 有新想法？[参与讨论](https://github.com/unit-mesh/autodev-workbench/discussions)
- 🤝 想要贡献？[查看贡献指南](../CONTRIBUTING.md)

通过这些增强工具，AutoDev GitHub Agent 正在成为一个更智能、更强大的编程助手！