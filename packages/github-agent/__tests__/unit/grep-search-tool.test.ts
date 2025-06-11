import { installGrepSearchTool } from '../../src/capabilities/tools/code-search-regex';
import * as fs from 'fs';
import * as path from 'path';

// Mock the regexSearchFiles function
jest.mock('@autodev/worker-core', () => ({
  regexSearchFiles: jest.fn()
}));

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn()
}));

describe('installGrepSearchTool', () => {
  let mockInstaller: jest.Mock;
  let grepSearchTool: any;
  let mockRegexSearchFiles: jest.Mock;
  let mockExistsSync: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Get the mocked functions
    const { regexSearchFiles } = require('@autodev/worker-core');
    mockRegexSearchFiles = regexSearchFiles as jest.Mock;
    mockExistsSync = fs.existsSync as jest.Mock;

    mockInstaller = jest.fn();
    installGrepSearchTool(mockInstaller);

    // Get the installed tool function
    expect(mockInstaller).toHaveBeenCalledWith(
      'grep-search',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );

    grepSearchTool = mockInstaller.mock.calls[0][3];
  });

  describe('tool configuration', () => {
    it('should install with correct name and description', () => {
      expect(mockInstaller).toHaveBeenCalledWith(
        'grep-search',
        'Search for patterns in code using regex with ripgrep',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should have correct parameter schema', () => {
      const schema = mockInstaller.mock.calls[0][2];

      expect(schema).toHaveProperty('search_path');
      expect(schema).toHaveProperty('pattern');
      // Only these two parameters should exist now
      expect(Object.keys(schema)).toHaveLength(2);
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      // Mock the workspace path and create a test directory
      process.env.WORKSPACE_PATH = '/test/workspace';

      // Mock fs.existsSync to return true for our test paths
      mockExistsSync.mockImplementation((path: any) => {
        const pathStr = path.toString();
        return pathStr.includes('/test/workspace') || pathStr === '.';
      });
    });

    afterEach(() => {
      delete process.env.WORKSPACE_PATH;
    });

    it('should handle basic search parameters', async () => {
      mockRegexSearchFiles.mockResolvedValue(`# test.ts
  1 | function test() {
  2 |   console.log("hello");
  3 | }
----`);

      const result = await grepSearchTool({
        search_path: '.',
        pattern: 'console.log'
      });

      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should handle search with no results', async () => {
      mockRegexSearchFiles.mockResolvedValue('No results found');

      const result = await grepSearchTool({
        search_path: '.',
        pattern: 'nonexistent'
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('No matches found');
    });

    it('should handle ripgrep errors gracefully', async () => {
      mockRegexSearchFiles.mockRejectedValue(new Error('Ripgrep not found'));

      const result = await grepSearchTool({
        search_path: '.',
        pattern: 'test'
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Error executing ripgrep search');
    });

    it('should validate search path security', async () => {
      // Mock fs.existsSync to return false for paths outside workspace
      mockExistsSync.mockImplementation((path: any) => {
        const pathStr = path.toString();
        return pathStr.includes('/test/workspace') && !pathStr.includes('etc/passwd');
      });

      const result = await grepSearchTool({
        search_path: '../../../etc/passwd',
        pattern: 'test'
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('outside the workspace directory');
    });

    it('should handle non-existent search paths', async () => {
      // Mock fs.existsSync to return false for nonexistent paths
      mockExistsSync.mockImplementation((path: any) => {
        const pathStr = path.toString();
        return !pathStr.includes('nonexistent-directory');
      });

      const result = await grepSearchTool({
        search_path: './nonexistent-directory',
        pattern: 'test'
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('does not exist');
    });
  });

  describe('result formatting', () => {
    beforeEach(() => {
      // Set up environment for this test
      process.env.WORKSPACE_PATH = '/test/workspace';

      // Mock fs.existsSync to return true for test paths
      mockExistsSync.mockImplementation((path: any) => {
        const pathStr = path.toString();
        return pathStr.includes('/test/workspace') || pathStr === '.' || pathStr.includes('/test/workspace/.');
      });
    });

    afterEach(() => {
      delete process.env.WORKSPACE_PATH;
    });
  });
});
