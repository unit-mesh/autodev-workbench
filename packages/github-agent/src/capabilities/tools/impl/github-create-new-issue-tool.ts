import { z } from "zod";
import { BaseMCPTool, MCPToolName, MCPToolCategory, MCPToolResult } from "../base/tool-registry";
import { GitHubService } from "../../../services/github/github-service";

/**
 * Parameters for GitHub Create New Issue tool
 */
export interface GitHubCreateNewIssueParams {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

/**
 * GitHub Create New Issue Tool
 * Create a new GitHub issue with title, description, labels, assignees, and milestone assignment
 */
export class GitHubCreateNewIssueTool extends BaseMCPTool<GitHubCreateNewIssueParams> {
  protected schema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    title: z.string().describe("Issue title"),
    body: z.string().optional().describe("Issue description/body in Markdown format"),
    labels: z.array(z.string()).optional().describe("Array of label names to assign to the issue"),
    assignees: z.array(z.string()).optional().describe("Array of usernames to assign to the issue"),
    milestone: z.number().optional().describe("Milestone number to assign to the issue"),
  });

  constructor() {
    super({
      name: MCPToolName.GITHUB_CREATE_NEW_ISSUE,
      category: MCPToolCategory.GITHUB_ISSUE,
      description: "Create a new GitHub issue with title, description, labels, assignees, and milestone assignment",
      aliases: ["github-issue-create"] // Backward compatibility
    });
  }

  async execute(params: GitHubCreateNewIssueParams): Promise<MCPToolResult> {
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

      // Create the issue
      const newIssue = await githubService.createIssue(params.owner, params.repo, {
        title: params.title,
        body: params.body,
        labels: params.labels,
        assignees: params.assignees,
        milestone: params.milestone,
      });

      const result = {
        success: true,
        issue: {
          number: newIssue.number,
          title: newIssue.title,
          body: newIssue.body,
          state: newIssue.state,
          user: newIssue.user?.login,
          labels: newIssue.labels.map(label => label.name),
          assignees: newIssue.assignees.map(assignee => assignee.login),
          milestone: newIssue.milestone ? {
            number: newIssue.milestone.number,
            title: newIssue.milestone.title,
          } : null,
          created_at: newIssue.created_at,
          updated_at: newIssue.updated_at,
          html_url: newIssue.html_url,
        },
        message: `Successfully created issue #${newIssue.number}: ${newIssue.title}`
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
            text: `Error creating GitHub issue: ${error.message}`
          }
        ]
      };
    }
  }
}

/**
 * Factory function for backward compatibility
 */
export function createGitHubCreateNewIssueTool(): GitHubCreateNewIssueTool {
  return new GitHubCreateNewIssueTool();
}

/**
 * Legacy installer function for backward compatibility
 */
export function installGitHubCreateNewIssueTool(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
  const tool = createGitHubCreateNewIssueTool();
  tool.install(installer);
}
