#!/usr/bin/env node

/**
 * Test script for FeatureRequestPlaybook functionality
 * Tests the enhanced feature request analysis and PR generation capabilities
 */

const { join } = require('node:path')
require('dotenv').config()

// Define feature request test cases
const featureRequestTests = [
  {
    name: 'OAuth2 Authentication Feature',
    input: 'Implement OAuth2 authentication system for user login with Google and GitHub providers',
    description: 'Test comprehensive feature analysis and implementation planning for OAuth2 authentication',
    expectedTools: ['github-analyze-issue', 'search-keywords', 'grep-search', 'read-file', 'analyze-basic-context'],
    expectedRounds: 3
  },
  {
    name: 'Real-time Chat Feature',
    input: 'Add real-time chat functionality using WebSocket for user communication',
    description: 'Test feature analysis for real-time communication system',
    expectedTools: ['search-keywords', 'grep-search', 'read-file', 'list-directory'],
    expectedRounds: 3
  },
  {
    name: 'API Rate Limiting',
    input: 'Implement API rate limiting with Redis backend to prevent abuse',
    description: 'Test feature analysis for infrastructure enhancement',
    expectedTools: ['grep-search', 'search-keywords', 'read-file', 'analyze-dependencies'],
    expectedRounds: 2
  }
];

async function testFeatureRequestPlaybook(testCase) {
  console.log(`\n🚀 Testing FeatureRequestPlaybook - ${testCase.name}`)
  console.log(`📝 Description: ${testCase.description}`)
  console.log(`💭 Input: ${testCase.input}`)

  try {
    const { AIAgent } = require('./dist/agent.js')
    const { FeatureRequestPlaybook } = require('./dist/playbooks/index.js')
    console.log('✅ FeatureRequestPlaybook loaded successfully')

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

    // Initialize agent with FeatureRequestPlaybook
    const agent = new AIAgent({
      workspacePath: join(process.cwd(), '../../'),
      githubToken: process.env.GITHUB_TOKEN,
      verbose: true,
      maxToolRounds: testCase.expectedRounds,
      enableToolChaining: true,
      playbook: new FeatureRequestPlaybook()
    })

    const llmInfo = agent.getLLMInfo()
    console.log(`✅ Agent initialized: ${llmInfo.provider} (${llmInfo.model})`)
    console.log(`🔧 Tools: ${agent.getAvailableTools().join(', ')}`)

    // Run feature request analysis
    console.log('🧪 Running feature request analysis...')
    const startTime = Date.now()
    
    const response = await agent.start(testCase.input)
    
    const executionTime = Date.now() - startTime

    console.log(`\n📊 Test Results for ${testCase.name}:`)
    console.log(`✅ Success: ${response.success}`)
    console.log(`🔄 Rounds: ${response.totalRounds || 1}`)
    console.log(`🛠️ Tools Used: ${response.toolResults.length}`)
    console.log(`⏱️ Execution Time: ${executionTime}ms`)
    console.log(`📝 Response Length: ${response.text.length} chars`)

    // Analyze tool usage
    if (response.toolResults.length > 0) {
      console.log('\n🔧 Tools Executed:')
      const toolsByRound = new Map()
      
      response.toolResults.forEach((result, i) => {
        const round = result.round || 1
        if (!toolsByRound.has(round)) {
          toolsByRound.set(round, [])
        }
        toolsByRound.get(round).push(result)
      })

      for (const [round, tools] of toolsByRound) {
        console.log(`  Round ${round}:`)
        tools.forEach((result, i) => {
          console.log(`    ${i + 1}. ${result.functionCall.name} - ${result.success ? '✅' : '❌'}`)
        })
      }
    }

    // Validate expected tools were used
    const toolsUsed = response.toolResults.map(r => r.functionCall.name)
    const expectedToolsUsed = testCase.expectedTools.filter(tool => 
      toolsUsed.some(used => used.includes(tool))
    )
    
    console.log(`\n🎯 Tool Coverage: ${expectedToolsUsed.length}/${testCase.expectedTools.length} expected tools used`)
    if (expectedToolsUsed.length < testCase.expectedTools.length) {
      const missing = testCase.expectedTools.filter(tool => 
        !toolsUsed.some(used => used.includes(tool))
      )
      console.log(`⚠️ Missing tools: ${missing.join(', ')}`)
    }

    // Check if response contains key sections for feature analysis
    const hasRequirements = response.text.toLowerCase().includes('requirement') || 
                           response.text.toLowerCase().includes('feature')
    const hasTechnicalAnalysis = response.text.toLowerCase().includes('technical') || 
                               response.text.toLowerCase().includes('implementation')
    const hasActionPlan = response.text.toLowerCase().includes('plan') || 
                         response.text.toLowerCase().includes('step')

    console.log(`\n📋 Content Analysis:`)
    console.log(`  Requirements Analysis: ${hasRequirements ? '✅' : '❌'}`)
    console.log(`  Technical Analysis: ${hasTechnicalAnalysis ? '✅' : '❌'}`)
    console.log(`  Action Plan: ${hasActionPlan ? '✅' : '❌'}`)

    console.log('\n📄 Feature Analysis Response:')
    console.log('=' * 80)
    console.log(response.text)
    console.log('=' * 80)

    // Determine test success
    const testSuccess = response.success && 
                       response.totalRounds >= 2 && 
                       response.toolResults.length >= 2 &&
                       hasRequirements && 
                       hasTechnicalAnalysis

    console.log(`\n${testSuccess ? '🎉 TEST PASSED' : '❌ TEST FAILED'}`)
    
    return testSuccess

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    return false
  }
}

// Run all feature request tests
if (require.main === module) {
  (async () => {
    console.log('🚀 Starting FeatureRequestPlaybook Test Suite')
    console.log(`📋 Running ${featureRequestTests.length} test cases...`)
    
    let allTestsPassed = true
    const results = []

    for (const testCase of featureRequestTests) {
      try {
        const success = await testFeatureRequestPlaybook(testCase)
        results.push({ 
          name: testCase.name, 
          success,
          input: testCase.input
        })
        if (!success) {
          allTestsPassed = false
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ Test error for ${testCase.name}:`, error)
        results.push({ 
          name: testCase.name, 
          success: false,
          error: error.message
        })
        allTestsPassed = false
      }
    }

    console.log('\n📋 FeatureRequestPlaybook Test Summary:')
    console.log('=' * 80)
    results.forEach(result => {
      console.log(`  ${result.name}: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
      if (result.error) {
        console.log(`    Error: ${result.error}`)
      }
    })

    const passedCount = results.filter(r => r.success).length
    console.log(`\n📊 Overall Results: ${passedCount}/${results.length} tests passed`)
    console.log(`${allTestsPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
    
    process.exit(allTestsPassed ? 0 : 1)
  })().catch(error => {
    console.error('❌ Global test execution error:', error)
    process.exit(1)
  })
}

module.exports = { testFeatureRequestPlaybook, featureRequestTests }
