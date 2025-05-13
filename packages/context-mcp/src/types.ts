import { Context, ContextRequest, ContextResponse } from '@modelcontextprotocol/sdk';

export interface MCPClientConfig {
  serverUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface MCPServerConfig {
  port?: number;
  host?: string;
  cors?: boolean;
}

export interface MCPError extends Error {
  code: string;
  status?: number;
}

export type ContextHandler = (context: Context) => Promise<ContextResponse>;
export type RequestHandler = (request: ContextRequest) => Promise<ContextResponse>;

export interface MCPClient {
  getContext(request: ContextRequest): Promise<ContextResponse>;
  close(): Promise<void>;
}

export interface MCPServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  onContext(handler: ContextHandler): void;
  onRequest(handler: RequestHandler): void;
} 
