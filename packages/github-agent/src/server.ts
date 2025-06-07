import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { ServerOptions as McpServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport as McpStdioTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport as McpHttpTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { type Preset, type GitHubAgentImplementation } from "./types";
export type { Preset, GitHubAgentImplementation };

import http from "node:http";

import {
  Implementation as McpImplementation,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";

import express, { Application } from "express";
import { randomUUID } from "node:crypto";

import { installCapabilities } from "./capabilities";

// Export types for use in other packages
export type { ServerOptions as McpServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
export type { Implementation as McpImplementation } from "@modelcontextprotocol/sdk/types.js";

export type HttpServeOptions = {
  port: number;
  hostname?: string;
};

/**
 * GitHub Agent MCP Server Implementation
 * @constructor
 * @param impl - The implementation of the GitHub Agent MCP server
 * @param options - The options for the MCP server
 * @see {@link McpServerOptions}
 * @see {@link McpImplementation}
 */
export class GitHubAgentServer {
  private impl: GitHubAgentImplementation;

  private mcpInst: McpServer;
  private mcpStdioTransport?: McpStdioTransport;
  private mcpHttpTransportSessions?: { [sessionId: string]: McpHttpTransport };

  private managedHttpServer?: http.Server;

  private expressApp?: Application;

  private isDestroyed = true;

  private preset: Preset | null = null;

  constructor(impl: GitHubAgentImplementation, options?: McpServerOptions) {
    this.impl = impl;
    this.mcpInst = new McpServer(
      {
        name: impl.name,
        version: impl.version,
      },
      options
    );
  }

  private ensureExpressApp() /* asserts this.expressApp is Application */{
    if (!this.expressApp) {
      this.expressApp = express();
      this.expressApp.use(express.json());
    }
  }

  private ensureMcpHttpTransportSessions() /* asserts this.mcpHttpTransportSessions is { [sessionId: string]: McpHttpTransport } */{
    if (!this.mcpHttpTransportSessions) {
      this.mcpHttpTransportSessions = {};
    }
  }

  private ensureMcpStdioTransport() /* asserts this.mcpStdioTransport is McpStdioTransport */{
    if (!this.mcpStdioTransport) {
      this.mcpStdioTransport = new McpStdioTransport();
    }
  }

  private ensureDestroyed() /* asserts this.isDestroyed is false */{
    if (!this.isDestroyed) {
      throw new Error("GitHubAgentServer is still running");
    }
  }

  private ensurePreset() /* asserts this.preset is Preset */{
    if (!this.preset) {
      throw new Error("Preset is not set");
    }
  }

  loadPreset(preset: Preset) {
    this.preset = preset;
    installCapabilities(this.mcpInst, this.impl, preset);
  }

  async serveHttp(options: HttpServeOptions): Promise<http.Server> {
    this.ensurePreset();
    this.ensureDestroyed();
    this.ensureExpressApp();
    if (!this.expressApp) throw new Error("Failed to create Express app"); // Type guard

    this.expressApp.post("/mcp", async (req, res) => {
      this.ensureMcpHttpTransportSessions();
      if (!this.mcpHttpTransportSessions) throw new Error("Failed to create MCP HTTP transport sessions"); // Type guard

      // Check for existing session ID
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport: McpHttpTransport;

      if (sessionId && this.mcpHttpTransportSessions![sessionId]) {
        // Reuse existing transport
        transport = this.mcpHttpTransportSessions[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new McpHttpTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            this.ensureMcpHttpTransportSessions();
            if (!this.mcpHttpTransportSessions) throw new Error("Failed to create MCP HTTP transport sessions"); // Type guard

            // Store the transport by session ID
            this.mcpHttpTransportSessions[sessionId] = transport;
          },
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            this.ensureMcpHttpTransportSessions();
            if (!this.mcpHttpTransportSessions) throw new Error("Failed to create MCP HTTP transport sessions"); // Type guard

            delete this.mcpHttpTransportSessions[transport.sessionId];
          }
        };
        // Connect to the MCP server
        await this.mcpInst.connect(transport);
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
        return;
      }

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    });

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (
      req: express.Request,
      res: express.Response
    ) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      this.ensureMcpHttpTransportSessions();
      if (!this.mcpHttpTransportSessions) throw new Error("Failed to create MCP HTTP transport sessions"); // Type guard

      if (!sessionId || !this.mcpHttpTransportSessions[sessionId]) {
        res.status(400).send("Invalid or missing session ID");
        return;
      }

      const transport = this.mcpHttpTransportSessions[sessionId];
      await transport.handleRequest(req, res);
    };

    // Handle GET requests for server-to-client notifications via SSE
    this.expressApp.get("/mcp", handleSessionRequest);

    // Handle DELETE requests for session termination
    this.expressApp.delete("/mcp", handleSessionRequest);

    if (this.managedHttpServer) {
      this.managedHttpServer.close();
      this.managedHttpServer = undefined;
    }
    if (options.hostname) {
      this.managedHttpServer = this.expressApp.listen(
        options.port,
        options.hostname
      );
    } else {
      this.managedHttpServer = this.expressApp.listen(options.port);
    }

    this.isDestroyed = false;
    return this.managedHttpServer;
  }

  async serveStdio() {
    this.ensurePreset();
    this.ensureDestroyed();
    this.ensureMcpStdioTransport();
    if (!this.mcpStdioTransport) throw new Error("Failed to create MCP STDIO transport"); // Type guard

    this.isDestroyed = false;
    await this.mcpInst.connect(this.mcpStdioTransport);
  }

  /**
   * Disconnect from underlying transports
   * Destroy the underlying transports
   */
  async destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.preset = null;

    this.mcpInst.close();

    if (this.managedHttpServer) {
      await new Promise<void>((resolve, reject) => {
        this.managedHttpServer?.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    this.expressApp = undefined;
    this.mcpHttpTransportSessions = undefined;

    this.mcpStdioTransport?.close();
    this.mcpStdioTransport = undefined;
  }
}
