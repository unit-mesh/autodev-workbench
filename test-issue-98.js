#!/usr/bin/env node

/**
 * Test script to analyze GitHub issue #98 from unit-mesh/autodev-workbench
 * This demonstrates the LLM-enhanced issue analysis capabilities
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration for the test
const config = {
  owner: 'unit-mesh',
  repo: 'autodev-workbench', 
  issue: '98',
  depth: 'medium',
  verbose: true,
  workspace: process.cwd()
};

console.log('🚀 Starting automated analysis of issue #98');
console.log('📋 Issue: "[TEST] generate project architecture"');
console.log('🔗 URL: https://github.com/unit-mesh/autodev-workbench/issues/98');
console.log('');

// Check if required environment variables are set
const requiredEnvVars = ['GITHUB_TOKEN'];
const optionalEnvVars = ['OPENAI_API_KEY', 'DEEPSEEK_TOKEN', 'GLM_TOKEN'];

console.log('🔍 Checking environment variables...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Required environment variable ${envVar} is not set`);
    process.exit(1);
  }
  console.log(`✅ ${envVar}: Set`);
}

for (const envVar of optionalEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set (LLM features enabled)`);
  } else {
    console.log(`⚠️ ${envVar}: Not set (LLM features may be limited)`);
  }
}

console.log('');

// Build the command
const actionPath = path.join(__dirname, 'packages/github-agent-action/bin/action.js');
const args = [
  'analyze',
  '--owner', config.owner,
  '--repo', config.repo,
  '--issue', config.issue,
  '--depth', config.depth,
  '--workspace', config.workspace
];

if (config.verbose) {
  args.push('--verbose');
}

console.log('🔧 Running command:');
console.log(`node ${actionPath} ${args.join(' ')}`);
console.log('');

// Execute the analysis
const child = spawn('node', [actionPath, ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Enable verbose LLM logging for this test
    VERBOSE_LLM_LOGS: 'true'
  }
});

child.on('close', (code) => {
  console.log('');
  if (code === 0) {
    console.log('✅ Analysis completed successfully!');
    console.log('');
    console.log('📊 Expected results:');
    console.log('  - LLM-based label suggestions (instead of hardcoded patterns)');
    console.log('  - Context-aware file importance analysis');
    console.log('  - Intelligent filtering suggestions based on issue content');
    console.log('  - Enhanced comment generation with architectural insights');
    console.log('');
    console.log('🔍 Check the GitHub issue for the generated analysis comment');
    console.log('🏷️ Check if appropriate labels were added based on LLM analysis');
  } else {
    console.error(`❌ Analysis failed with exit code ${code}`);
    process.exit(code);
  }
});

child.on('error', (error) => {
  console.error('💥 Failed to start analysis:', error.message);
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping analysis...');
  child.kill('SIGINT');
  process.exit(0);
});
