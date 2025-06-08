/**
 * Mock factories for creating test data
 */

export class MockFactories {
  /**
   * Create a mock GitHub issue
   */
  static createGitHubIssue(overrides: Partial<any> = {}) {
    return {
      number: 81,
      title: 'Authentication and error handling improvements',
      state: 'open',
      labels: [
        { name: 'bug', color: 'd73a4a' },
        { name: 'enhancement', color: 'a2eeef' }
      ],
      body: `## Description
This issue addresses authentication flow problems and error handling improvements.

## Steps to Reproduce
1. Login with expired token
2. Observe generic error message
3. User gets confused

## Expected Behavior
- Clear error messages
- Automatic token refresh
- Better user experience

## Additional Context
Related to authentication module in src/auth/`,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      comments: 3,
      assignees: [],
      milestone: null,
      user: {
        login: 'testuser',
        id: 12345
      },
      ...overrides
    };
  }

  /**
   * Create a mock tool execution result
   */
  static createToolResult(overrides: Partial<any> = {}) {
    return {
      success: true,
      functionCall: {
        name: 'github_analyze_issue',
        parameters: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          issue_number: 81,
          fetch_urls: true
        }
      },
      result: {
        content: [{
          type: 'text',
          text: `# GitHub Issue Analysis Report

## Issue Details
- **Repository**: unit-mesh/autodev-workbench
- **Issue Number**: #81
- **Analysis Date**: ${new Date().toISOString()}

## Current Issues Identified

### 1. Authentication Flow Issues
- **Location**: \`src/auth/authentication.js\`
- **Problem**: Missing error handling for expired tokens
- **Impact**: Users experience unexpected logouts

### 2. API Client Configuration
- **Location**: \`src/api/client.js\`
- **Problem**: Hardcoded timeout values
- **Impact**: Poor user experience on slow networks

## Detailed Plan

### Phase 1: Authentication Improvements
1. **Add token validation middleware**
   - File: \`src/middleware/auth.js\`
   - Add expiration checks
   - Implement refresh token logic

2. **Enhance error handling**
   - File: \`src/auth/authentication.js\`
   - Add specific error types
   - Implement retry mechanisms

---
**Powered by AutoDev Backend Agent**`
        }]
      },
      executionTime: 1200,
      round: 1,
      ...overrides
    };
  }

  /**
   * Create a mock AI Agent response
   */
  static createAgentResponse(overrides: Partial<any> = {}) {
    return {
      text: `# Comprehensive Issue Analysis

Based on my analysis of GitHub issue #81 in unit-mesh/autodev-workbench, I've identified several key areas for improvement:

## Key Findings

### 1. Authentication Issues
- Missing token expiration validation
- Inadequate error handling for auth failures
- Need for refresh token implementation

### 2. Code Quality Concerns
- Generic error messages that don't help users
- Hardcoded configuration values
- Insufficient test coverage for edge cases

### 3. User Experience Impact
- Users experiencing unexpected logouts
- Poor error messaging
- Slow response times on network issues

## Recommended Actions

1. **Immediate Fixes**
   - Add token expiration checks
   - Implement proper error types
   - Enhance error messages

2. **Medium-term Improvements**
   - Add comprehensive test coverage
   - Implement retry mechanisms
   - Add configuration management

This analysis provides both immediate fixes and long-term strategic guidance for the development team.`,
      toolResults: [MockFactories.createToolResult()],
      success: true,
      totalRounds: 1,
      executionTime: 3500,
      ...overrides
    };
  }

  /**
   * Create a mock AI Agent configuration
   */
  static createAgentConfig(overrides: Partial<any> = {}) {
    return {
      workspacePath: process.cwd(),
      githubToken: 'mock_github_token',
      verbose: false,
      maxToolRounds: 3,
      enableToolChaining: true,
      toolTimeout: 30000,
      ...overrides
    };
  }

  /**
   * Create mock LLM response
   */
  static createLLMResponse(overrides: Partial<any> = {}) {
    return {
      text: `I'll analyze this GitHub issue for you.

<function_calls>
<invoke name="github_analyze_issue">
<parameter name="owner">unit-mesh</parameter>
<parameter name="repo">autodev-workbench</parameter>
<parameter name="issue_number">81</parameter>
<parameter name="fetch_urls">true</parameter>
</invoke>
</function_calls>

Let me get the issue details and analyze the related code.`,
      usage: {
        prompt_tokens: 150,
        completion_tokens: 80,
        total_tokens: 230
      },
      ...overrides
    };
  }

  /**
   * Create mock function call parsing result
   */
  static createFunctionCallResult(overrides: Partial<any> = {}) {
    return {
      text: "I'll analyze this GitHub issue for you.\n\nLet me get the issue details and analyze the related code.",
      functionCalls: [{
        name: 'github_analyze_issue',
        parameters: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          issue_number: 81,
          fetch_urls: true
        }
      }],
      hasError: false,
      ...overrides
    };
  }
}
