# GitHub Agent CLI Tools

This directory contains command-line tools for the GitHub Agent package.

## Available Binaries

### `autodev-github-agent`
**File:** `index.js`  
**Purpose:** Main MCP (Model Context Protocol) server for GitHub integration

Starts the GitHub Agent MCP server that can be used with MCP-compatible clients.

**Usage:**
```bash
# Start server on stdio (default)
autodev-github-agent

# Start server on HTTP port
autodev-github-agent --port 3000
```

### `autodev-analyze-issue`
**File:** `analyze-issue.js`  
**Purpose:** Standalone CLI tool for analyzing GitHub issues with code context

Analyzes GitHub issues and generates detailed reports with relevant code files, symbols, and AI-powered suggestions.

**Usage:**
```bash
# Basic analysis (dry run)
autodev-analyze-issue microsoft vscode 12345

# Generate Chinese report and upload to GitHub
autodev-analyze-issue microsoft vscode 12345 --language=zh --upload

# Include file content with custom workspace
autodev-analyze-issue facebook react 67890 --include-content --workspace=/path/to/repo

# Verbose analysis with more files
autodev-analyze-issue nodejs node 11111 --verbose --max-files=20
```

**Options:**
- `--language=LANG`: Report language (en|zh) [default: en]
- `--upload`: Upload analysis report to GitHub as a comment
- `--include-content`: Include file content in the report [default: false]
- `--max-files=N`: Maximum number of files to include [default: 10]
- `--workspace=PATH`: Workspace path to analyze [default: current directory]
- `--verbose, -v`: Enable verbose output
- `--help, -h`: Show help message
- `--version`: Show version information

**Environment Variables:**
- `GITHUB_TOKEN`: GitHub personal access token (required)
- `OPENAI_API_KEY`: OpenAI API key for enhanced analysis (optional)

## Installation

After building the package, these binaries will be available globally if the package is installed:

```bash
# Install the package globally
npm install -g @autodev/github-agent

# Or use via npx
npx @autodev/github-agent analyze-issue microsoft vscode 12345
```

## Development

During development, you can run the binaries directly:

```bash
# Run the analyze-issue tool
node bin/analyze-issue.js microsoft vscode 12345 --verbose

# Run the MCP server
node bin/index.js --port 3000
```

## Migration from Scripts

The `analyze-issue` functionality was previously available as `scripts/analyze-and-upload.js`. This script is now deprecated and forwards to the new binary. Please update your workflows to use the new binary:

**Old (deprecated):**
```bash
node scripts/analyze-and-upload.js microsoft vscode 12345 --upload
```

**New (recommended):**
```bash
autodev-analyze-issue microsoft vscode 12345 --upload
# or
node bin/analyze-issue.js microsoft vscode 12345 --upload
```

## Exit Codes

The `autodev-analyze-issue` tool uses the following exit codes:

- `0`: Success
- `1`: Invalid arguments
- `2`: Missing GitHub token
- `3`: Analysis error
- `4`: Upload error
- `5`: Validation error

## Examples

### Basic Issue Analysis
```bash
# Analyze an issue without uploading
autodev-analyze-issue microsoft vscode 12345
```

### Upload Analysis to GitHub
```bash
# Analyze and upload the report as a comment
export GITHUB_TOKEN=your_token_here
autodev-analyze-issue microsoft vscode 12345 --upload
```

### Detailed Analysis with File Content
```bash
# Include file content and analyze more files
autodev-analyze-issue microsoft vscode 12345 \
  --include-content \
  --max-files=20 \
  --verbose
```

### Custom Workspace Analysis
```bash
# Analyze a specific codebase directory
autodev-analyze-issue microsoft vscode 12345 \
  --workspace=/path/to/vscode/repo \
  --language=zh \
  --upload
```

## Troubleshooting

### Missing GitHub Token
```
Error: GITHUB_TOKEN environment variable is not set
```
**Solution:** Set your GitHub personal access token:
```bash
export GITHUB_TOKEN=your_token_here
```

### Permission Denied
```
Error: Failed to fetch issue #12345: Not Found
```
**Solution:** Ensure your GitHub token has access to the repository and the issue exists.

### Workspace Not Found
```
Error: Workspace path does not exist: /invalid/path
```
**Solution:** Provide a valid path to the codebase you want to analyze.

For more help, run:
```bash
autodev-analyze-issue --help
```
