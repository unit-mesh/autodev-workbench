import { z } from "zod";
import { BaseMCPTool, MCPToolName, MCPToolCategory, MCPToolResult } from "../base/tool-registry";
import { GitHubService } from "../../../services/github/github-service";
import { AnalysisService } from "../../../services/analysis/AnalysisService";
import { fetchUrlsFromIssue } from "../web-fetch-content";

/**
 * Parameters for GitHub Get Issue With Analysis tool
 */
export interface GitHubGetIssueWithAnalysisParams {
  owner: string;
  repo: string;
  issue_number: number;
  workspace_path?: string;
  analysis_mode?: "basic" | "full";
  fetch_urls?: boolean;
  include_file_content?: boolean;
  max_files?: number;
}

/**
 * GitHub Get Issue With Analysis Tool
 * Retrieve a GitHub issue with intelligent code analysis, finding related files, symbols, and APIs in your workspace
 */
export class GitHubGetIssueWithAnalysisTool extends BaseMCPTool<GitHubGetIssueWithAnalysisParams> {
  protected schema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    issue_number: z.number().describe("Issue number to analyze"),
    workspace_path: z.string().optional().describe("Path to the workspace to analyze (defaults to current directory)"),
    analysis_mode: z.enum(["basic", "full"]).optional().describe("Analysis depth: basic (context only) or full (complete analysis)"),
    fetch_urls: z.boolean().optional().describe("Whether to fetch content from URLs mentioned in the issue"),
    include_file_content: z.boolean().optional().describe("Whether to include file content in the analysis"),
    max_files: z.number().min(1).max(100).optional().describe("Maximum number of files to analyze (1-100)"),
  });

  constructor() {
    super({
      name: MCPToolName.GITHUB_GET_ISSUE_WITH_ANALYSIS,
      category: MCPToolCategory.GITHUB_ISSUE,
      description: "Retrieve a GitHub issue with intelligent code analysis, finding related files, symbols, and APIs in your workspace",
      aliases: ["github_analyze_issue", "github_get_issue_context", "github-issue-get"] // Backward compatibility
    });
  }

  async execute(params: GitHubGetIssueWithAnalysisParams): Promise<MCPToolResult> {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        return {
          content: [
            {
              type: "text",
              text: "Error: GITHUB_TOKEN environment variable is not set. Please set your GitHub personal access token."
            }
          ]
        };
      }

      const githubService = new GitHubService(githubToken);
      const analysisService = new AnalysisService();

      // Get the issue details
      const issue = await githubService.getIssue(params.owner, params.repo, params.issue_number);
      
      if (!issue) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Issue #${params.issue_number} not found in ${params.owner}/${params.repo}`
            }
          ]
        };
      }

      let result: any = {
        issue: {
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          user: issue.user?.login,
          labels: issue.labels.map(label => label.name),
          assignees: issue.assignees.map(assignee => assignee.login),
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          html_url: issue.html_url,
        },
        analysis: {
          mode: params.analysis_mode || "basic",
          workspace_path: params.workspace_path || process.cwd(),
        }
      };

      // Fetch URLs if requested
      if (params.fetch_urls && issue.body) {
        try {
          const urlContent = await fetchUrlsFromIssue(issue.body);
          if (urlContent.length > 0) {
            result.url_content = urlContent;
          }
        } catch (error) {
          result.url_fetch_error = `Failed to fetch URLs: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }

      // Perform code analysis if workspace path is provided
      if (params.workspace_path) {
        try {
          const analysisResult = await analysisService.analyzeIssue({
            issue,
            workspacePath: params.workspace_path,
            includeFileContent: params.include_file_content || false,
            maxFiles: params.max_files || 20,
            analysisDepth: params.analysis_mode === "full" ? "deep" : "shallow"
          });

          result.code_analysis = {
            relevant_files: analysisResult.relevantFiles,
            symbols_found: analysisResult.symbolsFound,
            api_usage: analysisResult.apiUsage,
            summary: analysisResult.summary,
            confidence_score: analysisResult.confidenceScore
          };

          if (params.include_file_content && analysisResult.fileContents) {
            result.file_contents = analysisResult.fileContents;
          }
        } catch (error) {
          result.analysis_error = `Code analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
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
            text: `Error analyzing GitHub issue: ${error.message}`
          }
        ]
      };
    }
  }
}

/**
 * Factory function for backward compatibility
 */
export function createGitHubGetIssueWithAnalysisTool(): GitHubGetIssueWithAnalysisTool {
  return new GitHubGetIssueWithAnalysisTool();
}

/**
 * Legacy installer function for backward compatibility
 */
export function installGitHubGetIssueWithAnalysisTool(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
  const tool = createGitHubGetIssueWithAnalysisTool();
  tool.install(installer);
}
