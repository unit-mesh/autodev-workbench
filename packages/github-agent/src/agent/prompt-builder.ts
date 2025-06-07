/**
 * Prompt Builder for AI Agent
 * Constructs prompts for LLM to generate MCP tool calls
 */

import { ToolLike } from "../capabilities/_typing";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

export class PromptBuilder {
  private tools: ToolDefinition[] = [];

  /**
   * Register available tools from MCP capabilities
   */
  registerTools(tools: ToolDefinition[]): void {
    this.tools = tools;
  }

  /**
   * Build the system prompt with available tools
   */
  buildSystemPrompt(): string {
    const toolsJson = JSON.stringify(this.tools, null, 2);
    
    return `In this environment you have access to a set of tools you can use to answer the user's question.
You can invoke functions by writing a "<function_calls>" block like the following as part of your reply to the user:
<function_calls>
<invoke name="$FUNCTION_NAME">
<parameter name="$PARAMETER_NAME">$PARAMETER_VALUE</parameter>
...
</invoke>
<invoke name="$FUNCTION_NAME2">
...
</invoke>
</function_calls>

String and scalar parameters should be specified as is, while lists and objects should use JSON format.

Here are the functions available in JSONSchema format:
<functions>
${this.tools.map(tool => JSON.stringify(tool, null, 2)).join('\n')}
</functions>

You are an AI Agent specialized in GitHub issue analysis and code context understanding. You have access to powerful tools for:
- Fetching and analyzing GitHub issues
- Searching and analyzing code repositories
- Generating comprehensive analysis reports
- Uploading analysis results

Always invoke a function call in response to user queries. If there is any information missing for filling in a REQUIRED parameter, make your best guess for the parameter value based on the query context. If you cannot come up with any reasonable guess, fill the missing value in as <UNKNOWN>. Do not fill in optional parameters if they are not specified by the user.

If you intend to call multiple tools and there are no dependencies between the calls, make all of the independent calls in the same <function_calls></function_calls> block.

When analyzing GitHub issues:
1. First fetch the issue details if not provided
2. Analyze the issue content for technical keywords and context
3. Search for relevant code files and symbols
4. Generate a comprehensive analysis report
5. Provide actionable insights and recommendations

Be thorough, accurate, and helpful in your analysis.`;
  }

  /**
   * Build user prompt with context
   */
  buildUserPrompt(userInput: string, context?: any): string {
    let prompt = userInput;
    
    if (context) {
      prompt = `Context: ${JSON.stringify(context, null, 2)}\n\nUser Request: ${userInput}`;
    }
    
    return prompt;
  }

  /**
   * Extract tool definitions from MCP tool installers
   */
  static extractToolDefinitions(toolInstallers: readonly ToolLike[]): ToolDefinition[] {
    const tools: ToolDefinition[] = [];

    // Mock installer to capture tool definitions
    const mockInstaller = (
      name: string,
      description: string,
      inputSchema: Record<string, any>,
      handler: any
    ) => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      // Convert Zod schema to JSON Schema (simplified)
      for (const [key, zodType] of Object.entries(inputSchema)) {
        try {
          properties[key] = PromptBuilder.zodToJsonSchema(zodType);

          // Simple required check - assume all are required unless explicitly optional
          if (zodType && typeof zodType === 'object' && !zodType.isOptional) {
            required.push(key);
          }
        } catch (error) {
          // Fallback for complex types
          properties[key] = { type: 'string', description: `Parameter ${key}` };
          required.push(key);
        }
      }

      tools.push({
        name,
        description,
        parameters: {
          type: "object",
          properties,
          required
        }
      });
    };

    // Execute tool installers to capture definitions
    toolInstallers.forEach(installer => {
      try {
        installer(mockInstaller);
      } catch (error) {
        console.warn(`Failed to extract tool definition:`, error);
      }
    });

    return tools;
  }

  /**
   * Convert Zod type to JSON Schema (simplified)
   */
  private static zodToJsonSchema(zodType: any): any {
    // Simplified conversion with better error handling
    try {
      const typeName = zodType?._def?.typeName;
      const description = zodType?.description || '';

      switch (typeName) {
        case 'ZodString':
          return { type: 'string', description };
        case 'ZodNumber':
          return { type: 'number', description };
        case 'ZodBoolean':
          return { type: 'boolean', description };
        case 'ZodArray':
          return {
            type: 'array',
            items: PromptBuilder.zodToJsonSchema(zodType._def?.type),
            description
          };
        case 'ZodObject':
          const properties: Record<string, any> = {};
          const shape = zodType._def?.shape?.() || {};
          for (const [key, value] of Object.entries(shape)) {
            properties[key] = PromptBuilder.zodToJsonSchema(value);
          }
          return { type: 'object', properties, description };
        case 'ZodEnum':
          return {
            type: 'string',
            enum: zodType._def?.values || [],
            description
          };
        default:
          // Fallback for unknown types
          return { type: 'string', description: description || 'Parameter' };
      }
    } catch (error) {
      // Safe fallback
      return { type: 'string', description: 'Parameter' };
    }
  }
}
