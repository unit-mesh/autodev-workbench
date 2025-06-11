import { FunctionCall, ParsedResponse } from "./tool-definition";

/**
 * Function Call Parser for AI Agent
 * Parses LLM responses containing function calls in XML format
 */
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
      // First, try to extract function calls from markdown code blocks
      const markdownResult = this.extractFromMarkdownBlocks(response);
      if (markdownResult.functionCalls.length > 0) {
        return markdownResult;
      }

      // Extract function_calls blocks directly from response
      const functionCallsRegex = /<function_calls>([\s\S]*?)<\/function_calls>/g;
      const matches: RegExpExecArray[] = [];
      let match;
      while ((match = functionCallsRegex.exec(response)) !== null) {
        matches.push(match);
      }

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
    const matches: RegExpExecArray[] = [];
    let match;
    while ((match = invokeRegex.exec(blockContent)) !== null) {
      matches.push(match);
    }

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
    const matches: RegExpExecArray[] = [];
    let match;
    while ((match = parameterRegex.exec(parametersContent)) !== null) {
      matches.push(match);
    }

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
    // Function names should be alphanumeric with underscores, no spaces
    // Also check against known function names
    const knownFunctions = [
      'github_analyze_issue',
      'github_smart_search',
      'github_get_issues',
      'github_get_issue_context',
      'github_upload_analysis',
      'github_fetch_url_content'
    ];

    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str) && knownFunctions.includes(str);
  }

  /**
   * Check if a string looks like JSON
   */
  private static looksLikeJSON(str: string): boolean {
    return str.startsWith('{') && str.endsWith('}');
  }

  /**
   * Extract function calls from markdown code blocks
   * Handles cases where LLM wraps function calls in ```xml or ``` blocks
   */
  private static extractFromMarkdownBlocks(response: string): ParsedResponse {
    const result: ParsedResponse = {
      text: response,
      functionCalls: [],
      hasError: false
    };

    try {
      // Extract markdown code blocks that might contain function calls
      const codeBlocks = this.extractMarkdownCodeBlocks(response);
      let modifiedText = response;

      for (const block of codeBlocks) {
        // Check if this code block contains function_calls
        const functionCallsRegex = /<function_calls>([\s\S]*?)<\/function_calls>/g;
        const matches: RegExpExecArray[] = [];
        let match;
        while ((match = functionCallsRegex.exec(block.code)) !== null) {
          matches.push(match);
        }

        if (matches.length > 0) {
          // Parse function calls from this block
          for (const match of matches) {
            const blockContent = match[1];
            const functionCalls = this.parseFunctionCallsBlock(blockContent);
            result.functionCalls.push(...functionCalls);
          }

          // Remove the entire markdown code block from text
          modifiedText = modifiedText.replace(block.fullMatch, '').trim();
        }
      }

      result.text = modifiedText;
    } catch (error) {
      result.hasError = true;
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Extract markdown code blocks from text
   */
  private static extractMarkdownCodeBlocks(text: string): Array<{
    language: string;
    code: string;
    fullMatch: string;
  }> {
    const blocks: Array<{ language: string; code: string; fullMatch: string }> = [];

    // Match markdown code blocks with optional language identifier
    const codeBlockRegex = /```(\w+)?\s*\n?([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'plaintext';
      const code = match[2].trim();
      const fullMatch = match[0];

      // Only consider blocks that might contain XML/function calls
      if (language === 'xml' || language === 'plaintext' || !match[1] || code.includes('<function_calls>')) {
        blocks.push({
          language,
          code,
          fullMatch
        });
      }
    }

    return blocks;
  }
}
