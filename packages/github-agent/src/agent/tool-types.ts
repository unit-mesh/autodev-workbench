import { FunctionCall } from "./function-parser";

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
  functionCall: FunctionCall;
  executionTime?: number;
  round?: number;
}

export interface ToolExecutionContext {
  round: number;
  previousResults: ToolResult[];
  userInput: string;
  workspacePath: string;
}

export interface ToolExecutionStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageExecutionTime: number;
}

export interface ToolExecutionOptions {
  timeout?: number;
  verbose?: boolean;
} 