/**
 * Function Call Parser for AI Agent
 * Parses LLM responses containing function calls in XML format
 */

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

export class FunctionParser {
  /**
   * Parse LLM response for function calls
   */
  static parseResponse(response: string): ParsedResponse {
    const result: ParsedResponse = {
      text: response,
      functionCalls: [],
      hasError: false
    };

    try {
      // Extract function_calls blocks
      const functionCallsRegex = /<function_calls>([\s\S]*?)<\/function_calls>/g;
      const matches = [...response.matchAll(functionCallsRegex)];

      if (matches.length === 0) {
        // Try fallback JSON format parsing
        const jsonResult = this.parseJSONFormat(response);
        if (jsonResult.functionCalls.length > 0) {
          return jsonResult;
        }

        // No function calls found - this is normal for text-only responses
        return result;
      }

      // Parse each function_calls block
      for (const match of matches) {
        const blockContent = match[1];
        const functionCalls = this.parseFunctionCallsBlock(blockContent);
        result.functionCalls.push(...functionCalls);
      }

      // Remove function_calls blocks from text for cleaner output
      result.text = response.replace(functionCallsRegex, '').trim();

    } catch (error) {
      result.hasError = true;
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Parse individual function_calls block content
   */
  private static parseFunctionCallsBlock(blockContent: string): FunctionCall[] {
    const functionCalls: FunctionCall[] = [];
    
    // Extract invoke blocks
    const invokeRegex = /<invoke\s+name="([^"]+)">([\s\S]*?)<\/invoke>/g;
    const matches = [...blockContent.matchAll(invokeRegex)];

    for (const match of matches) {
      const functionName = match[1];
      const parametersContent = match[2];
      
      try {
        const parameters = this.parseParameters(parametersContent);
        functionCalls.push({
          name: functionName,
          parameters
        });
      } catch (error) {
        console.warn(`Failed to parse parameters for function ${functionName}:`, error);
        // Continue with other function calls even if one fails
      }
    }

    return functionCalls;
  }

  /**
   * Parse parameters from invoke block content
   */
  private static parseParameters(parametersContent: string): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Extract parameter blocks
    const parameterRegex = /<parameter\s+name="([^"]+)">([\s\S]*?)<\/parameter>/g;
    const matches = [...parametersContent.matchAll(parameterRegex)];

    for (const match of matches) {
      const paramName = match[1];
      const paramValue = match[2].trim();
      
      // Try to parse as JSON first, fallback to string
      try {
        // Check if it looks like JSON (starts with { or [)
        if (paramValue.startsWith('{') || paramValue.startsWith('[')) {
          parameters[paramName] = JSON.parse(paramValue);
        } else if (paramValue === 'true' || paramValue === 'false') {
          parameters[paramName] = paramValue === 'true';
        } else if (!isNaN(Number(paramValue)) && paramValue !== '') {
          parameters[paramName] = Number(paramValue);
        } else {
          parameters[paramName] = paramValue;
        }
      } catch {
        // If JSON parsing fails, treat as string
        parameters[paramName] = paramValue;
      }
    }

    return parameters;
  }

  /**
   * Validate function call against available tools
   */
  static validateFunctionCall(
    functionCall: FunctionCall, 
    availableTools: string[]
  ): { isValid: boolean; error?: string } {
    if (!availableTools.includes(functionCall.name)) {
      return {
        isValid: false,
        error: `Unknown function: ${functionCall.name}. Available functions: ${availableTools.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Format function call for debugging
   */
  static formatFunctionCall(functionCall: FunctionCall): string {
    return `${functionCall.name}(${JSON.stringify(functionCall.parameters, null, 2)})`;
  }

  /**
   * Extract text content without function calls
   */
  static extractTextOnly(response: string): string {
    return response.replace(/<function_calls>[\s\S]*?<\/function_calls>/g, '').trim();
  }

  /**
   * Check if response contains function calls
   */
  static hasFunctionCalls(response: string): boolean {
    return /<function_calls>[\s\S]*?<\/function_calls>/.test(response);
  }

  /**
   * Parse JSON format function calls (fallback for models that don't follow XML)
   * Looks for patterns like:
   * function_name
   * {"param1": "value1", "param2": "value2"}
   */
  private static parseJSONFormat(response: string): ParsedResponse {
    const functionCalls: FunctionCall[] = [];
    let text = response;

    // Look for patterns like:
    // function_name
    // {"param1": "value1", "param2": "value2"}
    const lines = response.split('\n');

    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1].trim();

      // Check if current line looks like a function name and next line looks like JSON
      if (this.isValidFunctionName(currentLine) && this.looksLikeJSON(nextLine)) {
        try {
          const parameters = JSON.parse(nextLine);

          // Validate that parameters is an object
          if (typeof parameters === 'object' && parameters !== null && !Array.isArray(parameters)) {
            functionCalls.push({
              name: currentLine,
              parameters
            });

            // Remove these lines from text
            text = text.replace(currentLine, '').replace(nextLine, '').trim();
          }
        } catch (error) {
          // JSON parsing failed, continue
        }
      }
    }

    return {
      text: text.trim(),
      functionCalls,
      hasError: false
    };
  }

  /**
   * Check if a string looks like a valid function name
   */
  private static isValidFunctionName(str: string): boolean {
    // Import the tool registry to check valid function names
    const { MCPToolFactory } = require('../capabilities/tools/tool-factory');

    // Function names should be alphanumeric with underscores/hyphens, no spaces
    const validFormat = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(str);

    // Check against registered tools (including aliases for backward compatibility)
    const isRegisteredTool = MCPToolFactory.isValidToolName(str);

    return validFormat && isRegisteredTool;
  }

  /**
   * Check if a string looks like JSON
   */
  private static looksLikeJSON(str: string): boolean {
    return str.startsWith('{') && str.endsWith('}');
  }
}
