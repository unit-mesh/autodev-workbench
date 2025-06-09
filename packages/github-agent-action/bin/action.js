#!/usr/bin/env node

/**
 * CLI entry point for AutoDev GitHub Agent Action
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');

// Load environment variables
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional
}

// Import the main module
let mainModule;
try {
  mainModule = require('../dist/index.js');
} catch (e) {
  console.error('Failed to load main module. Make sure to run "npm run build" first.');
  process.exit(1);
}

const {
  analyzeIssue,
  startWebhookServer,
  validateConfig,
  getVersion
} = mainModule;

program
  .name('autodev-github-action')
  .description('AutoDev GitHub Agent Action - Automated issue analysis')
  .version(getVersion());

// Analyze command
program
  .command('analyze')
  .description('Analyze a specific GitHub issue')
  .requiredOption('-o, --owner <owner>', 'Repository owner')
  .requiredOption('-r, --repo <repo>', 'Repository name')
  .requiredOption('-i, --issue <number>', 'Issue number')
  .option('-t, --token <token>', 'GitHub token (or set GITHUB_TOKEN env var)')
  .option('-w, --workspace <path>', 'Workspace path', process.cwd())
  .option('-d, --depth <depth>', 'Analysis depth (shallow|medium|deep)', 'medium')
  .option('--no-comment', 'Skip adding comment to issue')
  .option('--no-label', 'Skip adding labels to issue')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    try {
      if (options.verbose) {
        console.log('🔧 Options:', options);
      }

      const result = await analyzeIssue({
        owner: options.owner,
        repo: options.repo,
        issueNumber: parseInt(options.issue),
        githubToken: options.token,
        workspacePath: options.workspace,
        depth: options.depth,
        autoComment: options.comment,
        autoLabel: options.label
      });

      if (result.success) {
        console.log('✅ Analysis completed successfully');
        
        if (result.commentAdded) {
          console.log('💬 Comment added to issue');
        }
        
        if (result.labelsAdded && result.labelsAdded.length > 0) {
          console.log(`🏷️ Labels added: ${result.labelsAdded.join(', ')}`);
        }
        
        if (result.executionTime) {
          console.log(`⏱️ Execution time: ${result.executionTime}ms`);
        }
      } else {
        console.error('❌ Analysis failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 Error:', error.message);
      process.exit(1);
    }
  });

// Server command
program
  .command('server')
  .description('Start webhook server for automated issue processing')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-s, --secret <secret>', 'Webhook secret (or set WEBHOOK_SECRET env var)')
  .option('-t, --token <token>', 'GitHub token (or set GITHUB_TOKEN env var)')
  .option('-w, --workspace <path>', 'Workspace path', process.cwd())
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    try {
      if (options.verbose) {
        console.log('🔧 Server options:', options);
      }

      const webhookHandler = await startWebhookServer({
        port: parseInt(options.port),
        webhookSecret: options.secret,
        githubToken: options.token,
        workspacePath: options.workspace
      });

      console.log('🚀 Webhook server started successfully');
      console.log(`📡 Webhook endpoint: http://localhost:${options.port}/webhook`);
      console.log(`🏥 Health check: http://localhost:${options.port}/health`);
      console.log('Press Ctrl+C to stop the server');

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down server...');
        process.exit(0);
      });

    } catch (error) {
      console.error('💥 Failed to start server:', error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate configuration and environment')
  .action(() => {
    try {
      console.log('🔍 Validating configuration...');
      
      const validation = validateConfig();
      
      if (validation.valid) {
        console.log('✅ Configuration is valid');
      } else {
        console.log('❌ Configuration errors:');
        validation.errors.forEach(error => {
          console.log(`  - ${error}`);
        });
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 Validation error:', error.message);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    try {
      console.log('📋 Current Configuration:');
      console.log(`  GitHub Token: ${process.env.GITHUB_TOKEN ? '✅ Set' : '❌ Not set'}`);
      console.log(`  Webhook Secret: ${process.env.WEBHOOK_SECRET ? '✅ Set' : '❌ Not set'}`);
      console.log(`  Workspace: ${process.env.GITHUB_WORKSPACE || process.cwd()}`);
      console.log(`  Auto Comment: ${process.env.AUTO_COMMENT || 'true'}`);
      console.log(`  Auto Label: ${process.env.AUTO_LABEL || 'true'}`);
      console.log(`  Analysis Depth: ${process.env.ANALYSIS_DEPTH || 'medium'}`);
      console.log(`  Trigger Events: ${process.env.TRIGGER_EVENTS || 'opened,edited'}`);
      
      if (process.env.EXCLUDE_LABELS) {
        console.log(`  Exclude Labels: ${process.env.EXCLUDE_LABELS}`);
      }
      
      if (process.env.INCLUDE_LABELS) {
        console.log(`  Include Labels: ${process.env.INCLUDE_LABELS}`);
      }
    } catch (error) {
      console.error('💥 Error showing config:', error.message);
      process.exit(1);
    }
  });

// Version command (already handled by commander)

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    program.help();
  });

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(`
📚 Usage Examples:

1. Analyze a specific issue:
   autodev-github-action analyze -o unit-mesh -r autodev-workbench -i 81

2. Analyze with custom settings:
   autodev-github-action analyze -o owner -r repo -i 123 --depth deep --no-comment

3. Start webhook server:
   autodev-github-action server --port 3000

4. Start server with custom settings:
   autodev-github-action server -p 8080 -s my-webhook-secret

5. Validate configuration:
   autodev-github-action validate

6. Show current configuration:
   autodev-github-action config

Environment Variables:
  GITHUB_TOKEN       - GitHub personal access token (required)
  WEBHOOK_SECRET     - Secret for webhook verification
  WORKSPACE_PATH     - Path to repository workspace
  AUTO_COMMENT       - Auto-add analysis comments (true/false)
  AUTO_LABEL         - Auto-add labels (true/false)
  ANALYSIS_DEPTH     - Analysis depth (shallow/medium/deep)
  TRIGGER_EVENTS     - Comma-separated list of events to process
  EXCLUDE_LABELS     - Comma-separated list of labels to exclude
  INCLUDE_LABELS     - Comma-separated list of labels to include

GitHub Actions Usage:
  Add this action to your workflow:
  
  - name: Analyze Issues
    uses: ./packages/github-agent-action
    with:
      github-token: \${{ secrets.GITHUB_TOKEN }}
      analysis-depth: medium
      auto-comment: true
      auto-label: true
`);
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
