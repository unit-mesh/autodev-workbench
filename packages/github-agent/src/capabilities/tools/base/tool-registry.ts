/**
 * MCP Tool Registry - Centralized tool management with type safety
 */

import { z } from "zod";

/**
 * Enum for all available MCP tools
 */
export enum MCPToolName {
  // GitHub Issue Management
  GITHUB_LIST_REPOSITORY_ISSUES = "github-list-repository-issues",
  GITHUB_GET_ISSUE_WITH_ANALYSIS = "github-get-issue-with-analysis", 
  GITHUB_CREATE_NEW_ISSUE = "github-create-new-issue",
  GITHUB_ADD_ISSUE_COMMENT = "github-add-issue-comment",
  
  // GitHub Analysis & Search
  GITHUB_FIND_CODE_BY_DESCRIPTION = "github-find-code-by-description",
  GITHUB_ANALYZE_ISSUE_AND_POST_RESULTS = "github-analyze-issue-and-post-results",
  
  // Web Content
  EXTRACT_WEBPAGE_AS_MARKDOWN = "extract-webpage-as-markdown"
}

/**
 * Tool categories for better organization
 */
export enum MCPToolCategory {
  GITHUB_ISSUE = "github-issue",
  GITHUB_ANALYSIS = "github-analysis", 
  WEB_CONTENT = "web-content"
}

/**
 * Tool metadata interface
 */
export interface MCPToolMetadata {
  name: MCPToolName;
  category: MCPToolCategory;
  description: string;
  deprecated?: boolean;
  aliases?: string[]; // For backward compatibility
}

/**
 * Base interface for MCP tool parameters
 */
export interface MCPToolParameters {
  [key: string]: any;
}

/**
 * MCP Tool result interface
 */
export interface MCPToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

/**
 * Base class for all MCP Tools
 */
export abstract class BaseMCPTool<TParams extends MCPToolParameters = MCPToolParameters> {
  public readonly metadata: MCPToolMetadata;
  protected abstract schema: z.ZodType<TParams, any, any>;

  constructor(metadata: MCPToolMetadata) {
    this.metadata = metadata;
  }

  /**
   * Get the tool name
   */
  get name(): MCPToolName {
    return this.metadata.name;
  }

  /**
   * Get the tool category
   */
  get category(): MCPToolCategory {
    return this.metadata.category;
  }

  /**
   * Get the tool description
   */
  get description(): string {
    return this.metadata.description;
  }

  /**
   * Get the Zod schema for parameters
   */
  getSchema(): z.ZodType<TParams, any, any> {
    return this.schema;
  }

  /**
   * Validate parameters against schema
   */
  validateParameters(params: unknown): TParams {
    return this.schema.parse(params);
  }

  /**
   * Execute the tool with validated parameters
   */
  abstract execute(params: TParams): Promise<MCPToolResult>;

  /**
   * Install this tool with an MCP installer
   */
  install(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
    // Convert Zod schema to MCP format
    const mcpSchema = this.zodToMCPSchema(this.schema);
    
    installer(
      this.metadata.name,
      this.metadata.description,
      mcpSchema,
      async (params: unknown) => {
        const validatedParams = this.validateParameters(params);
        return await this.execute(validatedParams);
      }
    );
  }

  /**
   * Convert Zod schema to MCP schema format
   */
  private zodToMCPSchema(zodSchema: z.ZodType<any, any, any>): Record<string, any> {
    // This is a simplified conversion - could be enhanced
    // For now, we'll extract the shape from ZodObject
    if (zodSchema instanceof z.ZodObject) {
      const shape = zodSchema.shape;
      const mcpSchema: Record<string, any> = {};
      
      Object.entries(shape).forEach(([key, value]) => {
        if (value instanceof z.ZodString) {
          mcpSchema[key] = value;
        } else if (value instanceof z.ZodNumber) {
          mcpSchema[key] = value;
        } else if (value instanceof z.ZodBoolean) {
          mcpSchema[key] = value;
        } else if (value instanceof z.ZodOptional) {
          mcpSchema[key] = value;
        } else if (value instanceof z.ZodEnum) {
          mcpSchema[key] = value;
        } else {
          // Fallback for other types
          mcpSchema[key] = value;
        }
      });
      
      return mcpSchema;
    }
    
    // Fallback for non-object schemas
    return {};
  }
}

/**
 * Tool registry for managing all MCP tools
 */
export class MCPToolRegistry {
  private static instance: MCPToolRegistry;
  private tools: Map<MCPToolName, BaseMCPTool> = new Map();
  private aliases: Map<string, MCPToolName> = new Map();

  private constructor() {}

  static getInstance(): MCPToolRegistry {
    if (!MCPToolRegistry.instance) {
      MCPToolRegistry.instance = new MCPToolRegistry();
    }
    return MCPToolRegistry.instance;
  }

  /**
   * Register a tool
   */
  register(tool: BaseMCPTool): void {
    this.tools.set(tool.name, tool);
    
    // Register aliases for backward compatibility
    if (tool.metadata.aliases) {
      tool.metadata.aliases.forEach(alias => {
        this.aliases.set(alias, tool.name);
      });
    }
  }

  /**
   * Get a tool by name
   */
  getTool(name: MCPToolName | string): BaseMCPTool | undefined {
    // Try direct lookup first
    if (Object.values(MCPToolName).includes(name as MCPToolName)) {
      return this.tools.get(name as MCPToolName);
    }
    
    // Try alias lookup
    const aliasedName = this.aliases.get(name);
    if (aliasedName) {
      return this.tools.get(aliasedName);
    }
    
    return undefined;
  }

  /**
   * Get all tools
   */
  getAllTools(): BaseMCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: MCPToolCategory): BaseMCPTool[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }

  /**
   * Get all tool names
   */
  getAllToolNames(): MCPToolName[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool name is valid
   */
  isValidToolName(name: string): boolean {
    return this.getTool(name) !== undefined;
  }

  /**
   * Get tool names by category
   */
  getToolNamesByCategory(category: MCPToolCategory): MCPToolName[] {
    return this.getToolsByCategory(category).map(tool => tool.name);
  }

  /**
   * Install all tools with an MCP installer
   */
  installAll(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
    this.getAllTools().forEach(tool => {
      tool.install(installer);
    });
  }
}

/**
 * Utility functions
 */
export const ToolRegistry = MCPToolRegistry.getInstance();

/**
 * Helper function to check if a string is a valid tool name
 */
export function isValidMCPToolName(name: string): boolean {
  return ToolRegistry.isValidToolName(name);
}

/**
 * Helper function to get all tool names as array
 */
export function getAllMCPToolNames(): string[] {
  return Object.values(MCPToolName);
}
