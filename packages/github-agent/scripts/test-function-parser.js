#!/usr/bin/env node

/**
 * Test Function Parser
 * Tests the function parser with different input formats
 */

const { FunctionParser } = require('../dist/index.js');

console.log('🧪 Testing Function Parser...\n');

// Test 1: Correct XML format
console.log('Test 1: Correct XML format');
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

const result1 = FunctionParser.parseResponse(correctFormat);
console.log('Result 1:', JSON.stringify(result1, null, 2));
console.log('');

// Test 2: JSON format (what LLM is actually returning)
console.log('Test 2: JSON format (what LLM is actually returning)');
const jsonFormat = `
github_analyze_issue
{"owner": "unit-mesh", "repo": "autodev-workbench", "issue_number": 81, "fetch_urls": true}
`;

const result2 = FunctionParser.parseResponse(jsonFormat);
console.log('Result 2:', JSON.stringify(result2, null, 2));
console.log('');

// Test 3: Multiple function calls
console.log('Test 3: Multiple function calls');
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

const result3 = FunctionParser.parseResponse(multipleFormat);
console.log('Result 3:', JSON.stringify(result3, null, 2));
console.log('');

// Test 4: No function calls
console.log('Test 4: No function calls');
const noFunctionCalls = `
This is just a regular response without any function calls.
I'm providing analysis based on the information available.
`;

const result4 = FunctionParser.parseResponse(noFunctionCalls);
console.log('Result 4:', JSON.stringify(result4, null, 2));
console.log('');

console.log('✅ Function Parser tests completed!');
