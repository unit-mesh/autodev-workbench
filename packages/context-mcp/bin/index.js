#!/usr/bin/env node

const { MCPServer } = require("../dist/index.js");

const PKG = require("../package.json");

const { Presets } = require("../dist/_typing.js");

// parse --preset flag
const presetArg = process.argv.find((arg) => arg.startsWith("--preset="));
const presetValue = presetArg ? presetArg.split("=")[1] : null;

if (!presetValue) {
    // print help
    console.error("Usage: context-mcp --preset=<preset>");
    console.error("Available presets:");
    Presets.forEach((p) => {
        console.error(`  ${p.name}: ${p.description}`);
    });
    process.exit(1);
}

const preset = Presets.find((p) => p.name === presetValue);
if (!preset) {
    console.error("Invalid preset:", presetValue);
    process.exit(1);
}

console.error("Starting MCP server...");
console.error("Version:", PKG.version);

const server = new MCPServer({
    name: "autodev-context-mcp",
    version: PKG.version,
});

console.error("Loading preset:", preset.name);
server.loadPreset(preset);

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
