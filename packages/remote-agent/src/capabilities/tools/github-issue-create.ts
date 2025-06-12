import { ToolLike } from "../_typing";
import { z } from "zod";
import { GitHubService } from "../../services/github";

export const installGitHubCreateNewIssueTool: ToolLike = (installer) => {
  installer("github-create-new-issue", "Create a new GitHub issue with title, description, labels, assignees, and milestone assignment", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    title: z.string().describe("Issue title"),
    body: z.string().optional().describe("Issue body/description (markdown supported)"),
    labels: z.array(z.string()).optional().describe("Array of label names to add to the issue"),
    assignees: z.array(z.string()).optional().describe("Array of usernames to assign to the issue"),
    milestone: z.number().optional().describe("Milestone number to associate with the issue"),
  }, async ({
    owner,
    repo,
    title,
    body,
    labels,
    assignees,
    milestone
  }: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
    milestone?: number;
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

      const issueData = await githubService.createIssue(owner, repo, {
        title,
        body,
        labels,
        assignees,
        milestone
      });

      const result = {
        success: true,
        issue: {
          number: issueData.number,
          title: issueData.title,
          body: issueData.body,
          state: issueData.state,
          user: issueData.user?.login,
          labels: issueData.labels.map(label => ({
            name: label.name,
            color: label.color,
            description: label.description,
          })),
          assignees: issueData.assignees.map(assignee => assignee.login),
          milestone: issueData.milestone ? {
            number: issueData.milestone.number,
            title: issueData.milestone.title,
          } : null,
          created_at: issueData.created_at,
          updated_at: issueData.updated_at,
          html_url: issueData.html_url,
        },
        repository: `${owner}/${repo}`,
        message: `Successfully created issue #${issueData.number}: ${issueData.title}`
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
  });
};
