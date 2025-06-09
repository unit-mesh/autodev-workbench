// Re-export types from github-agent for compatibility
export type {
  GitHubConfig,
  GitHubIssue,
  CodeContext,
  IssueAnalysisResult,
  GitHubAgentImplementation
} from '@autodev/github-agent';

// GitHub Action specific types
export interface ActionConfig {
  githubToken: string;
  workspacePath?: string;
  webhookSecret?: string;
  autoComment?: boolean;
  autoLabel?: boolean;
  analysisDepth?: 'shallow' | 'medium' | 'deep';
  triggerEvents?: string[];
  excludeLabels?: string[];
  includeLabels?: string[];
}

export interface WebhookPayload {
  action: string;
  issue?: {
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
    html_url: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
    };
    default_branch: string;
    clone_url: string;
    html_url: string;
  };
  sender: {
    login: string;
    id: number;
  };
}

export interface AnalysisOptions {
  depth?: 'shallow' | 'medium' | 'deep';
  includeCodeSearch?: boolean;
  includeSymbolAnalysis?: boolean;
  maxFiles?: number;
  timeout?: number;
}

export interface ActionResult {
  success: boolean;
  analysisResult?: any; // Will be properly typed when we have the actual result structure
  commentAdded?: boolean;
  labelsAdded?: string[];
  error?: string;
  executionTime?: number;
}



export interface LabelConfig {
  bugLabel?: string;
  featureLabel?: string;
  documentationLabel?: string;
  enhancementLabel?: string;
  questionLabel?: string;
  analysisCompleteLabel?: string;
}

export interface ActionContext {
  owner: string;
  repo: string;
  issueNumber: number;
  eventType: string;
  action: string;
  workspacePath: string;
  config: ActionConfig;
}

export interface WebhookHandlerOptions {
  secret?: string;
  path?: string;
  port?: number;
  onIssueOpened?: (payload: WebhookPayload) => Promise<void>;
  onIssueEdited?: (payload: WebhookPayload) => Promise<void>;
  onIssueLabeled?: (payload: WebhookPayload) => Promise<void>;
  onIssueAssigned?: (payload: WebhookPayload) => Promise<void>;
}

export interface AnalysisReport {
  issueNumber: number;
  repository: string;
  analysisTimestamp: string;
  summary: string;
  codeReferences: Array<{
    file: string;
    line?: number;
    relevance: number;
    description: string;
  }>;
  suggestions: Array<{
    type: 'fix' | 'enhancement' | 'investigation';
    priority: 'low' | 'medium' | 'high';
    description: string;
    location?: string;
  }>;
  relatedIssues?: Array<{
    number: number;
    title: string;
    similarity: number;
  }>;
  estimatedComplexity?: 'low' | 'medium' | 'high';
  recommendedLabels?: string[];
}
