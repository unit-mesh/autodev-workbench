# GitHub Agent Action 测试指南

本文档介绍如何测试 GitHub Agent Action 的功能。

## 🚀 快速开始

### 1. 本地测试

在提交到 GitHub 之前，先进行本地测试：

```bash
# 进入项目目录
cd packages/github-agent-action

# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 设置环境变量
export GITHUB_TOKEN="your_github_token"
export OPENAI_API_KEY="your_openai_key"  # 可选

# 运行本地测试
pnpm run test:local
```

### 2. CLI 测试

测试命令行功能：

```bash
# 验证配置
node bin/action.js validate

# 分析特定 issue
node bin/action.js analyze \
  --owner unit-mesh \
  --repo autodev-worker \
  --issue 1 \
  --depth medium \
  --verbose

# 启动 webhook 服务器
node bin/action.js server --port 3000
```

## 🔧 GitHub Actions 测试

### 方法 1: 创建测试 Issue

1. 在 GitHub 仓库中创建一个新的 Issue
2. 使用提供的 Issue 模板：`.github/ISSUE_TEMPLATE/test-agent-action.md`
3. 观察 GitHub Actions 工作流是否自动触发
4. 检查 Actions 日志查看分析结果

### 方法 2: 手动触发工作流

1. 进入 GitHub 仓库的 Actions 页面
2. 选择 "Test GitHub Agent Action" 工作流
3. 点击 "Run workflow" 按钮
4. 查看执行结果

### 方法 3: 编辑现有 Issue

1. 找到一个现有的 Issue
2. 编辑 Issue 内容
3. 保存更改
4. 观察是否触发自动分析

## 📊 测试检查清单

### ✅ 基础功能测试

- [ ] 包构建成功
- [ ] CLI 命令正常工作
- [ ] 配置验证通过
- [ ] GitHub API 连接正常

### ✅ Issue 分析测试

- [ ] 能够获取 Issue 信息
- [ ] 代码搜索功能正常
- [ ] AI 分析生成结果
- [ ] 分析结果格式正确

### ✅ GitHub Actions 集成测试

- [ ] 工作流正确触发
- [ ] Action 输入参数正确传递
- [ ] 分析完成后输出正确
- [ ] 错误处理正常工作

### ✅ 自动化功能测试

- [ ] 自动添加评论（如果启用）
- [ ] 自动添加标签（如果启用）
- [ ] 评论内容格式正确
- [ ] 标签应用逻辑正确

## 🐛 常见问题排查

### 问题 1: GitHub Token 权限不足

**症状**: API 调用返回 403 错误

**解决方案**:
- 确保 GitHub Token 有足够权限
- 需要的权限：`repo`, `issues`, `pull_requests`

### 问题 2: LLM API 调用失败

**症状**: 分析过程中出现 API 错误

**解决方案**:
- 检查 LLM API Key 是否正确设置
- 确认 API 配额是否充足
- 检查网络连接

### 问题 3: 工作流不触发

**症状**: 创建/编辑 Issue 后工作流没有运行

**解决方案**:
- 检查工作流文件语法
- 确认触发条件是否正确
- 查看 Actions 页面的错误信息

### 问题 4: 构建失败

**症状**: `npm run build` 失败

**解决方案**:
- 检查 TypeScript 编译错误
- 确认所有依赖已安装
- 查看具体错误信息

## 📝 测试日志

记录测试结果：

```
测试日期: ____
测试环境: ____
测试结果: ____

问题记录:
1. ____
2. ____

改进建议:
1. ____
2. ____
```

## 🔄 持续测试

建议的测试频率：

- **开发阶段**: 每次代码更改后
- **发布前**: 完整的功能测试
- **生产环境**: 定期监控和测试

## 📞 获取帮助

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 检查 [Issues](https://github.com/unit-mesh/autodev-worker/issues)
3. 参考 [文档](../README.md)
4. 提交新的 Issue 报告问题
