import { z } from "zod";
import { BaseMCPTool, MCPToolName, MCPToolCategory, MCPToolResult } from "../base/tool-registry";
import { GitHubService } from "../../../services/github/github-service";

/**
 * Parameters for GitHub List Repository Issues tool
 */
export interface GitHubListRepositoryIssuesParams {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  labels?: string;
  assignee?: string;
  since?: string;
  per_page?: number;
  page?: number;
}

/**
 * GitHub List Repository Issues Tool
 * Browse and filter issues in a GitHub repository with support for pagination, labels, assignees, and date filtering
 */
export class GitHubListRepositoryIssuesTool extends BaseMCPTool<GitHubListRepositoryIssuesParams> {
  protected schema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    state: z.enum(["open", "closed", "all"]).optional().describe("State of issues to retrieve"),
    labels: z.string().optional().describe("Comma-separated list of label names to filter by"),
    assignee: z.string().optional().describe("Username of the assignee to filter by"),
    since: z.string().optional().describe("Only issues updated at or after this time (ISO 8601 format)"),
    per_page: z.number().min(1).max(100).optional().describe("Number of issues per page (1-100)"),
    page: z.number().min(1).optional().describe("Page number to retrieve"),
  });

  constructor() {
    super({
      name: MCPToolName.GITHUB_LIST_REPOSITORY_ISSUES,
      category: MCPToolCategory.GITHUB_ISSUE,
      description: "Browse and filter issues in a GitHub repository with support for pagination, labels, assignees, and date filtering",
      aliases: ["github_get_issues", "github-issue-list"] // Backward compatibility
    });
  }

  async execute(params: GitHubListRepositoryIssuesParams): Promise<MCPToolResult> {
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
      
      const issues = await githubService.getIssues(params.owner, params.repo, {
        state: params.state || "open",
        labels: params.labels,
        assignee: params.assignee,
        since: params.since,
        per_page: params.per_page || 30,
        page: params.page || 1,
      });

      const issuesData = issues.map(issue => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        user: issue.user?.login,
        labels: issue.labels.map(label => label.name),
        assignees: issue.assignees.map(assignee => assignee.login),
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        html_url: issue.html_url,
        body_preview: issue.body ? issue.body.substring(0, 200) + (issue.body.length > 200 ? "..." : "") : null,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              repository: `${params.owner}/${params.repo}`,
              total_issues: issues.length,
              page: params.page || 1,
              per_page: params.per_page || 30,
              issues: issuesData
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching GitHub issues: ${error.message}`
          }
        ]
      };
    }
  }
}

/**
 * Factory function for backward compatibility
 */
export function createGitHubListRepositoryIssuesTool(): GitHubListRepositoryIssuesTool {
  return new GitHubListRepositoryIssuesTool();
}

/**
 * Legacy installer function for backward compatibility
 */
export function installGitHubListRepositoryIssuesTool(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
  const tool = createGitHubListRepositoryIssuesTool();
  tool.install(installer);
}
