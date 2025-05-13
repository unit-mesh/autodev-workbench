# @autodev/context-mcp

Model Context Protocol implementation for AutoDev.

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
import { MCPClient, MCPServer } from "@autodev/context-mcp";

// Create a client
const client = new MCPClient({
  // configuration options
});

// Create a server
const server = new MCPServer({
  // configuration options
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

# Run linter
pnpm lint
```

## License

MIT
