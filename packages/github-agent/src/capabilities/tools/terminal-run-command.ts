import { ToolLike } from "../_typing";
import { z } from "zod";
import { spawn, exec } from "child_process";
import * as path from "path";

export const installRunTerminalCommandTool: ToolLike = (installer) => {
  installer("run-terminal-command", "Execute a terminal command with safety checks and output capture", {
    command: z.string().describe("The command to execute"),
    args: z.array(z.string()).optional().describe("Command arguments as array"),
    working_directory: z.string().optional().describe("Working directory for command execution (relative to workspace)"),
    timeout: z.number().optional().describe("Command timeout in milliseconds (default: 30000)"),
    capture_output: z.boolean().optional().describe("Capture and return command output (default: true)"),
    environment: z.record(z.string()).optional().describe("Additional environment variables"),
    shell: z.boolean().optional().describe("Run command in shell (default: false for security)"),
    dry_run: z.boolean().optional().describe("Show what command would be executed without running it (default: false)")
  }, async ({ 
    command, 
    args = [],
    working_directory,
    timeout = 30000,
    capture_output = true,
    environment = {},
    shell = false,
    dry_run = false
  }: { 
    command: string; 
    args?: string[];
    working_directory?: string;
    timeout?: number;
    capture_output?: boolean;
    environment?: Record<string, string>;
    shell?: boolean;
    dry_run?: boolean;
  }) => {
    try {
      // Security checks - block dangerous commands
      const dangerousCommands = [
        'rm', 'rmdir', 'del', 'format', 'fdisk',
        'sudo', 'su', 'chmod', 'chown',
        'curl', 'wget', 'nc', 'netcat',
        'dd', 'mkfs', 'mount', 'umount'
      ];

      const baseCommand = command.split(' ')[0].toLowerCase();
      if (dangerousCommands.includes(baseCommand)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Command '${baseCommand}' is not allowed for security reasons.`
            }
          ]
        };
      }

      // Resolve working directory
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const workingDir = working_directory 
        ? (path.isAbsolute(working_directory) ? working_directory : path.join(workspacePath, working_directory))
        : workspacePath;

      // Security check - ensure working directory is within workspace
      const resolvedWorkingDir = path.resolve(workingDir);
      const resolvedWorkspace = path.resolve(workspacePath);
      if (!resolvedWorkingDir.startsWith(resolvedWorkspace)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Working directory '${working_directory}' is outside the workspace directory.`
            }
          ]
        };
      }

      const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;
      
      const executionInfo = {
        command: command,
        args: args,
        full_command: fullCommand,
        working_directory: working_directory || ".",
        resolved_working_directory: resolvedWorkingDir,
        timeout: timeout,
        shell: shell,
        dry_run: dry_run,
        timestamp: new Date().toISOString()
      };

      if (dry_run) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                ...executionInfo,
                message: "Dry run - command was not executed",
                would_execute: fullCommand
              }, null, 2)
            }
          ]
        };
      }

      // Execute command
      const result = await new Promise<{
        stdout: string;
        stderr: string;
        exit_code: number;
        execution_time: number;
        timed_out: boolean;
      }>((resolve, reject) => {
        const startTime = Date.now();
        let timedOut = false;

        // Set up environment
        const env = {
          ...process.env,
          ...environment
        };

        const childProcess = shell 
          ? exec(fullCommand, { 
              cwd: resolvedWorkingDir, 
              env: env,
              timeout: timeout 
            })
          : spawn(command, args, { 
              cwd: resolvedWorkingDir, 
              env: env,
              stdio: capture_output ? 'pipe' : 'inherit'
            });

        let stdout = '';
        let stderr = '';

        if (capture_output && childProcess.stdout && childProcess.stderr) {
          childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          childProcess.stderr.on('data', (data) => {
            stderr += data.toString();
          });
        }

        // Set timeout
        const timeoutId = setTimeout(() => {
          timedOut = true;
          childProcess.kill('SIGTERM');
          
          // Force kill after 5 seconds
          setTimeout(() => {
            if (!childProcess.killed) {
              childProcess.kill('SIGKILL');
            }
          }, 5000);
        }, timeout);

        childProcess.on('close', (code) => {
          clearTimeout(timeoutId);
          const executionTime = Date.now() - startTime;
          
          resolve({
            stdout: stdout,
            stderr: stderr,
            exit_code: code || 0,
            execution_time: executionTime,
            timed_out: timedOut
          });
        });

        childProcess.on('error', (error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
      });

      const response = {
        ...executionInfo,
        result: {
          exit_code: result.exit_code,
          success: result.exit_code === 0 && !result.timed_out,
          execution_time_ms: result.execution_time,
          timed_out: result.timed_out,
          stdout: capture_output ? result.stdout : "Output capture disabled",
          stderr: capture_output ? result.stderr : "Error capture disabled",
          stdout_lines: capture_output ? result.stdout.split('\n').length : 0,
          stderr_lines: capture_output ? result.stderr.split('\n').length : 0
        }
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing command '${command}': ${error.message}`
          }
        ]
      };
    }
  });
};
