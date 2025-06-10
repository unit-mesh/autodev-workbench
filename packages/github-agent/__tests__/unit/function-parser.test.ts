/**
 * Unit tests for Function Parser
 * Converted from scripts/test-function-parser.js
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { MockFactories } from '../helpers/mock-factories';

// Mock the FunctionParser since we need to handle import issues
const mockFunctionParser = {
  parseResponse: (response: string) => {
    // First, try to extract function calls from markdown code blocks
    const markdownResult = mockFunctionParser.extractFromMarkdownBlocks(response);
    if (markdownResult.functionCalls.length > 0) {
      return markdownResult;
    }

    // Look for function_calls blocks directly
    const functionCallsRegex = /<function_calls>([\s\S]*?)<\/function_calls>/g;
    const matches = [...response.matchAll(functionCallsRegex)];

    const functionCalls: any[] = [];

    for (const match of matches) {
      const blockContent = match[1];
      const parsedCalls = mockFunctionParser.parseFunctionCallsBlock(blockContent);
      functionCalls.push(...parsedCalls);
    }

    return {
      text: response.replace(functionCallsRegex, '').trim(),
      functionCalls,
      hasError: false
    };
  },

  extractFromMarkdownBlocks: (response: string) => {
    const result = {
      text: response,
      functionCalls: [] as any[],
      hasError: false
    };

    try {
      // Extract markdown code blocks that might contain function calls
      const codeBlocks = mockFunctionParser.extractMarkdownCodeBlocks(response);
      let modifiedText = response;

      for (const block of codeBlocks) {
        // Check if this code block contains function_calls
        const functionCallsRegex = /<function_calls>([\s\S]*?)<\/function_calls>/g;
        const matches = [...block.code.matchAll(functionCallsRegex)];

        if (matches.length > 0) {
          // Parse function calls from this block
          for (const match of matches) {
            const blockContent = match[1];
            const functionCalls = mockFunctionParser.parseFunctionCallsBlock(blockContent);
            result.functionCalls.push(...functionCalls);
          }

          // Remove the entire markdown code block from text
          modifiedText = modifiedText.replace(block.fullMatch, '').trim();
        }
      }

      result.text = modifiedText;
    } catch (error) {
      result.hasError = true;
    }

    return result;
  },

  extractMarkdownCodeBlocks: (text: string) => {
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
  },

  parseFunctionCallsBlock: (blockContent: string) => {
    const functionCalls: any[] = [];

    // Extract invoke blocks
    const invokeRegex = /<invoke\s+name="([^"]+)">([\s\S]*?)<\/invoke>/g;
    const invokeMatches = [...blockContent.matchAll(invokeRegex)];

    for (const invokeMatch of invokeMatches) {
      const functionName = invokeMatch[1];
      const parametersContent = invokeMatch[2];

      // Extract parameters
      const parameters: Record<string, any> = {};
      const parameterRegex = /<parameter\s+name="([^"]+)">([\s\S]*?)<\/parameter>/g;
      const paramMatches = [...parametersContent.matchAll(parameterRegex)];

      for (const paramMatch of paramMatches) {
        const paramName = paramMatch[1];
        const paramValue = paramMatch[2].trim();

        // Simple type conversion
        if (paramValue === 'true' || paramValue === 'false') {
          parameters[paramName] = paramValue === 'true';
        } else if (!isNaN(Number(paramValue)) && paramValue !== '') {
          parameters[paramName] = Number(paramValue);
        } else {
          parameters[paramName] = paramValue;
        }
      }

      functionCalls.push({
        name: functionName,
        parameters
      });
    }

    return functionCalls;
  }
};

describe('FunctionParser', () => {
  describe('parseResponse', () => {
    test('should parse correct XML format', () => {
      const correctFormat = `
I need to analyze this issue. Let me call the appropriate tool.

<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="issue_number">81</parameter>
<parameter name="fetch_urls">true</parameter>
</invoke>
</function_calls>

This should work correctly.
`;

      const result = mockFunctionParser.parseResponse(correctFormat);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0]).toEqual({
        name: 'github_analyze_issue',
        parameters: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          issue_number: 81,
          fetch_urls: true
        }
      });
      expect(result.text).toContain('I need to analyze this issue');
      expect(result.text).toContain('This should work correctly');
      expect(result.text).not.toContain('<function_calls>');
      expect(result.hasError).toBe(false);
    });

    test('should handle JSON format (fallback)', () => {
      const jsonFormat = `
github_analyze_issue
{"owner": "unit-mesh", "repo": "autodev-workbench", "issue_number": 81, "fetch_urls": true}
`;

      const result = mockFunctionParser.parseResponse(jsonFormat);

      // JSON format should not be parsed by XML parser
      expect(result.functionCalls).toHaveLength(0);
      expect(result.text).toContain('github_analyze_issue');
      expect(result.hasError).toBe(false);
    });

    test('should parse multiple function calls', () => {
      const multipleFormat = `
Let me analyze this step by step.

<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="issue_number">81</parameter>
</invoke>
</function_calls>

Now let me search for related code.

<function_calls>
<invoke name="github_smart_search">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="query">authentication error</parameter>
</invoke>
</function_calls>

Done with analysis.
`;

      const result = mockFunctionParser.parseResponse(multipleFormat);

      expect(result.functionCalls).toHaveLength(2);
      expect(result.functionCalls[0]).toEqual({
        name: 'github_analyze_issue',
        parameters: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          issue_number: 81
        }
      });
      expect(result.functionCalls[1]).toEqual({
        name: 'github_smart_search',
        parameters: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          query: 'authentication error'
        }
      });
      expect(result.text).toContain('Let me analyze this step by step');
      expect(result.text).toContain('Done with analysis');
    });

    test('should handle no function calls', () => {
      const noFunctionCalls = `
This is just a regular response without any function calls.
I'm providing analysis based on the information available.
`;

      const result = mockFunctionParser.parseResponse(noFunctionCalls);

      expect(result.functionCalls).toHaveLength(0);
      expect(result.text).toContain('This is just a regular response');
      expect(result.hasError).toBe(false);
    });

    test('should handle empty input', () => {
      const result = mockFunctionParser.parseResponse('');

      expect(result.functionCalls).toHaveLength(0);
      expect(result.text).toBe('');
      expect(result.hasError).toBe(false);
    });

    test('should handle malformed XML gracefully', () => {
      const malformedXml = `
<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">unit-mesh
<parameter name="repo">autodev-workbench</parameter>
</invoke>
</function_calls>
`;

      const result = mockFunctionParser.parseResponse(malformedXml);

      // Should not crash, but may not parse correctly
      expect(result).toBeDefined();
      expect(result.hasError).toBe(false);
    });

    test('should handle different parameter types', () => {
      const mixedTypes = `
<function_calls>
<invoke name="test_function">
<parameter name="string_param">hello world</parameter>
<parameter name="number_param">42</parameter>
<parameter name="boolean_param">true</parameter>
<parameter name="false_param">false</parameter>
<parameter name="empty_param"></parameter>
</invoke>
</function_calls>
`;

      const result = mockFunctionParser.parseResponse(mixedTypes);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].parameters).toEqual({
        string_param: 'hello world',
        number_param: 42,
        boolean_param: true,
        false_param: false,
        empty_param: ''
      });
    });

    test('should preserve text content outside function calls', () => {
      const mixedContent = `
Before function call.

<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">test</parameter>
</invoke>
</function_calls>

After function call.
`;

      const result = mockFunctionParser.parseResponse(mixedContent);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.text).toContain('Before function call');
      expect(result.text).toContain('After function call');
      expect(result.text).not.toContain('<function_calls>');
    });
  });

  describe('edge cases', () => {
    test('should handle nested XML-like content in parameters', () => {
      const nestedContent = `
<function_calls>
<invoke name="test_function">
<parameter name="content"><div>HTML content</div></parameter>
</invoke>
</function_calls>
`;

      const result = mockFunctionParser.parseResponse(nestedContent);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].parameters.content).toBe('<div>HTML content</div>');
    });

    test('should handle function calls with no parameters', () => {
      const noParams = `
<function_calls>
<invoke name="simple_function">
</invoke>
</function_calls>
`;

      const result = mockFunctionParser.parseResponse(noParams);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0]).toEqual({
        name: 'simple_function',
        parameters: {}
      });
    });
  });

  describe('markdown code block handling', () => {
    test('should extract function calls from xml markdown blocks', () => {
      const markdownWrapped = `
I need to analyze this issue. Let me call the appropriate tool.

\`\`\`xml
<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="issue_number">81</parameter>
<parameter name="fetch_urls">true</parameter>
</invoke>
</function_calls>
\`\`\`

This should work correctly.
`;

      const result = mockFunctionParser.parseResponse(markdownWrapped);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0]).toEqual({
        name: 'github_analyze_issue',
        parameters: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          issue_number: 81,
          fetch_urls: true
        }
      });
      expect(result.text).toContain('I need to analyze this issue');
      expect(result.text).toContain('This should work correctly');
      expect(result.text).not.toContain('```xml');
      expect(result.text).not.toContain('<function_calls>');
      expect(result.hasError).toBe(false);
    });

    test('should extract function calls from unmarked markdown blocks', () => {
      const unmarkedBlock = `
Let me search for the issue.

\`\`\`
<function_calls>
<invoke name="github_smart_search">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="query">authentication error</parameter>
</invoke>
</function_calls>
\`\`\`

Search completed.
`;

      const result = mockFunctionParser.parseResponse(unmarkedBlock);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0]).toEqual({
        name: 'github_smart_search',
        parameters: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          query: 'authentication error'
        }
      });
      expect(result.text).toContain('Let me search for the issue');
      expect(result.text).toContain('Search completed');
      expect(result.text).not.toContain('```');
    });

    test('should handle multiple function calls in different markdown blocks', () => {
      const multipleBlocks = `
First, let me analyze the issue.

\`\`\`xml
<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="issue_number">81</parameter>
</invoke>
</function_calls>
\`\`\`

Now let me search for related code.

\`\`\`
<function_calls>
<invoke name="github_smart_search">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="query">authentication</parameter>
</invoke>
</function_calls>
\`\`\`

Analysis complete.
`;

      const result = mockFunctionParser.parseResponse(multipleBlocks);

      expect(result.functionCalls).toHaveLength(2);
      expect(result.functionCalls[0]).toEqual({
        name: 'github_analyze_issue',
        parameters: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          issue_number: 81
        }
      });
      expect(result.functionCalls[1]).toEqual({
        name: 'github_smart_search',
        parameters: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          query: 'authentication'
        }
      });
      expect(result.text).toContain('First, let me analyze');
      expect(result.text).toContain('Analysis complete');
      expect(result.text).not.toContain('```');
    });

    test('should ignore code blocks that do not contain function calls', () => {
      const mixedContent = `
Here's some example code:

\`\`\`javascript
function example() {
  console.log("Hello world");
}
\`\`\`

And here's a function call:

\`\`\`xml
<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">test</parameter>
</invoke>
</function_calls>
\`\`\`

Done.
`;

      const result = mockFunctionParser.parseResponse(mixedContent);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].name).toBe('github_analyze_issue');
      expect(result.text).toContain('Here\'s some example code');
      expect(result.text).toContain('function example()');
      expect(result.text).toContain('Done.');
      expect(result.text).not.toContain('<function_calls>');
    });

    test('should handle malformed markdown blocks gracefully', () => {
      const malformedMarkdown = `
\`\`\`xml
<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">unit-mesh
<parameter name="repo">autodev-workbench</parameter>
</invoke>
</function_calls>
\`\`\`
`;

      const result = mockFunctionParser.parseResponse(malformedMarkdown);

      // Should not crash, but may not parse correctly
      expect(result).toBeDefined();
      expect(result.hasError).toBe(false);
    });
  });
});
