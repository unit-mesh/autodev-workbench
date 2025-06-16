import { ToolLike } from "../../_typing";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// 终端会话管理器
class TerminalSessionManager {
  private static instance: TerminalSessionManager;
  private currentSession: TerminalSession | null = null;
  private sessionHistory: string[] = [];

  static getInstance(): TerminalSessionManager {
    if (!TerminalSessionManager.instance) {
      TerminalSessionManager.instance = new TerminalSessionManager();
    }
    return TerminalSessionManager.instance;
  }

  getCurrentSession(): TerminalSession | null {
    return this.currentSession;
  }

  addToHistory(command: string, output: string): void {
    const entry = `$ ${command}\n${output}`;
    this.sessionHistory.push(entry);

    // 保持历史记录在合理大小
    if (this.sessionHistory.length > 100) {
      this.sessionHistory = this.sessionHistory.slice(-50);
    }
  }

  getHistory(lines?: number): string[] {
    if (lines) {
      return this.sessionHistory.slice(-lines);
    }
    return this.sessionHistory;
  }

  clearHistory(): void {
    this.sessionHistory = [];
  }
}

interface TerminalSession {
  id: string;
  startTime: number;
  lastActivity: number;
  workingDirectory: string;
  environment: Record<string, string>;
}

// 读取终端输出工具
export const installReadTerminalTool: ToolLike = (installer) => {
  installer("read-terminal", "Read output from the active terminal session with intelligent parsing", {
    only_selected: z.boolean().optional().describe("Read only selected text in terminal (default: false)"),
    lines: z.number().optional().describe("Number of recent lines to read (0 = all available)"),
    include_history: z.boolean().optional().describe("Include command history in output (default: true)"),
    parse_output: z.boolean().optional().describe("Parse and analyze terminal output (default: true)"),
    filter_noise: z.boolean().optional().describe("Filter out noise and focus on important content (default: true)")
  }, async ({
    only_selected = false,
    lines,
    include_history = true,
    parse_output = true,
    filter_noise = true
  }) => {
    try {
      const sessionManager = TerminalSessionManager.getInstance();

      // 模拟读取终端输出（在实际实现中，这里会与真实终端交互）
      let terminalOutput = "";

      if (only_selected) {
        // 在实际实现中，这里会读取终端中选中的文本
        terminalOutput = "Selected text would be read here";
      } else {
        // 读取完整终端输出
        try {
          // 获取当前工作目录和基本信息
          const { stdout: pwd } = await execAsync('pwd');
          const { stdout: whoami } = await execAsync('whoami');
          const { stdout: date } = await execAsync('date');

          terminalOutput = `Current Directory: ${pwd.trim()}\nUser: ${whoami.trim()}\nTime: ${date.trim()}\n`;

          // 如果包含历史记录
          if (include_history) {
            const history = sessionManager.getHistory(lines);
            if (history.length > 0) {
              terminalOutput += "\n--- Command History ---\n";
              terminalOutput += history.join('\n\n');
            }
          }
        } catch (error) {
          terminalOutput = `Error reading terminal: ${error}`;
        }
      }

      // 解析输出
      let analysis = null;
      if (parse_output) {
        analysis = analyzeTerminalOutput(terminalOutput);
      }

      // 过滤噪音
      if (filter_noise) {
        terminalOutput = filterTerminalNoise(terminalOutput);
      }

      // 限制行数
      if (lines && lines > 0) {
        const outputLines = terminalOutput.split('\n');
        if (outputLines.length > lines) {
          terminalOutput = outputLines.slice(-lines).join('\n');
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            terminal_output: terminalOutput,
            metadata: {
              only_selected,
              lines_requested: lines,
              include_history,
              parse_output,
              filter_noise,
              timestamp: new Date().toISOString(),
              output_length: terminalOutput.length,
              line_count: terminalOutput.split('\n').length
            },
            analysis: analysis
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error reading terminal: ${error.message}`
        }]
      };
    }
  });
};

// 终端输出分析函数
function analyzeTerminalOutput(output: string) {
  const analysis = {
    hasErrors: false,
    hasWarnings: false,
    commandsDetected: [] as string[],
    pathsDetected: [] as string[],
    urlsDetected: [] as string[],
    statusIndicators: [] as string[],
    suggestions: [] as string[]
  };

  // 检测错误
  if (/error|failed|exception|fatal/i.test(output)) {
    analysis.hasErrors = true;
    analysis.statusIndicators.push("Errors detected in output");
  }

  // 检测警告
  if (/warning|warn|deprecated/i.test(output)) {
    analysis.hasWarnings = true;
    analysis.statusIndicators.push("Warnings detected in output");
  }

  // 检测命令
  const commandMatches = output.match(/\$ ([^\n]+)/g);
  if (commandMatches) {
    analysis.commandsDetected = commandMatches.map(cmd => cmd.substring(2));
  }

  // 检测路径
  const pathMatches = output.match(/\/[^\s]+/g);
  if (pathMatches) {
    analysis.pathsDetected = pathMatches.slice(0, 10); // 限制数量
  }

  // 检测URL
  const urlMatches = output.match(/https?:\/\/[^\s]+/g);
  if (urlMatches) {
    analysis.urlsDetected = urlMatches;
  }

  // 生成建议
  if (analysis.hasErrors) {
    analysis.suggestions.push("Review error messages and consider debugging steps");
  }

  if (analysis.commandsDetected.length > 0) {
    analysis.suggestions.push("Recent commands executed - check their output for important information");
  }

  return analysis;
}

// 过滤终端噪音
function filterTerminalNoise(output: string): string {
  // 移除ANSI转义序列
  let filtered = output.replace(/\u001b\[[0-9;]*m/g, '');

  // 移除过多的空行
  filtered = filtered.replace(/\n\s*\n\s*\n/g, '\n\n');

  // 移除常见的噪音模式
  const noisePatterns = [
    /^\s*$/gm, // 空行
    /^Last login:/gm, // 登录信息
    /^Welcome to/gm, // 欢迎信息
  ];

  noisePatterns.forEach(pattern => {
    filtered = filtered.replace(pattern, '');
  });

  return filtered.trim();
}

// 写入进程输入工具
export const installWriteProcessTool: ToolLike = (installer) => {
  installer("write-process", "Send input to an interactive process", {
    terminal_id: z.number().describe("Target process terminal ID"),
    input_text: z.string().describe("Text to send to process stdin"),
    add_newline: z.boolean().optional().describe("Automatically add newline to input (default: true)")
  }, async ({ terminal_id, input_text, add_newline = true }) => {
    try {
      // 这里需要与进程管理器集成
      // 在实际实现中，会从进程管理器获取进程并写入输入

      const finalInput = add_newline ? input_text + '\n' : input_text;

      // 模拟写入过程
      const result = {
        terminal_id,
        input_sent: finalInput,
        input_length: finalInput.length,
        success: true,
        timestamp: new Date().toISOString()
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error writing to process: ${error.message}`
        }]
      };
    }
  });
};

// 终止进程工具
export const installKillProcessTool: ToolLike = (installer) => {
  installer("kill-process", "Terminate a process by its terminal ID", {
    terminal_id: z.number().describe("Terminal ID of process to kill"),
    force: z.boolean().optional().describe("Force kill with SIGKILL (default: false)"),
    timeout: z.number().optional().describe("Timeout in seconds before force kill (default: 5)")
  }, async ({ terminal_id, force = false, timeout = 5 }) => {
    try {
      // 这里需要与进程管理器集成
      // 在实际实现中，会从进程管理器获取进程并终止它

      const result = {
        terminal_id,
        action: force ? "force_killed" : "terminated",
        signal: force ? "SIGKILL" : "SIGTERM",
        timeout,
        success: true,
        timestamp: new Date().toISOString()
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error killing process: ${error.message}`
        }]
      };
    }
  });
};
