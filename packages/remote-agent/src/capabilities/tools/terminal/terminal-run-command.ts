import { ToolLike } from "../../_typing";
import { z } from "zod";
import { spawn, exec, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";

// 进程管理器 - 跟踪所有活动进程
class ProcessManager {
  private static instance: ProcessManager;
  private processes: Map<number, ProcessInfo> = new Map();
  private nextId = 1;

  static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  addProcess(process: ChildProcess, command: string, options: any): number {
    const id = this.nextId++;
    const info: ProcessInfo = {
      id,
      process,
      command,
      startTime: Date.now(),
      status: 'running',
      options,
      output: [],
      errors: []
    };
    this.processes.set(id, info);

    // 监听进程事件
    process.on('exit', (code) => {
      if (this.processes.has(id)) {
        this.processes.get(id)!.status = code === 0 ? 'completed' : 'failed';
        this.processes.get(id)!.exitCode = code || 0;
        this.processes.get(id)!.endTime = Date.now();
      }
    });

    return id;
  }

  getProcess(id: number): ProcessInfo | undefined {
    return this.processes.get(id);
  }

  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }

  removeProcess(id: number): boolean {
    return this.processes.delete(id);
  }
}

interface ProcessInfo {
  id: number;
  process: ChildProcess;
  command: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed' | 'killed';
  exitCode?: number;
  options: any;
  output: string[];
  errors: string[];
}

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

// 智能输出分析器
class OutputAnalyzer {
  static analyzeOutput(stdout: string, stderr: string, command: string, exitCode: number) {
    const analysis = {
      hasErrors: exitCode !== 0 || stderr.length > 0,
      hasWarnings: false,
      insights: [] as string[],
      suggestions: [] as string[],
      patterns: [] as string[]
    };

    // 检测常见错误模式
    const errorPatterns = [
      { pattern: /ENOENT|command not found/i, suggestion: "Command not found. Check if the command is installed and in PATH." },
      { pattern: /EACCES|permission denied/i, suggestion: "Permission denied. Try running with appropriate permissions." },
      { pattern: /EADDRINUSE|port.*already in use/i, suggestion: "Port already in use. Try a different port or kill the existing process." },
      { pattern: /npm ERR!/i, suggestion: "NPM error detected. Try 'npm cache clean --force' or delete node_modules and reinstall." },
      { pattern: /Module not found|Cannot resolve module/i, suggestion: "Module not found. Check if dependencies are installed with 'npm install'." },
      { pattern: /SyntaxError|Unexpected token/i, suggestion: "Syntax error detected. Check the code for syntax issues." },
      { pattern: /ECONNREFUSED|connection refused/i, suggestion: "Connection refused. Check if the target service is running." }
    ];

    // 检测警告模式
    const warningPatterns = [
      /deprecated|deprecation/i,
      /warning:/i,
      /outdated/i
    ];

    const output = stdout + stderr;

    // 分析错误
    errorPatterns.forEach(({ pattern, suggestion }) => {
      if (pattern.test(output)) {
        analysis.suggestions.push(suggestion);
        analysis.patterns.push(pattern.source);
      }
    });

    // 分析警告
    warningPatterns.forEach(pattern => {
      if (pattern.test(output)) {
        analysis.hasWarnings = true;
        analysis.patterns.push(pattern.source);
      }
    });

    // 生成洞察
    if (command.includes('npm') && output.includes('added') && output.includes('packages')) {
      analysis.insights.push("NPM packages installed successfully");
    }

    if (command.includes('git') && output.includes('commit')) {
      analysis.insights.push("Git operation completed");
    }

    if (command.includes('test') && output.includes('passed')) {
      analysis.insights.push("Tests executed successfully");
    }

    return analysis;
  }
}

