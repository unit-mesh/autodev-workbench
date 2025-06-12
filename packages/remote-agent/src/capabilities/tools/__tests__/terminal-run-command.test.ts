import { installRunTerminalCommandTool } from '../terminal-run-command';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Terminal Command Execution Tool', () => {
  let tool: any;
  const mockInstaller = (name: string, description: string, schema: any, handler: any) => {
    tool = { name, description, schema, handler };
  };

  beforeEach(() => {
    installRunTerminalCommandTool(mockInstaller);
  });

  describe('Command Whitelist', () => {
    it('should allow whitelisted commands', async () => {
      const result = await tool.handler({ command: 'ls' });
      expect(result.content[0].text).not.toContain('Error: Command');
    });

    it('should reject non-whitelisted commands', async () => {
      const result = await tool.handler({ command: 'rm -rf /' });
      expect(result.content[0].text).toContain('Error: Command');
    });
  });

  describe('Dangerous Characters Check', () => {
    it('should reject commands with dangerous characters', async () => {
      const result = await tool.handler({ command: 'echo "test" && rm -rf *' });
      expect(result.content[0].text).toContain('Error: Command contains dangerous characters');
    });

    it('should reject commands with pipe characters', async () => {
      const result = await tool.handler({ command: 'ls | grep test' });
      expect(result.content[0].text).toContain('Error: Command contains dangerous characters');
    });
  });

  describe('Working Directory Security', () => {
    const workspacePath = process.cwd();
    const outsidePath = path.resolve(workspacePath, '../../');

    it('should reject working directory outside workspace', async () => {
      const result = await tool.handler({
        command: 'ls',
        working_directory: outsidePath
      });
      expect(result.content[0].text).toContain('Error: Working directory');
    });

    it('should allow working directory inside workspace', async () => {
      const result = await tool.handler({
        command: 'ls',
        working_directory: 'packages'
      });
      expect(result.content[0].text).not.toContain('Error: Working directory');
    });
  });

  describe('Environment Variables', () => {
    it('should filter out non-allowed environment variables', async () => {
      const result = await tool.handler({
        command: process.execPath,
        args: ['-e', "console.log('hello')"],
        environment: {
          PATH: '/usr/bin',
          HOME: '/home/user',
          DANGEROUS_VAR: 'malicious_value'
        }
      });
      expect(result.content[0].text).not.toContain('Error');
    });
  });

  describe('Process Management', () => {
    it('should handle command timeout', async () => {
      const result = await tool.handler({
        command: process.execPath,
        args: ['-e', 'setTimeout(function(){},2000)'],
        timeout: 1000
      });
      expect(result.content[0].text).toContain('timed_out');
    });

    it('should capture command output', async () => {
      const result = await tool.handler({
        command: 'echo',
        args: ['test'],
        capture_output: true
      });
      expect(result.content[0].text).toContain('test');
    });
  });

  describe('Dry Run Mode', () => {
    it('should show command without executing', async () => {
      const result = await tool.handler({
        command: 'ls',
        dry_run: true
      });
      expect(result.content[0].text).toContain('dry_run');
      expect(result.content[0].text).toContain('would_execute');
    });
  });
}); 