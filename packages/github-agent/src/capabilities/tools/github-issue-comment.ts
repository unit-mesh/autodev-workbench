import { ToolLike } from "../_typing";
import { z } from "zod";
import { GitHubService } from "../../services/github/github-service";

export const installGitHubAddIssueCommentTool: ToolLike = (installer) => {
  installer("github-add-issue-comment", "Add a comment to an existing GitHub issue with full markdown support for rich formatting", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    issue_number: z.number().describe("Issue number to comment on"),
    body: z.string().describe("Comment body (markdown supported)"),
  }, async ({ 
    owner, 
    repo, 
    issue_number,
    body
  }: { 
    owner: string; 
    repo: string; 
    issue_number: number;
    body: string;
  }) => {
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
      
      const commentData = await githubService.addIssueComment(owner, repo, issue_number, body);

      const result = {
        success: true,
        comment: {
          id: commentData.id,
          html_url: commentData.html_url,
          created_at: commentData.created_at,
          updated_at: commentData.updated_at,
        },
        issue: {
          number: issue_number,
          repository: `${owner}/${repo}`,
        },
        message: `Successfully added comment to issue #${issue_number}`
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
  });
};
