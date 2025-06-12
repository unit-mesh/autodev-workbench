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
   * Create a new GitHub issue
   * @param owner Repository owner
   * @param repo Repository name
   * @param issueData Issue data
   * @returns Created issue data
   */
  async createIssue(
    owner: string,
    repo: string,
    issueData: {
      title: string;
      body?: string;
      labels?: string[];
      assignees?: string[];
      milestone?: number;
    }
  ): Promise<GitHubIssue> {
    try {
      const { data } = await this.octokit.issues.create({
        owner,
        repo,
        title: issueData.title,
        body: issueData.body,
        labels: issueData.labels,
        assignees: issueData.assignees,
        milestone: issueData.milestone,
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body,
        state: data.state as 'open' | 'closed',
        user: data.user ? {
          login: data.user.login,
          id: data.user.id,
        } : null,
        labels: data.labels.map(label => ({
          id: typeof label === 'string' ? 0 : label.id || 0,
          name: typeof label === 'string' ? label : label.name || '',
          color: typeof label === 'string' ? '' : label.color || '',
          description: typeof label === 'string' ? '' : label.description || '',
        })),
        assignees: data.assignees?.map(assignee => ({
          login: assignee.login,
          id: assignee.id,
        })) || [],
        milestone: data.milestone ? {
          number: data.milestone.number,
          title: data.milestone.title,
        } : undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
        closed_at: data.closed_at,
        html_url: data.html_url,
      };
    } catch (error: any) {
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }
}
