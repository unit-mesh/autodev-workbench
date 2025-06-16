import { ToolLike } from "../capabilities/_typing";
import { ToolDefinition, ToolResult } from "./tool-definition";

export class ToolPromptBuilder {
  private tools: ToolDefinition[] = [];

  /**
   * Register available tools
   */
  registerTools(tools: ToolDefinition[]): void {
    this.tools = tools;
  }

  /**
   * Build tool-related part of system prompt
   */
  buildToolSystemPrompt(): string {
    return `In this environment you have access to a set of tools you can use to answer the user's question.

## 🎯 CRITICAL TOOL SELECTION GUIDELINES:

If the USER's task is general or you already know the answer, just respond without calling tools.
Follow these rules regarding tool calls:
1. ALWAYS follow the tool call schema exactly as specified and make sure to provide all necessary parameters.
2. The conversation may reference tools that are no longer available. NEVER call tools that are not explicitly provided.
3. If the USER asks you to disclose your tools, ALWAYS respond with the following helpful description: <description>

## RECOMMENDED TOOL COMBINATIONS Example:

- GitHub issues: github-analyze-issue + google-search + search-keywords + read-file
- Code understanding: analyze-basic-context + grep-search + read-file + google-search
- Implementation tasks: search-keywords + analyze-basic-context + read-file
- **External API integration: google-search + read-file + analyze-basic-context**
- **Unknown technology research: google-search + search-keywords + read-file**
- **Latest development trends: google-search + analyze-basic-context**

Here are the functions available in JSONSchema format:
<functions>
${this.tools.map(tool => JSON.stringify(tool, null, 2)).join('\n')}
</functions>

Answer the user's request using the relevant tool(s), if they are available. Check that all the required parameters for each tool call are provided or can reasonably be inferred from context. IF there are no relevant tools or there are missing values for required parameters, ask the user to supply these values; otherwise proceed with the tool calls. If the user provides a specific value for a parameter (for example provided in quotes), make sure to use that value EXACTLY. DO NOT make up values for or ask about optional parameters. Carefully analyze descriptive terms in the request as they may indicate required parameter values that should be included even if not explicitly quoted.

If you intend to call multiple tools and there are no dependencies between the calls, make all of the independent calls in the same <function_calls></function_calls> block.

You can use tools by writing a "<function_calls>" inside markdown code-block like the following as part of your reply to the user:

\`\`\`xml
<function_calls>
<invoke name="FUNCTION_NAME">
<parameter name="PARAMETER_NAME">PARAMETER_VALUE</parameter>
...
</invoke>
<invoke name="FUNCTION_NAME2">
...
</invoke>
</function_calls>
\`\`\`

String and scalar parameters should be specified as is, while lists and objects should use JSON format. You
Should always return with XML code block with <function_calls> tag when calling tools.`;
  }

  buildToolUserPrompt(round: number): string {
    if (round === 1) {
      return `## Analysis Approach:
To provide a comprehensive response, consider using multiple tools to gather complete information:

1. **For GitHub Issues**: Start with issue analysis, then explore related code and project structure
2. **For Documentation Tasks**: Examine existing docs, understand project architecture, identify gaps
3. **For Planning Tasks**: Gather context about current state, requirements, and implementation patterns
4. **For External Knowledge**: Use google-search when you need information about technologies, APIs, or concepts not found in the local codebase

Remember that google-search is extremely valuable when:
- You encounter unfamiliar technologies or terms
- You need information about external APIs or libraries
- You're researching best practices or standards
- Local codebase information is insufficient

Take a thorough, multi-step approach to ensure your analysis and recommendations are well-informed and actionable.`;
    }

    return `## Next Steps Guidance:
Based on the previous results, determine what additional analysis would strengthen your response:

- **If gaps remain**: Use targeted tools to fill missing information
- **If context is shallow**: Dive deeper into specific areas (code structure, existing docs, implementation patterns)
- **If external knowledge is needed**: Use google-search to research technologies, APIs, or concepts not explained in the codebase
- **If ready for synthesis**: Provide comprehensive final analysis with actionable recommendations

Remember: Thorough investigation leads to better recommendations. Only conclude when you have sufficient depth of understanding.`;
  }

  /**
   * Extract tool definitions from tool installers
   */
  static extractToolDefinitions(toolInstallers: readonly ToolLike[]): ToolDefinition[] {
    const tools: ToolDefinition[] = [];

    const mockInstaller = (
      name: string,
      description: string,
      inputSchema: Record<string, any>,
      handler: any
    ) => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, zodType] of Object.entries(inputSchema)) {
        try {
          properties[key] = ToolPromptBuilder.zodToJsonSchema(zodType);

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

  buildToolResultsSummary(successfulResults: ToolResult[]): string {
    return successfulResults
      .map(result => {
        const toolName = result.functionCall.name;
        let content = '';
        let sources = '';

        if (result.result?.content && Array.isArray(result.result.content)) {
          const textContent = result.result.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('\n');
          content = textContent;
        } else if (result.result?.content) {
          content = String(result.result.content);
        }

        // Extract sources from tool results
        sources = ToolPromptBuilder.extractSourcesFromToolResult(result);

        return `## ${toolName} (Round ${result.round})
${content}
${sources ? `\n**Sources:** ${sources}` : ''}`;
      })
      .join('\n\n');
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
            items: ToolPromptBuilder.zodToJsonSchema(zodType._def?.type),
            description
          };
        case 'ZodObject': {
          const properties: Record<string, any> = {};
          const shape = zodType._def?.shape?.() || {};
          for (const [key, value] of Object.entries(shape)) {
            properties[key] = ToolPromptBuilder.zodToJsonSchema(value);
          }
          return { type: 'object', properties, description };
        }
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

  /**
   * Extract sources from tool result
   */
  static extractSourcesFromToolResult(result: ToolResult): string {
    const toolName = result.functionCall.name;
    const sources: string[] = [];

    // Extract file paths from file-related tools
    if (toolName.includes('read-file') || toolName.includes('grep-search') || toolName.includes('analyze-basic-context')) {
      const params = result.functionCall.parameters;
      if (params.target_file || params.file_path) {
        sources.push(`File: ${params.target_file || params.file_path}`);
      }
      if (params.target_directories && Array.isArray(params.target_directories)) {
        sources.push(`Directories: ${params.target_directories.join(', ')}`);
      }
    }

    // Extract URLs from web search tools
    if (toolName.includes('google-search') || toolName.includes('extract-webpage')) {
      const params = result.functionCall.parameters;
      if (params.url) {
        sources.push(`Web: ${params.url}`);
      }
      if (params.search_term) {
        sources.push(`Search: "${params.search_term}"`);
      }
    }

    // Extract GitHub URLs from GitHub tools
    if (toolName.includes('github-')) {
      const params = result.functionCall.parameters;
      if (params.issue_url) {
        sources.push(`GitHub Issue: ${params.issue_url}`);
      }
      if (params.repo_url) {
        sources.push(`GitHub Repo: ${params.repo_url}`);
      }
    }

    // Extract project paths from analysis tools
    if (toolName.includes('analyze-') || toolName.includes('list-directory')) {
      const params = result.functionCall.parameters;
      if (params.workspace_path || params.directory_path) {
        sources.push(`Project: ${params.workspace_path || params.directory_path}`);
      }
    }

    return sources.join(', ');
  }
}
