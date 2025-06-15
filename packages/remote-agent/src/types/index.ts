import { PlatformConfig, PlatformType } from "../services/platform";
export type {
  PlatformRepository,
  PlatformComment,
  PlatformUser,
  PlatformLabel,
  IssueQueryOptions,
  IssueState,
  IPlatformService
} from '../services/platform/interfaces/IPlatformService';

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
  milestone?: {
    number: number;
    title: string;
  };
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

export type UrlCacheResult = {
  url: string;
  title?: string;
  content?: string;
  content_length?: number;
  status: 'success' | 'error';
  error?: string;
  timestamp: number; // When the URL was fetched
};

export interface IssueAnalysisResult {
  issue: GitHubIssue & { urlContent?: UrlCacheResult[] };
  relatedCode: CodeContext;
  suggestions: Array<{
    type: 'file' | 'function' | 'api' | 'symbol';
    description: string;
    location?: string;
    confidence: number;
  }>;
  projectContext?: any; // 添加项目上下文分析结果
  urlContentSummary?: string;
}

export type Preset = "GitHub" | "GitLab" | "Jira" | "AzureDevOps" | "Bitbucket" | "Multi";

export interface GitHubAgentImplementation {
  name: string;
  version: string;
  githubToken?: string;
  workspacePath?: string;
  platformType?: PlatformType;
  platformConfig?: PlatformConfig;
}
