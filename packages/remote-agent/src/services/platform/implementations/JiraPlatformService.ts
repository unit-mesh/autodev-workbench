/**
 * Jira Platform Service Implementation
 * 
 * Implements the IPlatformService interface for Jira
 * Note: Jira has a different concept model (projects vs repositories, issues vs tickets)
 */

import { BasePlatformService } from '../base/BasePlatformService';
import { 
  PlatformConfig,
  PlatformIssue,
  PlatformRepository,
  PlatformComment,
  IssueQueryOptions
} from '../interfaces/IPlatformService';

export class JiraPlatformService extends BasePlatformService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: PlatformConfig) {
    super(config);
    this.baseUrl = config.baseUrl || '';
    
    if (!this.baseUrl) {
      throw new Error('Jira base URL is required');
    }

    // Jira uses Basic Auth with email and API token
    const username = config.additionalConfig?.username || '';
    const auth = Buffer.from(`${username}:${config.token}`).toString('base64');
    
    this.headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async getRepository(owner: string, repo: string): Promise<PlatformRepository> {
    try {
      // In Jira, "repository" maps to "project"
      const response = await fetch(`${this.baseUrl}/rest/api/3/project/${repo}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        fullName: `${owner}/${data.key}`,
        description: data.description,
        language: null, // Jira doesn't have language concept
        defaultBranch: null,
        url: data.self,
        platform: 'jira'
      };
    } catch (error) {
      this.handleError(error, 'project fetch');
    }
  }

  async getIssues(owner: string, repo: string, options: IssueQueryOptions = {}): Promise<PlatformIssue[]> {
    try {
      // Build JQL query
      const jqlParts = [`project = "${repo}"`];
      
      if (options.state && options.state !== 'all') {
        const statusMap = {
          'open': 'Open',
          'in_progress': '"In Progress"',
          'resolved': 'Resolved',
          'closed': 'Closed',
          'todo': '"To Do"',
          'done': 'Done'
        };
        jqlParts.push(`status = ${statusMap[options.state] || 'Open'}`);
      }
      
      if (options.assignee) {
        jqlParts.push(`assignee = "${options.assignee}"`);
      }
      
      if (options.author) {
        jqlParts.push(`reporter = "${options.author}"`);
      }

      const jql = jqlParts.join(' AND ');
      const params = new URLSearchParams({
        jql,
        maxResults: String(options.perPage || 50),
        startAt: String(((options.page || 1) - 1) * (options.perPage || 50)),
        expand: 'names,schema,operations,editmeta,changelog,renderedFields'
      });

      const response = await fetch(`${this.baseUrl}/rest/api/3/search?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.issues.map((issue: any) => this.mapToGenericIssue(issue));
    } catch (error) {
      this.handleError(error, 'issues fetch');
    }
  }

  async getIssue(owner: string, repo: string, issueId: string | number): Promise<PlatformIssue> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueId}?expand=names,schema,operations,editmeta,changelog,renderedFields`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapToGenericIssue(data);
    } catch (error) {
      this.handleError(error, `issue ${issueId} fetch`);
    }
  }

  async getIssueComments(owner: string, repo: string, issueId: string | number): Promise<PlatformComment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueId}/comment`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.comments.map((comment: any) => ({
        id: comment.id,
        body: comment.body?.content?.[0]?.content?.[0]?.text || comment.body || '',
        author: comment.author ? {
          id: comment.author.accountId,
          login: comment.author.emailAddress || comment.author.displayName,
          displayName: comment.author.displayName,
          email: comment.author.emailAddress,
          avatarUrl: comment.author.avatarUrls?.['48x48']
        } : null,
        created_at: comment.created,
        updated_at: comment.updated,
        url: comment.self
      }));
    } catch (error) {
      this.handleError(error, `comments fetch for issue ${issueId}`);
    }
  }

  async addIssueComment(owner: string, repo: string, issueId: string | number, body: string): Promise<PlatformComment> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueId}/comment`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: body
                  }
                ]
              }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        body: body,
        author: data.author ? {
          id: data.author.accountId,
          login: data.author.emailAddress || data.author.displayName,
          displayName: data.author.displayName,
          email: data.author.emailAddress,
          avatarUrl: data.author.avatarUrls?.['48x48']
        } : null,
        created_at: data.created,
        updated_at: data.updated,
        url: data.self
      };
    } catch (error) {
      this.handleError(error, `comment creation for issue ${issueId}`);
    }
  }

  parseIssueUrl(url: string): { owner: string; repo: string; issueId: string | number } | null {
    // Jira URLs: https://company.atlassian.net/browse/PROJECT-123
    const jiraIssueRegex = /\/browse\/([A-Z]+)-(\d+)/;
    const match = url.match(jiraIssueRegex);
    
    if (match) {
      return {
        owner: 'jira', // Jira doesn't have owner concept like GitHub
        repo: match[1], // Project key
        issueId: `${match[1]}-${match[2]}` // Full issue key
      };
    }
    
    return null;
  }

  buildIssueUrl(owner: string, repo: string, issueId: string | number): string {
    return `${this.baseUrl}/browse/${issueId}`;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/myself`, {
        headers: this.headers
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapToGenericIssue(jiraIssue: any): PlatformIssue {
    const fields = jiraIssue.fields;
    
    return {
      id: jiraIssue.id,
      number: jiraIssue.key,
      title: fields.summary,
      body: fields.description?.content?.[0]?.content?.[0]?.text || fields.description || null,
      state: this.mapToGenericState(fields.status.name),
      author: fields.reporter ? {
        id: fields.reporter.accountId,
        login: fields.reporter.emailAddress || fields.reporter.displayName,
        displayName: fields.reporter.displayName,
        email: fields.reporter.emailAddress,
        avatarUrl: fields.reporter.avatarUrls?.['48x48']
      } : null,
      assignees: fields.assignee ? [{
        id: fields.assignee.accountId,
        login: fields.assignee.emailAddress || fields.assignee.displayName,
        displayName: fields.assignee.displayName,
        email: fields.assignee.emailAddress,
        avatarUrl: fields.assignee.avatarUrls?.['48x48']
      }] : [],
      labels: (fields.labels || []).map((label: string, index: number) => ({
        id: index,
        name: label,
        color: '',
        description: null
      })),
      created_at: fields.created,
      updated_at: fields.updated,
      closed_at: fields.resolutiondate,
      url: `${this.baseUrl}/browse/${jiraIssue.key}`,
      platform: 'jira',
      platformSpecific: {
        key: jiraIssue.key,
        project: fields.project,
        issuetype: fields.issuetype,
        priority: fields.priority,
        resolution: fields.resolution,
        status: fields.status,
        components: fields.components,
        fixVersions: fields.fixVersions
      }
    };
  }
}
