import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type ResourceMetadata = {
    [x: string]: unknown;
    name: string;
    version: string;
};

export type ResourceLike = (installer: McpServer["resource"], metadata: ResourceMetadata) => void;