/**
 * GitHub Platform Service Implementation
 * 
 * Implements the IPlatformService interface for GitHub
 */

import { Octokit } from "@octokit/rest";
import { BasePlatformService } from '../base/BasePlatformService';
import { 
  PlatformConfig,
  PlatformIssue,
  PlatformRepository,
  PlatformComment,
  IssueQueryOptions,
  PlatformUser,
  PlatformLabel
} from '../interfaces/IPlatformService';

export class GitHubPlatformService extends BasePlatformService {
  private octokit: Octokit;

  constructor(config: PlatformConfig) {
    super(config);
    this.octokit = new Octokit({
      auth: config.token,
      baseUrl: config.baseUrl || 'https://api.github.com'
    });
  }

  async getRepository(owner: string, repo: string): Promise<PlatformRepository> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      
      return {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        language: data.language,
        defaultBranch: data.default_branch,
        url: data.html_url,
        platform: 'github'
      };
    } catch (error) {
      this.handleError(error, 'repository fetch');
    }
  }

  async getIssues(owner: string, repo: string, options: IssueQueryOptions = {}): Promise<PlatformIssue[]> {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: options.state === 'all' ? 'all' : this.mapFromGenericState(options.state || 'open') as 'open' | 'closed',
        labels: options.labels?.join(','),
        assignee: options.assignee,
        creator: options.author,
        since: options.since,
        per_page: options.perPage || 30,
        page: options.page || 1,
        sort: options.sortBy === 'priority' ? 'created' : options.sortBy || 'created',
        direction: options.sortOrder || 'desc'
      });

      return data.map(issue => this.mapToGenericIssue(issue));
    } catch (error) {
      this.handleError(error, 'issues fetch');
    }
  }

  async getIssue(owner: string, repo: string, issueId: string | number): Promise<PlatformIssue> {
    try {
      const issueNumber = typeof issueId === 'string' ? parseInt(issueId) : issueId;
      const { data } = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });

      return this.mapToGenericIssue(data);
    } catch (error) {
      this.handleError(error, `issue #${issueId} fetch`);
    }
  }

  async getIssueComments(owner: string, repo: string, issueId: string | number): Promise<PlatformComment[]> {
    try {
      const issueNumber = typeof issueId === 'string' ? parseInt(issueId) : issueId;
      const { data } = await this.octokit.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber
      });

      return data.map(comment => ({
        id: comment.id,
        body: comment.body || '',
        author: comment.user ? {
          id: comment.user.id,
          login: comment.user.login,
          displayName: comment.user.name || comment.user.login,
          email: comment.user.email || undefined,
          avatarUrl: comment.user.avatar_url
        } : null,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        url: comment.html_url
      }));
    } catch (error) {
      this.handleError(error, `comments fetch for issue #${issueId}`);
    }
  }

  async addIssueComment(owner: string, repo: string, issueId: string | number, body: string): Promise<PlatformComment> {
    try {
      const issueNumber = typeof issueId === 'string' ? parseInt(issueId) : issueId;
      const { data } = await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body
      });

      return {
        id: data.id,
        body: data.body || '',
        author: data.user ? {
          id: data.user.id,
          login: data.user.login,
          displayName: data.user.name || data.user.login,
          email: data.user.email || undefined,
          avatarUrl: data.user.avatar_url
        } : null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        url: data.html_url
      };
    } catch (error) {
      this.handleError(error, `comment creation for issue #${issueId}`);
    }
  }

  parseIssueUrl(url: string): { owner: string; repo: string; issueId: string | number } | null {
    const githubIssueRegex = /github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/;
    const match = url.match(githubIssueRegex);
    
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        issueId: parseInt(match[3])
      };
    }
    
    return null;
  }

  buildIssueUrl(owner: string, repo: string, issueId: string | number): string {
    const baseUrl = this.config.baseUrl?.replace('/api/v3', '') || 'https://github.com';
    return `${baseUrl}/${owner}/${repo}/issues/${issueId}`;
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch {
      return false;
    }
  }

  private mapToGenericIssue(githubIssue: any): PlatformIssue {
    return {
      id: githubIssue.id,
      number: githubIssue.number,
      title: githubIssue.title,
      body: githubIssue.body,
      state: this.mapToGenericState(githubIssue.state),
      author: githubIssue.user ? {
        id: githubIssue.user.id,
        login: githubIssue.user.login,
        displayName: githubIssue.user.name || githubIssue.user.login,
        email: githubIssue.user.email || undefined,
        avatarUrl: githubIssue.user.avatar_url
      } : null,
      assignees: (githubIssue.assignees || []).map((assignee: any) => ({
        id: assignee.id,
        login: assignee.login,
        displayName: assignee.name || assignee.login,
        email: assignee.email || undefined,
        avatarUrl: assignee.avatar_url
      })),
      labels: (githubIssue.labels || []).map((label: any) => ({
        id: typeof label === 'object' ? label.id : 0,
        name: typeof label === 'string' ? label : label.name,
        color: typeof label === 'object' ? label.color : '',
        description: typeof label === 'object' ? label.description : null
      })),
      created_at: githubIssue.created_at,
      updated_at: githubIssue.updated_at,
      closed_at: githubIssue.closed_at,
      url: githubIssue.html_url,
      platform: 'github',
      platformSpecific: {
        node_id: githubIssue.node_id,
        repository_url: githubIssue.repository_url,
        comments_url: githubIssue.comments_url,
        events_url: githubIssue.events_url,
        timeline_url: githubIssue.timeline_url
      }
    };
  }
}
