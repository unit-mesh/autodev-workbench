# GitHub Agent MCP Server

A Model Context Protocol (MCP) server that provides GitHub issue analysis capabilities with code context integration. This server can fetch GitHub issues, analyze them, and provide relevant code context from your local workspace using the AutoDev context-worker.

## Features

- **GitHub Issues Integration**: Fetch and analyze GitHub issues from any repository
- **Code Context Analysis**: Analyze your local codebase to find relevant files, symbols, and APIs
- **Issue-Code Correlation**: Automatically correlate GitHub issues with relevant code in your workspace
- **MCP Protocol Support**: Full Model Context Protocol implementation for seamless AI assistant integration

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

Set your GitHub personal access token:

```bash
export GITHUB_TOKEN=your_github_token_here
```

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

### Available Tools

The GitHub Agent provides three main MCP tools:

#### 1. `github_get_issues`

Fetch GitHub issues from a repository.

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

Analyze a specific GitHub issue and find related code in your workspace.

**Parameters:**
- `owner` (string): Repository owner
- `repo` (string): Repository name
- `issue_number` (number): Issue number to analyze
- `workspace_path` (optional): Path to workspace (defaults to current directory)

**Example:**
```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "issue_number": 12345,
  "workspace_path": "/path/to/your/project"
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
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

## How It Works

1. **GitHub API Integration**: Uses the GitHub REST API to fetch issue data
2. **Code Analysis**: Leverages the AutoDev context-worker to analyze your local codebase
3. **Relevance Scoring**: Matches issue content with code files using keyword extraction and relevance scoring
4. **Context Correlation**: Provides suggestions and correlations between issues and code

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

## Dependencies

- `@autodev/context-worker`: Code analysis and context building
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `@octokit/rest`: GitHub API client
- `express`: HTTP server for MCP over HTTP
- `zod`: Schema validation

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the main repository.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review existing issues for solutions
