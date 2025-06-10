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
        'Search for patterns in code using regex with ripgrep or grep',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should have correct parameter schema', () => {
      const schema = mockInstaller.mock.calls[0][2];
      
      expect(schema).toHaveProperty('pattern');
      expect(schema).toHaveProperty('search_path');
      expect(schema).toHaveProperty('file_types');
      expect(schema).toHaveProperty('exclude_patterns');
      expect(schema).toHaveProperty('case_sensitive');
      expect(schema).toHaveProperty('whole_word');
      expect(schema).toHaveProperty('max_results');
      expect(schema).toHaveProperty('context_lines');
      expect(schema).toHaveProperty('use_ripgrep');
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
        pattern: 'console.log',
        search_path: '.',
        context_lines: 4
      });

      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0].text).toContain('## filepath: test.ts');
    });

    it('should handle search with no results', async () => {
      mockRegexSearchFiles.mockResolvedValue('No results found');

      const result = await grepSearchTool({
        pattern: 'nonexistent',
        search_path: '.'
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('No matches found');
    });

    it('should handle ripgrep errors gracefully', async () => {
      mockRegexSearchFiles.mockRejectedValue(new Error('Ripgrep not found'));

      const result = await grepSearchTool({
        pattern: 'test',
        search_path: '.'
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
        pattern: 'test',
        search_path: '../../../etc/passwd'
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
        pattern: 'test',
        search_path: './nonexistent-directory'
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

    it('should format results according to specification', async () => {
      const mockSearchResults = `# src/test.ts
  1 | // before line 1
  2 | // before line 2
  3 | console.log("match");
  4 | // after line 1
  5 | // after line 2
----

# src/another.ts
 10 | function test() {
 11 |   console.log("another match");
 12 | }
----`;

      mockRegexSearchFiles.mockResolvedValue(mockSearchResults);

      const result = await grepSearchTool({
        pattern: 'console.log',
        search_path: '.',
        context_lines: 4
      });

      expect(result.content[0].text).toContain('## filepath: src/test.ts');
      expect(result.content[0].text).toContain('## filepath: src/another.ts');
      expect(result.content[0].text).toContain('console.log("match")');
      expect(result.content[0].text).toContain('console.log("another match")');
    });
  });
});
