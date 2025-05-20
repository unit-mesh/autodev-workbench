#!/usr/bin/env node

const { MCPServer } = require("../dist/index.js");

const PKG = require("../package.json");

console.error("Starting MCP server...");
console.error("Version:", PKG.version);

const server = new MCPServer({
    name: "autodev-context-mcp",
    version: PKG.version,
});

console.error("Server created, starting stdio...");

// Add proper error handling and connection management
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

server.serveStdio()
    .then(() => {
        console.error("Server started successfully");
    })
    .catch(err => {
        console.error("Failed to start server:", err);
        process.exit(1);
    });
