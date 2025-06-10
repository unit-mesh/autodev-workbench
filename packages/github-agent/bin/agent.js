#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { AIAgent } = require('../dist/agent.js');
const readline = require('readline');
const path = require('path');

async function main() {
  console.log('🤖 AutoDev AI Agent Starting...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const config = parseArgs(args);

  // Extract GitHub context from environment variables if available
  const githubContext = extractGitHubContextFromEnv();

  try {
    const agent = new AIAgent({
      workspacePath: config.workspacePath || process.cwd(),
      githubToken: process.env.GITHUB_TOKEN,
      verbose: config.verbose,
      autoUploadToIssue: config.autoUpload || false,
      githubContext: githubContext
    });

    // Set global reference for cleanup
    globalAgent = agent;

    const llmInfo = agent.getLLMInfo();
    console.log(`🧠 LLM Provider: ${llmInfo.provider} (${llmInfo.model})`);
    console.log(`🔧 Available Tools: ${agent.getAvailableTools().join(', ')}`);
    console.log(`📁 Workspace: ${config.workspacePath || process.cwd()}`);

    if (config.command) {
      await processSingleCommand(agent, config.command, config);
      return;
    }

    // Start interactive mode
    await startInteractiveMode(agent, config);

  } catch (error) {
    console.error('❌ Failed to start AI Agent:', error.message);

    if (error.message.includes('LLM provider')) {
      console.log('\n💡 Please set one of the following environment variables:');
      console.log('   - GLM_TOKEN (for 智谱AI)');
      console.log('   - DEEPSEEK_TOKEN (for DeepSeek)');
      console.log('   - OPENAI_API_KEY (for OpenAI)');
    }

    if (globalAgent) {
      await cleanupAndExit(globalAgent, 1);
    } else {
      process.exit(1);
    }
  }
}

/**
 * Extract GitHub context from environment variables (GitHub Actions)
 */
function extractGitHubContextFromEnv() {
  // Check if we're running in GitHub Actions
  if (!process.env.GITHUB_ACTIONS) {
    return null;
  }

  try {
    const repository = process.env.GITHUB_REPOSITORY; // format: "owner/repo"
    const eventName = process.env.GITHUB_EVENT_NAME;
    const eventPath = process.env.GITHUB_EVENT_PATH;

    if (!repository || !eventName || !eventPath) {
      console.log('⚠️ GitHub Actions environment detected but missing required variables');
      return null;
    }

    // Parse repository
    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      console.log('⚠️ Invalid GITHUB_REPOSITORY format:', repository);
      return null;
    }

    // Read event data
    const fs = require('fs');
    let eventData = {};
    try {
      const eventContent = fs.readFileSync(eventPath, 'utf8');
      eventData = JSON.parse(eventContent);
    } catch (error) {
      console.log('⚠️ Failed to read GitHub event data:', error.message);
      return null;
    }

    // Extract issue number for issue events
    let issueNumber = null;
    if (eventName === 'issues' && eventData.issue) {
      issueNumber = eventData.issue.number;
    } else if (eventName === 'issue_comment' && eventData.issue) {
      issueNumber = eventData.issue.number;
    }

    if (issueNumber) {
      const context = {
        owner,
        repo,
        issueNumber,
        eventType: eventName,
        action: eventData.action
      };

      console.log('📋 GitHub context detected:', context);
      return context;
    } else {
      console.log('⚠️ No issue number found in GitHub event data');
      return null;
    }

  } catch (error) {
    console.log('⚠️ Failed to extract GitHub context:', error.message);
    return null;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const config = {
    verbose: false,
    workspacePath: null,
    command: null,
    autoUpload: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      
      case '--workspace':
      case '-w':
        if (i + 1 < args.length) {
          config.workspacePath = path.resolve(args[i + 1]);
          i++;
        }
        break;
      
      case '--command':
      case '-c':
        if (i + 1 < args.length) {
          config.command = args[i + 1];
          i++;
        }
        break;

      case '--auto-upload':
      case '-u':
        config.autoUpload = true;
        break;
      
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      
      default:
        // If no flag, treat as command
        if (!arg.startsWith('-') && !config.command) {
          config.command = args.slice(i).join(' ');
          break;
        }
    }
  }

  return config;
}

/**
 * Process a single command and exit
 */
async function processSingleCommand(agent, command, config) {
  console.log(`🎯 Processing command: ${command}\n`);

  try {
    const response = await agent.processInput(command);
    const formattedResponse = AIAgent.formatResponse(response, {
      autoUpload: config.autoUpload,
      githubToken: process.env.GITHUB_TOKEN
    });

    console.log(formattedResponse);

    if (!response.success) {
      console.error('❌ Command execution failed');
      await cleanupAndExit(agent, 1);
      return;
    }

    console.log('\n✅ Command completed successfully');
    await cleanupAndExit(agent, 0);

  } catch (error) {
    console.error('❌ Error processing command:', error.message);
    await cleanupAndExit(agent, 1);
  }
}

