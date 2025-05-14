# @autodev/worker-protobuf

Model Context Protocol implementation for AutoDev.

## Installation

```bash
npm install @autodev/worker-protobuf
# or
yarn add @autodev/worker-protobuf
# or
pnpm add @autodev/worker-protobuf
```

## Usage

```typescript
import { MCPClient, MCPServer } from "@autodev/worker-protobuf";

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
