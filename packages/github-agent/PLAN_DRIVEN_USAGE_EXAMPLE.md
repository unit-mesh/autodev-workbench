# 🎯 计划驱动Agent使用示例

## 🚀 快速开始

### 1. 基本配置
```typescript
import { PlanDrivenAgent } from './src/agent/plan-driven-agent';

const agent = new PlanDrivenAgent({
  workspacePath: '/path/to/project',
  githubToken: 'your-token',
  
  // 计划驱动配置
  planningMode: 'auto',        // 'always' | 'auto' | 'never'
  autoExecuteSimple: true,     // 简单任务自动执行
  requireConfirmation: true,   // 复杂任务需要确认
  enableRiskAnalysis: true,    // 启用风险分析
  enableRollback: true,        // 启用回滚机制
  
  // 复杂度阈值
  complexityThreshold: {
    simple: 1,    // <= 1个工具
    medium: 3,    // <= 3个工具
    complex: 5    // > 3个工具
  }
});
```

## 📝 使用场景示例

### 场景1: 简单任务 (自动执行)
```typescript
// 用户输入
const response = await agent.start("读取 package.json 文件");

// AI响应 (直接执行，无需计划)
console.log(response.text);
// 输出: package.json文件内容...
```

### 场景2: 中等复杂任务 (计划模式)
```typescript
// 用户输入
const response1 = await agent.start("修复TypeScript编译错误");

// AI响应 (展示计划)
console.log(response1.text);
/*
## 📋 执行计划

**目标**: 修复TypeScript编译错误
**复杂度**: 🟡 MEDIUM  
**预估时间**: 135秒 (2分钟)

### 🔄 执行步骤:
**1. 诊断阶段**
   - 📝 检查当前TypeScript错误
   - 🔧 工具: `diagnostics`
   - 🎯 目的: 识别具体的编译错误
   - ⏱️ 预估时间: 30秒

**2. 分析阶段**  
   - 📝 分析错误相关的代码文件
   - 🔧 工具: `read-file`, `codebase-retrieval`
   - 🎯 目的: 理解错误原因和影响范围
   - ⏱️ 预估时间: 45秒

**3. 修复阶段**
   - 📝 应用代码修复
   - 🔧 工具: `str-replace-editor`
   - 🎯 目的: 修复识别的错误
   - ⏱️ 预估时间: 60秒

### ⚠️ 风险评估:
- 🟡 **修复可能引入新错误**
  - 概率: medium | 影响: medium
  - 缓解措施: 使用备份和逐步验证

### 📝 需要修改的文件:
- `src/types.ts`
- `src/utils.ts`

**这个计划可以吗？**
- 输入 `yes` 或 `执行` 开始执行
- 输入 `modify` 或 `修改` 来调整计划
*/

// 用户确认
const response2 = await agent.start("yes");

// AI开始执行计划
console.log(response2.text);
/*
## ✅ 计划执行结果

**计划**: 修复TypeScript编译错误
**状态**: 成功完成
**执行时间**: 128秒 (预估: 135秒)

### 📊 阶段执行结果:
1. 诊断阶段: ✅ 成功 (28ms)
2. 分析阶段: ✅ 成功 (42ms)  
3. 修复阶段: ✅ 成功 (58ms)

### 🎉 执行成功!
所有阶段都已成功完成。

### ✅ 建议验证:
- 运行 `npm run type-check` 验证修复
*/
```