export const installRunTerminalCommandTool: ToolLike = (installer) => {
  installer("run-terminal-command", "Execute shell commands with advanced process management, interactive capabilities, real-time monitoring, and intelligent output analysis", {
    command: z.string().describe("The command to execute (e.g., 'npm start', 'git status', 'python script.py')"),
    args: z.array(z.string()).optional().describe("Command arguments as array for better security"),
    working_directory: z.string().optional().describe("Working directory for command execution (relative to workspace)"),

    // 执行控制
    timeout: z.number().optional().describe("Command timeout in milliseconds (default: 30000, max: 300000)"),
    interactive: z.boolean().optional().describe("Run as interactive process for long-running commands (default: false)"),
    background: z.boolean().optional().describe("Run in background without blocking (default: false)"),

    // 输出控制
    capture_output: z.boolean().optional().describe("Capture and return command output (default: true)"),
    stream_output: z.boolean().optional().describe("Stream output in real-time for long commands (default: false)"),
    max_output_lines: z.number().optional().describe("Maximum output lines to capture (default: 1000)"),

    // 环境和安全
    environment: z.record(z.string()).optional().describe("Additional environment variables (filtered for security)"),
    shell: z.boolean().optional().describe("Run command in shell (default: false for security)"),

    // 调试和预览
    dry_run: z.boolean().optional().describe("Show what command would be executed without running it (default: false)"),
    verbose: z.boolean().optional().describe("Include detailed execution information (default: false)"),

    // 智能分析
    analyze_output: z.boolean().optional().describe("Analyze output for errors, warnings, and insights (default: true)"),
    suggest_fixes: z.boolean().optional().describe("Suggest fixes for common errors (default: true)")
  }, async ({
    command,
    args = [],
    working_directory,
    timeout = 30000,
    interactive = false,
    background = false,
    capture_output = true,
    stream_output = false,
    max_output_lines = 1000,
    environment = {},
    shell = false,
    dry_run = false,
    verbose = false,
    analyze_output = true,
    suggest_fixes = true
  }: {
    command: string;
    args?: string[];
    working_directory?: string;
    timeout?: number;
    interactive?: boolean;
    background?: boolean;
    capture_output?: boolean;
    stream_output?: boolean;
    max_output_lines?: number;
    environment?: Record<string, string>;
    shell?: boolean;
    dry_run?: boolean;
    verbose?: boolean;
    analyze_output?: boolean;
    suggest_fixes?: boolean;
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
        interactive: interactive,
        background: background,
        shell: shell,
        dry_run: dry_run,
        verbose: verbose,
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
              const chunk = data.toString();
              stdout += chunk;

              // 限制输出长度
              const lines = stdout.split('\n');
              if (lines.length > max_output_lines) {
                stdout = lines.slice(-max_output_lines).join('\n');
              }

              // 实时流输出（如果启用）
              if (stream_output && verbose) {
                console.log(`[STDOUT] ${chunk.trim()}`);
              }
            });

            childProcess.stderr.on('data', (data) => {
              const chunk = data.toString();
              stderr += chunk;

              // 限制错误输出长度
              const lines = stderr.split('\n');
              if (lines.length > max_output_lines) {
                stderr = lines.slice(-max_output_lines).join('\n');
              }

              // 实时流错误输出（如果启用）
              if (stream_output && verbose) {
                console.error(`[STDERR] ${chunk.trim()}`);
              }
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

      // 智能输出分析
      let analysis = null;
      if (analyze_output && capture_output) {
        analysis = OutputAnalyzer.analyzeOutput(
          result.stdout,
          result.stderr,
          fullCommand,
          result.exit_code
        );
      }

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
          stderr_lines: capture_output ? result.stderr.split('\n').length : 0,
          output_truncated: capture_output && result.stdout.split('\n').length >= max_output_lines
        },
        analysis: analysis && suggest_fixes ? {
          has_errors: analysis.hasErrors,
          has_warnings: analysis.hasWarnings,
          insights: analysis.insights,
          suggestions: analysis.suggestions,
          detected_patterns: analysis.patterns
        } : null,
        performance: {
          execution_time_category: result.execution_time < 1000 ? 'fast' :
                                  result.execution_time < 10000 ? 'normal' : 'slow',
          memory_efficient: result.stdout.length < 10000,
          timeout_risk: result.execution_time > (timeout * 0.8)
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
