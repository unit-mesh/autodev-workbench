import { ToolLike } from "../_typing";
import { z } from "zod";
import { GitHubService } from "../../services/github/github-service";

export const installGitHubIssueListTool: ToolLike = (installer) => {
  installer("github-issue-list", "List GitHub issues from a repository", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    state: z.enum(["open", "closed", "all"]).optional().describe("State of issues to retrieve"),
    labels: z.string().optional().describe("Comma-separated list of label names to filter by"),
    assignee: z.string().optional().describe("Username of the assignee to filter by"),
    since: z.string().optional().describe("Only issues updated at or after this time (ISO 8601 format)"),
    per_page: z.number().min(1).max(100).optional().describe("Number of issues per page (1-100)"),
    page: z.number().min(1).optional().describe("Page number to retrieve"),
  }, async ({ 
    owner, 
    repo, 
    state = "open", 
    labels, 
    assignee, 
    since, 
    per_page = 30, 
    page = 1 
  }: { 
    owner: string; 
    repo: string; 
    state?: "open" | "closed" | "all"; 
    labels?: string;
    assignee?: string;
    since?: string;
    per_page?: number;
    page?: number;
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
      
      const issues = await githubService.getIssues(owner, repo, {
        state,
        labels,
        assignee,
        since,
        per_page,
        page,
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
              repository: `${owner}/${repo}`,
              total_issues: issues.length,
              page: page,
              per_page: per_page,
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
  });
};
