import { ToolLike } from "../_typing";
import { z } from "zod";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";

// 全局进程管理器
class GlobalProcessManager {
  private static instance: GlobalProcessManager;
  private processes: Map<number, ManagedProcess> = new Map();
  private nextId = 1;

  static getInstance(): GlobalProcessManager {
    if (!GlobalProcessManager.instance) {
      GlobalProcessManager.instance = new GlobalProcessManager();
    }
    return GlobalProcessManager.instance;
  }

  launchProcess(command: string, options: LaunchOptions): number {
    const id = this.nextId++;
    const process = new ManagedProcess(id, command, options);
    this.processes.set(id, process);
    return id;
  }

  getProcess(id: number): ManagedProcess | undefined {
    return this.processes.get(id);
  }

  getAllProcesses(): ProcessSummary[] {
    return Array.from(this.processes.values()).map(p => p.getSummary());
  }

  killProcess(id: number): boolean {
    const process = this.processes.get(id);
    if (process) {
      process.kill();
      return true;
    }
    return false;
  }

  cleanup(): void {
    this.processes.forEach(process => process.kill());
    this.processes.clear();
  }
}

interface LaunchOptions {
  cwd?: string;
  env?: Record<string, string>;
  wait: boolean;
  maxWaitSeconds: number;
}

interface ProcessSummary {
  terminal_id: number;
  command: string;
  status: 'running' | 'completed' | 'failed' | 'killed';
  start_time: string;
  end_time?: string;
  exit_code?: number;
  execution_time_ms?: number;
  output_lines: number;
  error_lines: number;
}

class ManagedProcess {
  private childProcess?: ChildProcess;
  private outputBuffer: string[] = [];
  private errorBuffer: string[] = [];
  private startTime: number;
  private endTime?: number;
  private status: 'running' | 'completed' | 'failed' | 'killed' = 'running';
  private exitCode?: number;

  constructor(
    public readonly id: number,
    public readonly command: string,
    private options: LaunchOptions
  ) {
    this.startTime = Date.now();
    this.launch();
  }

  private launch(): void {
    const [cmd, ...args] = this.command.split(' ');
    
    this.childProcess = spawn(cmd, args, {
      cwd: this.options.cwd,
      env: { ...process.env, ...this.options.env },
      stdio: 'pipe'
    });

    this.childProcess.stdout?.on('data', (data) => {
      this.outputBuffer.push(data.toString());
    });

    this.childProcess.stderr?.on('data', (data) => {
      this.errorBuffer.push(data.toString());
    });

    this.childProcess.on('exit', (code) => {
      this.endTime = Date.now();
      this.exitCode = code || 0;
      this.status = code === 0 ? 'completed' : 'failed';
    });

    this.childProcess.on('error', () => {
      this.endTime = Date.now();
      this.status = 'failed';
    });
  }

  getOutput(): string {
    return this.outputBuffer.join('');
  }

  getErrors(): string {
    return this.errorBuffer.join('');
  }

  writeInput(input: string): boolean {
    if (this.childProcess && this.status === 'running') {
      this.childProcess.stdin?.write(input);
      return true;
    }
    return false;
  }

  kill(): void {
    if (this.childProcess && this.status === 'running') {
      this.childProcess.kill('SIGTERM');
      this.status = 'killed';
      this.endTime = Date.now();
    }
  }

  getSummary(): ProcessSummary {
    return {
      terminal_id: this.id,
      command: this.command,
      status: this.status,
      start_time: new Date(this.startTime).toISOString(),
      end_time: this.endTime ? new Date(this.endTime).toISOString() : undefined,
      exit_code: this.exitCode,
      execution_time_ms: this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime,
      output_lines: this.outputBuffer.length,
      error_lines: this.errorBuffer.length
    };
  }
}

// 启动进程工具
export const installLaunchProcessTool: ToolLike = (installer) => {
  installer("launch-process", "Launch processes with advanced control (background/interactive modes)", {
    command: z.string().describe("Shell command to execute"),
    wait: z.boolean().describe("Wait for completion (true) or run in background (false)"),
    max_wait_seconds: z.number().describe("Maximum wait time for completion"),
    cwd: z.string().optional().describe("Working directory for command execution"),
    env: z.record(z.string()).optional().describe("Environment variables")
  }, async ({ command, wait, max_wait_seconds, cwd, env }) => {
    try {
      const manager = GlobalProcessManager.getInstance();
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const resolvedCwd = cwd ? path.resolve(workspacePath, cwd) : workspacePath;

      const processId = manager.launchProcess(command, {
        cwd: resolvedCwd,
        env,
        wait,
        maxWaitSeconds: max_wait_seconds
      });

      if (wait) {
        // 等待进程完成
        const process = manager.getProcess(processId)!;
        const startTime = Date.now();
        
        while (process.getSummary().status === 'running' && 
               (Date.now() - startTime) < max_wait_seconds * 1000) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const summary = manager.getProcess(processId)?.getSummary();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            terminal_id: processId,
            command,
            wait,
            process_summary: summary
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error launching process: ${error.message}`
        }]
      };
    }
  });
};

// 列出进程工具
export const installListProcessesTool: ToolLike = (installer) => {
  installer("list-processes", "List all active processes launched by the agent", {
    filter: z.enum(["all", "running", "completed", "failed"]).optional().describe("Filter processes by status")
  }, async ({ filter = "all" }) => {
    try {
      const manager = GlobalProcessManager.getInstance();
      let processes = manager.getAllProcesses();
      
      if (filter !== "all") {
        processes = processes.filter(p => p.status === filter);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            filter,
            total_processes: processes.length,
            processes
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error listing processes: ${error.message}`
        }]
      };
    }
  });
};

// 读取进程输出工具
export const installReadProcessTool: ToolLike = (installer) => {
  installer("read-process", "Read output from a specific process", {
    terminal_id: z.number().describe("Process terminal ID to read from"),
    wait: z.boolean().describe("Wait for new output if process still running"),
    max_wait_seconds: z.number().describe("Maximum time to wait for output")
  }, async ({ terminal_id, wait, max_wait_seconds }) => {
    try {
      const manager = GlobalProcessManager.getInstance();
      const process = manager.getProcess(terminal_id);
      
      if (!process) {
        return {
          content: [{
            type: "text",
            text: `Error: Process with terminal_id ${terminal_id} not found`
          }]
        };
      }

      if (wait && process.getSummary().status === 'running') {
        const startTime = Date.now();
        while (process.getSummary().status === 'running' && 
               (Date.now() - startTime) < max_wait_seconds * 1000) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            terminal_id,
            process_summary: process.getSummary(),
            stdout: process.getOutput(),
            stderr: process.getErrors()
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error reading process: ${error.message}`
        }]
      };
    }
  });
};
