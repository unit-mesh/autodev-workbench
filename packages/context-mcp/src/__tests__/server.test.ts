import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { MCPServerImpl } from '../server';
import { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { z } from 'zod';
import http from 'node:http';

describe('MCPServerImpl', () => {
  let server: MCPServerImpl;
  let client: McpClient;
  let transport: StreamableHTTPClientTransport;
  let httpServer: http.Server;
  const mockImpl: Implementation = {
    name: 'test-server',
    version: '1.0.0',
  };

  beforeEach(() => {
    server = new MCPServerImpl(mockImpl);
  });

  afterEach(async () => {
    if (client) {
      await client.close();
    }
    if (transport) {
      transport.close();
    }
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
    await server.destroy();
  });

  describe('HTTP Server', () => {
    it('should start an HTTP server on the specified port', async () => {
      const port = 0;
      httpServer = await server.serveHttp({ port });
      const actualPort = (httpServer.address() as any).port;
      
      expect(httpServer).toBeDefined();
      expect(httpServer.listening).toBe(true);
      
      // Test server is accessible
      const response = await new Promise<http.IncomingMessage>((resolve) => {
        http.get(`http://localhost:${actualPort}/mcp`, (res) => {
          resolve(res);
        });
      });
      
      expect(response.statusCode).toBe(400); // Should return 400 for missing session ID
    });

    it('should handle client connection and initialization', async () => {
      const port = 0;
      httpServer = await server.serveHttp({ port });
      const actualPort = (httpServer.address() as any).port;
      
      // Create MCP client
      transport = new StreamableHTTPClientTransport(new URL(`http://localhost:${actualPort}/mcp`));
      client = new McpClient({
        name: mockImpl.name,
        version: mockImpl.version,
        transport
      });

      // Connect client first
      await client.connect(transport);

      // Initialize client
      const prompts = (await client.listPrompts()).prompts;
      expect(prompts).toBeDefined();
      expect(prompts.length).toBeGreaterThan(0);

      const tools = (await client.listTools()).tools;
      expect(tools).toBeDefined();
      expect(tools.length).toBeGreaterThan(0);

      const resources = (await client.listResources()).resources;
      expect(resources).toBeDefined();
      expect(resources.length).toBeGreaterThan(0);

      const resource = resources[0];
      const version = await client.readResource(resource);
      expect(version).toBeDefined();
      expect(version.contents).toBeDefined();
      expect(version.contents[0].text).toBe(mockImpl.version);
    });
  });

  describe('Server Lifecycle', () => {
    it('should destroy server and cleanup resources', async () => {
      const port = 0;
      httpServer = await server.serveHttp({ port });
      
      expect(httpServer.listening).toBe(true);
      
      await server.destroy();
      
      // Wait for server to close
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
      
      expect(httpServer.listening).toBe(false);
    });
  });
}); 