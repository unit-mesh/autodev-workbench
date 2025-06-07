/**
 * GitLab Platform Service Implementation
 * 
 * Implements the IPlatformService interface for GitLab
 */

import { BasePlatformService } from '../base/BasePlatformService';
import { 
  PlatformConfig,
  PlatformIssue,
  PlatformRepository,
  PlatformComment,
  IssueQueryOptions
} from '../interfaces/IPlatformService';

export class GitLabPlatformService extends BasePlatformService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: PlatformConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://gitlab.com/api/v4';
    this.headers = {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    };
  }

  async getRepository(owner: string, repo: string): Promise<PlatformRepository> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const response = await fetch(`${this.baseUrl}/projects/${projectPath}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        fullName: data.path_with_namespace,
        description: data.description,
        language: data.default_language,
        defaultBranch: data.default_branch,
        url: data.web_url,
        platform: 'gitlab'
      };
    } catch (error) {
      this.handleError(error, 'repository fetch');
    }
  }

  async getIssues(owner: string, repo: string, options: IssueQueryOptions = {}): Promise<PlatformIssue[]> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const params = new URLSearchParams();
      
      if (options.state && options.state !== 'all') {
        params.append('state', this.mapFromGenericState(options.state));
      }
      if (options.labels?.length) {
        params.append('labels', options.labels.join(','));
      }
      if (options.assignee) {
        params.append('assignee_username', options.assignee);
      }
      if (options.author) {
        params.append('author_username', options.author);
      }
      if (options.since) {
        params.append('created_after', options.since);
      }
      if (options.until) {
        params.append('created_before', options.until);
      }
      
      params.append('per_page', String(options.perPage || 30));
      params.append('page', String(options.page || 1));
      
      if (options.sortBy) {
        const sortMap = { created: 'created_at', updated: 'updated_at', priority: 'priority' };
        params.append('order_by', sortMap[options.sortBy] || 'created_at');
      }
      if (options.sortOrder) {
        params.append('sort', options.sortOrder);
      }

      const response = await fetch(`${this.baseUrl}/projects/${projectPath}/issues?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.map((issue: any) => this.mapToGenericIssue(issue));
    } catch (error) {
      this.handleError(error, 'issues fetch');
    }
  }

  async getIssue(owner: string, repo: string, issueId: string | number): Promise<PlatformIssue> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const response = await fetch(`${this.baseUrl}/projects/${projectPath}/issues/${issueId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapToGenericIssue(data);
    } catch (error) {
      this.handleError(error, `issue #${issueId} fetch`);
    }
  }

  async getIssueComments(owner: string, repo: string, issueId: string | number): Promise<PlatformComment[]> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const response = await fetch(`${this.baseUrl}/projects/${projectPath}/issues/${issueId}/notes`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data
        .filter((note: any) => !note.system) // Filter out system notes
        .map((note: any) => ({
          id: note.id,
          body: note.body,
          author: note.author ? {
            id: note.author.id,
            login: note.author.username,
            displayName: note.author.name,
            email: note.author.email,
            avatarUrl: note.author.avatar_url
          } : null,
          created_at: note.created_at,
          updated_at: note.updated_at,
          url: note.web_url || `${this.baseUrl}/projects/${projectPath}/issues/${issueId}#note_${note.id}`
        }));
    } catch (error) {
      this.handleError(error, `comments fetch for issue #${issueId}`);
    }
  }

  async addIssueComment(owner: string, repo: string, issueId: string | number, body: string): Promise<PlatformComment> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const response = await fetch(`${this.baseUrl}/projects/${projectPath}/issues/${issueId}/notes`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ body })
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        body: data.body,
        author: data.author ? {
          id: data.author.id,
          login: data.author.username,
          displayName: data.author.name,
          email: data.author.email,
          avatarUrl: data.author.avatar_url
        } : null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        url: data.web_url || `${this.baseUrl}/projects/${projectPath}/issues/${issueId}#note_${data.id}`
      };
    } catch (error) {
      this.handleError(error, `comment creation for issue #${issueId}`);
    }
  }

  parseIssueUrl(url: string): { owner: string; repo: string; issueId: string | number } | null {
    const gitlabIssueRegex = /gitlab\.com\/([^\/]+)\/([^\/]+)\/-\/issues\/(\d+)/;
    const match = url.match(gitlabIssueRegex);
    
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
    const baseUrl = this.config.baseUrl?.replace('/api/v4', '') || 'https://gitlab.com';
    return `${baseUrl}/${owner}/${repo}/-/issues/${issueId}`;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: this.headers
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapToGenericIssue(gitlabIssue: any): PlatformIssue {
    return {
      id: gitlabIssue.id,
      number: gitlabIssue.iid,
      title: gitlabIssue.title,
      body: gitlabIssue.description,
      state: this.mapToGenericState(gitlabIssue.state),
      author: gitlabIssue.author ? {
        id: gitlabIssue.author.id,
        login: gitlabIssue.author.username,
        displayName: gitlabIssue.author.name,
        email: gitlabIssue.author.email,
        avatarUrl: gitlabIssue.author.avatar_url
      } : null,
      assignees: (gitlabIssue.assignees || []).map((assignee: any) => ({
        id: assignee.id,
        login: assignee.username,
        displayName: assignee.name,
        email: assignee.email,
        avatarUrl: assignee.avatar_url
      })),
      labels: (gitlabIssue.labels || []).map((label: string, index: number) => ({
        id: index,
        name: label,
        color: '',
        description: null
      })),
      created_at: gitlabIssue.created_at,
      updated_at: gitlabIssue.updated_at,
      closed_at: gitlabIssue.closed_at,
      url: gitlabIssue.web_url,
      platform: 'gitlab',
      platformSpecific: {
        project_id: gitlabIssue.project_id,
        milestone: gitlabIssue.milestone,
        weight: gitlabIssue.weight,
        due_date: gitlabIssue.due_date,
        confidential: gitlabIssue.confidential
      }
    };
  }
}
