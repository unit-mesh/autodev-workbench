#!/usr/bin/env node

/**
 * Test script for feature request analysis functionality
 * Tests GitHub issue analysis for feature requests using issue IDs
 *
 * Usage:
 *   node test-feature-request.js [issue_id]
 *   node test-feature-request.js 105
 *   node test-feature-request.js unit-mesh/autodev-workbench#105
 *   node test-feature-request.js (runs default test cases)
 */

const { join } = require('node:path')
require('dotenv').config({ path: join(__dirname, '.env') })

// Define feature request issues to test
const featureRequestIssues = [
  {
    owner: 'unit-mesh',
    repo: 'autodev-workbench',
    issueNumber: 105,
    description: 'Analyze feature request in GitHub issue #105',
    expectedTools: ['github-analyze-issue', 'search-keywords', 'grep-search', 'read-file'],
    expectedRounds: 3
  },
  // Add more feature request issues here as needed
];

async function testFeatureRequestAnalysis(issueConfig) {
  console.log(`\n🚀 Testing Feature Request Analysis - Issue #${issueConfig.issueNumber} (${issueConfig.owner}/${issueConfig.repo})`)
  console.log(`📝 Description: ${issueConfig.description}`)

  try {
    const { AIAgent } = require('./dist/agent.js')
    const { IssueAnalysisPlaybook } = require('./dist/playbooks/index.js')
    console.log('✅ IssueAnalysisPlaybook loaded successfully')

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

    // Initialize agent with IssueAnalysisPlaybook
    const agent = new AIAgent({
      workspacePath: join(process.cwd(), '../../'),
      githubToken: process.env.GITHUB_TOKEN,
      verbose: true,
      maxToolRounds: issueConfig.expectedRounds || 3,
      enableToolChaining: true,
      playbook: new IssueAnalysisPlaybook()
    })

    const llmInfo = agent.getLLMInfo()
    console.log(`✅ Agent initialized: ${llmInfo.provider} (${llmInfo.model})`)
    console.log(`🔧 Tools: ${agent.getAvailableTools().join(', ')}`)

    // Run feature request analysis
    console.log('🧪 Running feature request analysis...')
    const startTime = Date.now()

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

    const executionTime = Date.now() - startTime

    console.log(`\n📊 Test Results for Issue #${issueConfig.issueNumber}:`)
    console.log(`✅ Success: ${response.success}`)
    console.log(`🔄 Rounds: ${response.totalRounds || 1}`)
    console.log(`🛠️ Tools Used: ${response.toolResults.length}`)
    console.log(`⏱️ Execution Time: ${executionTime}ms`)
    console.log(`📝 Response Length: ${response.text.length} chars`)

    // Analyze tool usage
    if (response.toolResults.length > 0) {
      console.log('\n🔧 Tools Executed:')
      const toolsByRound = new Map()

      response.toolResults.forEach((result) => {
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

    // Validate expected tools were used (if specified)
    if (issueConfig.expectedTools) {
      const toolsUsed = response.toolResults.map(r => r.functionCall.name)
      const expectedToolsUsed = issueConfig.expectedTools.filter(tool =>
        toolsUsed.some(used => used.includes(tool))
      )

      console.log(`\n🎯 Tool Coverage: ${expectedToolsUsed.length}/${issueConfig.expectedTools.length} expected tools used`)
      if (expectedToolsUsed.length < issueConfig.expectedTools.length) {
        const missing = issueConfig.expectedTools.filter(tool =>
          !toolsUsed.some(used => used.includes(tool))
        )
        console.log(`⚠️ Missing tools: ${missing.join(', ')}`)
      }
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

// Parse command line arguments for issue ID
function parseIssueFromArgs() {
  const args = process.argv.slice(2)
  if (args.length > 0) {
    const issueArg = args[0]
    // Support formats like "105", "unit-mesh/autodev-workbench#105", or "#105"
    const match = issueArg.match(/(?:([^\/]+)\/([^#]+)#)?(\d+)/)
    if (match) {
      const [, owner, repo, issueNumber] = match
      return {
        owner: owner || 'unit-mesh',
        repo: repo || 'autodev-workbench',
        issueNumber: parseInt(issueNumber),
        description: `Analyze feature request in GitHub issue #${issueNumber}`
      }
    }
  }
  return null
}

// Run feature request analysis
if (require.main === module) {
  (async () => {
    // Check if issue ID provided via command line
    const cmdIssue = parseIssueFromArgs()
    const issuesToTest = cmdIssue ? [cmdIssue] : featureRequestIssues

    if (!cmdIssue && featureRequestIssues.length === 0) {
      console.log('📋 Usage: node test-feature-request.js [issue_id]')
      console.log('   Examples:')
      console.log('     node test-feature-request.js 105')
      console.log('     node test-feature-request.js unit-mesh/autodev-workbench#105')
      process.exit(1)
    }

    console.log('🚀 Starting Feature Request Analysis Test Suite')
    console.log(`📋 Running ${issuesToTest.length} test case(s)...`)
    if (cmdIssue) {
      console.log(`🎯 Testing issue: ${cmdIssue.owner}/${cmdIssue.repo}#${cmdIssue.issueNumber}`)
    }

    let allTestsPassed = true
    const results = []

    for (const issue of issuesToTest) {
      try {
        const success = await testFeatureRequestAnalysis(issue)
        results.push({
          issue: `${issue.owner}/${issue.repo}#${issue.issueNumber}`,
          success
        })
        if (!success) {
          allTestsPassed = false
        }

        // Small delay between tests
        if (issuesToTest.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error(`❌ Test error for issue ${issue.owner}/${issue.repo}#${issue.issueNumber}:`, error)
        results.push({
          issue: `${issue.owner}/${issue.repo}#${issue.issueNumber}`,
          success: false,
          error: error.message
        })
        allTestsPassed = false
      }
    }

    console.log('\n📋 Feature Request Analysis Test Summary:')
    console.log('='.repeat(80))
    results.forEach(result => {
      console.log(`  ${result.issue}: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
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

module.exports = { testFeatureRequestAnalysis, featureRequestIssues }
