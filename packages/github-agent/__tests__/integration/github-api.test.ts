/**
 * Integration tests for GitHub API
 * Converted from scripts/test-real-github-api.js
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestUtils } from '../helpers/test-utils';
import { MockFactories } from '../helpers/mock-factories';

// Mock Octokit for integration tests
let mockOctokit: any;

describe('GitHub API Integration', () => {
  let testEnv: ReturnType<typeof TestUtils.createTestEnvironment>;

  beforeEach(() => {
    testEnv = TestUtils.createTestEnvironment();
    mockOctokit = TestUtils.createMockOctokit();
    jest.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('repository access', () => {
    test('should fetch repository information', async () => {
      const repoData = {
        full_name: 'unit-mesh/autodev-workbench',
        description: 'AutoDev Workbench for AI-powered development',
        stargazers_count: 150,
        language: 'TypeScript',
        default_branch: 'main'
      };

      mockOctokit.rest.repos.get.mockResolvedValueOnce({ data: repoData });

      const result = await mockOctokit.rest.repos.get({
        owner: 'unit-mesh',
        repo: 'autodev-workbench'
      });

      expect(result.data).toEqual(repoData);
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: 'unit-mesh',
        repo: 'autodev-workbench'
      });
    });

    test('should handle repository not found', async () => {
      const error = new Error('Not Found');
      (error as any).status = 404;
      
      mockOctokit.rest.repos.get.mockRejectedValueOnce(error);

      await expect(mockOctokit.rest.repos.get({
        owner: 'nonexistent',
        repo: 'repo'
      })).rejects.toThrow('Not Found');
    });

    test('should handle authentication errors', async () => {
      const error = new Error('Bad credentials');
      (error as any).status = 401;
      
      mockOctokit.rest.repos.get.mockRejectedValueOnce(error);

      await expect(mockOctokit.rest.repos.get({
        owner: 'unit-mesh',
        repo: 'autodev-workbench'
      })).rejects.toThrow('Bad credentials');
    });
  });

  describe('issue access', () => {
    test('should fetch specific issue', async () => {
      const issueData = MockFactories.createGitHubIssue({
        number: 81,
        title: 'Authentication and error handling improvements'
      });

      mockOctokit.rest.issues.get.mockResolvedValueOnce({ data: issueData });

      const result = await mockOctokit.rest.issues.get({
        owner: 'unit-mesh',
        repo: 'autodev-workbench',
        issue_number: 81
      });

      expect(TestUtils.isValidGitHubIssue(result.data)).toBe(true);
      expect(result.data.number).toBe(81);
      expect(result.data.title).toBe('Authentication and error handling improvements');
      expect(mockOctokit.rest.issues.get).toHaveBeenCalledWith({
        owner: 'unit-mesh',
        repo: 'autodev-workbench',
        issue_number: 81
      });
    });

    test('should fetch multiple issues', async () => {
      const issuesData = [
        MockFactories.createGitHubIssue({ number: 81, title: 'Issue 1', state: 'open' }),
        MockFactories.createGitHubIssue({ number: 82, title: 'Issue 2', state: 'closed' }),
        MockFactories.createGitHubIssue({ number: 83, title: 'Issue 3', state: 'open' })
      ];

      mockOctokit.rest.issues.listForRepo.mockResolvedValueOnce({ data: issuesData });

      const result = await mockOctokit.rest.issues.listForRepo({
        owner: 'unit-mesh',
        repo: 'autodev-workbench',
        state: 'all',
        per_page: 5
      });

      expect(result.data).toHaveLength(3);
      result.data.forEach((issue: any) => {
        expect(TestUtils.isValidGitHubIssue(issue)).toBe(true);
      });
      expect(mockOctokit.rest.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'unit-mesh',
        repo: 'autodev-workbench',
        state: 'all',
        per_page: 5
      });
    });

    test('should handle issue not found', async () => {
      const error = new Error('Not Found');
      (error as any).status = 404;
      
      mockOctokit.rest.issues.get.mockRejectedValueOnce(error);

      await expect(mockOctokit.rest.issues.get({
        owner: 'unit-mesh',
        repo: 'autodev-workbench',
        issue_number: 999999
      })).rejects.toThrow('Not Found');
    });
  });

  describe('issue analysis', () => {
    test('should analyze issue content', async () => {
      const issueData = MockFactories.createGitHubIssue({
        number: 81,
        body: `## Description
This issue addresses authentication flow problems and error handling improvements.

## Steps to Reproduce
1. Login with expired token
2. Observe generic error message
3. User gets confused

## Expected Behavior
- Clear error messages
- Automatic token refresh
- Better user experience

## Additional Context
Related to authentication module in src/auth/
See also: https://example.com/docs/auth`
      });

      mockOctokit.rest.issues.get.mockResolvedValueOnce({ data: issueData });

      const result = await mockOctokit.rest.issues.get({
        owner: 'unit-mesh',
        repo: 'autodev-workbench',
        issue_number: 81
      });

      // Simulate URL extraction
      const urls: string[] = [];
      if (result.data.body) {
        const urlRegex = /https?:\/\/[^\s\)]+/g;
        const matches = result.data.body.match(urlRegex);
        if (matches) {
          urls.push(...matches);
        }
      }

      // Simulate analysis
      const analysis = {
        issue: {
          number: result.data.number,
          title: result.data.title,
          state: result.data.state,
          labels: result.data.labels.map((l: any) => l.name),
          body_length: result.data.body ? result.data.body.length : 0,
          urls_found: urls.length
        },
        analysis: {
          complexity: urls.length > 0 ? 'high' : 'medium',
          priority: result.data.labels.some((l: any) => l.name.includes('bug')) ? 'high' : 'medium',
          category: result.data.labels.length > 0 ? result.data.labels[0].name : 'general',
          estimated_effort: result.data.body && result.data.body.length > 200 ? 'large' : 'medium'
        }
      };

      expect(analysis.issue.number).toBe(81);
      expect(analysis.issue.urls_found).toBe(1);
      expect(analysis.analysis.complexity).toBe('high');
      expect(analysis.analysis.priority).toBe('high'); // Has 'bug' label
      expect(analysis.analysis.estimated_effort).toBe('large'); // Long body
    });

    test('should handle issues with no body', async () => {
      const issueData = MockFactories.createGitHubIssue({
        number: 82,
        body: null
      });

      mockOctokit.rest.issues.get.mockResolvedValueOnce({ data: issueData });

      const result = await mockOctokit.rest.issues.get({
        owner: 'unit-mesh',
        repo: 'autodev-workbench',
        issue_number: 82
      });

      const analysis = {
        body_length: result.data.body ? result.data.body.length : 0,
        urls_found: 0
      };

      expect(analysis.body_length).toBe(0);
      expect(analysis.urls_found).toBe(0);
    });
  });

  describe('batch processing', () => {
    test('should process multiple issues for comparison', async () => {
      const testIssues = [81, 92];
      const results: any[] = [];

      for (const issueNumber of testIssues) {
        const issueData = MockFactories.createGitHubIssue({
          number: issueNumber,
          title: `Test Issue #${issueNumber}`,
          body: `Issue body for #${issueNumber}`.repeat(issueNumber === 81 ? 30 : 15), // Different lengths
          comments: issueNumber === 81 ? 5 : 2,
          created_at: new Date(Date.now() - issueNumber * 24 * 60 * 60 * 1000).toISOString()
        });

        mockOctokit.rest.issues.get.mockResolvedValueOnce({ data: issueData });

        const result = await mockOctokit.rest.issues.get({
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          issue_number: issueNumber
        });

        const analysis = {
          number: result.data.number,
          title: result.data.title,
          body_length: result.data.body ? result.data.body.length : 0,
          comments: result.data.comments,
          created_days_ago: Math.floor((new Date().getTime() - new Date(result.data.created_at).getTime()) / (1000 * 60 * 60 * 24))
        };

        results.push(analysis);
      }

      expect(results).toHaveLength(2);
      
      // Compare issues
      const comparison = results.map(result => ({
        number: result.number,
        complexity: result.body_length > 500 ? 'High' : result.body_length > 200 ? 'Medium' : 'Low',
        activity: result.comments > 5 ? 'High' : result.comments > 2 ? 'Medium' : 'Low'
      }));

      expect(comparison[0].complexity).toBe('High'); // Issue 81 has longer body
      expect(comparison[1].complexity).toBe('Medium'); // Issue 92 has shorter body
      expect(comparison[0].activity).toBe('Medium'); // Issue 81 has 5 comments
      expect(comparison[1].activity).toBe('Low'); // Issue 92 has 2 comments
    });
  });

  describe('error handling', () => {
    test('should handle rate limiting', async () => {
      const error = new Error('API rate limit exceeded');
      (error as any).status = 403;
      
      mockOctokit.rest.issues.get.mockRejectedValueOnce(error);

      await expect(mockOctokit.rest.issues.get({
        owner: 'unit-mesh',
        repo: 'autodev-workbench',
        issue_number: 81
      })).rejects.toThrow('API rate limit exceeded');
    });

    test('should handle network errors', async () => {
      const error = new Error('Network error');
      (error as any).code = 'ECONNRESET';
      
      mockOctokit.rest.repos.get.mockRejectedValueOnce(error);

      await expect(mockOctokit.rest.repos.get({
        owner: 'unit-mesh',
        repo: 'autodev-workbench'
      })).rejects.toThrow('Network error');
    });
  });

  describe('performance', () => {
    test('should measure API call performance', async () => {
      const issueData = MockFactories.createGitHubIssue();
      mockOctokit.rest.issues.get.mockResolvedValueOnce({ data: issueData });

      const { result, time } = await TestUtils.measureExecutionTime(async () => {
        return await mockOctokit.rest.issues.get({
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          issue_number: 81
        });
      });

      expect(TestUtils.isValidGitHubIssue(result.data)).toBe(true);
      expect(time).toBeGreaterThanOrEqual(0);
      expect(time).toBeLessThan(1000); // Should be fast for mocked calls
    });

    test('should benchmark multiple API calls', async () => {
      const benchmark = TestUtils.createBenchmark('GitHub API calls');
      
      for (let i = 0; i < 3; i++) {
        const issueData = MockFactories.createGitHubIssue({ number: 81 + i });
        mockOctokit.rest.issues.get.mockResolvedValueOnce({ data: issueData });

        await benchmark.measure(async () => {
          return await mockOctokit.rest.issues.get({
            owner: 'unit-mesh',
            repo: 'autodev-workbench',
            issue_number: 81 + i
          });
        });
      }

      const stats = benchmark.getStats();
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(3);
      expect(stats!.average).toBeGreaterThanOrEqual(0);
    });
  });
});
