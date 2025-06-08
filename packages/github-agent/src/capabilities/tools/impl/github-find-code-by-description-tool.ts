import { z } from "zod";
import { BaseMCPTool, MCPToolName, MCPToolCategory, MCPToolResult } from "../base/tool-registry";
import { AnalysisService } from "../../../services/analysis/AnalysisService";

/**
 * Parameters for GitHub Find Code By Description tool
 */
export interface GitHubFindCodeByDescriptionParams {
  owner: string;
  repo: string;
  query: string;
  workspace_path?: string;
  search_depth?: "shallow" | "medium" | "deep";
  max_results?: number;
  include_file_content?: boolean;
}

/**
 * GitHub Find Code By Description Tool
 * Find relevant code files and functions by describing what you're looking for in natural language, using AI-powered semantic search
 */
export class GitHubFindCodeByDescriptionTool extends BaseMCPTool<GitHubFindCodeByDescriptionParams> {
  protected schema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    query: z.string().describe("Natural language description of what you're looking for (e.g., 'authentication logic', 'database connection code', 'error handling for API calls')"),
    workspace_path: z.string().optional().describe("Path to the workspace to search (defaults to current directory)"),
    search_depth: z.enum(["shallow", "medium", "deep"]).optional().describe("Search depth: shallow (file names), medium (symbols), deep (content analysis)"),
    max_results: z.number().min(1).max(50).optional().describe("Maximum number of results to return (1-50)"),
    include_file_content: z.boolean().optional().describe("Whether to include file content snippets in results"),
  });

  constructor() {
    super({
      name: MCPToolName.GITHUB_FIND_CODE_BY_DESCRIPTION,
      category: MCPToolCategory.GITHUB_ANALYSIS,
      description: "Find relevant code files and functions by describing what you're looking for in natural language, using AI-powered semantic search",
      aliases: ["github_smart_search", "github-search-smart"] // Backward compatibility
    });
  }

  async execute(params: GitHubFindCodeByDescriptionParams): Promise<MCPToolResult> {
    try {
      const analysisService = new AnalysisService();
      const workspacePath = params.workspace_path || process.cwd();

      // Perform intelligent code search
      const searchResult = await analysisService.smartSearch({
        query: params.query,
        workspacePath,
        searchDepth: params.search_depth || "medium",
        maxResults: params.max_results || 20,
        includeFileContent: params.include_file_content || false,
        repositoryContext: {
          owner: params.owner,
          repo: params.repo,
        }
      });

      const result = {
        query: params.query,
        repository: `${params.owner}/${params.repo}`,
        workspace_path: workspacePath,
        search_depth: params.search_depth || "medium",
        total_results: searchResult.results.length,
        results: searchResult.results.map(item => ({
          file_path: item.filePath,
          relevance_score: item.relevanceScore,
          match_type: item.matchType, // 'filename', 'symbol', 'content'
          matches: item.matches.map(match => ({
            line_number: match.lineNumber,
            content: match.content,
            context: match.context,
            symbol_name: match.symbolName,
            symbol_type: match.symbolType,
          })),
          file_summary: item.summary,
          ...(params.include_file_content && item.fileContent ? {
            file_content: item.fileContent
          } : {})
        })),
        search_metadata: {
          keywords_generated: searchResult.metadata.keywordsGenerated,
          search_strategies_used: searchResult.metadata.searchStrategiesUsed,
          total_files_scanned: searchResult.metadata.totalFilesScanned,
          execution_time_ms: searchResult.metadata.executionTimeMs,
        },
        suggestions: searchResult.suggestions || []
      };

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
            text: `Error searching code: ${error.message}`
          }
        ]
      };
    }
  }
}

/**
 * Factory function for backward compatibility
 */
export function createGitHubFindCodeByDescriptionTool(): GitHubFindCodeByDescriptionTool {
  return new GitHubFindCodeByDescriptionTool();
}

/**
 * Legacy installer function for backward compatibility
 */
export function installGitHubFindCodeByDescriptionTool(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
  const tool = createGitHubFindCodeByDescriptionTool();
  tool.install(installer);
}
