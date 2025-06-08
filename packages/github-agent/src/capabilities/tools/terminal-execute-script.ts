import { ToolLike } from "../_typing";
import { z } from "zod";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

export const installExecuteScriptTool: ToolLike = (installer) => {
  installer("execute-script", "Execute a script file (npm scripts, shell scripts, Python scripts, etc.)", {
    script_type: z.enum(["npm", "yarn", "python", "node", "shell", "custom"]).describe("Type of script to execute"),
    script_name: z.string().describe("Script name (for npm/yarn) or script content/file path"),
    script_args: z.array(z.string()).optional().describe("Arguments to pass to the script"),
    working_directory: z.string().optional().describe("Working directory for script execution"),
    timeout: z.number().optional().describe("Script timeout in milliseconds (default: 60000)"),
    environment: z.record(z.string()).optional().describe("Additional environment variables"),
    interpreter: z.string().optional().describe("Custom interpreter for 'custom' script type"),
    dry_run: z.boolean().optional().describe("Show what would be executed without running (default: false)")
  }, async ({ 
    script_type, 
    script_name,
    script_args = [],
    working_directory,
    timeout = 60000,
    environment = {},
    interpreter,
    dry_run = false
  }: { 
    script_type: "npm" | "yarn" | "python" | "node" | "shell" | "custom"; 
    script_name: string;
    script_args?: string[];
    working_directory?: string;
    timeout?: number;
    environment?: Record<string, string>;
    interpreter?: string;
    dry_run?: boolean;
  }) => {
    try {
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

      // Determine command and arguments based on script type
      let command: string;
      let args: string[];
      let fullCommand: string;

      switch (script_type) {
        case "npm":
          // Check if package.json exists
          const packageJsonPath = path.join(resolvedWorkingDir, "package.json");
          if (!fs.existsSync(packageJsonPath)) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: package.json not found in ${resolvedWorkingDir}`
                }
              ]
            };
          }
          
          // Verify script exists in package.json
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
          if (!packageJson.scripts || !packageJson.scripts[script_name]) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Script '${script_name}' not found in package.json. Available scripts: ${Object.keys(packageJson.scripts || {}).join(", ")}`
                }
              ]
            };
          }

          command = "npm";
          args = ["run", script_name, ...script_args];
          fullCommand = `npm run ${script_name} ${script_args.join(" ")}`.trim();
          break;

        case "yarn":
          // Check if package.json exists
          const yarnPackageJsonPath = path.join(resolvedWorkingDir, "package.json");
          if (!fs.existsSync(yarnPackageJsonPath)) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: package.json not found in ${resolvedWorkingDir}`
                }
              ]
            };
          }

          command = "yarn";
          args = [script_name, ...script_args];
          fullCommand = `yarn ${script_name} ${script_args.join(" ")}`.trim();
          break;

        case "python":
          // Check if script file exists (if it's a file path)
          if (script_name.endsWith(".py")) {
            const scriptPath = path.isAbsolute(script_name) ? script_name : path.join(resolvedWorkingDir, script_name);
            if (!fs.existsSync(scriptPath)) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Error: Python script '${script_name}' not found.`
                  }
                ]
              };
            }
          }

          command = "python3";
          args = [script_name, ...script_args];
          fullCommand = `python3 ${script_name} ${script_args.join(" ")}`.trim();
          break;

        case "node":
          // Check if script file exists
          const nodePath = path.isAbsolute(script_name) ? script_name : path.join(resolvedWorkingDir, script_name);
          if (!fs.existsSync(nodePath)) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Node.js script '${script_name}' not found.`
                }
              ]
            };
          }

          command = "node";
          args = [script_name, ...script_args];
          fullCommand = `node ${script_name} ${script_args.join(" ")}`.trim();
          break;

        case "shell":
          // For shell scripts, check if file exists
          const shellPath = path.isAbsolute(script_name) ? script_name : path.join(resolvedWorkingDir, script_name);
          if (!fs.existsSync(shellPath)) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Shell script '${script_name}' not found.`
                }
              ]
            };
          }

          command = "bash";
          args = [script_name, ...script_args];
          fullCommand = `bash ${script_name} ${script_args.join(" ")}`.trim();
          break;

        case "custom":
          if (!interpreter) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Custom script type requires 'interpreter' parameter.`
                }
              ]
            };
          }

          command = interpreter;
          args = [script_name, ...script_args];
          fullCommand = `${interpreter} ${script_name} ${script_args.join(" ")}`.trim();
          break;

        default:
          return {
            content: [
              {
                type: "text",
                text: `Error: Unsupported script type '${script_type}'.`
              }
            ]
          };
      }

      const executionInfo = {
        script_type: script_type,
        script_name: script_name,
        script_args: script_args,
        command: command,
        args: args,
        full_command: fullCommand,
        working_directory: working_directory || ".",
        resolved_working_directory: resolvedWorkingDir,
        timeout: timeout,
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
                message: "Dry run - script was not executed",
                would_execute: fullCommand
              }, null, 2)
            }
          ]
        };
      }

      // Execute script
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

        const childProcess = spawn(command, args, { 
          cwd: resolvedWorkingDir, 
          env: env,
          stdio: 'pipe'
        });

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

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
          stdout: result.stdout,
          stderr: result.stderr,
          stdout_lines: result.stdout.split('\n').length,
          stderr_lines: result.stderr.split('\n').length
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
            text: `Error executing script '${script_name}': ${error.message}`
          }
        ]
      };
    }
  });
};
