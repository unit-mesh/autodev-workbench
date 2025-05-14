import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { prompts } from "./capabilities/prompts.js";
import { tools } from "./capabilities/tools.js";
import { resources } from "./capabilities/resources.js";

import type { ResourceMetadata } from "./capabilities/resources/_typing.js";

// TODO: This metadata is really annoying, we should find a better way to do this.
export function installCapabilities(mcpInst: McpServer, metadata: ResourceMetadata) {
    resources.forEach(resource => resource(mcpInst.resource, metadata));
    tools.forEach(tool => tool(mcpInst.tool));
    prompts.forEach(prompt => prompt(mcpInst.prompt));
}
