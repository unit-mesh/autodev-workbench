#!/usr/bin/env node

/**
 * Test script for FeatureRequestPlaybook functionality
 * Tests automated feature request analysis and code modification
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
    description: 'Implement feature request from GitHub issue #105',
    expectedTools: ['github-analyze-issue', 'search-keywords', 'grep-search', 'read-file', 'str-replace-editor'],
    expectedRounds: 3,
    validateCodeChanges: true
  },
  // Add more feature request issues here as needed
];

async function testFeatureRequestImplementation(issueConfig) {
  console.log(`\n🚀 Testing Feature Request Implementation - Issue #${issueConfig.issueNumber} (${issueConfig.owner}/${issueConfig.repo})`)
  console.log(`📝 Description: ${issueConfig.description}`)

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
      maxToolRounds: issueConfig.expectedRounds || 5, // Increase rounds for feature implementation
      enableToolChaining: true,
      playbook: new FeatureRequestPlaybook()
    })

    const llmInfo = agent.getLLMInfo()
    console.log(`✅ Agent initialized: ${llmInfo.provider} (${llmInfo.model})`)
    console.log(`🔧 Available tools: ${agent.getAvailableTools().join(', ')}`)

    // Run feature request implementation
    console.log('\n🧪 Starting feature request analysis and implementation...')
    const startTime = Date.now()

    const response = await agent.start(
      `Analyze and implement the feature request from GitHub issue #${issueConfig.issueNumber}.

      Requirements:
      1. First analyze the issue to understand the feature requirements
      2. Search the codebase to understand the current implementation
      3. Plan the implementation approach
      4. Generate the necessary code changes
      5. If code modification is not possible, provide detailed implementation guidance

      Please provide a comprehensive analysis and implementation plan.`,
      {
        githubContext: {
          owner: issueConfig.owner,
          repo: issueConfig.repo,
          issueNumber: issueConfig.issueNumber
        },
        enableCodeModification: true,
        targetBranch: `feature/issue-${issueConfig.issueNumber}-automated`
      }
    )

    const executionTime = Date.now() - startTime

    console.log(`\n📊 Implementation Results for Issue #${issueConfig.issueNumber}:`)
    console.log(`✅ Success: ${response.success}`)
    console.log(`🔄 Rounds: ${response.totalRounds || 1}`)
    console.log(`🛠️ Tools Used: ${response.toolResults.length}`)
    console.log(`⏱️ Execution Time: ${executionTime}ms`)
    console.log(`📝 Response Length: ${response.text.length} chars`)

    // Analyze tool usage by round
    if (response.toolResults.length > 0) {
      console.log('\n🔧 Tools Execution Summary:')
      const toolsByRound = new Map()

      response.toolResults.forEach((result) => {
        const round = result.round || 1
        if (!toolsByRound.has(round)) {
          toolsByRound.set(round, [])
        }
        toolsByRound.get(round).push(result)
      })

      for (const [round, tools] of toolsByRound) {
        console.log(`\n  Round ${round}: ${getRoundDescription(round)}`)
        tools.forEach((result, i) => {
          const status = result.success ? '✅' : '❌'
          const toolName = result.functionCall.name
          console.log(`    ${i + 1}. ${toolName} - ${status}`)
          
          // Show details for important tools
          if (toolName === 'str-replace-editor' && result.success) {
            const params = result.functionCall.parameters
            console.log(`       Modified: ${params.targetFile || 'Unknown file'}`)
          }
        })
      }
    }

    // Check code modification tools
    const codeModificationTools = response.toolResults.filter(r => 
      r.functionCall.name === 'str-replace-editor' && r.success
    )
    
    console.log(`\n💻 Code Modifications: ${codeModificationTools.length} file(s) changed`)
    if (codeModificationTools.length > 0) {
      console.log('📝 Modified files:')
      codeModificationTools.forEach((tool, i) => {
        const params = tool.functionCall.parameters
        console.log(`  ${i + 1}. ${params.targetFile || 'Unknown file'}`)
      })
    }

    // Validate expected tools were used
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

    // Analyze implementation content
    const hasRequirements = response.text.toLowerCase().includes('requirement') || 
                           response.text.toLowerCase().includes('feature')
    const hasTechnicalAnalysis = response.text.toLowerCase().includes('technical') || 
                               response.text.toLowerCase().includes('implementation')
    const hasImplementationPlan = response.text.toLowerCase().includes('plan') || 
                                 response.text.toLowerCase().includes('roadmap')
    const hasCodeChanges = response.text.toLowerCase().includes('code') || 
                          response.text.toLowerCase().includes('implementation')

    console.log(`\n📋 Implementation Analysis:`)
    console.log(`  Requirements Analysis: ${hasRequirements ? '✅' : '❌'}`)
    console.log(`  Technical Analysis: ${hasTechnicalAnalysis ? '✅' : '❌'}`)
    console.log(`  Implementation Plan: ${hasImplementationPlan ? '✅' : '❌'}`)
    console.log(`  Code Changes: ${hasCodeChanges ? '✅' : '❌'}`)

    // Show implementation summary
    console.log('\n📄 Implementation Summary:')
    console.log('='.repeat(80))
    // Extract and show key sections from the response
    const sections = extractImplementationSections(response.text)
    if (sections.summary) {
      console.log('\n🎯 Executive Summary:')
      console.log(sections.summary)
    }
    if (sections.implementation) {
      console.log('\n🚀 Implementation Details:')
      console.log(sections.implementation)
    }
    if (sections.testing) {
      console.log('\n🧪 Testing Strategy:')
      console.log(sections.testing)
    }
    console.log('='.repeat(80))

    // Determine test success
    const testSuccess = response.success && 
                       response.totalRounds >= 2 && 
                       response.toolResults.length >= 4 &&
                       hasRequirements && 
                       hasTechnicalAnalysis &&
                       hasImplementationPlan &&
                       (issueConfig.validateCodeChanges ? codeModificationTools.length > 0 : true)

    console.log(`\n${testSuccess ? '🎉 TEST PASSED' : '❌ TEST FAILED'}`)
    
    return {
      success: testSuccess,
      codeModifications: codeModificationTools.length,
      response
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    return {
      success: false,
      codeModifications: 0,
      error: error.message
    }
  }
}

// Helper function to get round description
function getRoundDescription(round) {
  switch (round) {
    case 1:
      return 'Feature Requirements Analysis'
    case 2:
      return 'Codebase Discovery & Architecture Analysis'
    case 3:
      return 'Implementation Planning & Code Generation'
    default:
      return 'Additional Analysis & Refinement'
  }
}

// Helper function to extract key sections from implementation response
function extractImplementationSections(text) {
  const sections = {
    summary: '',
    implementation: '',
    testing: ''
  }

  // Extract executive summary
  const summaryMatch = text.match(/(?:executive summary|overview|summary)[:\s]*([^#]+?)(?=\n#|\n\n#|$)/i)
  if (summaryMatch) {
    sections.summary = summaryMatch[1].trim().substring(0, 300) + '...'
  }

  // Extract implementation details
  const implMatch = text.match(/(?:implementation|code changes|technical implementation)[:\s]*([^#]+?)(?=\n#|\n\n#|$)/i)
  if (implMatch) {
    sections.implementation = implMatch[1].trim().substring(0, 300) + '...'
  }

  // Extract testing strategy
  const testMatch = text.match(/(?:testing strategy|test plan|testing)[:\s]*([^#]+?)(?=\n#|\n\n#|$)/i)
  if (testMatch) {
    sections.testing = testMatch[1].trim().substring(0, 300) + '...'
  }

  return sections
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
        description: `Implement feature request from GitHub issue #${issueNumber}`,
        expectedTools: ['github-analyze-issue', 'search-keywords', 'grep-search', 'read-file', 'str-replace-editor'],
        expectedRounds: 5, // Increased for feature implementation
        validateCodeChanges: true
      }
    }
  }
  return null
}

// Run feature request implementation test
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

    console.log('🚀 Starting Feature Request Implementation Test Suite')
    console.log(`📋 Running ${issuesToTest.length} test case(s)...`)
    if (cmdIssue) {
      console.log(`🎯 Testing issue: ${cmdIssue.owner}/${cmdIssue.repo}#${cmdIssue.issueNumber}`)
    }

    let allTestsPassed = true
    const results = []

    for (const issue of issuesToTest) {
      try {
        const result = await testFeatureRequestImplementation(issue)
        results.push({
          issue: `${issue.owner}/${issue.repo}#${issue.issueNumber}`,
          ...result
        })
        if (!result.success) {
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
          codeModifications: 0,
          error: error.message
        })
        allTestsPassed = false
      }
    }

    console.log('\n📋 Feature Request Implementation Test Summary:')
    console.log('='.repeat(80))
    results.forEach(result => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED'
      console.log(`  ${result.issue}: ${status}`)
      if (result.codeModifications > 0) {
        console.log(`    💻 Code modifications: ${result.codeModifications} file(s)`)
      }
      if (result.error) {
        console.log(`    Error: ${result.error}`)
      }
    })

    const passedCount = results.filter(r => r.success).length
    const totalModifications = results.reduce((sum, r) => sum + (r.codeModifications || 0), 0)
    
    console.log(`\n📊 Overall Results:`)
    console.log(`  Tests: ${passedCount}/${results.length} passed`)
    console.log(`  Code modifications: ${totalModifications} file(s) total`)
    console.log(`\n${allTestsPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)

    process.exit(allTestsPassed ? 0 : 1)
  })().catch(error => {
    console.error('❌ Global test execution error:', error)
    process.exit(1)
  })
}

// Export for use in other tests
module.exports = { 
  testFeatureRequestImplementation, 
  featureRequestIssues,
  getRoundDescription,
  extractImplementationSections
}
