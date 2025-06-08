/**
 * Test utilities and helper functions
 */

import { jest } from '@jest/globals';

export class TestUtils {
  /**
   * Create a mock console that captures output
   */
  static createMockConsole() {
    return {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a mock timer for testing timeouts
   */
  static createMockTimer() {
    jest.useFakeTimers();
    return {
      advance: (ms: number) => jest.advanceTimersByTime(ms),
      runAll: () => jest.runAllTimers(),
      restore: () => jest.useRealTimers()
    };
  }

  /**
   * Validate GitHub issue structure
   */
  static isValidGitHubIssue(issue: any): boolean {
    return issue &&
           typeof issue.number === 'number' &&
           typeof issue.title === 'string' &&
           typeof issue.state === 'string' &&
           Array.isArray(issue.labels);
  }

  /**
   * Validate tool result structure
   */
  static isValidToolResult(result: any): boolean {
    return result &&
           typeof result.success === 'boolean' &&
           result.functionCall &&
           typeof result.functionCall.name === 'string';
  }

  /**
   * Validate agent response structure
   */
  static isValidAgentResponse(response: any): boolean {
    return response &&
           typeof response.text === 'string' &&
           Array.isArray(response.toolResults) &&
           typeof response.success === 'boolean';
  }

  /**
   * Create a mock GitHub API client
   */
  static createMockOctokit() {
    return {
      rest: {
        repos: {
          get: jest.fn() as any
        },
        issues: {
          get: jest.fn() as any,
          listForRepo: jest.fn() as any
        }
      }
    };
  }

  /**
   * Create a mock LLM service
   */
  static createMockLLMService() {
    return {
      generateResponse: jest.fn() as any,
      getProvider: jest.fn().mockReturnValue('mock'),
      getModel: jest.fn().mockReturnValue('mock-model')
    };
  }

  /**
   * Create a mock file system for workspace operations
   */
  static createMockFileSystem() {
    const files = new Map<string, string>();
    
    return {
      writeFile: jest.fn((path: string, content: string) => {
        files.set(path, content);
        return Promise.resolve();
      }),
      readFile: jest.fn((path: string) => {
        const content = files.get(path);
        if (content === undefined) {
          return Promise.reject(new Error(`File not found: ${path}`));
        }
        return Promise.resolve(content);
      }),
      exists: jest.fn((path: string) => {
        return Promise.resolve(files.has(path));
      }),
      listFiles: jest.fn(() => {
        return Promise.resolve(Array.from(files.keys()));
      }),
      getFiles: () => files
    };
  }

  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    return { result, time };
  }

  /**
   * Create a test environment with common mocks
   */
  static createTestEnvironment() {
    const mockConsole = TestUtils.createMockConsole();
    const mockOctokit = TestUtils.createMockOctokit();
    const mockLLMService = TestUtils.createMockLLMService();
    const mockFileSystem = TestUtils.createMockFileSystem();

    return {
      mockConsole,
      mockOctokit,
      mockLLMService,
      mockFileSystem,
      cleanup: () => {
        jest.clearAllMocks();
      }
    };
  }

  /**
   * Assert that a function throws with a specific message
   */
  static async expectToThrow(fn: () => Promise<any>, expectedMessage?: string) {
    try {
      await fn();
      throw new Error('Expected function to throw, but it did not');
    } catch (error: any) {
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}", but got "${error.message}"`);
      }
    }
  }

  /**
   * Create a performance benchmark
   */
  static createBenchmark(name: string) {
    const measurements: number[] = [];
    
    return {
      measure: async <T>(fn: () => Promise<T>): Promise<T> => {
        const { result, time } = await TestUtils.measureExecutionTime(fn);
        measurements.push(time);
        return result;
      },
      getStats: () => {
        if (measurements.length === 0) return null;
        
        const sorted = [...measurements].sort((a, b) => a - b);
        const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const median = sorted[Math.floor(sorted.length / 2)];
        
        return {
          name,
          count: measurements.length,
          average: avg,
          min,
          max,
          median,
          measurements: [...measurements]
        };
      }
    };
  }
}
