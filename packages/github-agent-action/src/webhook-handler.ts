import express, { Request, Response } from 'express';
import { Webhooks } from '@octokit/webhooks';
import { WebhookPayload, WebhookHandlerOptions, ActionContext, ActionConfig } from './types';
import { IssueAnalyzer } from './issue-analyzer';
import { GitHubActionService } from './action';

export class WebhookHandler {
  private app: express.Application;
  private webhooks: Webhooks;
  private actionService: GitHubActionService;
  private options: WebhookHandlerOptions;

  constructor(actionService: GitHubActionService, options: WebhookHandlerOptions = {}) {
    this.actionService = actionService;
    this.options = {
      path: '/webhook',
      port: 3000,
      ...options
    };

    this.app = express();
    this.app.use(express.json());

    // Initialize webhooks with secret if provided
    this.webhooks = new Webhooks({
      secret: this.options.secret || 'default-secret'
    });

    this.setupWebhookHandlers();
    this.setupRoutes();
  }

  /**
   * Setup webhook event handlers
   */
  private setupWebhookHandlers(): void {
    // Handle issue opened events
    this.webhooks.on('issues.opened', async ({ payload }) => {
      console.log(`📝 Issue opened: #${payload.issue.number} in ${payload.repository.full_name}`);
      
      try {
        await this.handleIssueEvent(payload as WebhookPayload, 'opened');
        
        if (this.options.onIssueOpened) {
          await this.options.onIssueOpened(payload as WebhookPayload);
        }
      } catch (error) {
        console.error('Error handling issue opened event:', error);
      }
    });

    // Handle issue edited events
    this.webhooks.on('issues.edited', async ({ payload }) => {
      console.log(`✏️ Issue edited: #${payload.issue.number} in ${payload.repository.full_name}`);
      
      try {
        await this.handleIssueEvent(payload as WebhookPayload, 'edited');
        
        if (this.options.onIssueEdited) {
          await this.options.onIssueEdited(payload as WebhookPayload);
        }
      } catch (error) {
        console.error('Error handling issue edited event:', error);
      }
    });

    // Handle issue labeled events
    this.webhooks.on('issues.labeled', async ({ payload }) => {
      console.log(`🏷️ Issue labeled: #${payload.issue.number} in ${payload.repository.full_name}`);
      
      try {
        if (this.options.onIssueLabeled) {
          await this.options.onIssueLabeled(payload as WebhookPayload);
        }
      } catch (error) {
        console.error('Error handling issue labeled event:', error);
      }
    });

    // Handle issue assigned events
    this.webhooks.on('issues.assigned', async ({ payload }) => {
      console.log(`👤 Issue assigned: #${payload.issue.number} in ${payload.repository.full_name}`);
      
      try {
        if (this.options.onIssueAssigned) {
          await this.options.onIssueAssigned(payload as WebhookPayload);
        }
      } catch (error) {
        console.error('Error handling issue assigned event:', error);
      }
    });

    // Handle webhook errors
    this.webhooks.onError((error) => {
      console.error('Webhook error:', error);
    });
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'github-agent-action-webhook'
      });
    });

    // Webhook endpoint
    this.app.post(this.options.path!, async (req: Request, res: Response) => {
      try {
        await this.webhooks.verifyAndReceive({
          id: req.headers['x-github-delivery'] as string,
          name: req.headers['x-github-event'] as any,
          signature: req.headers['x-hub-signature-256'] as string,
          payload: JSON.stringify(req.body)
        });

        res.status(200).json({ message: 'Webhook processed successfully' });
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(400).json({ 
          error: 'Webhook processing failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Manual trigger endpoint for testing
    this.app.post('/trigger/:owner/:repo/:issueNumber', async (req: Request, res: Response) => {
      try {
        const { owner, repo, issueNumber } = req.params;
        const { action = 'manual', depth = 'medium' } = req.body;

        console.log(`🔧 Manual trigger for issue #${issueNumber} in ${owner}/${repo}`);

        const result = await this.actionService.processIssue({
          owner,
          repo,
          issueNumber: parseInt(issueNumber),
          action,
          depth
        });

        res.json({
          success: true,
          result,
          message: `Analysis completed for issue #${issueNumber}`
        });
      } catch (error) {
        console.error('Manual trigger error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Status endpoint
    this.app.get('/status', (req: Request, res: Response) => {
      res.json({
        service: 'github-agent-action',
        version: process.env.npm_package_version || '0.1.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        webhookPath: this.options.path,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle issue events (opened, edited, etc.)
   */
  private async handleIssueEvent(payload: WebhookPayload, eventType: string): Promise<void> {
    if (!payload.issue || !payload.repository) {
      console.warn('Invalid payload: missing issue or repository data');
      return;
    }

    // Check if we should process this issue
    if (!this.shouldProcessIssue(payload, eventType)) {
      console.log(`⏭️ Skipping issue #${payload.issue.number} - does not meet processing criteria`);
      return;
    }

    const context: ActionContext = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issueNumber: payload.issue.number,
      eventType,
      action: payload.action,
      workspacePath: process.cwd(), // This could be configured
      config: this.getActionConfig()
    };

    try {
      console.log(`🚀 Processing issue #${context.issueNumber} in ${context.owner}/${context.repo}`);
      
      const result = await this.actionService.processIssueWithContext(context);
      
      if (result.success) {
        console.log(`✅ Successfully processed issue #${context.issueNumber}`);
        
        // Log analysis results
        if (result.analysisResult) {
          console.log(`📊 Analysis completed in ${result.executionTime}ms`);
        }
        
        if (result.commentAdded) {
          console.log(`💬 Comment added to issue #${context.issueNumber}`);
        }
        
        if (result.labelsAdded && result.labelsAdded.length > 0) {
          console.log(`🏷️ Labels added: ${result.labelsAdded.join(', ')}`);
        }
      } else {
        console.error(`❌ Failed to process issue #${context.issueNumber}: ${result.error}`);
      }
    } catch (error) {
      console.error(`💥 Error processing issue #${context.issueNumber}:`, error);
    }
  }

  /**
   * Determine if an issue should be processed based on configuration
   */
  private shouldProcessIssue(payload: WebhookPayload, eventType: string): boolean {
    const config = this.getActionConfig();
    
    // Check if event type is in trigger events
    if (config.triggerEvents && !config.triggerEvents.includes(eventType)) {
      return false;
    }

    // Check exclude labels
    if (config.excludeLabels && payload.issue) {
      const issueLabels = payload.issue.labels.map(label => label.name);
      const hasExcludedLabel = config.excludeLabels.some(label => issueLabels.includes(label));
      if (hasExcludedLabel) {
        return false;
      }
    }

    // Check include labels (if specified, issue must have at least one)
    if (config.includeLabels && config.includeLabels.length > 0 && payload.issue) {
      const issueLabels = payload.issue.labels.map(label => label.name);
      const hasIncludedLabel = config.includeLabels.some(label => issueLabels.includes(label));
      if (!hasIncludedLabel) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get action configuration from environment or defaults
   */
  private getActionConfig(): ActionConfig {
    return {
      githubToken: process.env.GITHUB_TOKEN || '',
      workspacePath: process.env.WORKSPACE_PATH || process.cwd(),
      webhookSecret: process.env.WEBHOOK_SECRET,
      autoComment: process.env.AUTO_COMMENT === 'true',
      autoLabel: process.env.AUTO_LABEL === 'true',
      analysisDepth: (process.env.ANALYSIS_DEPTH as any) || 'medium',
      triggerEvents: process.env.TRIGGER_EVENTS?.split(',') || ['opened', 'edited', 'reopened'],
      excludeLabels: process.env.EXCLUDE_LABELS?.split(',') || [],
      includeLabels: process.env.INCLUDE_LABELS?.split(',') || []
    };
  }

  /**
   * Start the webhook server
   */
  async start(): Promise<void> {
    const port = this.options.port || 3000;
    
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`🚀 GitHub Agent Action webhook server started on port ${port}`);
        console.log(`📡 Webhook endpoint: http://localhost:${port}${this.options.path}`);
        console.log(`🏥 Health check: http://localhost:${port}/health`);
        console.log(`📊 Status: http://localhost:${port}/status`);
        resolve();
      });
    });
  }

  /**
   * Get the Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get webhook instance for advanced configuration
   */
  getWebhooks(): Webhooks {
    return this.webhooks;
  }
}
