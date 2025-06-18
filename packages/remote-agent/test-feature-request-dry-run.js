#!/usr/bin/env node

/**
 * Dry run test script for FeatureRequestPlaybook functionality
 * Tests the playbook configuration and prompt generation without making API calls
 *
 * Usage:
 *   node test-feature-request-dry-run.js [issue_id]
 *   node test-feature-request-dry-run.js 105
 */

const { join } = require('node:path')

async function testFeatureRequestPlaybookDryRun(issueConfig) {
  console.log(`\n🚀 Dry Run Test - Feature Request Playbook - Issue #${issueConfig.issueNumber}`)
  console.log(`📝 Description: ${issueConfig.description}`)

  try {
    // Test playbook loading
    const { FeatureRequestPlaybook } = require('./dist/playbooks/index.js')
    console.log('✅ FeatureRequestPlaybook loaded successfully')

    // Initialize playbook with skipLLMConfig option for dry run
    const playbook = new FeatureRequestPlaybook({ skipLLMConfig: true })
    console.log('✅ FeatureRequestPlaybook initialized')

    // Test prompt preparation
    const userInput = `Analyze and implement the feature request from GitHub issue #${issueConfig.issueNumber}. 
      
      Requirements:
      1. First analyze the issue to understand the feature requirements
      2. Search the codebase to understand the current implementation
      3. Plan the implementation approach
      4. Generate the necessary code changes
      5. If code modification is not possible, provide detailed implementation guidance
      
      Please provide a comprehensive analysis and implementation plan.`

    const context = {
      githubContext: {
        owner: issueConfig.owner,
        repo: issueConfig.repo,
        issueNumber: issueConfig.issueNumber
      },
      enableCodeModification: true,
      targetBranch: `feature/issue-${issueConfig.issueNumber}-automated`
    }

    // Test prompt generation
    const prompt = playbook.preparePrompt(userInput, context)
    console.log('✅ Prompt generation successful')
    console.log(`📏 Prompt length: ${prompt.length} characters`)

    // Test base prompt content
    const basePrompt = playbook.getSystemPrompt()
    console.log('✅ Base prompt retrieved')
    console.log(`📏 Base prompt length: ${basePrompt.length} characters`)

    // Analyze prompt content
    const hasFeatureAnalysis = prompt.toLowerCase().includes('feature') && prompt.toLowerCase().includes('analysis')
    const hasCodeModification = prompt.toLowerCase().includes('str-replace-editor') || prompt.toLowerCase().includes('code changes')
    const hasImplementationGuidance = prompt.toLowerCase().includes('implementation') && prompt.toLowerCase().includes('guidance')
    const hasToolStrategy = prompt.toLowerCase().includes('tool usage') || prompt.toLowerCase().includes('github-analyze-issue')

    console.log(`\n📋 Prompt Analysis:`)
    console.log(`  Feature Analysis Focus: ${hasFeatureAnalysis ? '✅' : '❌'}`)
    console.log(`  Code Modification Support: ${hasCodeModification ? '✅' : '❌'}`)
    console.log(`  Implementation Guidance: ${hasImplementationGuidance ? '✅' : '❌'}`)
    console.log(`  Tool Strategy: ${hasToolStrategy ? '✅' : '❌'}`)

    // Test summary prompt
    const mockToolResults = [
      {
        functionCall: { name: 'github-analyze-issue', parameters: { issue_number: issueConfig.issueNumber } },
        success: true,
        result: { content: 'Mock issue analysis result' },
        round: 1
      },
      {
        functionCall: { name: 'search-keywords', parameters: { keywords: ['feature', 'implementation'] } },
        success: true,
        result: { content: 'Mock search results' },
        round: 2
      }
    ]

    const summaryPrompt = playbook.prepareSummaryPrompt(userInput, mockToolResults, 'analysis_complete')
    console.log('✅ Summary prompt generation successful')
    console.log(`📏 Summary prompt length: ${summaryPrompt.length} characters`)

    // Test verification prompt
    const verificationPrompt = playbook.prepareVerificationPrompt(userInput, mockToolResults)
    console.log('✅ Verification prompt generation successful')
    console.log(`📏 Verification prompt length: ${verificationPrompt.length} characters`)

    // Show key sections of the prompts
    console.log('\n📄 Prompt Samples:')
    console.log('='.repeat(80))
    console.log('\n🎯 Base Prompt (first 300 chars):')
    console.log(basePrompt.substring(0, 300) + '...')
    
    console.log('\n🔧 Prepared Prompt (first 300 chars):')
    console.log(prompt.substring(0, 300) + '...')
    
    console.log('\n📊 Summary Prompt (first 300 chars):')
    console.log(summaryPrompt.substring(0, 300) + '...')
    console.log('='.repeat(80))

    // Determine test success
    const testSuccess = hasFeatureAnalysis && 
                       hasCodeModification && 
                       hasImplementationGuidance && 
                       hasToolStrategy &&
                       prompt.length > 500 &&
                       summaryPrompt.length > 500

    console.log(`\n${testSuccess ? '🎉 DRY RUN TEST PASSED' : '❌ DRY RUN TEST FAILED'}`)
    
    return {
      success: testSuccess,
      promptLength: prompt.length,
      summaryPromptLength: summaryPrompt.length,
      verificationPromptLength: verificationPrompt.length,
      analysis: {
        hasFeatureAnalysis,
        hasCodeModification,
        hasImplementationGuidance,
        hasToolStrategy
      }
    }

  } catch (error) {
    console.error('❌ Dry run test failed:', error.message)
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
    // Support formats like "105", "unit-mesh/autodev-workbench#105", or "#105"
    const match = issueArg.match(/(?:([^\/]+)\/([^#]+)#)?(\d+)/)
    if (match) {
      const [, owner, repo, issueNumber] = match
      return {
        owner: owner || 'unit-mesh',
        repo: repo || 'autodev-workbench',
        issueNumber: parseInt(issueNumber),
        description: `Implement feature request from GitHub issue #${issueNumber}`,
      }
    }
  }
  return {
    owner: 'unit-mesh',
    repo: 'autodev-workbench',
    issueNumber: 105,
    description: 'Implement feature request from GitHub issue #105'
  }
}

// Run dry run test
if (require.main === module) {
  (async () => {
    const issueConfig = parseIssueFromArgs()
    
    console.log('🚀 Starting Feature Request Playbook Dry Run Test')
    console.log(`🎯 Testing issue: ${issueConfig.owner}/${issueConfig.repo}#${issueConfig.issueNumber}`)

    try {
      const result = await testFeatureRequestPlaybookDryRun(issueConfig)
      
      console.log('\n📋 Dry Run Test Summary:')
      console.log('='.repeat(80))
      console.log(`  Issue: ${issueConfig.owner}/${issueConfig.repo}#${issueConfig.issueNumber}`)
      console.log(`  Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
      
      if (result.success) {
        console.log(`  Prompt Length: ${result.promptLength} chars`)
        console.log(`  Summary Prompt Length: ${result.summaryPromptLength} chars`)
        console.log(`  Verification Prompt Length: ${result.verificationPromptLength} chars`)
        console.log(`  Analysis Results:`)
        console.log(`    Feature Analysis: ${result.analysis.hasFeatureAnalysis ? '✅' : '❌'}`)
        console.log(`    Code Modification: ${result.analysis.hasCodeModification ? '✅' : '❌'}`)
        console.log(`    Implementation Guidance: ${result.analysis.hasImplementationGuidance ? '✅' : '❌'}`)
        console.log(`    Tool Strategy: ${result.analysis.hasToolStrategy ? '✅' : '❌'}`)
      }
      
      if (result.error) {
        console.log(`  Error: ${result.error}`)
      }

      console.log(`\n${result.success ? '🎉 ALL TESTS PASSED' : '❌ TESTS FAILED'}`)
      process.exit(result.success ? 0 : 1)
      
    } catch (error) {
      console.error('❌ Global test execution error:', error)
      process.exit(1)
    }
  })()
}

// Export for use in other tests
module.exports = { 
  testFeatureRequestPlaybookDryRun,
  parseIssueFromArgs
}
