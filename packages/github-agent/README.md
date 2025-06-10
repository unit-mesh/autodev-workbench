# AutoDev GitHub Remote AI Agent

A comprehensive Model Context Protocol (MCP) server that provides advanced GitHub issue analysis capabilities with intelligent code context integration. This server can fetch GitHub issues, analyze them with AI-powered insights, and provide relevant code context from your local workspace using the AutoDev ecosystem.

## ✨ Key Features

- **🔍 GitHub Issues Integration**: Fetch, analyze, and interact with GitHub issues from any repository
- **🧠 AI-Powered Analysis**: Uses LLM to intelligently extract keywords, generate insights, and create analysis reports
- **🌐 Web Content Processing**: Automatically fetch and convert web URLs to markdown using Puppeteer, Cheerio, and TurndownService
- **📊 Code Context Analysis**: Analyze your local codebase to find relevant files, symbols, and APIs using advanced search strategies
- **🎯 Multi-Strategy Search**: Combines LLM analysis, ripgrep text search, symbol analysis, and relevance scoring
- **📝 Automated Reporting**: Generate and upload comprehensive analysis reports directly to GitHub issues
- **🌍 Multi-Language Support**: Supports both English and Chinese report generation
- **🏗️ Design Pattern Architecture**: Built with Strategy, Factory, and Template Method patterns for extensibility
- **⚡ Smart Caching**: Advanced caching system for improved performance
- **🔄 Smart Fallback**: Works with or without LLM configuration using rule-based alternatives
- **🔌 MCP Protocol Support**: Full Model Context Protocol implementation for seamless AI assistant integration

## Installation

### Using npx (Recommended)

```bash
npx @autodev/github-agent@latest
```

### Using pnpm

```bash
pnpm add -g @autodev/github-agent
```

## Setup

### Environment Variables

#### Required: GitHub Token
Set your GitHub personal access token:

```bash
export GITHUB_TOKEN=your_github_token_here
```

#### Optional: LLM Configuration (for AI-powered features)

**Option 1: GLM (ZhipuAI) - Recommended**
```bash
export GLM_TOKEN=your_glm_token_here
export LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
export LLM_MODEL=glm-4-air
```

**Option 2: OpenAI**
```bash
export OPENAI_API_KEY=your_openai_api_key_here
export LLM_BASE_URL=https://api.openai.com/v1
export LLM_MODEL=gpt-4o-mini
```

**Option 3: Other OpenAI-compatible APIs**
```bash
export LLM_BASE_URL=https://your-api-endpoint.com/v1
export OPENAI_API_KEY=your_api_key_here
export LLM_MODEL=your_model_name
```

> **Note**: LLM configuration is optional. The system will fall back to rule-based keyword extraction if no LLM is configured.

### GitHub Token Setup

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with the following scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories)
   - `issues` (to read issues)

## Usage

### Command Line

#### Start as MCP Server (stdio)

```bash
autodev-github-agent
```

#### Start as HTTP Server

```bash
autodev-github-agent --port 3001
```

#### Standalone Issue Analysis

```bash
autodev-analyze-issue --owner microsoft --repo vscode --issue 12345
```

### Available Tools

The GitHub Agent provides six comprehensive MCP tools:

#### 1. `github_get_issues`

Fetch GitHub issues from a repository with advanced filtering options.

**Parameters:**
- `owner` (string): Repository owner (username or organization)
- `repo` (string): Repository name
- `state` (optional): Issue state - "open", "closed", or "all" (default: "open")
- `labels` (optional): Comma-separated list of label names to filter by
- `assignee` (optional): Username of the assignee to filter by
- `since` (optional): Only issues updated after this time (ISO 8601 format)
- `per_page` (optional): Number of issues per page (1-100, default: 30)
- `page` (optional): Page number to retrieve (default: 1)

**Example:**
```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "state": "open",
  "labels": "bug,help-wanted",
  "per_page": 10
}
```

#### 2. `github_analyze_issue`

Analyze a specific GitHub issue with AI-powered insights and automatic URL content fetching.

**Parameters:**
- `owner` (string): Repository owner
- `repo` (string): Repository name
- `issue_number` (number): Issue number to analyze
- `workspace_path` (optional): Path to workspace (defaults to current directory)
- `fetch_urls` (optional): Automatically fetch content from URLs in issue (default: true)
- `url_timeout` (optional): Timeout for URL fetching in milliseconds (default: 10000)

