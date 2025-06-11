import { ToolLike } from "../_typing";
import { z } from "zod";
import { spawn, exec, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";

// 允许的命令白名单
const ALLOWED_COMMANDS = [
  'ls', 'cat', 'grep', 'find', 'echo', 'pwd',
  'git', 'npm', 'yarn', 'pnpm', 'node', 'python',
  'mkdir', 'touch', 'cp', 'mv', 'tar', 'zip', 'unzip'
];

// 危险字符列表
const DANGEROUS_CHARS = [';', '|', '&', '>', '<', '`', '$', '[', ']'];

// 允许的环境变量
const ALLOWED_ENV_VARS = ['PATH', 'HOME', 'USER', 'LANG', 'LC_ALL', 'NODE_ENV'];

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
      // 1. 命令白名单检查
      const baseCommand = command.split(' ')[0].toLowerCase();
      const baseName = path.basename(baseCommand);
      if (!ALLOWED_COMMANDS.includes(baseCommand) && !ALLOWED_COMMANDS.includes(baseName)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Command '${baseCommand}' is not in the allowed commands list.`
            }
          ]
        };
      }

      // 2. 参数安全检查
      const allArgs = [command, ...args].join(' ');
      if (DANGEROUS_CHARS.some(char => allArgs.includes(char))) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Command contains dangerous characters.`
            }
          ]
        };
      }

      // 3. 工作目录检查
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const workingDir = working_directory 
        ? (path.isAbsolute(working_directory) ? working_directory : path.join(workspacePath, working_directory))
        : workspacePath;

      const resolvedWorkingDir = path.resolve(workingDir);
      const resolvedWorkspace = path.resolve(workspacePath);

      // 检查工作目录是否在工作空间内
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

      // 检查工作目录是否包含符号链接
      try {
        const realPath = await fs.realpath(resolvedWorkingDir);
        if (realPath !== resolvedWorkingDir) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Working directory contains symbolic links.`
              }
            ]
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Invalid working directory.`
            }
          ]
        };
      }

      // 4. 环境变量过滤
      const filteredEnv = {
        ...process.env,
        ...Object.fromEntries(
          Object.entries(environment).filter(([key]) => ALLOWED_ENV_VARS.includes(key))
        )
      };

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

      // 5. 改进的命令执行和进程管理
      const result = await new Promise<{
        stdout: string;
        stderr: string;
        exit_code: number;
        execution_time: number;
        timed_out: boolean;
      }>((resolve, reject) => {
        const startTime = Date.now();
        let timedOut = false;
        let childProcess: ChildProcess;

        const killProcess = () => {
          if (!childProcess) return;
          try {
            // 检查进程是否还存在
            if (childProcess.killed) return;
            
            childProcess.kill('SIGTERM');
            
            // 设置一个更短的超时时间
            const forceKillTimeout = setTimeout(() => {
              if (childProcess && !childProcess.killed) {
                try {
                  childProcess.kill('SIGKILL');
                } catch (error) {
                  // 忽略任何错误
                }
              }
            }, 1000);
            
            // 确保清理超时
            childProcess.on('exit', () => {
              clearTimeout(forceKillTimeout);
            });
          } catch (error) {
            // 忽略 ESRCH 错误（进程不存在）
            if (error instanceof Error && error.message.includes('ESRCH')) return;
            console.error('Error killing process:', error);
          }
        };

        try {
          childProcess = shell 
            ? exec(fullCommand, { 
                cwd: resolvedWorkingDir, 
                env: filteredEnv,
                timeout: timeout 
              })
            : spawn(command, args, { 
                cwd: resolvedWorkingDir, 
                env: filteredEnv,
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

          // 设置超时
          const timeoutId = setTimeout(() => {
            timedOut = true;
            killProcess();
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

        } catch (error) {
          reject(error);
        }
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
