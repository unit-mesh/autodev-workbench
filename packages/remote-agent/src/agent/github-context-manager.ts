import { GitHubConfig, GitHubIssueContext, GitHubIssueUploadOptions } from './github-types';
import { ToolResult } from './tool-definition';

const GITHUB_ISSUE_URL_PATTERN = /(?:github\.com\/|^|\s)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/issues\/|#)(\d+)/i;

export class GitHubContextManager {
  private config: GitHubConfig;

  constructor(config: GitHubConfig = {}) {
    this.config = {
      autoUploadToIssue: false,
      ...config
    };
  }

  extractContext(userInput: string, toolResults: ToolResult[]): GitHubIssueContext | undefined {
    if (this.config.context) {
      return {
        owner: this.config.context.owner,
        repo: this.config.context.repo,
        issueNumber: this.config.context.issueNumber
      };
    }

    const inputMatch = userInput.match(GITHUB_ISSUE_URL_PATTERN);
    if (inputMatch) {
      return {
        owner: inputMatch[1],
        repo: inputMatch[2],
        issueNumber: parseInt(inputMatch[3])
      };
    }

    for (const result of toolResults) {
      if (result.success && result.functionCall.name.includes('github')) {
        const params = result.functionCall.parameters;
        if (params.owner && params.repo && (params.issue_number || params.issueNumber)) {
          return {
            owner: params.owner,
            repo: params.repo,
            issueNumber: params.issue_number || params.issueNumber
          };
        }
      }
    }

    return undefined;
  }

  async uploadToIssue(options: GitHubIssueUploadOptions): Promise<boolean> {
    if (!this.config.token) {
      throw new Error('GitHub token is required for uploading to issues');
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${options.owner}/${options.repo}/issues/${options.issueNumber}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${options.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: options.content
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload to GitHub issue: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error uploading to GitHub issue:', error);
      return false;
    }
  }

  getConfig(): GitHubConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<GitHubConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  isEnabled(): boolean {
    return Boolean(this.config.token);
  }

  isAutoUploadEnabled(): boolean {
    return Boolean(this.config.autoUploadToIssue && this.config.token);
  }
}