**Example:**
```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "issue_number": 12345,
  "workspace_path": "/path/to/your/project",
  "fetch_urls": true
}
```

#### 3. `github_get_issue_context`

Get detailed context for a GitHub issue including related code and suggestions.

**Parameters:**
- `owner` (string): Repository owner
- `repo` (string): Repository name
- `issue_number` (number): Issue number
- `workspace_path` (optional): Path to workspace (defaults to current directory)
- `include_file_content` (optional): Include full file content (default: false)
- `max_files` (optional): Maximum number of files to return (1-20, default: 5)

**Example:**
```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "issue_number": 12345,
  "include_file_content": true,
  "max_files": 10
}
```

#### 4. `github_smart_search`

Intelligently search for code related to any query using AI-generated keywords and multiple search strategies.

**Parameters:**
- `owner` (string): Repository owner
- `repo` (string): Repository name
- `query` (string): Search query - can be an issue description, error message, or feature request
- `workspace_path` (optional): Path to workspace (defaults to current directory)
- `search_depth` (optional): "shallow", "medium", or "deep" (default: "medium")
- `include_symbols` (optional): Include symbol analysis (default: true)
- `include_ripgrep` (optional): Use ripgrep for text search (default: true)

**Example:**
```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "query": "authentication error when connecting to remote server",
  "search_depth": "deep",
  "include_symbols": true
}
```

#### 5. `github_upload_analysis`

Analyze a GitHub issue and automatically upload the analysis results as a comment to the issue.

**Parameters:**
- `owner` (string): Repository owner
- `repo` (string): Repository name
- `issue_number` (number): Issue number to analyze and upload results to
- `workspace_path` (optional): Path to workspace (defaults to current directory)
- `language` (optional): Language for the report - "en" or "zh" (default: "en")
- `include_file_content` (optional): Include file content in the report (default: false)
- `max_files` (optional): Maximum number of files to include (default: 10)

**Example:**
```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "issue_number": 12345,
  "language": "zh",
  "include_file_content": true
}
```

#### 6. `github_fetch_url_content`

Fetch and convert web page content to markdown for analysis, with support for extracting URLs from GitHub issues.

**Parameters:**
- `url` (string): URL to fetch content from
- `timeout` (optional): Request timeout in milliseconds (default: 10000)
- `extract_urls` (optional): Extract URLs from GitHub issue content (default: false)
- `issue_content` (optional): GitHub issue content to extract URLs from

**Example:**
```json
{
  "url": "https://example.com/documentation",
  "timeout": 15000
}
```

## 🚀 Advanced Capabilities

### AI-Powered Analysis
- **🧠 LLM-powered keyword extraction**: Uses AI models to intelligently analyze issue descriptions and generate relevant search terms
- **📊 Intelligent relevance scoring**: Ranks results by likelihood of being related to your query
- **🎯 Context-aware suggestions**: Provides actionable recommendations based on AI-detected issue type
- **📝 Automated report generation**: Creates comprehensive analysis reports with detailed plans and recommendations

### Multi-Strategy Search
- **🔍 Hybrid search approach**: Combines LLM analysis, ripgrep text search, symbol analysis, and relevance scoring
- **📋 Comprehensive analysis**: Includes files, symbols, APIs, and detailed explanations
- **🔄 Smart fallback**: Works with rule-based extraction when LLM is not configured
- **⚡ Performance optimization**: Advanced caching and efficient search algorithms

### Web Content Integration
- **🌐 Automatic URL fetching**: Extracts and processes URLs from GitHub issues
- **📄 HTML to Markdown conversion**: Uses Cheerio and TurndownService for clean content extraction
- **🧹 Content cleaning**: Removes scripts, styles, and navigation elements for focused analysis

## 💡 Usage Examples

### Basic Issue Analysis
```json
{
  "tool": "github_analyze_issue",
  "arguments": {
    "owner": "microsoft",
    "repo": "vscode",
    "issue_number": 12345,
    "workspace_path": "/path/to/your/project"
  }
}
```

### Smart Search for Bug Investigation
```json
{
  "tool": "github_smart_search",
  "arguments": {
    "owner": "microsoft",
    "repo": "vscode",
    "query": "TypeError: Cannot read property 'length' of undefined in file explorer",
    "search_depth": "deep"
  }
}
```

