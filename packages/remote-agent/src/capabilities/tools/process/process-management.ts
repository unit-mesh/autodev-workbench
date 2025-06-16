import { ToolLike } from "../../_typing";
import { z } from "zod";
import * as path from "path";
import { GlobalProcessManager } from "./global-process-manager";

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

