#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { AIAgent } = require('../dist/agent.js');
const { GitHubService } = require('../dist/index.js');
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
 * Generate label-specific analysis command
 */
function generateLabelSpecificCommand(githubContext) {
  if (githubContext?.eventContext?.type !== 'labeled') {
    return null;
  }

  const { owner, repo, issueNumber, eventContext } = githubContext;
  const { labelName, allLabels } = eventContext;
  const repository = `${owner}/${repo}`;
  const basePrompt = `Issue #${issueNumber} in ${repository}`;

  // Define label-specific analysis strategies
  const labelStrategies = {
    // Technical analysis labels
    'bug': `${basePrompt} has been labeled as a bug. Perform comprehensive bug analysis: 1) Examine related code to identify the root cause, 2) Trace the bug's impact across the system, 3) Provide step-by-step debugging guidance, 4) Suggest specific code fixes with examples, 5) Recommend testing strategies to prevent regression.`,

    'enhancement': `${basePrompt} has been labeled as an enhancement. Analyze this feature request: 1) Evaluate technical feasibility and complexity, 2) Identify affected components and dependencies, 3) Suggest implementation approach with code examples, 4) Estimate development effort and potential risks, 5) Recommend testing and rollout strategies.`,

    'performance': `${basePrompt} has been labeled as a performance issue. Conduct performance analysis: 1) Identify performance bottlenecks in related code, 2) Analyze algorithmic complexity and resource usage, 3) Suggest optimization strategies with code examples, 4) Provide benchmarking recommendations, 5) Consider scalability implications.`,

    'security': `${basePrompt} has been labeled as a security issue. Perform security audit: 1) Identify potential vulnerabilities in related code, 2) Analyze security implications and attack vectors, 3) Suggest security best practices and fixes, 4) Provide remediation steps with priority levels, 5) Recommend security testing approaches.`,

    'refactor': `${basePrompt} has been labeled for refactoring. Analyze refactoring needs: 1) Identify code smells and technical debt, 2) Suggest refactoring strategies and patterns, 3) Provide step-by-step refactoring plan, 4) Estimate impact on existing functionality, 5) Recommend testing strategies during refactoring.`,

    // Workflow and priority labels
    'critical': `${basePrompt} is marked as critical. Provide urgent analysis: 1) Assess immediate impact and business risks, 2) Identify quick mitigation strategies, 3) Provide emergency fix suggestions with code examples, 4) Outline long-term solution approach, 5) Recommend monitoring and alerting improvements.`,

    'needs-analysis': `${basePrompt} needs detailed analysis. Provide comprehensive technical analysis: 1) Deep dive into the issue context and requirements, 2) Examine all related code components and dependencies, 3) Provide detailed technical insights and trade-offs, 4) Suggest multiple solution approaches with pros/cons, 5) Recommend implementation roadmap.`,

    'help-wanted': `${basePrompt} is seeking community help. Create newcomer-friendly analysis: 1) Explain the issue in simple, accessible terms, 2) Identify good starting points for new contributors, 3) Provide learning resources and documentation links, 4) Suggest incremental contribution steps, 5) Highlight mentoring opportunities.`,

    'good-first-issue': `${basePrompt} is marked as good for first-time contributors. Create beginner-friendly guidance: 1) Explain the issue simply with clear context, 2) Provide step-by-step implementation hints, 3) Suggest relevant learning resources and tutorials, 4) Identify potential mentoring points and code review focus areas, 5) Recommend testing approaches for beginners.`,

    // Domain-specific labels
    'frontend': `${basePrompt} has been labeled as frontend-related. Provide frontend-focused analysis: 1) Examine UI/UX implications and user experience, 2) Analyze frontend code architecture and patterns, 3) Suggest modern frontend best practices, 4) Consider accessibility and performance implications, 5) Recommend testing strategies for frontend changes.`,

    'backend': `${basePrompt} has been labeled as backend-related. Provide backend-focused analysis: 1) Analyze server-side architecture and data flow, 2) Examine API design and database implications, 3) Consider scalability and performance factors, 4) Suggest backend best practices and patterns, 5) Recommend monitoring and logging strategies.`,

    'api': `${basePrompt} has been labeled as API-related. Provide API-focused analysis: 1) Analyze API design and RESTful principles, 2) Examine request/response patterns and data structures, 3) Consider versioning and backward compatibility, 4) Suggest API documentation improvements, 5) Recommend testing and validation strategies.`,

    'database': `${basePrompt} has been labeled as database-related. Provide database-focused analysis: 1) Analyze database schema and query patterns, 2) Examine data relationships and constraints, 3) Consider performance and indexing strategies, 4) Suggest migration and backup considerations, 5) Recommend monitoring and optimization approaches.`
  };

  // Check for label combinations that might need special handling
  const hasMultipleImportantLabels = allLabels.filter(label =>
    ['critical', 'security', 'performance', 'breaking-change'].includes(label)
  ).length > 1;

  if (hasMultipleImportantLabels) {
    return `${basePrompt} has been labeled with "${labelName}" and has multiple high-priority labels: [${allLabels.join(', ')}]. Provide comprehensive analysis considering all these aspects: 1) Analyze the issue from multiple perspectives based on all labels, 2) Identify potential conflicts or synergies between different concerns, 3) Prioritize recommendations based on label importance, 4) Suggest coordinated approach addressing all labeled concerns, 5) Provide implementation roadmap considering all constraints.`;
  }

  // Return label-specific strategy or default
  return labelStrategies[labelName] ||
    `${basePrompt} has been labeled with "${labelName}". Analyze this issue in the context of this label: 1) Explain why this label is relevant to the issue, 2) Provide insights specific to this label's domain, 3) Suggest appropriate next steps and solutions, 4) Consider related issues or patterns, 5) Recommend best practices for this type of issue.`;
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
    let eventContext = null;
    if (eventName === 'issues' && eventData.issue) {
      issueNumber = eventData.issue.number;

      // Add context based on the specific action
      switch (eventData.action) {
        case 'labeled':
          eventContext = {
            type: 'labeled',
            labelName: eventData.label?.name,
            labelColor: eventData.label?.color,
            allLabels: eventData.issue.labels?.map(l => l.name) || []
          };
          break;
        case 'assigned':
          eventContext = {
            type: 'assigned',
            assignee: eventData.assignee?.login,
            allAssignees: eventData.issue.assignees?.map(a => a.login) || []
          };
          break;
        default:
          eventContext = {
            type: eventData.action || 'unknown'
          };
      }
    } else if (eventName === 'issue_comment' && eventData.issue) {
      issueNumber = eventData.issue.number;
      eventContext = {
        type: 'comment',
        commentAuthor: eventData.comment?.user?.login
      };
    }

    if (issueNumber) {
      const context = {
        owner,
        repo,
        issueNumber,
        eventType: eventName,
        action: eventData.action,
        eventContext
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
  // Check if we have GitHub context and should generate a smart command
  const githubContext = extractGitHubContextFromEnv();
  let finalCommand = command;

  // Generate label-specific command if this is a labeled event
  if (githubContext?.eventContext?.type === 'labeled') {
    const smartCommand = generateLabelSpecificCommand(githubContext);
    if (smartCommand) {
      finalCommand = smartCommand;
      console.log(`🏷️ Generated label-specific command for "${githubContext.eventContext.labelName}" label`);
    }
  }

  console.log(`🎯 Processing command: ${finalCommand}\n`);

  try {
    const response = await agent.start(finalCommand);
    const githubToken = process.env.GITHUB_TOKEN;
    console.log(`try uploading response to GitHub with autoUpload: ${config.autoUpload}, githubContext: ${response.githubContext}, githubToken: ${githubToken ? githubToken.substring(0, 4) + '...' : 'undefined'}`);

    if (config?.autoUpload && response.githubContext && githubToken) {
      // Note: This is async but we can't await in a static method
      // The upload will happen in the background
      const githubService = new GitHubService(githubToken);
      const commentData = await githubService.addIssueComment(
          response.githubContext.owner,
          response.githubContext.repo,
          response.githubContext.issueNumber,
          response.text
      );
      console.log(`Comment added: ${commentData.html_url}`);
    } else {
      console.log(`Cannot upload response to GitHub, options: ${JSON.stringify(config)}, text: ${response.text}`);
    }

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

      const response = await agent.start(trimmedInput);
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
