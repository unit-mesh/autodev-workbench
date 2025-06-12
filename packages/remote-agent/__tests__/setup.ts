/**
 * Jest setup file for remote-agent tests
 * Configures global test environment and utilities
 */

import { jest } from '@jest/globals';

// Extend Jest matchers
expect.extend({
  toBeValidGitHubIssue(received: any) {
    const pass = received &&
                 typeof received.number === 'number' &&
                 typeof received.title === 'string' &&
                 typeof received.state === 'string' &&
                 Array.isArray(received.labels);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid GitHub issue`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid GitHub issue with number, title, state, and labels`,
        pass: false,
      };
    }
  },

  toBeValidToolResult(received: any) {
    const pass = received &&
                 typeof received.success === 'boolean' &&
                 received.functionCall &&
                 typeof received.functionCall.name === 'string';

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid tool result`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid tool result with success, functionCall.name`,
        pass: false,
      };
    }
  }
});

// Global test utilities
global.testUtils = {
  createMockGitHubIssue: (overrides = {}) => ({
    number: 81,
    title: 'Test Issue',
    state: 'open',
    labels: [{ name: 'bug' }],
    body: 'Test issue body',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    comments: 0,
    ...overrides
  }),

  createMockToolResult: (overrides = {}) => ({
    success: true,
    functionCall: { name: 'github_analyze_issue', parameters: {} },
    result: { content: [{ type: 'text', text: 'Mock result' }] },
    executionTime: 1000,
    round: 1,
    ...overrides
  }),

  createMockAgentResponse: (overrides = {}) => ({
    text: 'Mock agent response',
    toolResults: [],
    success: true,
    totalRounds: 1,
    executionTime: 2000,
    ...overrides
  })
};

// Declare global types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidGitHubIssue(): R;
      toBeValidToolResult(): R;
    }
  }

  var testUtils: {
    createMockGitHubIssue: (overrides?: any) => any;
    createMockToolResult: (overrides?: any) => any;
    createMockAgentResponse: (overrides?: any) => any;
  };

  var restoreConsole: () => void;
  var mockConsole: () => void;
}
