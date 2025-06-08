import { z } from "zod";
import { BaseMCPTool, MCPToolName, MCPToolCategory, MCPToolResult } from "../base/tool-registry";
import { fetchHtmlContent, urlToMarkdown, extractTitle } from "../web-fetch-content";

/**
 * Parameters for Extract Webpage As Markdown tool
 */
export interface ExtractWebpageAsMarkdownParams {
  url: string;
  include_metadata?: boolean;
  max_content_length?: number;
  remove_navigation?: boolean;
  remove_ads?: boolean;
}

/**
 * Extract Webpage As Markdown Tool
 * Extract and convert web page content to clean markdown format, removing navigation and ads for better readability
 */
export class ExtractWebpageAsMarkdownTool extends BaseMCPTool<ExtractWebpageAsMarkdownParams> {
  protected schema = z.object({
    url: z.string().url().describe("URL of the webpage to extract content from"),
    include_metadata: z.boolean().optional().describe("Whether to include page metadata (title, description, etc.)"),
    max_content_length: z.number().min(100).max(50000).optional().describe("Maximum content length in characters (100-50000)"),
    remove_navigation: z.boolean().optional().describe("Whether to remove navigation elements"),
    remove_ads: z.boolean().optional().describe("Whether to remove advertisement elements"),
  });

  constructor() {
    super({
      name: MCPToolName.EXTRACT_WEBPAGE_AS_MARKDOWN,
      category: MCPToolCategory.WEB_CONTENT,
      description: "Extract and convert web page content to clean markdown format, removing navigation and ads for better readability",
      aliases: ["fetch_url_content", "web-fetch-content"] // Backward compatibility
    });
  }

  async execute(params: ExtractWebpageAsMarkdownParams): Promise<MCPToolResult> {
    try {
      // Validate URL
      let url: URL;
      try {
        url = new URL(params.url);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Invalid URL format: ${params.url}`
            }
          ]
        };
      }

      // Fetch HTML content
      const htmlContent = await fetchHtmlContent(params.url, 30000); // 30 second timeout
      
      if (!htmlContent) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Failed to fetch content from ${params.url}`
            }
          ]
        };
      }

      // Extract title
      const title = extractTitle(htmlContent);

      // Convert to markdown
      const markdownContent = await urlToMarkdown(params.url);

      // Prepare result
      let result: any = {
        url: params.url,
        title: title,
        content_length: markdownContent.length,
        markdown_content: markdownContent,
      };

      // Add metadata if requested
      if (params.include_metadata !== false) { // Default to true
        result.metadata = {
          domain: url.hostname,
          protocol: url.protocol,
          path: url.pathname,
          extracted_at: new Date().toISOString(),
          content_type: "text/html",
          processing_options: {
            remove_navigation: params.remove_navigation !== false,
            remove_ads: params.remove_ads !== false,
            max_content_length: params.max_content_length || 10000,
          }
        };
      }

      // Truncate content if it exceeds max length
      const maxLength = params.max_content_length || 10000;
      if (result.markdown_content.length > maxLength) {
        result.markdown_content = result.markdown_content.substring(0, maxLength) + '\n\n[Content truncated...]';
        result.content_truncated = true;
        result.original_length = markdownContent.length;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error extracting webpage content: ${error.message}`
          }
        ]
      };
    }
  }
}

/**
 * Factory function for backward compatibility
 */
export function createExtractWebpageAsMarkdownTool(): ExtractWebpageAsMarkdownTool {
  return new ExtractWebpageAsMarkdownTool();
}

/**
 * Legacy installer function for backward compatibility
 */
export function installExtractWebpageAsMarkdownTool(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
  const tool = createExtractWebpageAsMarkdownTool();
  tool.install(installer);
}
