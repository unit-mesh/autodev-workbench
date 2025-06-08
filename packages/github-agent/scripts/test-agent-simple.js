#!/usr/bin/env node

/**
 * Simple Agent Test Script
 * Tests the AI Agent functionality without complex dependencies
 */

require('dotenv').config();

async function testAgent() {
  console.log('🤖 Testing AI Agent...\n');

  try {
    // Import the agent
    const { AIAgent } = require('../dist/agent.js');

    // Create agent with DeepSeek configuration
    const agent = new AIAgent({
      workspacePath: process.cwd(),
      githubToken: process.env.GITHUB_TOKEN,
      verbose: true,
      maxToolRounds: 3,
      enableToolChaining: true,
      toolTimeout: 30000
    });

    // Display agent info
    const llmInfo = agent.getLLMInfo();
    console.log(`🔧 LLM Provider: ${llmInfo.provider} (${llmInfo.model})`);
    console.log(`🛠️  Available Tools: ${agent.getAvailableTools().join(', ')}`);
    console.log(`⚙️  Configuration:`, agent.getConfig());
    console.log('');

    // Test with a simple issue analysis request
    const userInput = `Please analyze GitHub issue #81 in unit-mesh/autodev-workbench. 
    I want to understand:
    1. What the issue is about
    2. What code might be related to this issue
    3. Any potential solutions or insights`;

    console.log('📝 User Input:', userInput);
    console.log('\n🚀 Starting analysis...\n');

    // Enable debug mode to see LLM responses
    agent.updateConfig({ verbose: true });

    const startTime = Date.now();
    const response = await agent.processInput(userInput);
    const endTime = Date.now();

    console.log('\n' + '='.repeat(60));
    console.log('📊 AGENT RESPONSE');
    console.log('='.repeat(60));

    console.log(`⏱️  Execution Time: ${endTime - startTime}ms`);
    console.log(`✅ Success: ${response.success}`);
    console.log(`🔄 Total Rounds: ${response.totalRounds || 1}`);
    console.log(`🔧 Tools Used: ${response.toolResults.length}`);

    if (response.error) {
      console.log(`❌ Error: ${response.error}`);
    }

    if (response.text) {
      console.log('\n📝 Agent Response:');
      console.log(response.text);
    }

    if (response.toolResults.length > 0) {
      console.log('\n🔧 Tool Execution Details:');
      response.toolResults.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        const time = result.executionTime ? ` (${result.executionTime}ms)` : '';
        const round = result.round ? ` [Round ${result.round}]` : '';
        
        console.log(`${status} ${result.functionCall.name}${time}${round}`);
        
        if (result.success && result.result) {
          // Try to extract meaningful content
          if (result.result.content && Array.isArray(result.result.content)) {
            const textContent = result.result.content
              .filter(item => item.type === 'text')
              .map(item => item.text)
              .join('\n');
            
            if (textContent) {
              const preview = textContent.length > 200 ? 
                textContent.substring(0, 200) + '...' : 
                textContent;
              console.log(`   📄 Result: ${preview}`);
            }
          }
        } else if (result.error) {
          console.log(`   ❌ Error: ${result.error}`);
        }
      });
    }

    // Display execution stats
    const stats = agent.getExecutionStats();
    console.log('\n📈 Execution Statistics:');
    console.log(`   Total Calls: ${stats.totalCalls}`);
    console.log(`   Successful: ${stats.successfulCalls}`);
    console.log(`   Failed: ${stats.failedCalls}`);
    console.log(`   Avg Time: ${stats.averageExecutionTime.toFixed(2)}ms`);

    console.log('\n✅ Agent test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Agent test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testAgent()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testAgent };
