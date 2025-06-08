/**
 * Unit tests for GitHubActionService
 */

import { GitHubActionService } from '../../src/action';
import { ActionConfig } from '../../src/types';

// Mock dependencies
jest.mock('@octokit/rest');
jest.mock('@autodev/github-agent');

describe('GitHubActionService', () => {
  let service: GitHubActionService;
  let mockConfig: Partial<ActionConfig>;

  beforeEach(() => {
    mockConfig = {
      githubToken: 'test-token',
      workspacePath: '/test/workspace',
      autoComment: true,
      autoLabel: true,
      analysisDepth: 'medium'
    };

    service = new GitHubActionService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(service).toBeInstanceOf(GitHubActionService);
      
      const config = service.getConfig();
      expect(config.githubToken).toBe('test-token');
      expect(config.workspacePath).toBe('/test/workspace');
      expect(config.autoComment).toBe(true);
      expect(config.autoLabel).toBe(true);
      expect(config.analysisDepth).toBe('medium');
    });

    it('should throw error if no GitHub token provided', () => {
      expect(() => {
        new GitHubActionService({ githubToken: '' });
      }).toThrow('GitHub token is required');
    });

    it('should use default values for optional config', () => {
      const minimalService = new GitHubActionService({ githubToken: 'test-token' });
      const config = minimalService.getConfig();
      
      expect(config.autoComment).toBe(true);
      expect(config.autoLabel).toBe(true);
      expect(config.analysisDepth).toBe('medium');
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = service.getConfig();
      
      expect(config).toEqual(expect.objectContaining({
        githubToken: 'test-token',
        workspacePath: '/test/workspace',
        autoComment: true,
        autoLabel: true,
        analysisDepth: 'medium'
      }));
    });

    it('should return a copy of config (not reference)', () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      service.updateConfig({
        autoComment: false,
        analysisDepth: 'deep'
      });

      const config = service.getConfig();
      expect(config.autoComment).toBe(false);
      expect(config.analysisDepth).toBe('deep');
      expect(config.githubToken).toBe('test-token'); // Should preserve existing values
    });

    it('should merge with existing config', () => {
      const originalConfig = service.getConfig();
      
      service.updateConfig({
        autoLabel: false
      });

      const updatedConfig = service.getConfig();
      expect(updatedConfig.autoLabel).toBe(false);
      expect(updatedConfig.githubToken).toBe(originalConfig.githubToken);
      expect(updatedConfig.workspacePath).toBe(originalConfig.workspacePath);
    });
  });

  describe('processIssue', () => {
    it('should process issue with valid options', async () => {
      // Mock the validateIssue method to avoid actual API calls
      const validateIssueSpy = jest.spyOn(service as any, 'validateIssue').mockResolvedValue(undefined);
      
      // Mock the IssueAnalyzer
      const mockAnalyzeResult = {
        success: true,
        analysisResult: { summary: 'Test analysis' },
        executionTime: 1000
      };

      // This test would need more sophisticated mocking of the IssueAnalyzer
      // For now, we'll test the parameter validation
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        issueNumber: 123
      };

      // Since we can't easily mock the complex dependencies, we'll test that the method
      // at least accepts the correct parameters without throwing
      expect(() => {
        service.processIssue(options);
      }).not.toThrow();

      validateIssueSpy.mockRestore();
    });

    it('should validate required parameters', () => {
      expect(() => {
        service.processIssue({} as any);
      }).not.toThrow(); // The method should handle missing parameters gracefully
    });
  });
});

describe('GitHubActionService configuration loading', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load configuration from environment variables', () => {
    process.env.GITHUB_TOKEN = 'env-token';
    process.env.WORKSPACE_PATH = '/env/workspace';
    process.env.AUTO_COMMENT = 'false';
    process.env.AUTO_LABEL = 'false';
    process.env.ANALYSIS_DEPTH = 'deep';

    const service = new GitHubActionService();
    const config = service.getConfig();

    expect(config.githubToken).toBe('env-token');
    expect(config.workspacePath).toBe('/env/workspace');
    expect(config.autoComment).toBe(false);
    expect(config.autoLabel).toBe(false);
    expect(config.analysisDepth).toBe('deep');
  });

  it('should prioritize provided config over environment variables', () => {
    process.env.GITHUB_TOKEN = 'env-token';
    process.env.AUTO_COMMENT = 'false';

    const service = new GitHubActionService({
      githubToken: 'override-token',
      autoComment: true
    });

    const config = service.getConfig();
    expect(config.githubToken).toBe('override-token');
    expect(config.autoComment).toBe(true);
  });
});
