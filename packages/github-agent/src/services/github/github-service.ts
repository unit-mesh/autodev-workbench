import { Octokit } from "@octokit/rest";
import { GitHubIssue } from "../../types/index";

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getIssues(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      labels?: string;
      assignee?: string;
      since?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubIssue[]> {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: options.state || 'open',
        labels: options.labels,
        assignee: options.assignee,
        since: options.since,
        per_page: options.per_page || 30,
        page: options.page || 1,
      });

      return data.map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state as 'open' | 'closed',
        user: issue.user ? {
          login: issue.user.login,
          id: issue.user.id,
        } : null,
        labels: issue.labels.map(label => ({
          id: typeof label === 'object' && label !== null && 'id' in label ? label.id : 0,
          name: typeof label === 'string' ? label : (label as any).name || '',
          color: typeof label === 'object' && label !== null && 'color' in label ? (label as any).color : '',
          description: typeof label === 'object' && label !== null && 'description' in label ? (label as any).description : null,
        })),
        assignees: issue.assignees?.map(assignee => ({
          login: assignee.login,
          id: assignee.id,
        })) || [],
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at,
        html_url: issue.html_url,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch issues: ${error.message}`);
    }
  }

  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    try {
      const { data: issue } = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body || null,
        state: issue.state as 'open' | 'closed',
        user: issue.user ? {
          login: issue.user.login,
          id: issue.user.id,
        } : null,
        labels: issue.labels.map(label => ({
          id: typeof label === 'object' && label !== null && 'id' in label ? label.id : 0,
          name: typeof label === 'string' ? label : (label as any).name || '',
          color: typeof label === 'object' && label !== null && 'color' in label ? (label as any).color : '',
          description: typeof label === 'object' && label !== null && 'description' in label ? (label as any).description : null,
        })),
        assignees: issue.assignees?.map(assignee => ({
          login: assignee.login,
          id: assignee.id,
        })) || [],
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at,
        html_url: issue.html_url,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch issue #${issueNumber}: ${error.message}`);
    }
  }

  async getRepositoryInfo(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        language: data.language,
        default_branch: data.default_branch,
        html_url: data.html_url,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch repository info: ${error.message}`);
    }
  }

  /**
   * Add a comment to a GitHub issue
   * @param owner Repository owner
   * @param repo Repository name
   * @param issueNumber Issue number
   * @param body Comment body (markdown supported)
   * @returns Comment data
   */
  async addIssueComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<{
    id: number;
    html_url: string;
    created_at: string;
    updated_at: string;
  }> {
    try {
      const { data } = await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      });

      return {
        id: data.id,
        html_url: data.html_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error: any) {
      throw new Error(`Failed to add comment to issue #${issueNumber}: ${error.message}`);
    }
  }

  /**
   * Get comments for a GitHub issue
   * @param owner Repository owner
   * @param repo Repository name
   * @param issueNumber Issue number
   * @returns Array of comments
   */
  async getIssueComments(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<Array<{
    id: number;
    body: string;
    user: { login: string; id: number } | null;
    created_at: string;
    updated_at: string;
    html_url: string;
  }>> {
    try {
      const { data } = await this.octokit.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return data.map(comment => ({
        id: comment.id,
        body: comment.body || '',
        user: comment.user ? {
          login: comment.user.login,
          id: comment.user.id,
        } : null,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        html_url: comment.html_url,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch comments for issue #${issueNumber}: ${error.message}`);
    }
  }
}
