#!/usr/bin/env node

const { GitHubAgentServer } = require('./dist/index.js');

async function testServer() {
  console.log('Testing GitHub Agent MCP Server...');
  
  try {
    const server = new GitHubAgentServer({
      name: "github-agent-test",
      version: "0.1.0",
    });

    console.log('✓ Server created successfully');

    // Load GitHub preset
    server.loadPreset("GitHub");
    console.log('✓ GitHub preset loaded successfully');

    // Test HTTP server
    console.log('Starting HTTP server on port 3001...');
    const httpServer = await server.serveHttp({ port: 3001 });
    console.log('✓ HTTP server started successfully');

    // Wait a bit then shutdown
    setTimeout(async () => {
      console.log('Shutting down server...');
      await server.destroy();
      console.log('✓ Server shut down successfully');
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

testServer();