### Automated Analysis Upload
```json
{
  "tool": "github_upload_analysis",
  "arguments": {
    "owner": "microsoft",
    "repo": "vscode",
    "issue_number": 12345,
    "language": "zh",
    "include_file_content": true
  }
}
```

## Integration with AI Assistants

This MCP server can be integrated with AI assistants that support the Model Context Protocol, such as:

- Claude Desktop
- Custom AI applications
- Other MCP-compatible tools

### Claude Desktop Configuration

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "github-agent": {
      "command": "npx",
      "args": ["@autodev/github-agent@latest"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here",
        "GLM_TOKEN": "your_glm_token_here"
      }
    }
  }
}
```

## 🏗️ Architecture & How It Works

### Design Patterns Implementation
- **Strategy Pattern**: Multiple analysis strategies (LLM, rule-based, hybrid) for different scenarios
- **Factory Pattern**: Dynamic creation of analyzers based on configuration and available resources
- **Template Method Pattern**: Consistent analysis workflow with customizable steps

### Processing Pipeline
1. **GitHub API Integration**: Uses the GitHub REST API to fetch issue data and repository information
2. **Content Processing**: Automatically fetches and converts web URLs to markdown using Puppeteer and Cheerio
3. **AI Analysis**: Leverages LLM services for intelligent keyword extraction and context understanding
4. **Code Analysis**: Uses the AutoDev context-worker ecosystem to analyze your local codebase
5. **Multi-Strategy Search**: Combines ripgrep, symbol analysis, and AI-powered relevance scoring
6. **Report Generation**: Creates comprehensive analysis reports with actionable recommendations
7. **GitHub Integration**: Optionally uploads analysis results directly to GitHub issues as comments

### Caching & Performance
- **Advanced caching system**: Memory, file, and Redis-based caching options
- **Intelligent cache invalidation**: Based on issue updates and workspace changes
- **Optimized search algorithms**: Efficient file filtering and content analysis

## Development

### Building from Source

```bash
git clone <repository-url>
cd packages/github-agent
pnpm install
pnpm build
```

### Running Tests

```bash
pnpm test
```

### Development Mode

```bash
pnpm dev
```

## 🔧 Available Binaries

The package provides two executable binaries:

### `autodev-github-agent`
Main MCP server for GitHub integration. Supports both stdio and HTTP modes.

```bash
# Start as MCP server (stdio)
autodev-github-agent

# Start as HTTP server
autodev-github-agent --port 3000
```

### `autodev-analyze-issue`
Standalone CLI tool for analyzing GitHub issues with code context.

```bash
# Analyze a specific issue
autodev-analyze-issue --owner microsoft --repo vscode --issue 12345

# Analyze with custom workspace
autodev-analyze-issue --owner microsoft --repo vscode --issue 12345 --workspace /path/to/project
```

## 📦 Dependencies

### Core Dependencies
- `@autodev/context-worker`: Advanced code analysis and context building
- `@autodev/worker-core`: Core worker functionality and utilities
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `@octokit/rest`: GitHub API client
- `express`: HTTP server for MCP over HTTP

### AI & Analysis
- `@ai-sdk/openai`: AI SDK for LLM integration
- `ai`: AI utilities and providers
- `zod`: Schema validation and type safety

### Web Content Processing
- `cheerio`: Server-side HTML parsing and manipulation
- `turndown`: HTML to Markdown conversion
- `@types/cheerio`: TypeScript definitions for Cheerio

### Search & Performance
- `@vscode/ripgrep`: Fast text search capabilities
- `dotenv`: Environment variable management

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the main repository.

## 📚 Additional Resources

### Configuration Examples
- See `.env.example` for environment variable templates
- Check `USAGE_EXAMPLES.md` for detailed usage scenarios
- Review `INTEGRATION_SUMMARY.md` for technical implementation details

### Troubleshooting
- Ensure GitHub token has appropriate permissions (repo, issues)
- Verify LLM configuration for AI-powered features
- Check workspace path accessibility for code analysis
- Monitor timeout settings for web content fetching

## 🆘 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the documentation and examples
- Review existing issues for solutions
- Consult the AutoDev ecosystem documentation

## 🔗 Related Projects

- [`@autodev/context-worker`](../context-worker): Core code analysis engine
- [`@autodev/worker-core`](../worker-core): Shared utilities and functionality
- [AutoDev Web Interface](../web): Web-based interface for the AutoDev ecosystem
