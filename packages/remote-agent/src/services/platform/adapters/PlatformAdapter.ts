import { GitHubIssue } from '../../../types';
import {
  IPlatformService,
  PlatformIssue,
} from '../interfaces/IPlatformService';

export class PlatformAdapter {
  private platformService: IPlatformService;

  constructor(platformService: IPlatformService) {
    this.platformService = platformService;
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

  private mapToGitHubState(platformState: string): 'open' | 'closed' {
    const closedStates = ['closed', 'resolved', 'done'];
    return closedStates.includes(platformState.toLowerCase()) ? 'closed' : 'open';
  }
}
