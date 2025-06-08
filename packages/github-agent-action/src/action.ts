import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { ActionContext, ActionConfig, ActionResult, AnalysisOptions } from './types';
import { IssueAnalyzer } from './issue-analyzer';

export interface ProcessIssueOptions {
  owner: string;
  repo: string;
  issueNumber: number;
  action?: string;
  depth?: 'shallow' | 'medium' | 'deep';
  autoComment?: boolean;
  autoLabel?: boolean;
}

export class GitHubActionService {
  private octokit: Octokit;
  private config: ActionConfig;

  constructor(config?: Partial<ActionConfig>) {
    // Get configuration from GitHub Actions inputs or environment
    this.config = this.loadConfig(config);
    
    // Initialize Octokit with GitHub token
    this.octokit = new Octokit({
      auth: this.config.githubToken
    });

    console.log('🔧 GitHub Action Service initialized');
    console.log(`📁 Workspace: ${this.config.workspacePath}`);
    console.log(`🤖 Auto Comment: ${this.config.autoComment}`);
    console.log(`🏷️ Auto Label: ${this.config.autoLabel}`);
  }

  /**
   * Load configuration from GitHub Actions inputs or environment
   */
  private loadConfig(overrides?: Partial<ActionConfig>): ActionConfig {
    const config: ActionConfig = {
      githubToken: this.getInput('github-token') || process.env.GITHUB_TOKEN || '',
      workspacePath: this.getInput('workspace-path') || process.env.GITHUB_WORKSPACE || process.cwd(),
      webhookSecret: this.getInput('webhook-secret') || process.env.WEBHOOK_SECRET,
      autoComment: this.getBooleanInput('auto-comment') ?? true,
      autoLabel: this.getBooleanInput('auto-label') ?? true,
      analysisDepth: (this.getInput('analysis-depth') as any) || 'medium',
      triggerEvents: this.getInput('trigger-events')?.split(',') || ['opened', 'edited', 'reopened'],
      excludeLabels: this.getInput('exclude-labels')?.split(',').filter(Boolean) || [],
      includeLabels: this.getInput('include-labels')?.split(',').filter(Boolean) || [],
      ...overrides
    };

    if (!config.githubToken) {
      throw new Error('GitHub token is required. Set GITHUB_TOKEN environment variable or github-token input.');
    }

    return config;
  }

  /**
   * Get input value (works in both GitHub Actions and standalone mode)
   */
  private getInput(name: string): string {
    try {
      return core.getInput(name);
    } catch {
      // Fallback for standalone mode
      return process.env[name.toUpperCase().replace('-', '_')] || '';
    }
  }

  /**
   * Get boolean input value
   */
  private getBooleanInput(name: string): boolean | undefined {
    const value = this.getInput(name);
    if (!value) return undefined;
    return value.toLowerCase() === 'true';
  }

  /**
   * Process an issue with simplified options
   */
  async processIssue(options: ProcessIssueOptions): Promise<ActionResult> {
    const context: ActionContext = {
      owner: options.owner,
      repo: options.repo,
      issueNumber: options.issueNumber,
      eventType: 'manual',
      action: options.action || 'analyze',
      workspacePath: this.config.workspacePath!,
      config: {
        ...this.config,
        autoComment: options.autoComment ?? this.config.autoComment,
        autoLabel: options.autoLabel ?? this.config.autoLabel,
        analysisDepth: options.depth || this.config.analysisDepth
      }
    };

    return this.processIssueWithContext(context);
  }

