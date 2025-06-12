/**
 * Platform Service Interface
 * 
 * Defines the contract for different platform integrations (GitHub, GitLab, Jira, etc.)
 * This abstraction allows the system to work with multiple issue tracking platforms.
 */

// Generic platform types
export type PlatformType = 'github' | 'gitlab' | 'jira' | 'azure-devops' | 'bitbucket';

export type IssueState = 'open' | 'closed' | 'in_progress' | 'resolved' | 'todo' | 'done';

export interface PlatformUser {
  id: string | number;
  login: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface PlatformLabel {
  id: string | number;
  name: string;
  color?: string;
  description?: string | null;
}

export interface PlatformIssue {
  id: string | number;
  number: string | number;
  title: string;
  body: string | null;
  state: IssueState;
  author: PlatformUser | null;
  assignees: PlatformUser[];
  labels: PlatformLabel[];
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  url: string;
  // Platform-specific metadata
  platform: PlatformType;
  platformSpecific?: Record<string, any>;
}

export interface PlatformRepository {
  id: string | number;
  name: string;
  fullName: string;
  description?: string | null;
  language?: string | null;
  defaultBranch?: string;
  url: string;
  platform: PlatformType;
}

export interface PlatformComment {
  id: string | number;
  body: string;
  author: PlatformUser | null;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface IssueQueryOptions {
  state?: IssueState | 'all';
  labels?: string[];
  assignee?: string;
  author?: string;
  since?: string;
  until?: string;
  perPage?: number;
  page?: number;
  sortBy?: 'created' | 'updated' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface PlatformConfig {
  type: PlatformType;
  baseUrl?: string;
  token: string;
  // Platform-specific configuration
  additionalConfig?: Record<string, any>;
}

/**
 * Main platform service interface
 */
export interface IPlatformService {
  readonly platformType: PlatformType;
  readonly config: PlatformConfig;

  // Repository operations
  getRepository(owner: string, repo: string): Promise<PlatformRepository>;

  // Issue operations
  getIssues(owner: string, repo: string, options?: IssueQueryOptions): Promise<PlatformIssue[]>;
  getIssue(owner: string, repo: string, issueId: string | number): Promise<PlatformIssue>;
  
  // Comment operations
  getIssueComments(owner: string, repo: string, issueId: string | number): Promise<PlatformComment[]>;
  addIssueComment(owner: string, repo: string, issueId: string | number, body: string): Promise<PlatformComment>;

  // Utility methods
  isConfigured(): boolean;
  validateConnection(): Promise<boolean>;
  
  // Platform-specific URL handling
  parseIssueUrl(url: string): { owner: string; repo: string; issueId: string | number } | null;
  buildIssueUrl(owner: string, repo: string, issueId: string | number): string;
}
