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
}
