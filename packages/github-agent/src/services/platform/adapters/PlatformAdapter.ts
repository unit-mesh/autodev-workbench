/**
 * Platform Adapter
 * 
 * Provides backward compatibility and unified interface for existing code
 * that expects GitHub-specific types while supporting multiple platforms
 */

import { GitHubIssue } from '../../../types/index';
import { 
  IPlatformService, 
  PlatformIssue, 
  PlatformRepository,
  PlatformComment,
  IssueQueryOptions 
} from '../interfaces/IPlatformService';
import { PlatformServiceFactory } from '../factories/PlatformServiceFactory';

export class PlatformAdapter {
  private platformService: IPlatformService;

  constructor(platformService: IPlatformService) {
    this.platformService = platformService;
  }

  /**
   * Create adapter from environment variables
   */
  static async createFromEnv(platformType?: string): Promise<PlatformAdapter> {
    const service = await PlatformServiceFactory.createFromEnv(platformType as any);
    return new PlatformAdapter(service);
  }

  /**
   * Get platform service instance
   */
  getPlatformService(): IPlatformService {
    return this.platformService;
  }

  /**
   * Get repository info (backward compatible)
   */
  async getRepositoryInfo(owner: string, repo: string) {
    const repository = await this.platformService.getRepository(owner, repo);
    
    // Convert to GitHub-compatible format for backward compatibility
    return {
      id: repository.id,
      name: repository.name,
      full_name: repository.fullName,
      description: repository.description,
      language: repository.language,
      default_branch: repository.defaultBranch,
      html_url: repository.url,
    };
  }

  /**
   * Get issues (backward compatible with GitHub format)
   */
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
    const queryOptions: IssueQueryOptions = {
      state: options.state === 'all' ? 'all' : (options.state as any),
      labels: options.labels ? options.labels.split(',') : undefined,
      assignee: options.assignee,
      since: options.since,
      perPage: options.per_page,
      page: options.page
    };

    const issues = await this.platformService.getIssues(owner, repo, queryOptions);
    return issues.map(issue => this.convertToGitHubIssue(issue));
  }

  /**
   * Get single issue (backward compatible)
   */
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const issue = await this.platformService.getIssue(owner, repo, issueNumber);
    return this.convertToGitHubIssue(issue);
  }

  /**
   * Add issue comment (backward compatible)
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
    const comment = await this.platformService.addIssueComment(owner, repo, issueNumber, body);
    
    return {
      id: typeof comment.id === 'string' ? parseInt(comment.id) : comment.id,
      html_url: comment.url,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    };
  }

  /**
   * Get issue comments (backward compatible)
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
    const comments = await this.platformService.getIssueComments(owner, repo, issueNumber);
    
    return comments.map(comment => ({
      id: typeof comment.id === 'string' ? parseInt(comment.id) : comment.id,
      body: comment.body,
      user: comment.author ? {
        login: comment.author.login,
        id: typeof comment.author.id === 'string' ? parseInt(comment.author.id) : comment.author.id,
      } : null,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      html_url: comment.url,
    }));
  }

  /**
   * Convert platform issue to GitHub issue format for backward compatibility
   */
  private convertToGitHubIssue(platformIssue: PlatformIssue): GitHubIssue {
    return {
      id: typeof platformIssue.id === 'string' ? parseInt(platformIssue.id) : platformIssue.id,
      number: typeof platformIssue.number === 'string' ? parseInt(platformIssue.number) : platformIssue.number,
      title: platformIssue.title,
      body: platformIssue.body,
      state: this.mapToGitHubState(platformIssue.state),
      user: platformIssue.author ? {
        login: platformIssue.author.login,
        id: typeof platformIssue.author.id === 'string' ? parseInt(platformIssue.author.id) : platformIssue.author.id,
      } : null,
      labels: platformIssue.labels.map(label => ({
        id: typeof label.id === 'string' ? parseInt(label.id) : label.id,
        name: label.name,
        color: label.color || '',
        description: label.description,
      })),
      assignees: platformIssue.assignees.map(assignee => ({
        login: assignee.login,
        id: typeof assignee.id === 'string' ? parseInt(assignee.id) : assignee.id,
      })),
      created_at: platformIssue.created_at,
      updated_at: platformIssue.updated_at,
      closed_at: platformIssue.closed_at,
      html_url: platformIssue.url,
    };
  }

  /**
   * Map platform state to GitHub state
   */
  private mapToGitHubState(platformState: string): 'open' | 'closed' {
    const closedStates = ['closed', 'resolved', 'done'];
    return closedStates.includes(platformState.toLowerCase()) ? 'closed' : 'open';
  }

  /**
   * Parse issue URL and return platform-specific info
   */
  parseIssueUrl(url: string): { owner: string; repo: string; issueId: string | number; platform: string } | null {
    const result = this.platformService.parseIssueUrl(url);
    if (result) {
      return {
        ...result,
        platform: this.platformService.platformType
      };
    }
    return null;
  }

  /**
   * Build issue URL
   */
  buildIssueUrl(owner: string, repo: string, issueId: string | number): string {
    return this.platformService.buildIssueUrl(owner, repo, issueId);
  }

  /**
   * Check if platform is configured
   */
  isConfigured(): boolean {
    return this.platformService.isConfigured();
  }

  /**
   * Validate connection
   */
  async validateConnection(): Promise<boolean> {
    return this.platformService.validateConnection();
  }

  /**
   * Get platform type
   */
  getPlatformType(): string {
    return this.platformService.platformType;
  }
}
