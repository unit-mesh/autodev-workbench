// Re-export platform types for unified interface
export type {
  PlatformType,
  PlatformIssue,
  PlatformRepository,
  PlatformComment,
  PlatformUser,
  PlatformLabel,
  PlatformConfig,
  IssueQueryOptions,
  IssueState,
  IPlatformService
} from '../services/platform/interfaces/IPlatformService';

// Legacy GitHub-specific types (for backward compatibility)
export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: {
    login: string;
    id: number;
  } | null;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  assignees: Array<{
    login: string;
    id: number;
  }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
}

export interface CodeContext {
  files: Array<{
    path: string;
    content: string;
    relevanceScore: number;
  }>;
  symbols: Array<{
    name: string;
    type: string;
    location: {
      file: string;
      line: number;
      column: number;
    };
    description?: string;
  }>;
  apis: Array<{
    path: string;
    method: string;
    description?: string;
  }>;
}

export interface IssueAnalysisResult {
  issue: GitHubIssue | PlatformIssue;
  relatedCode: CodeContext;
  suggestions: Array<{
    type: 'file' | 'function' | 'api' | 'symbol';
    description: string;
    location?: string;
    confidence: number;
  }>;
  summary: string;
}

export type Preset = "GitHub" | "GitLab" | "Jira" | "AzureDevOps" | "Bitbucket" | "Multi";

export interface GitHubAgentImplementation {
  name: string;
  version: string;
  githubToken?: string;
  workspacePath?: string;
  // Platform-agnostic configuration
  platformType?: PlatformType;
  platformConfig?: PlatformConfig;
}
