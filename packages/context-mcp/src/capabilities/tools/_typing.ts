import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type ToolLike = (installer: McpServer["tool"]) => void;
