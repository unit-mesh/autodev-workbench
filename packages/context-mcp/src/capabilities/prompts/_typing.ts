import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type PromptLike = (installer: McpServer["prompt"]) => void;