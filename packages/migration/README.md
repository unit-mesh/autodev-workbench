# @ai-migration/framework

通用AI辅助迁移框架 - 基于Vue迁移工具的成功实践抽象出的轻量级、可扩展的迁移框架。

## 🌟 特性

- **🤖 AI驱动**: 智能分析项目结构，自动生成迁移策略
- **🔧 可扩展**: 插件化架构，支持自定义迁移规则和工具
- **📊 上下文感知**: 全程跟踪迁移状态，支持断点续传
- **🎯 多模态**: 支持规则引擎 + AI智能修复的混合模式
- **🛡️ 安全可靠**: 自动备份、回滚机制、干运行模式
- **⚡ 高性能**: 并行处理、增量分析、智能缓存

## 📦 安装

```bash
npm install @ai-migration/framework
```

### 全局安装CLI工具

```bash
npm install -g @ai-migration/framework
```

## 🚀 快速开始

### CLI使用

```bash
# Vue 2 到 Vue 3 迁移
ai-migration migrate ./my-vue-project --preset vue2-to-vue3

# React 16 到 React 18 迁移
ai-migration migrate ./my-react-project --preset react16-to-react18

# 项目分析
ai-migration analyze ./my-project

# 查看框架状态
ai-migration status
```

### 编程接口

```typescript
import { 
  createMigrationOrchestrator, 
  createMigrationContext,
  ConfigManager 
} from '@ai-migration/framework';

async function migrateProject() {
  // 创建迁移编排器
  const orchestrator = createMigrationOrchestrator({
    dryRun: false,
    verbose: true
  });
  
  // 初始化迁移上下文
  const context = await orchestrator.initialize('./my-project');
  
  // 执行迁移
  const result = await orchestrator.execute();
  
  console.log('迁移完成:', result);
}
```

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (CLI/API)                         │
├─────────────────────────────────────────────────────────────┤
│                    迁移编排层 (策略规划+流程执行)             │
├─────────────────────────────────────────────────────────────┤
│                    AI代理层 (分析+修复+验证)                 │
├─────────────────────────────────────────────────────────────┤
│                    工具执行层 (可扩展工具系统)               │
├─────────────────────────────────────────────────────────────┤
│                    上下文管理层 (状态+配置管理)              │
├─────────────────────────────────────────────────────────────┤
│                    基础设施层 (文件系统+AI服务+日志)         │
└─────────────────────────────────────────────────────────────┘
```

## 📋 支持的迁移类型

### Vue 2 → Vue 3
- ✅ 依赖升级 (vue, vue-router, vuex)
- ✅ Composition API 迁移
- ✅ 构建工具更新 (webpack → vite)
- ✅ 组件语法转换

### React 16 → React 18
- ✅ 依赖升级
- ✅ 并发特性迁移
- ✅ 严格模式修复
- ✅ Root API 更新

### Angular 12 → 15
- ✅ ng update 自动升级
- ✅ 独立组件迁移
- ✅ 新特性采用

## 🔧 配置

### 环境变量

```bash
# AI服务配置
export OPENAI_API_KEY="your-openai-key"
export DEEPSEEK_TOKEN="your-deepseek-token"
export GLM_API_KEY="your-glm-key"

# 框架配置
export AI_MIGRATION_DRY_RUN="false"
export AI_MIGRATION_VERBOSE="true"
export AI_MIGRATION_MAX_RETRIES="3"
```

### 配置文件

```bash
# 初始化配置文件
ai-migration config --init

# 查看当前配置
ai-migration config --show

# 验证配置
ai-migration config --validate
```

配置文件示例 (`ai-migration.config.json`):

```json
{
  "mode": "auto",
  "dryRun": false,
  "verbose": false,
  "ai": {
    "provider": "openai",
    "model": "gpt-4",
    "maxTokens": 4000,
    "temperature": 0.1
  },
  "execution": {
    "parallelism": {
      "enabled": true,
      "maxConcurrency": 4
    },
    "backup": {
      "enabled": true,
      "location": ".migration-backup"
    }
  }
}
```

## 🎯 API参考

### 核心类

#### MigrationContext
```typescript
import { MigrationContext } from '@ai-migration/framework';

const context = new MigrationContext('./project-path', {
  mode: 'auto',
  verbose: true
});
```

#### ContextAwareComponent
```typescript
import { ContextAwareComponent } from '@ai-migration/framework';

class CustomComponent extends ContextAwareComponent {
  async onExecute() {
    // 自定义执行逻辑
    return { success: true };
  }
}
```

#### AIService
```typescript
import { AIService } from '@ai-migration/framework';

class CustomAIService extends AIService {
  protected checkAvailability(): boolean {
    return !!process.env.CUSTOM_AI_KEY;
  }
  
  protected async performAICall(prompt: string): Promise<string> {
    // 自定义AI调用逻辑
    return 'AI response';
  }
}
```

### 工具系统

#### ToolRegistry
```typescript
import { ToolRegistry } from '@ai-migration/framework';

const registry = new ToolRegistry();

registry.registerTool({
  name: 'custom_tool',
  category: 'migration',
  description: '自定义迁移工具',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', required: true }
    },
    required: ['input']
  },
  executor: async (params) => {
    return { result: `处理: ${params.input}` };
  }
});
```

## 🔌 扩展开发

### 自定义AI代理

```typescript
import { BaseAIAgent } from '@ai-migration/framework';

class CustomAnalysisAgent extends BaseAIAgent {
  async onExecute() {
    const prompt = '分析项目结构...';
    const analysis = await this.analyzeWithAI(prompt);
    return { analysis };
  }
}
```

### 自定义预设

```typescript
import { ConfigManager } from '@ai-migration/framework';

const configManager = new ConfigManager();

configManager.addPreset('custom-migration', {
  name: 'Custom Migration',
  description: '自定义迁移预设',
  source: { framework: 'custom', version: '1.x' },
  target: { framework: 'custom', version: '2.x' },
  steps: [
    {
      name: 'custom-step',
      agent: 'CustomAgent',
      order: 1,
      required: true
    }
  ],
  tools: ['custom-tool']
});
```

## 📊 监控和报告

### 事件监听

```typescript
orchestrator.on('phase:change', (data) => {
  console.log(`阶段变更: ${data.phase}`);
});

orchestrator.on('progress:update', (progress) => {
  console.log(`进度: ${progress}%`);
});

orchestrator.on('error:add', (data) => {
  console.log(`错误: ${data.error.message}`);
});
```

### 生成报告

迁移完成后会自动生成详细报告：
- JSON格式：机器可读的详细数据
- 包含迁移统计、错误信息、性能指标

## 🛠️ 开发

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
npm run test:watch
```

### 开发模式

```bash
npm run dev
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎贡献代码、报告问题或提出改进建议！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 🙏 致谢

本框架基于Vue 2到Vue 3迁移工具的成功实践开发，感谢原项目的贡献者们。

---

**更多文档**: [GitHub Repository](https://github.com/phodal/vue-migrate/tree/master/packages/framework)  
**问题反馈**: [GitHub Issues](https://github.com/phodal/vue-migrate/issues)  
**社区讨论**: [Discussions](https://github.com/phodal/vue-migrate/discussions)
