#!/usr/bin/env node

/**
 * Test script for the new feature-request tool integration
 * Tests the feature-request tool that integrates testFeatureRequestImplementation
 *
 * Usage:
 *   node test-feature-request-tool.js [issue_id]
 *   node test-feature-request-tool.js 105
 *   node test-feature-request-tool.js (runs default test cases)
 */

const { join } = require('node:path')
require('dotenv').config({ path: join(__dirname, '.env') })

// Test cases for the feature-request tool
const TEST_CASES = [
  {
    description: "Add a simple logging utility that can write messages to both console and file with different log levels (info, warn, error)",
    expectedSuccess: true,
    expectedModifications: 1,
    testName: "Simple Logging Utility"
  },
  {
    description: "Create a user authentication middleware for Express.js that validates JWT tokens and handles authorization",
    expectedSuccess: true,
    expectedModifications: 1,
    testName: "JWT Authentication Middleware"
  },
  {
    description: "Implement a configuration manager that loads settings from environment variables and config files",
    expectedSuccess: true,
    expectedModifications: 1,
    testName: "Configuration Manager"
  }
]

async function testFeatureRequestTool(testCase, issueNumber = null) {
  console.log(`\n🚀 Testing Feature Request Tool: ${testCase.testName}`)
  console.log(`📝 Description: ${testCase.description}`)

  try {
    const { AIAgent } = require('./dist/agent.js')
    console.log('✅ AIAgent loaded successfully')

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

    // Initialize agent (this will include the feature-request tool)
    const agent = new AIAgent({
      workspacePath: join(process.cwd(), '../../'),
      githubToken: process.env.GITHUB_TOKEN,
      verbose: true,
      maxToolRounds: 6,
      enableToolChaining: true
    })

    const llmInfo = agent.getLLMInfo()
    console.log(`✅ Agent initialized: ${llmInfo.provider} (${llmInfo.model})`)
    
    const availableTools = agent.getAvailableTools()
    console.log(`🔧 Available tools: ${availableTools.length}`)
    
    // Check if feature-request tool is available
    if (!availableTools.includes('feature-request')) {
      console.error('❌ feature-request tool not found in available tools')
      console.log('Available tools:', availableTools.join(', '))
      return false
    }
    
    console.log('✅ feature-request tool is available')

    // Test the feature-request tool
    console.log('\n🧪 Testing feature-request tool...')
    const startTime = Date.now()

    // Prepare the prompt to use the feature-request tool
    let prompt = `Please use the feature-request tool to implement the following feature:

${testCase.description}

Use the feature-request tool with these parameters:
- description: "${testCase.description}"
- verbose: true
- max_rounds: 6`

    if (issueNumber) {
      prompt += `
- issue_number: ${issueNumber}
- owner: "unit-mesh"
- repo: "autodev-workbench"`
    }

    const response = await agent.start(prompt)
    const executionTime = Date.now() - startTime

    console.log(`\n📊 Test Results for ${testCase.testName}:`)
    console.log(`✅ Success: ${response.success}`)
    console.log(`🔄 Rounds: ${response.totalRounds || 1}`)
    console.log(`🛠️ Tools Used: ${response.toolResults.length}`)
    console.log(`⏱️ Execution Time: ${executionTime}ms`)
    console.log(`📝 Response Length: ${response.text.length} chars`)

    // Check if feature-request tool was actually used
    const featureRequestToolUsed = response.toolResults.some(r => 
      r.functionCall.name === 'feature-request'
    )

    if (!featureRequestToolUsed) {
      console.log('⚠️ Warning: feature-request tool was not used in the response')
      console.log('Tools used:', response.toolResults.map(r => r.functionCall.name).join(', '))
    } else {
      console.log('✅ feature-request tool was successfully used')
    }

    // Analyze tool usage
    if (response.toolResults.length > 0) {
      console.log('\n🔧 Tool Usage Analysis:')
      const toolUsage = new Map()
      
      response.toolResults.forEach(result => {
        const toolName = result.functionCall.name
        if (!toolUsage.has(toolName)) {
          toolUsage.set(toolName, { count: 0, success: 0 })
        }
        const stats = toolUsage.get(toolName)
        stats.count++
        if (result.success) stats.success++
      })

      for (const [toolName, stats] of toolUsage) {
        console.log(`  ${toolName}: ${stats.success}/${stats.count} successful`)
      }
    }

    // Check for code modifications (if feature-request tool was used)
    const codeModifications = response.toolResults.filter(r => 
      r.functionCall.name === 'str-replace-editor' && r.success
    ).length

    console.log(`💻 Code Modifications: ${codeModifications}`)

    // Show response summary
    console.log('\n📄 Response Summary:')
    console.log('='.repeat(80))
    const summary = response.text.length > 500 ? 
      response.text.substring(0, 500) + '...' : 
      response.text
    console.log(summary)
    console.log('='.repeat(80))

    // Determine test success
    const testSuccess = response.success && 
                       featureRequestToolUsed &&
                       response.toolResults.length >= 1

    console.log(`\n${testSuccess ? '🎉 TEST PASSED' : '❌ TEST FAILED'}`)
    
    return {
      success: testSuccess,
      featureRequestToolUsed,
      codeModifications,
      executionTime,
      response
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    return {
      success: false,
      error: error.message
    }
  }
}

// Parse command line arguments for issue ID
function parseIssueFromArgs() {
  const args = process.argv.slice(2)
  if (args.length > 0) {
    const issueArg = args[0]
    const issueNumber = parseInt(issueArg)
    if (!isNaN(issueNumber)) {
      return issueNumber
    }
  }
  return null
}

// Run feature request tool tests
if (require.main === module) {
  (async () => {
    const issueNumber = parseIssueFromArgs()
    
    console.log('🚀 Starting Feature Request Tool Test Suite')
    
    if (issueNumber) {
      console.log(`🎯 Testing with GitHub issue #${issueNumber}`)
      // Create a test case for the specific issue
      const issueTestCase = {
        description: `Implement the feature request from GitHub issue #${issueNumber}`,
        expectedSuccess: true,
        expectedModifications: 1,
        testName: `GitHub Issue #${issueNumber}`
      }
      
      const result = await testFeatureRequestTool(issueTestCase, issueNumber)
      console.log(`\n📋 Test Result: ${result.success ? 'PASSED' : 'FAILED'}`)
      process.exit(result.success ? 0 : 1)
    } else {
      console.log(`📋 Running ${TEST_CASES.length} test case(s)...`)
      
      let allTestsPassed = true
      const results = []

      for (let i = 0; i < TEST_CASES.length; i++) {
        const testCase = TEST_CASES[i]
        console.log(`\n${'='.repeat(80)}`)
        console.log(`📋 Test Case ${i + 1}/${TEST_CASES.length}: ${testCase.testName}`)

        try {
          const result = await testFeatureRequestTool(testCase)
          results.push({
            testName: testCase.testName,
            ...result
          })
          
          if (!result.success) {
            allTestsPassed = false
          }

          // Small delay between tests
          if (i < TEST_CASES.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } catch (error) {
          console.error(`❌ Test case ${i + 1} failed:`, error.message)
          results.push({
            testName: testCase.testName,
            success: false,
            error: error.message
          })
          allTestsPassed = false
        }
      }

      // Summary
      console.log('\n📋 Feature Request Tool Test Summary:')
      console.log('='.repeat(80))
      results.forEach(result => {
        const status = result.success ? '✅ PASSED' : '❌ FAILED'
        console.log(`  ${result.testName}: ${status}`)
        if (result.featureRequestToolUsed !== undefined) {
          console.log(`    Tool Used: ${result.featureRequestToolUsed ? 'Yes' : 'No'}`)
        }
        if (result.codeModifications !== undefined) {
          console.log(`    Code Modifications: ${result.codeModifications}`)
        }
        if (result.error) {
          console.log(`    Error: ${result.error}`)
        }
      })

      const passedCount = results.filter(r => r.success).length
      console.log(`\n📊 Overall Results: ${passedCount}/${results.length} tests passed`)
      console.log(`\n${allTestsPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)

      process.exit(allTestsPassed ? 0 : 1)
    }
  })().catch(error => {
    console.error('❌ Global test execution error:', error)
    process.exit(1)
  })
}

module.exports = { 
  testFeatureRequestTool, 
  TEST_CASES
}
