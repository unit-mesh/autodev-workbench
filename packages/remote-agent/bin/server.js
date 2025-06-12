#!/usr/bin/env node

const { GitHubAgentServer } = require('../dist/index.js');

async function main() {
  const server = new GitHubAgentServer({
    name: "autodev-github-agent",
    version: "0.1.0",
  });

  // Load GitHub preset
  server.loadPreset("GitHub");

  // Check if we should serve via HTTP or stdio
  const args = process.argv.slice(2);
  const httpPortIndex = args.indexOf('--port');
  
  if (httpPortIndex !== -1 && httpPortIndex + 1 < args.length) {
    const port = parseInt(args[httpPortIndex + 1], 10);
    if (isNaN(port)) {
      console.error('Invalid port number');
      process.exit(1);
    }
    
    console.log(`Starting GitHub Agent MCP server on port ${port}`);
    await server.serveHttp({ port });
  } else {
    console.log('Starting GitHub Agent MCP server on stdio');
    await server.serveStdio();
  }
}

main().catch((error) => {
  console.error('Failed to start GitHub Agent MCP server:', error);
  process.exit(1);
});
