# AutoDev Remote AI Agent

A comprehensive Model Context Protocol (MCP) server that provides advanced GitHub issue analysis capabilities with intelligent code context integration. This server can fetch GitHub issues, analyze them with AI-powered insights, and provide relevant code context from your local workspace using the AutoDev ecosystem.

## ✨ Key Features

- **🔍 GitHub Integration**: Fetch, analyze, and interact with GitHub issues from any repository
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
npx @autodev/remote-agent@latest
```

### Using pnpm

```bash
pnpm add -g @autodev/remote-agent
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
autodev-remote-agent
```

#### Start as HTTP Server

```bash
autodev-remote-agent --port 3001
```

#### Standalone Issue Analysis

```bash
autodev-analyze-issue --owner microsoft --repo vscode --issue 12345
```

### Available Tools

The Remote Agent provides the following comprehensive MCP tools:

#### GitHub Integration Tools
- **`github_get_issues`**: Fetch GitHub issues with advanced filtering options
- **`github_analyze_issue`**: Analyze issues with AI-powered insights and URL content fetching
- **`github_get_issue_context`**: Get detailed context for issues including related code
- **`github_smart_search`**: Intelligently search for code related to any query
- **`github_upload_analysis`**: Analyze issues and upload results as comments
- **`github_issue_create`**: Create new GitHub issues
- **`github_issue_comment`**: Add comments to GitHub issues

#### File System Tools
- **`read-file`**: Read file contents with encoding support
- **`write-file`**: Create or update files with multiple modes (create/append/overwrite)
- **`list-directory`**: List directory contents with filtering options
- **`delete-file`**: Delete files from the filesystem
- **`str-replace-editor`**: Precise code editing with pattern matching

#### Code Analysis Tools
- **`analyze-basic-context`**: Analyze project structure and context
- **`search-keywords`**: Search for keywords across files
- **`code-search-regex`**: Search code using regular expressions
- **`semantic-code-search`**: AI-powered semantic code search

#### Terminal & Process Tools
- **`run-terminal-command`**: Execute terminal commands with output capture
- **`get-terminal-output`**: Get output from previously executed commands
- **`launch-process`**: Start background processes with management options
- **`list-processes`**: List running processes
- **`read-process`**: Get output from running processes
- **`kill-process`**: Terminate running processes

#### Web Tools
- **`web-fetch-content`**: Fetch and convert web content to markdown
- **`web-search`**: Search the web using Google or Bing APIs
- **`open-browser`**: Open URLs in the system browser

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

### Web Search Capabilities
- **🔍 Multi-engine search**: Supports Google Custom Search and Bing Search APIs with automatic fallback
- **🌍 Multi-language support**: Search in different languages (English, Chinese, etc.)
- **🛡️ Safe search filtering**: Optional content filtering for appropriate results
- **⚡ Smart error handling**: Graceful fallback and detailed error messages with configuration guidance

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

### Web Search for Knowledge Verification
```json
{
  "tool": "web-search",
  "arguments": {
    "query": "React Server Components best practices 2024",
    "num_results": 5,
    "search_engine": "auto",
    "language": "en"
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
    "remote-agent": {
      "command": "npx",
      "args": ["@autodev/remote-agent@latest"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here",
        "GLM_TOKEN": "your_glm_token_here",
        "GOOGLE_SEARCH_API_KEY": "your_google_search_api_key",
        "GOOGLE_SEARCH_ENGINE_ID": "your_google_search_engine_id",
        "BING_SEARCH_API_KEY": "your_bing_search_api_key"
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

## 📊 Comparison with Other AI Agents

AutoDev Remote Agent has been designed with a comprehensive set of tools that compare favorably with other AI coding agents:

| Feature Category | AutoDev Remote Agent | Other AI Agents |
|-----------------|----------------------|----------------|
| **File Operations** | Complete suite (read, write, list, delete) | Often limited to basic operations |
| **Terminal Execution** | Advanced command execution with output analysis | Basic command execution |
| **Process Management** | Full process lifecycle management | Limited or no process management |
| **Code Search** | Multiple search strategies (keywords, regex, semantic) | Basic search capabilities |
| **GitHub Integration** | Complete GitHub workflow tools | Limited or no GitHub integration |
| **Web Capabilities** | Content fetching, web search, browser control | Limited web interaction |

With **23 specialized tools**, AutoDev Remote Agent provides one of the most comprehensive tool sets among AI coding agents, particularly excelling in GitHub integration and process management.

## Development

### Building from Source

```bash
git clone https://github.com/unit-mesh/autodev-workbench
cd packages/remote-agent
pnpm install
pnpm build
```

### Running Tests

```bash
pnpm test
```

### Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the main repository.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
