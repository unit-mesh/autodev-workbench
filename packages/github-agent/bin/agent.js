#!/usr/bin/env node

const { AIAgent } = require('../dist/agent.js');
const readline = require('readline');
const path = require('path');

/**
 * Autonomous AI Agent CLI
 * Interactive command-line interface for the AI Agent
 */

async function main() {
  console.log('🤖 AutoDev AI Agent Starting...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const config = parseArgs(args);

  try {
    // Initialize AI Agent
    const agent = new AIAgent({
      workspacePath: config.workspacePath || process.cwd(),
      githubToken: process.env.GITHUB_TOKEN,
      verbose: config.verbose
    });

    const llmInfo = agent.getLLMInfo();
    console.log(`🧠 LLM Provider: ${llmInfo.provider} (${llmInfo.model})`);
    console.log(`🔧 Available Tools: ${agent.getAvailableTools().join(', ')}`);
    console.log(`📁 Workspace: ${config.workspacePath || process.cwd()}`);
    console.log('\n' + '='.repeat(60));
    console.log('💬 AI Agent is ready! Type your requests or "help" for commands.');
    console.log('   Type "exit" or "quit" to stop the agent.');
    console.log('='.repeat(60) + '\n');

    // Handle single command mode
    if (config.command) {
      await processSingleCommand(agent, config.command);
      return;
    }

    // Start interactive mode
    await startInteractiveMode(agent);

  } catch (error) {
    console.error('❌ Failed to start AI Agent:', error.message);
    
    if (error.message.includes('LLM provider')) {
      console.log('\n💡 Please set one of the following environment variables:');
      console.log('   - GLM_TOKEN (for 智谱AI)');
      console.log('   - DEEPSEEK_TOKEN (for DeepSeek)');
      console.log('   - OPENAI_API_KEY (for OpenAI)');
    }
    
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const config = {
    verbose: false,
    workspacePath: null,
    command: null
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
async function processSingleCommand(agent, command) {
  console.log(`🎯 Processing command: ${command}\n`);
  
  const response = await agent.processInput(command);
  const formattedResponse = AIAgent.formatResponse(response);
  
  console.log(formattedResponse);
  
  if (!response.success) {
    process.exit(1);
  }
}

/**
 * Start interactive mode
 */
async function startInteractiveMode(agent) {
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
      const formattedResponse = AIAgent.formatResponse(response);
      
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
  -h, --help              Show this help message

EXAMPLES:
  # Interactive mode
  autodev-ai-agent

  # Single command
  autodev-ai-agent "Analyze GitHub issue #123 in owner/repo"
  
  # With options
  autodev-ai-agent --verbose --workspace /path/to/project

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

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the agent
main().catch((error) => {
  console.error('❌ Failed to start AI Agent:', error);
  process.exit(1);
});
