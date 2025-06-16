#!/usr/bin/env node

/**
 * Quick test script for agent.ts basic functionality
 * Simplified version for rapid validation
 */

const { join } = require('node:path')
require('dotenv').config()

// Define the list of issues to test
const issuesToTest = [
  {
    owner: 'unit-mesh',
    repo: 'autodev-workbench',
    issueNumber: 105,
    description: 'Analyze GitHub issue #105 in unit-mesh/autodev-workbench'
  },
  // Add more issues here, for example:
  // {
  //   owner: 'unit-mesh',
  //   repo: 'autodev-workbench',
  //   issueNumber: 104,
  //   description: 'Analyze GitHub issue #104 in unit-mesh/autodev-workbench'
  // }
];

async function quickTest (issueConfig) {
  console.log(`\n🚀 Quick Agent Test - Issue #${issueConfig.issueNumber} (${issueConfig.owner}/${issueConfig.repo})`)

  // Check if agent is built
  try {
    const { AIAgent } = require('./dist/agent.js')
    console.log('✅ Agent module loaded successfully')

    // Check environment
    if (!process.env.GITHUB_TOKEN) {
      console.error('❌ GITHUB_TOKEN not found in environment')
      return false
    }

    const hasLLM = process.env.GLM_TOKEN || process.env.DEEPSEEK_TOKEN || process.env.OPENAI_API_KEY
    if (!hasLLM) {
      console.error('❌ No LLM provider token found')
      return false
    }

    console.log('✅ Environment variables configured')

    // Initialize agent
    const agent = new AIAgent({
      // to cwd ../../
      workspacePath: join(process.cwd(), '../../'),
      githubToken: process.env.GITHUB_TOKEN,
      verbose: true,
      maxToolRounds: 3,
      enableToolChaining: true
    })

    const llmInfo = agent.getLLMInfo()
    console.log(`✅ Agent initialized: ${llmInfo.provider} (${llmInfo.model})`)
    console.log(`🔧 Tools: ${agent.getAvailableTools().join(', ')}`)

    // Simple test
    console.log('🧪 Running test for current issue...')
    const response = await agent.start(
      issueConfig.description,
      {
        githubContext: {
          owner: issueConfig.owner,
          repo: issueConfig.repo,
          issueNumber: issueConfig.issueNumber
        }
      }
    )

    console.log(`\n📊 Test Results for Issue #${issueConfig.issueNumber}:`)
    console.log(`✅ Success: ${response.success}`)
    console.log(`🔄 Rounds: ${response.totalRounds || 1}`)
    console.log(`🛠️ Tools Used: ${response.toolResults.length}`)
    console.log(`📝 Response Length: ${response.text.length} chars`)

    if (response.toolResults.length > 0) {
      console.log('\n🔧 Tools Executed:')
      response.toolResults.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.functionCall.name} - ${result.success ? '✅' : '❌'}`)
      })
    }

    console.log('\n📄 Final Response:')
    console.log(response.text)

    return response.success

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run quick test
if (require.main === module) {
  (async () => {
    let allTestsPassed = true;
    const results = [];

    for (const issue of issuesToTest) {
      try {
        const success = await quickTest(issue);
        results.push({ issue: `${issue.owner}/${issue.repo}#${issue.issueNumber}`, success });
        if (!success) {
          allTestsPassed = false;
        }
      } catch (error) {
        console.error(`❌ Test error for issue ${issue.owner}/${issue.repo}#${issue.issueNumber}:`, error);
        results.push({ issue: `${issue.owner}/${issue.repo}#${issue.issueNumber}`, success: false });
        allTestsPassed = false;
      }
    }

    console.log('\n📋 Overall Test Summary:');
    results.forEach(result => {
      console.log(`  ${result.issue}: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    });

    console.log(`\n${allTestsPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    process.exit(allTestsPassed ? 0 : 1);
  })().catch(error => {
    console.error('❌ Global quick test execution error:', error);
    process.exit(1);
  });
}

module.exports = { quickTest, issuesToTest };
