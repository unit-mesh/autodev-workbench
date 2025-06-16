#!/usr/bin/env node

/**
 * Simple Visual Test Script for Agent
 * No external dependencies, pure Node.js visualization
 */

const { join } = require('node:path')
const fs = require('node:fs')
require('dotenv').config()

// Simple ASCII art and colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
}

// ASCII Art Generator
function generateASCIIChart(data, width = 50) {
  const { passed, failed, total } = data
  if (total === 0) return '│' + ' '.repeat(width) + '│'
  
  const passedWidth = Math.round((passed / total) * width)
  const failedWidth = width - passedWidth
  
  return `│${colors.bgGreen}${' '.repeat(passedWidth)}${colors.reset}${colors.bgRed}${' '.repeat(failedWidth)}${colors.reset}│`
}

function generateProgressBar(current, total, width = 30) {
  const percentage = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * width)
  const empty = width - filled
  
  return `[${colors.green}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(empty)}${colors.reset}] ${percentage}%`
}

// Test Results Visualizer
class SimpleVisualizer {
  constructor() {
    this.results = []
    this.startTime = Date.now()
  }

  addResult(result) {
    this.results.push({
      ...result,
      timestamp: Date.now()
    })
  }

  getSummary() {
    const total = this.results.length
    const passed = this.results.filter(r => r.success).length
    const failed = total - passed
    const totalTime = Date.now() - this.startTime
    
    return {
      total,
      passed,
      failed,
      successRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0,
      totalTime: (totalTime / 1000).toFixed(2),
      averageTime: total > 0 ? (totalTime / total / 1000).toFixed(2) : 0
    }
  }

  displayHeader() {
    console.clear()
    console.log(`${colors.bright}${colors.magenta}`)
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗')
    console.log('║                          🤖 AI Agent Test Suite                             ║')
    console.log('║                        Enhanced Visual Testing                               ║')
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝')
    console.log(colors.reset)
  }

  displayProgress(current, total, testName) {
    const progress = generateProgressBar(current, total)
    console.log(`\n${colors.cyan}Progress: ${progress} ${colors.white}(${current}/${total})${colors.reset}`)
    console.log(`${colors.dim}Current: ${testName}${colors.reset}`)
  }

  displayTestResult(result) {
    const status = result.success ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`
    const duration = `${colors.yellow}${result.duration}s${colors.reset}`
    const tools = `${colors.blue}${result.toolsUsed} tools${colors.reset}`
    
    console.log(`\n┌─ ${colors.bright}${result.issue}${colors.reset} ─────────────────────────────────────────`)
    console.log(`│ Status: ${status}`)
    console.log(`│ Duration: ${duration}`)
    console.log(`│ Tools Used: ${tools}`)
    console.log(`│ Rounds: ${colors.magenta}${result.rounds}${colors.reset}`)
    if (result.error) {
      console.log(`│ Error: ${colors.red}${result.error}${colors.reset}`)
    }
    console.log('└─────────────────────────────────────────────────────────────────────────────')
  }

  displaySummary() {
    const summary = this.getSummary()
    const chart = generateASCIIChart(summary, 60)
    
    console.log(`\n${colors.bright}${colors.white}`)
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗')
    console.log('║                              📊 FINAL RESULTS                               ║')
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣')
    console.log(`║ ${chart} ║`)
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣')
    console.log(`║ ${colors.green}✅ Passed: ${summary.passed.toString().padEnd(8)}${colors.red}❌ Failed: ${summary.failed.toString().padEnd(8)}${colors.blue}📊 Total: ${summary.total.toString().padEnd(8)}${colors.reset}║`)
    console.log(`║ ${colors.yellow}📈 Success Rate: ${summary.successRate}%${colors.reset}${' '.repeat(47 - summary.successRate.length)}║`)
    console.log(`║ ${colors.cyan}⏱️  Total Time: ${summary.totalTime}s${colors.reset}${' '.repeat(48 - summary.totalTime.length)}║`)
    console.log(`║ ${colors.magenta}⚡ Average Time: ${summary.averageTime}s${colors.reset}${' '.repeat(46 - summary.averageTime.length)}║`)
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝')
    console.log(colors.reset)
  }

  displayDetailedResults() {
    console.log(`\n${colors.bright}${colors.white}📋 Detailed Test Results:${colors.reset}`)
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐')
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      const duration = result.duration.toString().padStart(6)
      const tools = result.toolsUsed.toString().padStart(2)
      const issue = result.issue.padEnd(35)
      
      console.log(`│ ${index + 1}.${status} ${issue} ${colors.yellow}${duration}s${colors.reset} ${colors.blue}${tools} tools${colors.reset} │`)
    })
    
    console.log('└─────────────────────────────────────────────────────────────────────────────┘')
  }

  generateTextReport() {
    const summary = this.getSummary()
    const timestamp = new Date().toLocaleString()
    
    let report = `AI Agent Test Report
Generated: ${timestamp}

SUMMARY
=======
Total Tests: ${summary.total}
Passed: ${summary.passed}
Failed: ${summary.failed}
Success Rate: ${summary.successRate}%
Total Time: ${summary.totalTime}s
Average Time: ${summary.averageTime}s

DETAILED RESULTS
================
`

    this.results.forEach((result, index) => {
      report += `
${index + 1}. ${result.issue}
   Status: ${result.success ? 'PASSED' : 'FAILED'}
   Duration: ${result.duration}s
   Tools Used: ${result.toolsUsed}
   Rounds: ${result.rounds}
   Response Length: ${result.responseLength} chars
   ${result.error ? `Error: ${result.error}` : ''}
`
    })

    const reportPath = join(__dirname, 'test-report.txt')
    fs.writeFileSync(reportPath, report)
    return reportPath
  }
}

// Test configuration
const issuesToTest = [
  {
    owner: 'unit-mesh',
    repo: 'autodev-workbench',
    issueNumber: 105,
    description: 'Analyze GitHub issue #105 in unit-mesh/autodev-workbench'
  },
  {
    owner: 'unit-mesh',
    repo: 'autodev-workbench',
    issueNumber: 104,
    description: 'Analyze GitHub issue #104 in unit-mesh/autodev-workbench'
  }
]

// Main test function
async function runVisualTest(issueConfig, visualizer, index, total) {
  const startTime = Date.now()
  
  try {
    visualizer.displayProgress(index, total, `Issue #${issueConfig.issueNumber}`)
    
    // Load agent
    const { AIAgent } = require('./dist/agent.js')
    
    // Environment check
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN not found in environment')
    }