### 场景3: 复杂任务 (详细计划)
```typescript
// 用户输入
const response = await agent.start("重构用户认证系统，提高安全性");

// AI响应 (详细计划)
console.log(response.text);
/*
## 📋 执行计划

**目标**: 重构用户认证系统，提高安全性
**复杂度**: 🔴 COMPLEX
**预估时间**: 480秒 (8分钟)

### 🔄 执行步骤:

**1. 系统分析阶段**
   - 📝 分析当前认证系统架构
   - 🔧 工具: `codebase-retrieval`, `analyze-basic-context`
   - 🎯 目的: 理解现有认证流程和安全漏洞
   - ⏱️ 预估时间: 90秒

**2. 安全审计阶段** (依赖: 系统分析阶段)
   - 📝 检查安全漏洞和最佳实践
   - 🔧 工具: `diagnostics`, `web-search`
   - 🎯 目的: 识别安全问题和改进方案
   - ⏱️ 预估时间: 120秒

**3. 重构设计阶段** (依赖: 安全审计阶段)
   - 📝 设计新的安全认证架构
   - 🔧 工具: `render-mermaid`, `str-replace-editor`
   - 🎯 目的: 创建安全的认证系统设计
   - ⏱️ 预估时间: 150秒

**4. 实施阶段** (依赖: 重构设计阶段)
   - 📝 实施新的认证代码
   - 🔧 工具: `str-replace-editor`, `write-file`
   - 🎯 目的: 应用安全改进
   - ⏱️ 预估时间: 120秒

### ⚠️ 风险评估:
- 🔴 **可能破坏现有登录功能**
  - 概率: high | 影响: high
  - 缓解措施: 完整备份和分阶段测试

- 🟡 **新代码可能有bug**
  - 概率: medium | 影响: medium  
  - 缓解措施: 代码审查和测试验证

### 📝 需要修改的文件:
- `src/auth/authentication.ts`
- `src/auth/middleware.ts`
- `src/auth/jwt-utils.ts`
- `tests/auth.test.ts`

### 🔄 回滚策略:
- 自动备份: ✅ 启用
- 回滚步骤: 恢复备份 → 验证恢复

**这个计划可以吗？**
*/
```

### 场景4: 计划修改
```typescript
// 用户想要修改计划
const response = await agent.start("modify");

console.log(response.text);
/*
## 🔧 计划修改选项

当前计划: **重构用户认证系统，提高安全性**

### 可以修改的内容:

**1. 调整执行步骤**
- 添加新的阶段: `add phase [阶段名称] [描述]`
- 删除阶段: `remove phase [阶段编号]`

**2. 修改工具选择**  
- 更换工具: `change tool [阶段编号] [新工具名]`

**3. 调整安全设置**
- 启用/禁用备份: `backup on/off`
- 启用/禁用预览模式: `dry-run on/off`

### 💡 常见修改示例:
- "添加测试验证阶段"
- "在修改前先备份所有文件"
- "使用更安全的工具"
*/

// 用户提出修改
const response2 = await agent.start("添加测试验证阶段");
// AI会修改计划并重新展示...
```

## ⚙️ 配置选项详解

### planningMode 配置
```typescript
// 总是使用计划模式
planningMode: 'always'  // 所有任务都创建计划

// 自动判断 (推荐)
planningMode: 'auto'    // 根据复杂度自动选择

// 从不使用计划模式
planningMode: 'never'   // 所有任务直接执行
```

### 复杂度阈值配置
```typescript
complexityThreshold: {
  simple: 1,    // 评分 <= 1: 简单任务
  medium: 3,    // 评分 <= 3: 中等任务  
  complex: 5    // 评分 > 3: 复杂任务
}

// 评分规则:
// - 复杂关键词 (implement, refactor): +3分
// - 中等关键词 (modify, update): +2分  
// - 简单关键词 (read, show): +1分
// - 多个文件: +1分
// - GitHub相关: +1分
// - 长文本: +1分
```

### 自动执行配置
```typescript
autoExecuteSimple: true,     // 简单任务自动执行
requireConfirmation: true,   // 复杂任务需要确认

// 组合效果:
// - 简单任务: 直接执行，无需确认
// - 复杂任务: 展示计划，等待确认
```

## 🔄 工作流程图

```
用户输入
    ↓
任务复杂度分析
    ↓
┌─────────────┬─────────────┬─────────────┐
│   简单任务   │   中等任务   │   复杂任务   │
│  (直接执行)  │  (计划模式)  │  (计划模式)  │
└─────────────┴─────────────┴─────────────┘
                    ↓
                信息收集
                    ↓
                制定计划
                    ↓
                展示计划
                    ↓
                用户确认
                    ↓
                执行计划
                    ↓
                验证结果
```

## 🎯 最佳实践

### 1. 任务描述要清晰
```typescript
// ❌ 模糊描述
"修复bug"

// ✅ 清晰描述  
"修复用户登录时的TypeScript类型错误"
```

### 2. 合理设置复杂度阈值
```typescript
// 对于新手用户 - 更多计划
complexityThreshold: { simple: 0, medium: 1, complex: 2 }

// 对于专家用户 - 更少计划
complexityThreshold: { simple: 2, medium: 4, complex: 6 }
```

### 3. 启用安全选项
```typescript
enableRiskAnalysis: true,    // 风险分析
enableRollback: true,        // 回滚机制
requireConfirmation: true    // 确认机制
```

这样，你的GitHub Agent就具备了和我一样的计划驱动能力，既保持了专业工具的优势，又获得了透明性和可控性！
