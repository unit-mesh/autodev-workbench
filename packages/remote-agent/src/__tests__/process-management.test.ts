import { describe, expect, test, jest, afterAll, beforeEach } from '@jest/globals';
import { GlobalProcessManager } from '../capabilities/tools/process/global-process-manager';
import { installLaunchProcessTool } from '../capabilities/tools/process/launch-process-tool';
import { installListProcessesTool } from '../capabilities/tools/process/list-processes-tool';
import { installReadProcessTool } from '../capabilities/tools/process/read-process-tool';
import { installKillProcessTool } from '../capabilities/tools/process/kill-process-tool';

describe('Process Management Tools', () => {
  // Mock installer function for testing tools
  const mockInstaller = jest.fn().mockImplementation((name: string, description: string, params: any, handler: any) => {
    return async (args: any) => handler(args);
  });

  // Setup tools for testing
  let launchProcessHandler: any;
  let listProcessesHandler: any;
  let readProcessHandler: any;
  let killProcessHandler: any;

  beforeEach(() => {
    // Reset the mock and reinstall tools
    mockInstaller.mockClear();

    // Install the tools and capture the handlers
    installLaunchProcessTool(mockInstaller);
    installListProcessesTool(mockInstaller);
    installReadProcessTool(mockInstaller);
    installKillProcessTool(mockInstaller);

    // Get the most recent calls for each tool
    const calls = mockInstaller.mock.calls;
    const handlers = mockInstaller.mock.results.map(result => result.value);

    // Assign handlers by tool name
    for (let i = 0; i < calls.length; i++) {
      const [name] = calls[i];
      if (name === 'launch-process') launchProcessHandler = handlers[i];
      if (name === 'list-processes') listProcessesHandler = handlers[i];
      if (name === 'read-process') readProcessHandler = handlers[i];
      if (name === 'kill-process') killProcessHandler = handlers[i];
    }
  });

  // Cleanup processes after tests
  afterAll(() => {
    GlobalProcessManager.getInstance().cleanup();
  });

  test('should launch a process and get its ID', async () => {
    // Execute a simple echo command
    const result = await launchProcessHandler({
      command: 'echo "Hello Process"',
      wait: true,
      max_wait_seconds: 5,
      cwd: process.cwd()
    });

    const responseObj = JSON.parse(result.content[0].text);
    expect(responseObj.terminal_id).toBeGreaterThan(0);
    expect(responseObj.command).toBe('echo "Hello Process"');
    expect(responseObj.process_summary.status).toBe('completed');
  });

  test('should list all processes', async () => {
    // First launch a process
    const launchResult = await launchProcessHandler({
      command: 'ls -la',
      wait: true,
      max_wait_seconds: 5
    });

    const launchData = JSON.parse(launchResult.content[0].text);
    expect(launchData.terminal_id).toBeGreaterThan(0);

    // Now list processes
    const listResult = await listProcessesHandler({
      filter: 'all'
    });

    const listData = JSON.parse(listResult.content[0].text);
    expect(listData.processes.length).toBeGreaterThan(0);
    expect(listData.processes.some((p: any) => p.terminal_id === launchData.terminal_id)).toBe(true);
  });

  test('should read process output', async () => {
    // Launch a process with specific output
    const launchResult = await launchProcessHandler({
      command: 'echo "Test Output Content"',
      wait: true,
      max_wait_seconds: 5
    });

    const launchData = JSON.parse(launchResult.content[0].text);
    const processId = launchData.terminal_id;

    // Read the process output
    const readResult = await readProcessHandler({
      terminal_id: processId,
      wait: false,
      max_wait_seconds: 1
    });

    const readData = JSON.parse(readResult.content[0].text);
    expect(readData.stdout).toContain('Test Output Content');
    expect(readData.process_summary.status).toBe('completed');
  });

  test('should launch, read and kill a long running process', async () => {
    // Launch a long-running process (sleep for 10 seconds)
    const launchResult = await launchProcessHandler({
      command: 'sleep 10',
      wait: false,  // Don't wait for completion
      max_wait_seconds: 1
    });

    const launchData = JSON.parse(launchResult.content[0].text);
    const processId = launchData.terminal_id;

    // Check that the process is running
    const listResult = await listProcessesHandler({
      filter: 'running'
    });

    const listData = JSON.parse(listResult.content[0].text);
    expect(listData.processes.some((p: any) => p.terminal_id === processId)).toBe(true);

    // Kill the process
    const killResult = await killProcessHandler({
      terminal_id: processId
    });

    const killData = JSON.parse(killResult.content[0].text);
    expect(killData.success).toBe(true);
    expect(killData.process_summary.status).toBe('killed');

    // Check that the process is no longer running
    const finalListResult = await listProcessesHandler({
      filter: 'running'
    });

    const finalListData = JSON.parse(finalListResult.content[0].text);
    expect(finalListData.processes.some((p: any) => p.terminal_id === processId)).toBe(false);
  });

  test('should run the remote-agent build process and manage it', async () => {
    // Launch the build process (non-blocking)
    const cwd = process.cwd();
    console.log('Current working directory:', cwd);
    const launchResult = await launchProcessHandler({
      command: 'npm run build',
      wait: false,
      max_wait_seconds: 30,
      cwd: cwd
    });

    const launchData = JSON.parse(launchResult.content[0].text);
    const processId = launchData.terminal_id;
    expect(processId).toBeGreaterThan(0);

    // List processes to verify it's running
    const listResult = await listProcessesHandler({
      filter: 'running'
    });

    const listData = JSON.parse(listResult.content[0].text);
    const isProcessRunning = listData.processes.some((p: any) => p.terminal_id === processId);

    if (isProcessRunning) {
      // Read some output from the build process
      const readResult = await readProcessHandler({
        terminal_id: processId,
        wait: true,
        max_wait_seconds: 2
      });

      const readData = JSON.parse(readResult.content[0].text);
      console.log('Build process output:', readData.stdout);

      // Kill the process
      const killResult = await killProcessHandler({
        terminal_id: processId
      });

      const killData = JSON.parse(killResult.content[0].text);
      expect(killData.success).toBe(true);

      // Verify process was killed
      const finalListResult = await listProcessesHandler({
        filter: 'all'
      });

      const finalListData = JSON.parse(finalListResult.content[0].text);
      const killedProcess = finalListData.processes.find((p: any) => p.terminal_id === processId);
      expect(killedProcess).toBeDefined();
      expect(killedProcess.status).toBe('killed');
    } else {
      // If the process completed very quickly, this is also acceptable
      console.log('Build process completed before we could test killing it');
    }
  });
});