    const hasLLM = process.env.GLM_TOKEN || process.env.DEEPSEEK_TOKEN || process.env.OPENAI_API_KEY
    if (!hasLLM) {
      throw new Error('No LLM provider token found')
    }

    // Initialize agent
    const agent = new AIAgent({
      workspacePath: join(process.cwd(), '../../'),
      githubToken: process.env.GITHUB_TOKEN,
      verbose: false,
      maxToolRounds: 3,
      enableToolChaining: true
    })

    // Run test
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

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    const result = {
      issue: `${issueConfig.owner}/${issueConfig.repo}#${issueConfig.issueNumber}`,
      description: issueConfig.description,
      success: response.success,
      duration: duration,
      rounds: response.totalRounds || 1,
      toolsUsed: response.toolResults.length,
      responseLength: response.text.length
    }

    visualizer.addResult(result)
    visualizer.displayTestResult(result)
    
    return result

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    const result = {
      issue: `${issueConfig.owner}/${issueConfig.repo}#${issueConfig.issueNumber}`,
      description: issueConfig.description,
      success: false,
      duration: duration,
      rounds: 0,
      toolsUsed: 0,
      responseLength: 0,
      error: error.message
    }

    visualizer.addResult(result)
    visualizer.displayTestResult(result)
    
    return result
  }
}

// Main execution
async function main() {
  const visualizer = new SimpleVisualizer()
  
  visualizer.displayHeader()
  
  console.log(`${colors.cyan}🚀 Starting ${issuesToTest.length} tests...${colors.reset}`)
  console.log(`${colors.dim}Press Ctrl+C to stop${colors.reset}\n`)

  let allPassed = true

  for (let i = 0; i < issuesToTest.length; i++) {
    const issue = issuesToTest[i]
    const result = await runVisualTest(issue, visualizer, i + 1, issuesToTest.length)
    
    if (!result.success) {
      allPassed = false
    }
    
    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Final visualization
  visualizer.displaySummary()
  visualizer.displayDetailedResults()
  
  // Generate report
  const reportPath = visualizer.generateTextReport()
  console.log(`\n${colors.bright}📄 Text report saved: ${colors.cyan}${reportPath}${colors.reset}`)

  // Final status
  const finalMessage = allPassed ? 
    `${colors.bgGreen}${colors.white} 🎉 ALL TESTS PASSED! ${colors.reset}` :
    `${colors.bgRed}${colors.white} ❌ SOME TESTS FAILED ${colors.reset}`
  
  console.log(`\n${finalMessage}\n`)
  
  process.exit(allPassed ? 0 : 1)
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error)
    process.exit(1)
  })
}

module.exports = { SimpleVisualizer, runVisualTest, issuesToTest }
