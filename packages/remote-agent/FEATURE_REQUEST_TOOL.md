# Feature Request Tool Integration

这个集成将 `testFeatureRequestImplementation` 功能封装为一个标准的 remote-agent 工具，让用户可以通过简单的工具调用来触发自动化功能开发。

## 🎯 功能特性

- **工具化集成**: 将功能请求实现封装为标准的 remote-agent 工具
- **自动代码生成**: 基于功能描述自动分析和生成代码
- **智能工具链**: 集成 FeatureRequestPlaybook 的完整工具链
- **MCP 兼容**: 支持 Model Context Protocol 标准

## 🏗️ 架构组件

### 1. 核心工具
- **FeatureRequestTool**: `packages/remote-agent/src/capabilities/tools/feature/feature-request-tool.ts`
  - 封装了 testFeatureRequestImplementation 的核心逻辑
  - 提供标准的工具接口
  - 支持详细的参数配置

### 2. 服务层
- **FeatureRequestService**: `packages/remote-agent/src/services/feature-request-service.ts`
  - 处理功能请求的业务逻辑
  - 管理 AI Agent 和 FeatureRequestPlaybook
  - 提供结构化的结果分析

### 3. 工具注册
- **工具集成**: 在 `packages/remote-agent/src/capabilities/tools.ts` 中注册
- **MCP 支持**: 在 `packages/remote-agent/src/capabilities.ts` 中启用

## 🚀 使用方法

### 1. 通过 AI Agent 使用

```javascript
const { AIAgent } = require('./packages/remote-agent/dist/agent.js')

const agent = new AIAgent({
  workspacePath: './',
  githubToken: process.env.GITHUB_TOKEN,
  verbose: true,
  enableToolChaining: true
})

// 使用 feature-request 工具
const response = await agent.start(`
请使用 feature-request 工具实现以下功能：

添加一个简单的日志工具，支持不同级别的日志输出（info, warn, error）

参数：
- description: "添加一个简单的日志工具，支持不同级别的日志输出"
- verbose: true
- max_rounds: 6
`)
```

### 2. 直接调用工具

```javascript
const { FeatureRequestService } = require('./packages/remote-agent/dist/services/feature-request-service.js')

const service = new FeatureRequestService({
  description: "实现用户认证中间件",
  workspacePath: "./",
  verbose: true,
  maxToolRounds: 8
})

const result = await service.implementFeature()
console.log(result)
```

### 3. MCP 客户端使用

```json
{
  "method": "tools/call",
  "params": {
    "name": "feature-request",
    "arguments": {
      "description": "创建一个配置管理器，支持从环境变量和配置文件加载设置",
      "verbose": true,
      "max_rounds": 6
    }
  }
}
```

## 🧪 测试

### 运行工具测试
```bash
# 测试 feature-request 工具
node packages/remote-agent/test-feature-request-tool.js

# 测试特定 GitHub issue
node packages/remote-agent/test-feature-request-tool.js 105

# 运行原始功能测试
node packages/remote-agent/test-feature-request.js
```

### 构建和准备
```bash
# 构建 remote-agent
cd packages/remote-agent
pnpm build

# 确保环境变量配置
cp .env.example .env
# 编辑 .env 文件，添加必要的 token
```

## ⚙️ 工具参数

### feature-request 工具参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `description` | string | ✅ | - | 功能的详细描述 |
| `issue_number` | number | ❌ | - | GitHub issue 编号 |
| `owner` | string | ❌ | "unit-mesh" | GitHub 仓库所有者 |
| `repo` | string | ❌ | "autodev-workbench" | GitHub 仓库名称 |
| `workspace_path` | string | ❌ | 当前目录 | 工作空间路径 |
| `max_rounds` | number | ❌ | 8 | 最大工具执行轮数 |
| `validate_changes` | boolean | ❌ | true | 是否验证代码修改 |
| `verbose` | boolean | ❌ | false | 启用详细日志 |

## 📊 工具输出

工具会返回详细的执行报告，包括：

- **执行状态**: 成功/失败状态
- **进度步骤**: 各个执行阶段的状态
- **代码修改**: 修改的文件数量和详情
- **工具使用**: 使用的工具列表和执行情况
- **实现总结**: AI 生成的实现摘要
- **执行时间**: 总执行时间统计

### 示例输出

```
🚀 Starting Feature Request Implementation
📝 Description: 添加一个简单的日志工具，支持不同级别的日志输出

🤖 AI Agent: deepseek (deepseek-chat)
🔧 Available Tools: 25

⚙️ Configuration:
   • Max Rounds: 6
   • Validate Changes: true
   • Verbose: false

🧪 Executing feature request analysis and implementation...

📊 Implementation Results:
✅ Success: true
🔄 Rounds: 4
🛠️ Tools Used: github-analyze-issue, search-keywords, read-file, str-replace-editor
💻 Code Modifications: 1
⏱️ Execution Time: 45230ms

🔧 Progress Steps:
  1. 分析功能需求 - ✅
  2. 搜索相关代码 - ✅
  3. 生成实现方案 - ✅
  4. 修改代码文件 - ✅

📄 Implementation Summary:
成功实现了日志工具功能，创建了支持多级别日志输出的 Logger 类...

📝 Modified Files:
  1. src/utils/logger.ts

🎉 Feature request implementation completed successfully!

💡 Next Steps:
• Review the generated code changes
• Test the implemented functionality
• Consider adding unit tests
• Update documentation if needed
```

## 🔧 自定义配置

### 修改工具行为
在 `feature-request-tool.ts` 中可以自定义：
- 参数验证逻辑
- 输出格式
- 错误处理
- 日志级别

### 调整服务配置
在 `FeatureRequestService` 中可以修改：
- 默认工具轮数
- 工作空间路径
- 验证规则
- 进度回调

## 🔗 与现有功能的关系

- **testFeatureRequestImplementation**: 原始测试脚本，现在作为服务层的基础
- **FeatureRequestPlaybook**: 核心的 AI 提示词策略，负责指导功能实现
- **AutoDevRemoteAgentTools**: 工具集合，feature-request 工具已集成其中
- **MCP 服务器**: 支持通过 MCP 协议调用 feature-request 工具

## 🐛 故障排除

### 常见问题

1. **工具未找到**
   - 确认 remote-agent 已构建：`pnpm build`
   - 检查工具是否正确注册在 `AutoDevRemoteAgentTools` 中

2. **环境配置错误**
   - 检查 `.env` 文件中的 token 配置
   - 确认 GITHUB_TOKEN 和 LLM provider token 已设置

3. **执行失败**
   - 启用 verbose 模式查看详细日志
   - 检查工作空间路径是否正确
   - 确认网络连接和 API 访问权限

### 调试模式
```javascript
// 启用详细日志
const result = await agent.start(`
使用 feature-request 工具，参数：
- description: "..."
- verbose: true
- max_rounds: 10
`)
```

## 🔮 未来扩展

- 支持更多编程语言和框架
- 添加代码质量检查和测试生成
- 集成 CI/CD 流水线触发
- 支持团队协作和代码审查
- 添加性能监控和分析
- 实现增量功能更新
