import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitHubTools, FeatureDevelopmentTools } from "./capabilities/tools";
import type { Preset, GitHubAgentImplementation } from "./types";

export function installCapabilities(
  mcpInst: McpServer,
  metadata: GitHubAgentImplementation,
  preset: Preset
) {
  switch (preset) {
    case "GitHub":
      GitHubTools.forEach(tool => tool(mcpInst.tool.bind(mcpInst)));
      // Also install feature development tools for enhanced capabilities
      FeatureDevelopmentTools.forEach(tool => tool(mcpInst.tool.bind(mcpInst)));
      break;
    default:
      throw new Error(`Unsupported preset: ${preset}`);
  }
}