/**
 * Clean up resources and exit gracefully
 */
async function cleanupAndExit(agent, exitCode) {
  try {
    console.log('🧹 Cleaning up resources...');

    // Clean up agent resources
    if (agent && typeof agent.cleanup === 'function') {
      await agent.cleanup();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    console.log('✅ Cleanup completed');

    // Use setImmediate to ensure all async operations complete
    setImmediate(() => {
      process.exit(exitCode);
    });

  } catch (error) {
    console.warn('⚠️ Warning during cleanup:', error.message);
    process.exit(exitCode);
  }
}

/**
 * Start interactive mode
 */
async function startInteractiveMode(agent, config) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '🤖 > '
  });

  rl.prompt();

  rl.on('line', async (input) => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      rl.prompt();
      return;
    }

    // Handle special commands
    if (trimmedInput === 'exit' || trimmedInput === 'quit') {
      console.log('👋 Goodbye!');
      rl.close();
      return;
    }

    if (trimmedInput === 'help') {
      showInteractiveHelp(agent);
      rl.prompt();
      return;
    }

    if (trimmedInput === 'clear') {
      agent.clearHistory();
      console.log('🧹 Conversation history cleared.');
      rl.prompt();
      return;
    }

    if (trimmedInput === 'tools') {
      console.log('🔧 Available tools:', agent.getAvailableTools().join(', '));
      rl.prompt();
      return;
    }

    // Process user input
    try {
      console.log('\n🤔 Thinking...\n');
      
      const response = await agent.processInput(trimmedInput);
      const formattedResponse = AIAgent.formatResponse(response, {
        autoUpload: config.autoUpload,
        githubToken: process.env.GITHUB_TOKEN
      });

      console.log(formattedResponse);
    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    console.log('\n');
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n👋 AI Agent stopped.');
    process.exit(0);
  });
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🤖 AutoDev AI Agent - Autonomous GitHub Issue Analysis

USAGE:
  autodev-ai-agent [OPTIONS] [COMMAND]

OPTIONS:
  -v, --verbose           Enable verbose logging
  -w, --workspace PATH    Set workspace path (default: current directory)
  -c, --command TEXT      Execute single command and exit
  -u, --auto-upload       Automatically upload analysis results to GitHub issues
  -h, --help              Show this help message

EXAMPLES:
  # Interactive mode
  autodev-ai-agent

  # Single command
  autodev-ai-agent "Analyze GitHub issue #123 in owner/repo"
  
  # With options
  autodev-ai-agent --verbose --workspace /path/to/project

  # Auto-upload results to GitHub issue
  autodev-ai-agent --auto-upload "Analyze GitHub issue #123 in owner/repo"

ENVIRONMENT VARIABLES:
  GITHUB_TOKEN           GitHub personal access token
  GLM_TOKEN             智谱AI API token
  DEEPSEEK_TOKEN        DeepSeek API token  
  OPENAI_API_KEY        OpenAI API key

The agent can help you:
  - Analyze GitHub issues and pull requests
  - Search and understand code repositories
  - Generate comprehensive analysis reports
  - Provide actionable insights and recommendations
`);
}

/**
 * Show interactive help
 */
function showInteractiveHelp(agent) {
  const llmInfo = agent.getLLMInfo();
  
  console.log(`
🤖 AI Agent Interactive Commands:

SPECIAL COMMANDS:
  help     - Show this help message
  tools    - List available tools
  clear    - Clear conversation history
  exit     - Exit the agent

EXAMPLE REQUESTS:
  "Analyze GitHub issue #123 in owner/repo"
  "Search for authentication-related code"
  "Get context for issue about login problems"
  "Find files related to user management"

CURRENT STATUS:
  🧠 LLM: ${llmInfo.provider} (${llmInfo.model})
  🔧 Tools: ${agent.getAvailableTools().length} available
  
Just type your request in natural language!
`);
}

// Global agent reference for cleanup
let globalAgent = null;

// Handle uncaught errors with cleanup
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  if (globalAgent) {
    try {
      await globalAgent.cleanup();
    } catch (cleanupError) {
      console.warn('⚠️ Error during emergency cleanup:', cleanupError.message);
    }
  }
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (globalAgent) {
    try {
      await globalAgent.cleanup();
    } catch (cleanupError) {
      console.warn('⚠️ Error during emergency cleanup:', cleanupError.message);
    }
  }
  process.exit(1);
});

// Handle graceful shutdown signals
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (globalAgent) {
    await cleanupAndExit(globalAgent, 0);
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (globalAgent) {
    await cleanupAndExit(globalAgent, 0);
  } else {
    process.exit(0);
  }
});

// Start the agent
main().catch(async (error) => {
  console.error('❌ Failed to start AI Agent:', error);
  if (globalAgent) {
    await cleanupAndExit(globalAgent, 1);
  } else {
    process.exit(1);
  }
});
