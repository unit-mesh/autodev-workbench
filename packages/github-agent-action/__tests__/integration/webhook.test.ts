/**
 * Integration tests for WebhookHandler
 */

import request from 'supertest';
import { WebhookHandler } from '../../src/webhook-handler';
import { GitHubActionService } from '../../src/action';

// Mock the GitHubActionService
jest.mock('../../src/action');

describe('WebhookHandler Integration', () => {
  let webhookHandler: WebhookHandler;
  let mockActionService: jest.Mocked<GitHubActionService>;

  beforeEach(() => {
    // Create mock action service
    mockActionService = {
      processIssueWithContext: jest.fn(),
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      processIssue: jest.fn()
    } as any;

    // Create webhook handler with mock service
    webhookHandler = new WebhookHandler(mockActionService, {
      port: 0, // Use random port for testing
      secret: 'test-secret',
      path: '/webhook'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const app = webhookHandler.getApp();
      
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        service: 'github-agent-action-webhook'
      });
    });
  });

  describe('Status Endpoint', () => {
    it('should respond with status information', async () => {
      const app = webhookHandler.getApp();
      
      const response = await request(app)
        .get('/status')
        .expect(200);

      expect(response.body).toEqual({
        service: 'github-agent-action',
        version: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        webhookPath: '/webhook',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Manual Trigger', () => {
    it('should handle manual trigger requests', async () => {
      const app = webhookHandler.getApp();
      
      // Mock successful processing
      mockActionService.processIssue.mockResolvedValue({
        success: true,
        analysisResult: { summary: 'Test analysis' },
        executionTime: 1000
      });

      const response = await request(app)
        .post('/trigger/test-owner/test-repo/123')
        .send({
          action: 'manual',
          depth: 'medium'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        result: {
          success: true,
          analysisResult: { summary: 'Test analysis' },
          executionTime: 1000
        },
        message: 'Analysis completed for issue #123'
      });

      expect(mockActionService.processIssue).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issueNumber: 123,
        action: 'manual',
        depth: 'medium'
      });
    });

    it('should handle manual trigger errors', async () => {
      const app = webhookHandler.getApp();
      
      // Mock failed processing
      mockActionService.processIssue.mockRejectedValue(new Error('Processing failed'));

      const response = await request(app)
        .post('/trigger/test-owner/test-repo/123')
        .send({
          action: 'manual'
        })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Processing failed'
      });
    });

    it('should validate issue number parameter', async () => {
      const app = webhookHandler.getApp();
      
      const response = await request(app)
        .post('/trigger/test-owner/test-repo/invalid')
        .send({
          action: 'manual'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Webhook Processing', () => {
    it('should reject requests without proper signature', async () => {
      const app = webhookHandler.getApp();
      
      const response = await request(app)
        .post('/webhook')
        .send({
          action: 'opened',
          issue: { number: 123 },
          repository: { full_name: 'test/repo' }
        })
        .expect(400);

      expect(response.body.error).toBe('Webhook processing failed');
    });

    it('should handle malformed webhook payloads', async () => {
      const app = webhookHandler.getApp();
      
      const response = await request(app)
        .post('/webhook')
        .send('invalid json')
        .expect(400);

      expect(response.body.error).toBe('Webhook processing failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const app = webhookHandler.getApp();
      
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });

    it('should handle invalid HTTP methods', async () => {
      const app = webhookHandler.getApp();
      
      await request(app)
        .put('/health')
        .expect(404);
    });
  });
});

describe('WebhookHandler Configuration', () => {
  it('should use default configuration when none provided', () => {
    const mockActionService = {} as GitHubActionService;
    const handler = new WebhookHandler(mockActionService);
    
    expect(handler).toBeInstanceOf(WebhookHandler);
  });

  it('should accept custom configuration', () => {
    const mockActionService = {} as GitHubActionService;
    const customOptions = {
      port: 8080,
      secret: 'custom-secret',
      path: '/custom-webhook'
    };
    
    const handler = new WebhookHandler(mockActionService, customOptions);
    
    expect(handler).toBeInstanceOf(WebhookHandler);
  });

  it('should provide access to Express app', () => {
    const mockActionService = {} as GitHubActionService;
    const handler = new WebhookHandler(mockActionService);
    
    const app = handler.getApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('should provide access to webhooks instance', () => {
    const mockActionService = {} as GitHubActionService;
    const handler = new WebhookHandler(mockActionService);
    
    const webhooks = handler.getWebhooks();
    expect(webhooks).toBeDefined();
  });
});
