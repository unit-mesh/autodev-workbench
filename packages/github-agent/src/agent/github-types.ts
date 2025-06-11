export interface GitHubContext {
  owner: string;
  repo: string;
  issueNumber: number;
  eventType?: string;
  action?: string;
}

export interface GitHubIssueContext {
  owner: string;
  repo: string;
  issueNumber: number;
}

export interface GitHubConfig {
  token?: string;
  context?: GitHubContext;
  autoUploadToIssue?: boolean;
}

export interface GitHubIssueUploadOptions {
  token: string;
  owner: string;
  repo: string;
  issueNumber: number;
  content: string;
} 