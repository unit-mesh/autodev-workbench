# GitHub Agent Usage Examples

This document provides detailed examples of how to use the GitHub Agent MCP server with its intelligent search capabilities.

## Quick Start

```bash
# Start the server
npx @autodev/github-agent@latest

# Or with HTTP server
npx @autodev/github-agent@latest --port 3001
```

## Tool Examples

### 1. Basic Issue Retrieval

Get all open issues from a repository:

```json
{
  "tool": "github_get_issues",
  "arguments": {
    "owner": "microsoft",
    "repo": "vscode",
    "state": "open",
    "per_page": 10
  }
}
```

### 2. Smart Search for Bug Investigation

Use AI-powered search to find code related to a specific error:

```json
{
  "tool": "github_smart_search",
  "arguments": {
    "owner": "microsoft",
    "repo": "vscode",
    "query": "TypeError: Cannot read property 'length' of undefined in file explorer",
    "search_depth": "deep",
    "workspace_path": "/path/to/vscode-clone"
  }
}
```

**What this does:**
- Extracts keywords like "TypeError", "length", "undefined", "file", "explorer"
- Uses ripgrep to search for these terms in your local codebase
- Analyzes symbols and functions that might be related
- Provides relevance-scored results with explanations

### 3. Feature Implementation Research

Find code related to implementing a new feature:

```json
{
  "tool": "github_smart_search",
  "arguments": {
    "owner": "facebook",
    "repo": "react",
    "query": "implement dark mode theme switching with context API",
    "search_depth": "medium",
    "include_symbols": true
  }
}
```

**Expected results:**
- Files containing theme-related code
- Context API implementations
- CSS/styling files
- Component files that handle theming

### 4. Performance Issue Analysis

Investigate performance problems:

```json
{
  "tool": "github_smart_search",
  "arguments": {
    "owner": "nodejs",
    "repo": "node",
    "query": "memory leak in HTTP server with keep-alive connections",
    "search_depth": "deep",
    "workspace_path": "/path/to/node-source"
  }
}
```

### 5. Detailed Issue Analysis

Analyze a specific GitHub issue with full context:

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

### 6. Get Issue Context with File Content

Get comprehensive context including full file contents:

```json
{
  "tool": "github_get_issue_context",
  "arguments": {
    "owner": "microsoft",
    "repo": "vscode",
    "issue_number": 12345,
    "include_file_content": true,
    "max_files": 10
  }
}
```

## Advanced Search Strategies

### Search Depth Comparison

**Shallow Search** (`search_depth: "shallow"`):
- 5 most relevant files
- 3 key symbols
- 2 API endpoints
- Fast execution (~10 seconds)

**Medium Search** (`search_depth: "medium"`):
- 10 relevant files
- 5 symbols
- 3 API endpoints
- Balanced performance (~30 seconds)

**Deep Search** (`search_depth: "deep"`):
- 20 relevant files
- 10 symbols
- 5 API endpoints
- Comprehensive analysis (~60 seconds)

### Keyword Extraction Examples

The AI keyword extraction identifies different types of terms:

**Input**: "React component not rendering after state update with hooks"

**Extracted Keywords**:
- Primary: ["react", "component", "rendering", "state", "update", "hooks"]
- Technical: ["useState", "useEffect", "componentDidMount", "setState"]
- Secondary: ["render", "mount", "lifecycle", "props"]
- Contextual: ["not rendering", "after update"]

## Integration Examples

### Claude Desktop Configuration

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

### Example Conversation Flow

1. **User**: "I'm getting a 'Cannot read property of undefined' error in my React app"

2. **AI Assistant**: Let me search for related code in your project.
   ```json
   {
     "tool": "github_smart_search",
     "arguments": {
       "query": "Cannot read property of undefined React",
       "search_depth": "medium"
     }
   }
   ```

3. **Results**: The tool finds:
   - 8 relevant files with potential undefined property access
   - 5 React components with similar patterns
   - 3 utility functions that handle undefined values
   - Specific suggestions for null checks and optional chaining

4. **AI Assistant**: Based on the analysis, here are the most likely causes and solutions...

## Best Practices

### 1. Effective Query Writing

**Good queries:**
- "authentication error when connecting to database"
- "memory leak in worker threads"
- "implement user permissions with role-based access"

**Less effective queries:**
- "fix bug" (too vague)
- "error" (too generic)
- "make it work" (no context)

### 2. Workspace Setup

- Ensure your workspace contains the relevant source code
- Use the same repository structure as the GitHub repo when possible
- Keep your local code reasonably up-to-date

### 3. Search Depth Selection

- Use **shallow** for quick overviews
- Use **medium** for most investigations
- Use **deep** for comprehensive analysis or complex issues

### 4. Combining Tools

1. Start with `github_get_issues` to find relevant issues
2. Use `github_smart_search` to find related code
3. Use `github_analyze_issue` for detailed analysis
4. Use `github_get_issue_context` for full context

## Troubleshooting

### Common Issues

1. **"ripgrep not found"**: Install ripgrep (`brew install ripgrep` on macOS)
2. **"context-worker failed"**: Ensure the workspace path is correct
3. **"No results found"**: Try broader search terms or different search depth

### Performance Tips

- Use appropriate search depth for your needs
- Limit workspace size by excluding unnecessary directories
- Use specific queries for better results

## Example Output

Here's what a typical smart search result looks like:

```json
{
  "query": {
    "original": "authentication error when connecting to database",
    "search_depth": "medium"
  },
  "search_results": {
    "relevant_files": [
      {
        "path": "src/auth/database-connection.ts",
        "relevance_score": 0.95,
        "why_relevant": "Contains database authentication logic"
      }
    ],
    "relevant_symbols": [
      {
        "name": "authenticateConnection",
        "type": "Function",
        "location": { "file": "src/auth/database-connection.ts", "line": 45 }
      }
    ]
  },
  "analysis": {
    "summary": "Found 8 relevant files and 12 symbols related to database authentication...",
    "suggestions": [
      {
        "type": "file",
        "description": "Check database-connection.ts for authentication logic",
        "confidence": 0.95,
        "priority": "high"
      }
    ]
  }
}
```
