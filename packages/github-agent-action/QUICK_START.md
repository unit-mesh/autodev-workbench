# GitHub Agent Action 快速开始

## 🚀 立即使用

### 方法 1: 在您的仓库中使用

在您的仓库中创建 `.github/workflows/issue-analysis.yml` 文件：

```yaml
name: Automated Issue Analysis
on:
  issues:
    types: [opened, edited, reopened]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Analyze Issue
        uses: unit-mesh/autodev-workbench/packages/github-agent-action@master
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          analysis-depth: medium
          auto-comment: true
          auto-label: true
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### 方法 2: 测试现有功能

1. **Fork 这个仓库** 到您的 GitHub 账户
2. **创建一个新的 Issue** 使用提供的模板
3. **观察自动分析** 过程和结果

### 方法 3: 手动触发测试

1. 进入 Actions 页面
2. 选择 "Test GitHub Agent Action" 工作流
3. 点击 "Run workflow"

## ⚙️ 配置选项

### 必需配置

- `github-token`: GitHub API 访问令牌
- LLM API Key (选择一个):
  - `OPENAI_API_KEY`: OpenAI API 密钥
  - `DEEPSEEK_TOKEN`: DeepSeek API 密钥  
  - `GLM_TOKEN`: GLM API 密钥

### 可选配置

- `analysis-depth`: 分析深度 (`shallow`/`medium`/`deep`)
- `auto-comment`: 自动添加评论 (`true`/`false`)
- `auto-label`: 自动添加标签 (`true`/`false`)
- `exclude-labels`: 排除的标签列表
- `include-labels`: 包含的标签列表

## 🔑 设置 Secrets

在您的仓库设置中添加以下 Secrets：

1. 进入 Settings → Secrets and variables → Actions
2. 添加以下 secrets：
   - `OPENAI_API_KEY` (如果使用 OpenAI)
   - `DEEPSEEK_TOKEN` (如果使用 DeepSeek)
   - `GLM_TOKEN` (如果使用 GLM)

## 📝 示例工作流

### 基础配置
```yaml
- uses: unit-mesh/autodev-workbench/packages/github-agent-action@master
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 高级配置
```yaml
- uses: unit-mesh/autodev-workbench/packages/github-agent-action@master
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    analysis-depth: deep
    auto-comment: true
    auto-label: true
    exclude-labels: 'wontfix,duplicate'
    include-labels: 'bug,enhancement'
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## 🎯 预期效果

当 Issue 被创建或编辑时，Action 将：

1. **分析 Issue 内容** - 理解问题描述
2. **搜索相关代码** - 找到相关文件和函数
3. **生成分析报告** - 提供详细的分析结果
4. **添加智能评论** - 包含分析结果和建议
5. **应用相关标签** - 基于分析结果自动分类

## 🔍 查看结果

- **Actions 日志**: 查看详细的执行过程
- **Issue 评论**: 查看自动生成的分析报告
- **Issue 标签**: 查看自动应用的标签

## 🆘 获取帮助

如果遇到问题：

1. 查看 [完整文档](README.md)
2. 检查 [测试指南](TESTING.md)
3. 提交 [Issue](https://github.com/unit-mesh/autodev-workbench/issues)

## 📊 监控使用

建议监控以下指标：

- Action 执行成功率
- 分析质量和准确性
- 用户反馈和满意度
- API 使用量和成本
