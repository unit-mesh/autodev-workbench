# GitHub Issue Analysis and Upload Guide

This guide explains how to use the new LLM-powered analysis report generation and automatic GitHub upload functionality.

## Features

### 🤖 LLM-Powered Analysis Reports
- Generate comprehensive analysis reports using AI
- Support for both English and Chinese reports
- Structured analysis with current issues, detailed plans, and recommendations
- Configurable confidence levels and fallback mechanisms

### 📤 Automatic GitHub Upload
- Upload analysis results directly to GitHub issues as comments
- Markdown-formatted reports with proper structure
- Include or exclude file content based on preferences
- Configurable file limits and content filtering

### 🔧 Flexible Configuration
- Multiple language support (English/Chinese)
- Customizable report formats
- Optional file content inclusion
- Workspace path configuration

## Usage

### 1. MCP Tool: `github_upload_analysis`

Use this tool to analyze an issue and automatically upload results:

```json
{
  "tool": "github_upload_analysis",
  "arguments": {
    "owner": "microsoft",
    "repo": "vscode",
    "issue_number": 12345,
    "language": "zh",
    "include_file_content": false,
    "max_files": 10
  }
}
```

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name  
- `issue_number` (required): Issue number to analyze
- `workspace_path` (optional): Local workspace path
- `language` (optional): Report language (`en` or `zh`, default: `en`)
- `include_file_content` (optional): Include file content in report (default: `false`)
- `max_files` (optional): Maximum files to include (default: `10`)

### 2. Standalone Script

Use the command-line script for direct execution:

```bash
# Basic usage
node scripts/analyze-and-upload.js microsoft vscode 12345

# With options
node scripts/analyze-and-upload.js microsoft vscode 12345 \
  --language=zh \
  --upload \
  --include-content \
  --max-files=15 \
  --workspace=/path/to/project

# Using npm script
npm run analyze-issue microsoft vscode 12345 -- --language=zh --upload
```

**Options:**
- `--language=en|zh`: Report language (default: en)
- `--upload`: Upload to GitHub (default: false, just prints report)
- `--include-content`: Include file content in report (default: false)
- `--max-files=N`: Maximum files to include (default: 10)
- `--workspace=PATH`: Workspace path (default: current directory)

### 3. Programmatic Usage

```typescript
import { 
  GitHubService, 
  ContextAnalyzer, 
  AnalysisReportGenerator 
} from '@autodev/github-agent';

const githubService = new GitHubService(process.env.GITHUB_TOKEN);
const contextAnalyzer = new ContextAnalyzer('/path/to/workspace');
const reportGenerator = new AnalysisReportGenerator(process.env.GITHUB_TOKEN);

// Get and analyze issue
const issue = await githubService.getIssue('owner', 'repo', 123);
const analysisResult = await contextAnalyzer.analyzeIssue(issue);

// Generate and upload report
const { report, uploadResult } = await reportGenerator.generateAndUploadReport(
  'owner', 'repo', 123, analysisResult, {
    uploadToGitHub: true,
    language: 'zh',
    includeFileContent: false,
    maxFiles: 10
  }
);
```

## Report Format Examples

### English Report
```markdown
# Analysis and Plan

Based on my code analysis, I have identified the following issues and improvement opportunities:

## Analysis Summary
The issue involves a TypeError when accessing undefined properties in the FileExplorer component...

## Current Issues:
1. Null pointer exception in file handling logic
2. Missing error handling for edge cases
3. Performance issues with large directory listings

## Optimization Plan:
### 1. Fix null pointer handling
- File to modify: src/components/FileExplorer.tsx
- Changes needed: Add null checks before property access

### 2. Implement error boundaries
- Files to modify: src/components/ErrorBoundary.tsx
- Changes needed: Add comprehensive error handling

## Recommendations:
1. Implement defensive programming practices
2. Add comprehensive unit tests
3. Consider using TypeScript strict mode

## Relevant Files:
### src/components/FileExplorer.tsx
**Relevance Score:** 0.95
**Reason:** Contains the main logic causing the TypeError
```

### Chinese Report
```markdown
# 分析和优化计划
基于我对代码的分析，我发现了以下问题和改进机会：

## 当前问题：
1. 文件处理逻辑中存在空指针异常
2. 缺少边界情况的错误处理
3. 大目录列表的性能问题

## 优化计划：
1. 修复空指针处理
  - 修改文件：src/components/FileExplorer.tsx
  - 在属性访问前添加空值检查
2. 实现错误边界
  - 修改文件：src/components/ErrorBoundary.tsx
  - 添加全面的错误处理
```

## Environment Setup

```bash
# Required
export GITHUB_TOKEN=your_github_token

# Optional (for AI features)
export GLM_TOKEN=your_glm_token
# or
export OPENAI_API_KEY=your_openai_key

# Optional (custom LLM configuration)
export LLM_BASE_URL=https://your-api-endpoint.com/v1
export LLM_MODEL=your_model_name
```

## Error Handling

The system includes comprehensive error handling:

1. **LLM Failures**: Falls back to rule-based analysis
2. **GitHub API Errors**: Provides detailed error messages
3. **Network Issues**: Graceful degradation with local analysis
4. **Invalid Responses**: Validation and fallback mechanisms

## Best Practices

1. **Use appropriate language**: Choose `zh` for Chinese teams, `en` for international teams
2. **Limit file content**: Set `include_file_content: false` for large codebases
3. **Configure max files**: Adjust `max_files` based on issue complexity
4. **Test before upload**: Run without `--upload` flag first to review reports
5. **Monitor API limits**: Be aware of GitHub API rate limits

## Troubleshooting

### Common Issues

1. **"GITHUB_TOKEN not set"**
   - Solution: Set the `GITHUB_TOKEN` environment variable

2. **"LLM analysis failed"**
   - Solution: Check LLM configuration or rely on fallback analysis

3. **"Upload failed"**
   - Solution: Verify repository permissions and API limits

4. **"No relevant files found"**
   - Solution: Check workspace path and ensure code is present

### Debug Mode

Enable debug logging:
```bash
DEBUG=github-agent:* node scripts/analyze-and-upload.js ...
```

## Integration Examples

### CI/CD Pipeline
```yaml
- name: Analyze Issue
  run: |
    npm run analyze-issue ${{ github.event.issue.repository.owner.login }} \
                          ${{ github.event.issue.repository.name }} \
                          ${{ github.event.issue.number }} \
                          -- --upload --language=en
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GLM_TOKEN: ${{ secrets.GLM_TOKEN }}
```

### GitHub Actions Workflow
```yaml
name: Auto Issue Analysis
on:
  issues:
    types: [opened, labeled]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install @autodev/github-agent
      - run: npx @autodev/github-agent analyze-issue ${{ github.repository_owner }} ${{ github.event.repository.name }} ${{ github.event.issue.number }} --upload
```
