import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { prompts } from "./capabilities/prompts.js";
import { AutoDevTools, DevOpsTools, PosixTools } from "./capabilities/tools.js";
import { resources } from "./capabilities/resources.js";

import type { ResourceMetadata } from "./capabilities/resources/_typing.js";
import type { Preset } from "./_typing.js";

export function installCapabilities(mcpInst: McpServer, metadata: ResourceMetadata, preset: Preset) {
    resources.forEach(resource => resource(mcpInst.resource.bind(mcpInst), metadata));
    prompts.forEach(prompt => prompt(mcpInst.prompt.bind(mcpInst)));

    switch (preset) {
        case "AutoDev":
            AutoDevTools.forEach(tool => tool(mcpInst.tool.bind(mcpInst)));
            break;
        case "DevOps":
            DevOpsTools.forEach(tool => tool(mcpInst.tool.bind(mcpInst)));
            break;
        case "SafePosix":
            PosixTools.forEach(tool => tool(mcpInst.tool.bind(mcpInst)));
            break;
        default:
            throw new Error(`Unsupported preset: ${preset}`);
    }
}
