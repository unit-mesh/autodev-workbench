# AutoDev GitHub Agent Action

🤖 **Automated GitHub issue analysis using AI-powered code analysis**

## 🌟 Features

- **🔍 Intelligent Issue Analysis**: AI-powered analysis of GitHub issues with code context
- **💬 Automated Comments**: Automatically add analysis results as comments to issues
- **🏷️ Smart Labeling**: Automatically apply relevant labels based on analysis
- **⚙️ Configurable**: Flexible configuration options for different workflows
- **🚀 Easy Setup**: Simple integration with existing GitHub workflows

## 🚀 Quick Start

Add this action to your workflow file (e.g., `.github/workflows/issue-analysis.yml`):

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
        uses: unit-mesh/github-agent-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          analysis-depth: medium
          auto-comment: true
          auto-label: true
```

## 📋 Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token for API access | Yes | `${{ github.token }}` |
| `openai-api-key` | OpenAI API key for LLM analysis | No | - |
| `deepseek-token` | DeepSeek API token for LLM analysis | No | - |
| `glm-token` | GLM API token for LLM analysis | No | - |
| `analysis-depth` | Analysis depth (shallow/medium/deep) | No | `medium` |
| `auto-comment` | Add analysis comment to issues | No | `true` |
| `auto-label` | Add labels based on analysis | No | `true` |
| `exclude-labels` | Labels to exclude from analysis | No | - |
| `include-labels` | Labels to include for analysis | No | - |

## 📊 Outputs

| Output | Description |
|--------|-------------|
| `success` | Whether the analysis was successful |
| `comment-added` | Whether a comment was added to the issue |
| `labels-added` | Comma-separated list of labels that were added |
| `execution-time` | Time taken to complete the analysis (in milliseconds) |
| `error` | Error message if the analysis failed |

## 🔑 Setup

1. **Add API Key**: Add one of the following secrets to your repository:
   - `OPENAI_API_KEY` (recommended)
   - `DEEPSEEK_TOKEN`
   - `GLM_TOKEN`

2. **Configure Workflow**: Add the action to your workflow file

3. **Test**: Create or edit an issue to see the analysis in action

## 📖 Examples

### Basic Configuration
```yaml
- uses: unit-mesh/github-agent-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### Advanced Configuration
```yaml
- uses: unit-mesh/github-agent-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    analysis-depth: deep
    auto-comment: true
    auto-label: true
    exclude-labels: 'wontfix,duplicate'
    include-labels: 'bug,enhancement'
```

## 🎯 What It Does

When an issue is created, edited, or reopened, this action will:

1. **Analyze the issue content** using AI
2. **Search for relevant code** in your repository
3. **Generate intelligent insights** and recommendations
4. **Add a detailed comment** with analysis results (if enabled)
5. **Apply relevant labels** for better organization (if enabled)

## 🔧 Supported LLM Providers

- **OpenAI** (GPT-3.5, GPT-4)
- **DeepSeek** (DeepSeek-V2)
- **GLM** (ChatGLM)

## 📚 Documentation

For detailed documentation, examples, and troubleshooting, visit:
- [GitHub Repository](https://github.com/unit-mesh/autodev-workbench)
- [Quick Start Guide](https://github.com/unit-mesh/autodev-workbench/blob/master/packages/github-agent-action/QUICK_START.md)

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/unit-mesh/autodev-workbench/blob/master/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- 📖 [Documentation](https://github.com/unit-mesh/autodev-workbench)
- 🐛 [Issue Tracker](https://github.com/unit-mesh/autodev-workbench/issues)
- 💬 [Discussions](https://github.com/unit-mesh/autodev-workbench/discussions)
