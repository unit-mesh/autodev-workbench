#!/usr/bin/env node

/**
 * Quick test script for agent.ts basic functionality
 * Simplified version for rapid validation
 */

const {join} = require("node:path");
require('dotenv').config();

async function quickTest() {
  console.log('🚀 Quick Agent Test - Issue #81');
  
  // Check if agent is built
  try {
    const { AIAgent } = require('./dist/agent.js');
    console.log('✅ Agent module loaded successfully');
    
    // Check environment
    if (!process.env.GITHUB_TOKEN) {
      console.error('❌ GITHUB_TOKEN not found in environment');
      return false;
    }
    
    const hasLLM = process.env.GLM_TOKEN || process.env.DEEPSEEK_TOKEN || process.env.OPENAI_API_KEY;
    if (!hasLLM) {
      console.error('❌ No LLM provider token found');
      return false;
    }
    
    console.log('✅ Environment variables configured');
    
    // Initialize agent
    const agent = new AIAgent({
      // to cwd ../../
      workspacePath: join(process.cwd(), '../../'),
      githubToken: process.env.GITHUB_TOKEN,
      verbose: true,
      maxToolRounds: 3,
      enableToolChaining: true
    });
    
    const llmInfo = agent.getLLMInfo();
    console.log(`✅ Agent initialized: ${llmInfo.provider} (${llmInfo.model})`);
    console.log(`🔧 Tools: ${agent.getAvailableTools().join(', ')}`);
    
    // Simple test
    console.log('\n🧪 Running simple test...');
    const response = await agent.processInput(
      'Analyze GitHub issue #81 in unit-mesh/autodev-workbench about database connection problems',
      {
        githubContext: {
          owner: 'unit-mesh',
          repo: 'autodev-workbench',
          issueNumber: 81
        }
      }
    );
    
    console.log(`\n📊 Test Results:`);
    console.log(`✅ Success: ${response.success}`);
    console.log(`🔄 Rounds: ${response.totalRounds || 1}`);
    console.log(`🛠️ Tools Used: ${response.toolResults.length}`);
    console.log(`📝 Response Length: ${response.text.length} chars`);
    
    if (response.toolResults.length > 0) {
      console.log('\n🔧 Tools Executed:');
      response.toolResults.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.functionCall.name} - ${result.success ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n📄 Final Response:');
    console.log(response.text);
    
    return response.success;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run quick test
if (require.main === module) {
  quickTest().then(success => {
    console.log(`\n${success ? '🎉' : '❌'} Quick test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Quick test error:', error);
    process.exit(1);
  });
}

module.exports = { quickTest };
