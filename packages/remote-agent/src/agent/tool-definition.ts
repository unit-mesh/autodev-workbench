export interface ToolDefinition {
	name: string;
	description: string;
	parameters: {
		type: "object";
		properties: Record<string, any>;
		required: string[];
	};
}

export interface ToolResult {
	success: boolean;
	result?: any;
	error?: string;
	functionCall: FunctionCall;
	executionTime?: number;
	round?: number;
}

export interface FunctionCall {
	name: string;
	parameters: Record<string, any>;
}

export interface ParsedResponse {
	text: string;
	functionCalls: FunctionCall[];
	hasError: boolean;
	error?: string;
}

export interface ToolExecutionContext {
  round: number;
  previousResults: ToolResult[];
  userInput: string;
  workspacePath: string;
}

export interface ToolExecutionOptions {
  timeout?: number;
  verbose?: boolean;
}