  /**
   * Process an issue with full context
   */
  async processIssueWithContext(context: ActionContext): Promise<ActionResult> {
    try {
      console.log(`🔍 Processing issue #${context.issueNumber} in ${context.owner}/${context.repo}`);

      // Validate issue exists and is accessible
      await this.validateIssue(context);

      // Create issue analyzer
      const analyzer = new IssueAnalyzer(context);

      // Configure analysis options
      const analysisOptions: AnalysisOptions = {
        depth: context.config.analysisDepth,
        includeCodeSearch: true,
        includeSymbolAnalysis: true,
        timeout: 120000
      };

      // Perform analysis
      const result = await analyzer.analyzeIssue(analysisOptions);

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Add comment if configured and analysis was successful
      if (context.config.autoComment && result.analysisResult) {
        try {
          await this.addAnalysisComment(context, result);
          result.commentAdded = true;
          console.log(`💬 Added analysis comment to issue #${context.issueNumber}`);
        } catch (error) {
          console.warn('Failed to add comment:', error);
          // Don't fail the entire process if comment fails
        }
      }

      // Add labels if configured
      if (context.config.autoLabel && result.labelsAdded && result.labelsAdded.length > 0) {
        try {
          await this.addLabelsToIssue(context, result.labelsAdded);
          console.log(`🏷️ Added labels to issue #${context.issueNumber}: ${result.labelsAdded.join(', ')}`);
        } catch (error) {
          console.warn('Failed to add labels:', error);
          // Don't fail the entire process if labeling fails
        }
      }

      // Set GitHub Actions outputs if running in Actions context
      this.setOutputs(result);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to process issue #${context.issueNumber}:`, errorMessage);

      // Set error output for GitHub Actions
      this.setErrorOutput(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validate that the issue exists and is accessible
   */
  private async validateIssue(context: ActionContext): Promise<void> {
    try {
      const { data: issue } = await this.octokit.issues.get({
        owner: context.owner,
        repo: context.repo,
        issue_number: context.issueNumber
      });

      console.log(`✅ Issue #${context.issueNumber} validated: "${issue.title}"`);
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status;
        if (status === 404) {
          throw new Error(`Issue #${context.issueNumber} not found in ${context.owner}/${context.repo}`);
        } else if (status === 403) {
          throw new Error(`Access denied to issue #${context.issueNumber} in ${context.owner}/${context.repo}`);
        }
      }
      throw new Error(`Failed to validate issue: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add analysis comment to the issue
   */
  private async addAnalysisComment(context: ActionContext, result: ActionResult): Promise<void> {
    if (!result.analysisResult) {
      throw new Error('No analysis result to comment');
    }

    // Generate comment body
    const commentBody = this.generateCommentBody(result);

    await this.octokit.issues.createComment({
      owner: context.owner,
      repo: context.repo,
      issue_number: context.issueNumber,
      body: commentBody
    });
  }

  /**
   * Generate comment body from analysis result
   */
  private generateCommentBody(result: ActionResult): string {
    const sections: string[] = [];

    sections.push('## 🤖 Automated Issue Analysis');
    sections.push('');

    if (result.analysisResult) {
      sections.push('### Analysis Summary');
      sections.push('The issue has been automatically analyzed using AI-powered code analysis.');
      sections.push('');

      // Add execution time if available
      if (result.executionTime) {
        sections.push(`**Analysis completed in**: ${result.executionTime}ms`);
        sections.push('');
      }

      // Add any specific analysis content
      // This would be enhanced based on the actual analysis result structure
      sections.push('### Key Findings');
      sections.push('- Automated analysis has been performed');
      sections.push('- Relevant code sections have been identified');
      sections.push('- Recommendations are available for review');
      sections.push('');
    }

    if (result.labelsAdded && result.labelsAdded.length > 0) {
      sections.push('### Labels Applied');
      result.labelsAdded.forEach(label => {
        sections.push(`- \`${label}\``);
      });
      sections.push('');
    }

    sections.push('---');
    sections.push('*This analysis was generated automatically by [AutoDev GitHub Agent Action](https://github.com/unit-mesh/autodev-worker)*');

    return sections.join('\n');
  }

  /**
   * Add labels to the issue
   */
  private async addLabelsToIssue(context: ActionContext, labels: string[]): Promise<void> {
    await this.octokit.issues.addLabels({
      owner: context.owner,
      repo: context.repo,
      issue_number: context.issueNumber,
      labels
    });
  }

  /**
   * Set GitHub Actions outputs
   */
  private setOutputs(result: ActionResult): void {
    try {
      core.setOutput('success', result.success.toString());
      core.setOutput('comment-added', (result.commentAdded || false).toString());
      
      if (result.labelsAdded) {
        core.setOutput('labels-added', result.labelsAdded.join(','));
      }
      
      if (result.executionTime) {
        core.setOutput('execution-time', result.executionTime.toString());
      }
      
      if (result.error) {
        core.setOutput('error', result.error);
      }
    } catch {
      // Ignore errors if not running in GitHub Actions context
    }
  }

  /**
   * Set error output for GitHub Actions
   */
  private setErrorOutput(error: string): void {
    try {
      core.setFailed(error);
      core.setOutput('success', 'false');
      core.setOutput('error', error);
    } catch {
      // Ignore errors if not running in GitHub Actions context
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ActionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ActionConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
