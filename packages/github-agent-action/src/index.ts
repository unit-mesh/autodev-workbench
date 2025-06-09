/**
 * AutoDev GitHub Agent Action
 * 
 * Automated GitHub issue analysis using AI-powered code analysis.
 * This package provides both GitHub Actions integration and standalone webhook server capabilities.
 */

// Core exports
export { GitHubActionService } from './action';
export type { ProcessIssueOptions } from './action';
export { IssueAnalyzer } from './issue-analyzer';
export { WebhookHandler } from './webhook-handler';

// Type exports
export type {
  ActionConfig,
  ActionContext,
  ActionResult,
  AnalysisOptions,
  AnalysisReport,
  WebhookPayload,
  WebhookHandlerOptions,
  LabelConfig
} from './types';

// Re-export useful types from github-agent
export type {
  GitHubConfig,
  GitHubIssue,
  CodeContext,
  IssueAnalysisResult,
  GitHubAgentImplementation
} from './types';

import { GitHubActionService } from './action';
import { WebhookHandler } from './webhook-handler';
import { ActionResult } from './types';
import * as core from '@actions/core';
import * as github from '@actions/github';

/**
 * Main entry point for GitHub Actions
 * This function is called when the action runs in a GitHub workflow
 */
export async function run(): Promise<void> {
  try {
    console.log('🚀 Starting AutoDev GitHub Agent Action');

    // Initialize the action service
    const actionService = new GitHubActionService();

    // Get context from GitHub Actions
    const context = github.context;
    
    // Check if this is an issue event
    if (context.eventName === 'issues') {
      const payload = context.payload;
      
      if (!payload.issue) {
        throw new Error('No issue found in event payload');
      }

      console.log(`📝 Processing issue #${payload.issue.number}: ${payload.issue.title}`);

      // Process the issue
      const result = await actionService.processIssue({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issueNumber: payload.issue.number,
        action: payload.action
      });

      if (result.success) {
        console.log('✅ Issue analysis completed successfully');
        
        if (result.commentAdded) {
          console.log('💬 Analysis comment added to issue');
        }
        
        if (result.labelsAdded && result.labelsAdded.length > 0) {
          console.log(`🏷️ Labels added: ${result.labelsAdded.join(', ')}`);
        }
      } else {
        throw new Error(result.error || 'Issue analysis failed');
      }
    } else {
      console.log(`ℹ️ Event type '${context.eventName}' is not supported. Only 'issues' events are processed.`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Action failed:', errorMessage);
    core.setFailed(errorMessage);
  }
}

/**
 * Create and start a webhook server for standalone operation
 */
export async function startWebhookServer(options: {
  port?: number;
  webhookSecret?: string;
  githubToken?: string;
  workspacePath?: string;
} = {}): Promise<WebhookHandler> {
  console.log('🌐 Starting GitHub Agent Action webhook server');

  // Initialize action service
  const actionService = new GitHubActionService({
    githubToken: options.githubToken || process.env.GITHUB_TOKEN,
    workspacePath: options.workspacePath || process.cwd(),
    webhookSecret: options.webhookSecret || process.env.WEBHOOK_SECRET
  });

  // Create webhook handler
  const webhookHandler = new WebhookHandler(actionService, {
    port: options.port || parseInt(process.env.PORT || '3000'),
    secret: options.webhookSecret || process.env.WEBHOOK_SECRET || 'default-secret',
    path: '/webhook'
  });

  // Start the server
  await webhookHandler.start();

  return webhookHandler;
}

/**
 * Analyze a specific issue (for manual/programmatic use)
 */
export async function analyzeIssue(options: {
  owner: string;
  repo: string;
  issueNumber: number;
  githubToken?: string;
  workspacePath?: string;
  depth?: 'shallow' | 'medium' | 'deep';
  autoComment?: boolean;
  autoLabel?: boolean;
}): Promise<ActionResult> {
  console.log(`🔍 Analyzing issue #${options.issueNumber} in ${options.owner}/${options.repo}`);

  const actionService = new GitHubActionService({
    githubToken: options.githubToken || process.env.GITHUB_TOKEN,
    workspacePath: options.workspacePath || process.cwd()
  });

  return actionService.processIssue({
    owner: options.owner,
    repo: options.repo,
    issueNumber: options.issueNumber,
    depth: options.depth,
    autoComment: options.autoComment,
    autoLabel: options.autoLabel
  });
}

/**
 * Utility function to validate configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required environment variables
  if (!process.env.GITHUB_TOKEN) {
    errors.push('GITHUB_TOKEN environment variable is required');
  }

  // Check for GitHub Actions context if running in Actions
  try {
    const context = github.context;
    if (context.eventName && !['issues', 'issue_comment'].includes(context.eventName)) {
      errors.push(`Event type '${context.eventName}' is not supported`);
    }
  } catch {
    // Not running in GitHub Actions context, which is fine for standalone mode
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get version information
 */
export function getVersion(): string {
  return process.env.npm_package_version || '0.1.0';
}

/**
 * Default export for convenience
 */
export default {
  run,
  startWebhookServer,
  analyzeIssue,
  validateConfig,
  getVersion,
  GitHubActionService,
  WebhookHandler
};

// Auto-run if this is the main module and we're in GitHub Actions context
if (require.main === module) {
  // Check if we're in GitHub Actions context
  if (process.env.GITHUB_ACTIONS === 'true') {
    run().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  } else {
    // Standalone mode - start webhook server
    const port = parseInt(process.env.PORT || '3000');
    console.log(`🚀 Starting in standalone mode on port ${port}`);
    
    startWebhookServer({ port }).catch(error => {
      console.error('Failed to start webhook server:', error);
      process.exit(1);
    });
  }
}
