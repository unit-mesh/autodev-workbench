# @autodev/context-mcp

Model Context Protocol implementation for AutoDev.

## Using in cursor
```json
{
  "mcpServers": {
    "autodev-context-mcp": {
      "command": "npx",
      "args": ["--package=@autodev/context-mcp", "autodev-context-mcp", "--preset=AutoDev"]
    }
  }
}
```

### Local Using

```json
{
  "mcpServers": {
    "autodev": {
      "command": "node",
      "args": ["/Users/phodal/ai/autodev-work/packages/context-mcp/dist/index.js", "--preset=AutoDev"],
      "env": {
        "PROJECT_ID": "cmaqby8oo0002l704skfwgpjy"
      }
    }
  }
}
```

## Installation

```bash
npm install @autodev/context-mcp
# or
yarn add @autodev/context-mcp
# or
pnpm add @autodev/context-mcp
```

## Usage

```typescript
import { MCPServer } from "@autodev/context-mcp";

// Create a server instance
const server = new MCPServer({
  name: "my-server",
  version: "1.0.0",
});

server.serveHttp({
  port: 3000,
});
```
## Available Tools

### POSIX Command Line Tools
- `ls` - List directory contents
  ```typescript
  // Example: List files in a directory
  const result = await server.tool("ls", { path: "./src" });
  ```

- `cat` - Concatenate and display file contents
  ```typescript
  // Example: Display file contents
  const result = await server.tool("cat", { path: "./package.json" });
  ```

- `grep` - Search for patterns in files
  ```typescript
  // Example: Search for a pattern
  const result = await server.tool("grep", { 
    pattern: "function", 
    path: "./src/**/*.ts" 
  });
  ```

- `head` - Display first lines of files
  ```typescript
  // Example: Show first 10 lines
  const result = await server.tool("head", { 
    path: "./large-file.txt",
    lines: 10 
  });
  ```

- `tail` - Display last lines of files
  ```typescript
  // Example: Show last 20 lines
  const result = await server.tool("tail", { 
    path: "./log.txt",
    lines: 20 
  });
  ```

- `tee` - Read from stdin and write to stdout and files
  ```typescript
  // Example: Write to multiple files
  const result = await server.tool("tee", {
    paths: ["./output1.txt", "./output2.txt"],
    input: "Hello, World!"
  });
  ```

- `sort` - Sort text files
  ```typescript
  // Example: Sort lines numerically
  const result = await server.tool("sort", {
    path: "./numbers.txt",
    numeric: true
  });
  ```

- `uniq` - Report or filter out repeated lines
  ```typescript
  // Example: Show unique lines with counts
  const result = await server.tool("uniq", {
    path: "./duplicates.txt",
    count: true
  });
  ```

- `cut` - Remove sections from each line
  ```typescript
  // Example: Extract first and third fields
  const result = await server.tool("cut", {
    path: "./data.txt",
    fields: "1,3",
    delimiter: ","
  });
  ```

- `paste` - Merge lines of files
  ```typescript
  // Example: Merge two files side by side
  const result = await server.tool("paste", {
    paths: ["./file1.txt", "./file2.txt"]
  });
  ```

- `diff` - Compare files line by line
  ```typescript
  // Example: Compare two files
  const result = await server.tool("diff", {
    file1: "./old.txt",
    file2: "./new.txt"
  });
  ```

- `free` - Display memory usage
  ```typescript
  // Example: Show memory usage in human-readable format
  const result = await server.tool("free", {
    humanReadable: true
  });
  ```

- `df` - Display disk space usage
  ```typescript
  // Example: Show disk usage for local filesystems
  const result = await server.tool("df", {
    local: true,
    humanReadable: true
  });
  ```

- `find` - Search for files
  ```typescript
  // Example: Find all TypeScript files
  const result = await server.tool("find", {
    path: "./src",
    pattern: "*.ts"
  });
  ```

- `wc` - Count lines, words, and characters
  ```typescript
  // Example: Count lines and words
  const result = await server.tool("wc", {
    path: "./text.txt",
    lines: true,
    words: true
  });
  ```

### Code Search Tools
- `ast_grep` - Search code using AST patterns
  ```typescript
  // Example: Find all function declarations
  const result = await server.tool("ast_grep", {
    pattern: "function $FUNC()",
    path: "./src"
  });
  ```

- `rip_grep` - Fast text-based code search
  ```typescript
  // Example: Search for a specific string
  const result = await server.tool("rip_grep", {
    pattern: "TODO",
    path: "./src"
  });
  ```

### Repository Tools
- GitHub PR Tools
  - List pull requests
  ```typescript
  const result = await server.tool("github_pr_list", {
    owner: "username",
    repo: "repository"
  });
  ```
  - Create pull requests
  ```typescript
  const result = await server.tool("github_pr_create", {
    owner: "username",
    repo: "repository",
    title: "New Feature",
    body: "Description",
    head: "feature-branch",
    base: "main"
  });
  ```

- GitLab MR Tools
  - List merge requests
  ```typescript
  const result = await server.tool("gitlab_mr_list", {
    projectId: "123",
    state: "opened"
  });
  ```
  - Create merge requests
  ```typescript
  const result = await server.tool("gitlab_mr_create", {
    projectId: "123",
    title: "New Feature",
    description: "Description",
    sourceBranch: "feature-branch",
    targetBranch: "main"
  });
  ```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test
```

## License

MIT
