import { ContextRequest, ContextResponse } from "@modelcontextprotocol/sdk";
import { MCPClient, MCPClientConfig, MCPError } from "./types";

export class MCPClientImpl implements MCPClient {
  private serverUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: MCPClientConfig) {
    this.serverUrl = config.serverUrl;
    this.timeout = config.timeout || 30000;
    this.headers = {
      "Content-Type": "application/json",
      ...config.headers,
    };
  }

  async getContext(request: ContextRequest): Promise<ContextResponse> {
    try {
      const response = await fetch(`${this.serverUrl}/context`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = new Error(
          `HTTP error! status: ${response.status}`
        ) as MCPError;
        error.code = "MCP_CLIENT_ERROR";
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        const mcpError = error as MCPError;
        mcpError.code = mcpError.code || "MCP_CLIENT_ERROR";
        throw mcpError;
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    // Cleanup any resources if needed
  }
}
