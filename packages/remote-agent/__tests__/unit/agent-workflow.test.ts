/**
 * Unit tests for AI Agent Workflow
 * Converted from scripts/simple-agent-test.js
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { MockFactories } from '../helpers/mock-factories';
import { TestUtils } from '../helpers/test-utils';

// Mock AI Agent class for testing
class MockAIAgent {
  private config: any;
  private toolHandlers: Map<string, Function>;
  private conversationHistory: any[];

  constructor(config: any = {}) {
    this.config = {
      maxToolRounds: 3,
      enableToolChaining: true,
      toolTimeout: 30000,
      verbose: false,
      ...config
    };
    this.toolHandlers = new Map();
    this.conversationHistory = [];
    
    this.registerMockTools();
  }

  private registerMockTools() {
    // Mock github_analyze_issue tool
    this.toolHandlers.set('github_analyze_issue', async (params: any) => {
      await TestUtils.wait(100); // Simulate async work
      
      return {
        content: [{
          type: 'text',
          text: `Analysis of issue #${params.issue_number} in ${params.owner}/${params.repo}:
          
## Issue Summary
- Title: Example issue for testing
- State: open
- Labels: bug, enhancement

## Related Code Found
- Found 3 relevant files
- Identified 2 potential code locations
- Suggested 1 fix approach

## Recommendations
1. Check the authentication logic in auth.js
2. Review error handling in api-client.js
3. Update documentation for the new feature`
        }]
      };
    });
    
    // Mock github_smart_search tool
    this.toolHandlers.set('github_smart_search', async (params: any) => {
      await TestUtils.wait(100); // Simulate async work
      
      return {
        content: [{
          type: 'text',
          text: `Smart search results for "${params.query}":
          
## Code Matches Found
- src/auth/authentication.js (lines 45-67)
- src/api/client.js (lines 123-145)
- tests/auth.test.js (lines 89-112)

## Patterns Identified
- Authentication error handling
- API client configuration
- Test coverage gaps`
        }]
      };
    });
  }

  async processInput(userInput: string) {
    const startTime = Date.now();
    const toolResults: any[] = [];
    
    // Simulate LLM deciding to call tools
    const shouldAnalyzeIssue = userInput.includes('issue') && userInput.includes('analyze');
    const shouldSearch = userInput.includes('search') || userInput.includes('code');
    
    if (shouldAnalyzeIssue) {
      // Extract issue info from input (simplified)
      const issueMatch = userInput.match(/issue #?(\d+)/i);
      const repoMatch = userInput.match(/([\w-]+)\/([\w-]+)/);
      
      if (issueMatch && repoMatch) {
        const issueNumber = parseInt(issueMatch[1]);
        const owner = repoMatch[1];
        const repo = repoMatch[2];
        
        try {
          const result = await this.toolHandlers.get('github_analyze_issue')!({
            owner,
            repo,
            issue_number: issueNumber,
            fetch_urls: true
          });
          
          toolResults.push({
            success: true,
            functionCall: { name: 'github_analyze_issue', parameters: { owner, repo, issue_number: issueNumber } },
            result,
            executionTime: 500,
            round: 1
          });
        } catch (error: any) {
          toolResults.push({
            success: false,
            functionCall: { name: 'github_analyze_issue', parameters: { owner, repo, issue_number: issueNumber } },
            error: error.message,
            executionTime: 100,
            round: 1
          });
        }
      }
    }
    
    if (shouldSearch && toolResults.length > 0) {
      // Second round - smart search based on analysis
      try {
        const result = await this.toolHandlers.get('github_smart_search')!({
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          query: 'authentication error handling',
          search_depth: 'medium'
        });
        
        toolResults.push({
          success: true,
          functionCall: { name: 'github_smart_search', parameters: { query: 'authentication error handling' } },
          result,
          executionTime: 300,
          round: 2
        });
      } catch (error: any) {
        toolResults.push({
          success: false,
          functionCall: { name: 'github_smart_search', parameters: { query: 'authentication error handling' } },
          error: error.message,
          executionTime: 100,
          round: 2
        });
      }
    }
    
    // Generate final response
    const finalText = this.generateFinalResponse(userInput, toolResults);
    
    return {
      text: finalText,
      toolResults,
      success: true,
      totalRounds: Math.max(...toolResults.map(r => r.round || 1), 1),
      executionTime: Date.now() - startTime
    };
  }

  private generateFinalResponse(userInput: string, toolResults: any[]) {
    const successfulResults = toolResults.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return "I apologize, but I encountered issues while analyzing the request. Please check the repository and issue details.";
    }
    
    let response = `# Analysis Results\n\nBased on your request: "${userInput}"\n\n`;
    
    successfulResults.forEach((result, index) => {
      const content = result.result?.content?.[0]?.text || 'Tool executed successfully';
      response += `## ${result.functionCall.name} Results\n\n${content}\n\n`;
    });
    
    response += `## Summary\n\nCompleted analysis using ${successfulResults.length} tools in ${toolResults.length > 1 ? toolResults.length : 1} rounds. `;
    response += `The analysis provides insights into the issue and related code patterns.`;
    
    return response;
  }

  getAvailableTools() {
    return Array.from(this.toolHandlers.keys());
  }

  getLLMInfo() {
    return { provider: 'mock', model: 'mock-model-v1' };
  }

  getConfig() {
    return { ...this.config };
  }

  updateConfig(updates: any) {
    this.config = { ...this.config, ...updates };
  }

  getExecutionStats() {
    return {
      totalCalls: 1,
      successfulCalls: 1,
      failedCalls: 0,
      averageExecutionTime: 1500
    };
  }
}

describe('AI Agent Workflow', () => {
  let agent: MockAIAgent;

  beforeEach(() => {
    agent = new MockAIAgent({
      verbose: false,
      maxToolRounds: 2,
      enableToolChaining: true
    });
  });

  describe('initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultAgent = new MockAIAgent();
      const config = defaultAgent.getConfig();

      expect(config.maxToolRounds).toBe(3);
      expect(config.enableToolChaining).toBe(true);
      expect(config.toolTimeout).toBe(30000);
      expect(config.verbose).toBe(false);
    });

    test('should override default configuration', () => {
      const customAgent = new MockAIAgent({
        maxToolRounds: 5,
        verbose: true,
        customOption: 'test'
      });
      const config = customAgent.getConfig();

      expect(config.maxToolRounds).toBe(5);
      expect(config.verbose).toBe(true);
      expect(config.customOption).toBe('test');
    });

    test('should register available tools', () => {
      const tools = agent.getAvailableTools();

      expect(tools).toContain('github_analyze_issue');
      expect(tools).toContain('github_smart_search');
      expect(tools).toHaveLength(2);
    });
  });

  describe('tool execution', () => {
    test('should execute github_analyze_issue tool', async () => {
      const testInput = "Please analyze GitHub issue #81 in unit-mesh/autodev-workbench";
      
      const response = await agent.processInput(testInput);

      expect(response.success).toBe(true);
      expect(response.toolResults).toHaveLength(1);
      expect(TestUtils.isValidToolResult(response.toolResults[0])).toBe(true);
      expect(response.toolResults[0].functionCall.name).toBe('github_analyze_issue');
      expect(response.toolResults[0].functionCall.parameters).toEqual({
        owner: 'unit-mesh',
        repo: 'autodev-workbench',
        issue_number: 81
      });
    });

    test('should execute multiple tools in sequence', async () => {
      const testInput = "Please analyze GitHub issue #81 in unit-mesh/autodev-workbench and search for related code";
      
      const response = await agent.processInput(testInput);

      expect(response.success).toBe(true);
      expect(response.toolResults).toHaveLength(2);
      expect(response.totalRounds).toBe(2);
      
      // First tool should be issue analysis
      expect(response.toolResults[0].functionCall.name).toBe('github_analyze_issue');
      expect(response.toolResults[0].round).toBe(1);
      
      // Second tool should be smart search
      expect(response.toolResults[1].functionCall.name).toBe('github_smart_search');
      expect(response.toolResults[1].round).toBe(2);
    });

    test('should handle tool execution errors gracefully', async () => {
      // Create agent with failing tool
      const failingAgent = new MockAIAgent();
      failingAgent['toolHandlers'].set('github_analyze_issue', async () => {
        throw new Error('Tool execution failed');
      });

      const testInput = "Please analyze GitHub issue #81 in unit-mesh/autodev-workbench";
      
      const response = await failingAgent.processInput(testInput);

      expect(response.success).toBe(true); // Agent should still succeed
      expect(response.toolResults).toHaveLength(1);
      expect(response.toolResults[0].success).toBe(false);
      expect(response.toolResults[0].error).toBe('Tool execution failed');
    });
  });

  describe('response generation', () => {
    test('should generate comprehensive response', async () => {
      const testInput = "Please analyze GitHub issue #81 in unit-mesh/autodev-workbench and search for related code";
      
      const response = await agent.processInput(testInput);

      expect(response.text).toContain('Analysis Results');
      expect(response.text).toContain('github_analyze_issue Results');
      expect(response.text).toContain('github_smart_search Results');
      expect(response.text).toContain('Summary');
      expect(response.text).toContain('Completed analysis using 2 tools');
    });

    test('should handle no successful tools', async () => {
      const testInput = "This input should not trigger any tools";
      
      const response = await agent.processInput(testInput);

      expect(response.success).toBe(true);
      expect(response.toolResults).toHaveLength(0);
      expect(response.text).toContain('I apologize, but I encountered issues');
    });

    test('should include execution metrics', async () => {
      const testInput = "Please analyze GitHub issue #81 in unit-mesh/autodev-workbench";
      
      const response = await agent.processInput(testInput);

      expect(response.executionTime).toBeGreaterThan(0);
      expect(response.totalRounds).toBeGreaterThan(0);
      expect(response.toolResults[0].executionTime).toBeGreaterThan(0);
    });
  });

  describe('configuration management', () => {
    test('should update configuration', () => {
      const originalConfig = agent.getConfig();
      
      agent.updateConfig({ verbose: true, newOption: 'test' });
      
      const updatedConfig = agent.getConfig();
      expect(updatedConfig.verbose).toBe(true);
      expect(updatedConfig.newOption).toBe('test');
      expect(updatedConfig.maxToolRounds).toBe(originalConfig.maxToolRounds); // Should preserve other options
    });

    test('should provide LLM information', () => {
      const llmInfo = agent.getLLMInfo();

      expect(llmInfo.provider).toBe('mock');
      expect(llmInfo.model).toBe('mock-model-v1');
    });

    test('should provide execution statistics', () => {
      const stats = agent.getExecutionStats();

      expect(stats.totalCalls).toBeGreaterThanOrEqual(0);
      expect(stats.successfulCalls).toBeGreaterThanOrEqual(0);
      expect(stats.failedCalls).toBeGreaterThanOrEqual(0);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
    });
  });
});
