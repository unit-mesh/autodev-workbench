import { z } from "zod";
import { BaseMCPTool, MCPToolName, MCPToolCategory, MCPToolResult } from "../base/tool-registry";
import { GitHubService } from "../../../services/github/github-service";

/**
 * Parameters for GitHub Add Issue Comment tool
 */
export interface GitHubAddIssueCommentParams {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

/**
 * GitHub Add Issue Comment Tool
 * Add a comment to an existing GitHub issue with full markdown support for rich formatting
 */
export class GitHubAddIssueCommentTool extends BaseMCPTool<GitHubAddIssueCommentParams> {
  protected schema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    issue_number: z.number().describe("Issue number to comment on"),
    body: z.string().describe("Comment body in Markdown format"),
  });

  constructor() {
    super({
      name: MCPToolName.GITHUB_ADD_ISSUE_COMMENT,
      category: MCPToolCategory.GITHUB_ISSUE,
      description: "Add a comment to an existing GitHub issue with full markdown support for rich formatting",
      aliases: ["github-issue-comment"] // Backward compatibility
    });
  }

  async execute(params: GitHubAddIssueCommentParams): Promise<MCPToolResult> {
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

      // First, verify the issue exists
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

      // Add the comment
      const comment = await githubService.addIssueComment(params.owner, params.repo, params.issue_number, params.body);

      const result = {
        success: true,
        comment: {
          id: comment.id,
          body: comment.body,
          user: comment.user?.login,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          html_url: comment.html_url,
        },
        issue: {
          number: issue.number,
          title: issue.title,
          html_url: issue.html_url,
        },
        message: `Successfully added comment to issue #${params.issue_number}`
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
            text: `Error adding comment to GitHub issue: ${error.message}`
          }
        ]
      };
    }
  }
}

/**
 * Factory function for backward compatibility
 */
export function createGitHubAddIssueCommentTool(): GitHubAddIssueCommentTool {
  return new GitHubAddIssueCommentTool();
}

/**
 * Legacy installer function for backward compatibility
 */
export function installGitHubAddIssueCommentTool(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
  const tool = createGitHubAddIssueCommentTool();
  tool.install(installer);
}
