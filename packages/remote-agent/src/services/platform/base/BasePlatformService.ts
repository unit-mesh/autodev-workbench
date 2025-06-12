/**
 * Base Platform Service
 * 
 * Provides common functionality for all platform implementations
 */

import { 
  IPlatformService, 
  PlatformConfig, 
  PlatformType,
  PlatformIssue,
  IssueState 
} from '../interfaces/IPlatformService';

export abstract class BasePlatformService implements IPlatformService {
  public readonly platformType: PlatformType;
  public readonly config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
    this.platformType = config.type;
  }

  // Abstract methods that must be implemented by each platform
  abstract getRepository(owner: string, repo: string): Promise<any>;
  abstract getIssues(owner: string, repo: string, options?: any): Promise<PlatformIssue[]>;
  abstract getIssue(owner: string, repo: string, issueId: string | number): Promise<PlatformIssue>;
  abstract getIssueComments(owner: string, repo: string, issueId: string | number): Promise<any[]>;
  abstract addIssueComment(owner: string, repo: string, issueId: string | number, body: string): Promise<any>;
  abstract parseIssueUrl(url: string): { owner: string; repo: string; issueId: string | number } | null;
  abstract buildIssueUrl(owner: string, repo: string, issueId: string | number): string;

  // Common utility methods
  isConfigured(): boolean {
    return !!(this.config.token && this.config.type);
  }

  async validateConnection(): Promise<boolean> {
    try {
      // Each platform should override this with a simple API call
      return true;
    } catch (error) {
      return false;
    }
  }

  // Common state mapping utilities
  protected mapToGenericState(platformState: string): IssueState {
    const stateMap: Record<string, IssueState> = {
      // GitHub states
      'open': 'open',
      'closed': 'closed',

      // GitLab states
      'opened': 'open',

      // Jira states
      'To Do': 'todo',
      'In Progress': 'in_progress',
      'Done': 'done',
      'Resolved': 'resolved',

      // Azure DevOps states
      'New': 'open',
      'Active': 'in_progress',
      'Closed': 'closed'
    };

    return stateMap[platformState] || 'open';
  }

  protected mapFromGenericState(genericState: IssueState): string {
    const platformStateMap: Record<PlatformType, Record<IssueState, string>> = {
      github: {
        open: 'open',
        closed: 'closed',
        in_progress: 'open',
        resolved: 'closed',
        todo: 'open',
        done: 'closed'
      },
      gitlab: {
        open: 'opened',
        closed: 'closed',
        in_progress: 'opened',
        resolved: 'closed',
        todo: 'opened',
        done: 'closed'
      },
      jira: {
        open: 'Open',
        closed: 'Closed',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        todo: 'To Do',
        done: 'Done'
      },
      'azure-devops': {
        open: 'New',
        closed: 'Closed',
        in_progress: 'Active',
        resolved: 'Resolved',
        todo: 'New',
        done: 'Closed'
      },
      bitbucket: {
        open: 'open',
        closed: 'closed',
        in_progress: 'open',
        resolved: 'resolved',
        todo: 'open',
        done: 'closed'
      }
    };

    return platformStateMap[this.platformType]?.[genericState] || 'open';
  }

  // Common error handling
  protected handleError(error: any, operation: string): never {
    const message = error?.message || String(error);
    throw new Error(`${this.platformType} ${operation} failed: ${message}`);
  }

  // Common URL validation
  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
