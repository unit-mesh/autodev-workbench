/**
 * MCP Tool Factory - Centralized tool creation and registration
 */

import { 
  MCPToolRegistry, 
  MCPToolName, 
  MCPToolCategory, 
  BaseMCPTool,
  ToolRegistry,
  isValidMCPToolName,
  getAllMCPToolNames
} from "./base/tool-registry";

// Import tool implementations
import { GitHubListRepositoryIssuesTool } from "./impl/github-list-repository-issues-tool";
import { GitHubGetIssueWithAnalysisTool } from "./impl/github-get-issue-with-analysis-tool";
import { GitHubCreateNewIssueTool } from "./impl/github-create-new-issue-tool";
import { GitHubAddIssueCommentTool } from "./impl/github-add-issue-comment-tool";
import { GitHubFindCodeByDescriptionTool } from "./impl/github-find-code-by-description-tool";
import { GitHubAnalyzeIssueAndPostResultsTool } from "./impl/github-analyze-issue-and-post-results-tool";
import { ExtractWebpageAsMarkdownTool } from "./impl/extract-webpage-as-markdown-tool";

/**
 * Tool factory for creating and managing MCP tools
 */
export class MCPToolFactory {
  private static initialized = false;

  /**
   * Initialize all tools and register them
   */
  static initialize(): void {
    if (MCPToolFactory.initialized) {
      return;
    }

    // Register GitHub Issue Management Tools
    ToolRegistry.register(new GitHubListRepositoryIssuesTool());
    ToolRegistry.register(new GitHubCreateNewIssueTool());
    ToolRegistry.register(new GitHubAddIssueCommentTool());

    // TODO: Register these tools after fixing dependencies
    // ToolRegistry.register(new GitHubGetIssueWithAnalysisTool());
    // ToolRegistry.register(new GitHubFindCodeByDescriptionTool());
    // ToolRegistry.register(new GitHubAnalyzeIssueAndPostResultsTool());

    // Register Web Content Tools
    ToolRegistry.register(new ExtractWebpageAsMarkdownTool());

    MCPToolFactory.initialized = true;
  }

  /**
   * Get a tool by name (with type safety)
   */
  static getTool(name: MCPToolName): BaseMCPTool | undefined {
    MCPToolFactory.initialize();
    return ToolRegistry.getTool(name);
  }

  /**
   * Get a tool by string name (for backward compatibility)
   */
  static getToolByName(name: string): BaseMCPTool | undefined {
    MCPToolFactory.initialize();
    return ToolRegistry.getTool(name);
  }

  /**
   * Get all tools
   */
  static getAllTools(): BaseMCPTool[] {
    MCPToolFactory.initialize();
    return ToolRegistry.getAllTools();
  }

  /**
   * Get tools by category
   */
  static getToolsByCategory(category: MCPToolCategory): BaseMCPTool[] {
    MCPToolFactory.initialize();
    return ToolRegistry.getToolsByCategory(category);
  }

  /**
   * Get GitHub Issue tools
   */
  static getGitHubIssueTools(): BaseMCPTool[] {
    return MCPToolFactory.getToolsByCategory(MCPToolCategory.GITHUB_ISSUE);
  }

  /**
   * Get GitHub Analysis tools
   */
  static getGitHubAnalysisTools(): BaseMCPTool[] {
    return MCPToolFactory.getToolsByCategory(MCPToolCategory.GITHUB_ANALYSIS);
  }

  /**
   * Get Web Content tools
   */
  static getWebContentTools(): BaseMCPTool[] {
    return MCPToolFactory.getToolsByCategory(MCPToolCategory.WEB_CONTENT);
  }

  /**
   * Install all tools with an MCP installer
   */
  static installAllTools(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
    MCPToolFactory.initialize();
    ToolRegistry.installAll(installer);
  }

  /**
   * Install tools by category
   */
  static installToolsByCategory(
    category: MCPToolCategory,
    installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void
  ): void {
    MCPToolFactory.initialize();
    const tools = ToolRegistry.getToolsByCategory(category);
    tools.forEach(tool => tool.install(installer));
  }

  /**
   * Check if a tool name is valid
   */
  static isValidToolName(name: string): boolean {
    MCPToolFactory.initialize();
    return isValidMCPToolName(name);
  }

  /**
   * Get all tool names
   */
  static getAllToolNames(): string[] {
    MCPToolFactory.initialize();
    return getAllMCPToolNames();
  }

  /**
   * Get tool metadata
   */
  static getToolMetadata(name: MCPToolName): { name: string; description: string; category: string } | undefined {
    const tool = MCPToolFactory.getTool(name);
    if (!tool) return undefined;

    return {
      name: tool.name,
      description: tool.description,
      category: tool.category
    };
  }

  /**
   * Create legacy installer functions for backward compatibility
   */
  static createLegacyInstallers(): Record<string, Function> {
    MCPToolFactory.initialize();
    const installers: Record<string, Function> = {};

    ToolRegistry.getAllTools().forEach(tool => {
      // Create installer function name
      const functionName = `install${tool.name.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join('')}Tool`;

      installers[functionName] = (installer: Function) => {
        tool.install(installer);
      };

      // Also create aliases for backward compatibility
      if (tool.metadata.aliases) {
        tool.metadata.aliases.forEach(alias => {
          const aliasFunctionName = `install${alias.split('_').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('')}Tool`;
          installers[aliasFunctionName] = installers[functionName];
        });
      }
    });

    return installers;
  }
}

/**
 * Backward compatibility exports
 */

// Initialize tools on module load
MCPToolFactory.initialize();

// Export tool collections for backward compatibility
export const GitHubIssueTools = MCPToolFactory.getGitHubIssueTools().map(tool => 
  (installer: Function) => tool.install(installer)
);

export const GitHubAnalysisTools = MCPToolFactory.getGitHubAnalysisTools().map(tool => 
  (installer: Function) => tool.install(installer)
);

export const WebContentTools = MCPToolFactory.getWebContentTools().map(tool => 
  (installer: Function) => tool.install(installer)
);

export const GitHubTools = [
  ...GitHubIssueTools,
  ...GitHubAnalysisTools,
  ...WebContentTools,
];

// Export individual installer functions
const legacyInstallers = MCPToolFactory.createLegacyInstallers();
export const installGitHubListRepositoryIssuesTool = legacyInstallers.installGithubListRepositoryIssuesTool;

// Export types and enums
export { MCPToolName, MCPToolCategory, BaseMCPTool, ToolRegistry } from "./base/tool-registry";
