#!/usr/bin/env node

/**
 * GitHub Issue Analysis CLI Tool
 * 
 * A command-line tool to analyze GitHub issues and generate detailed reports
 * with code context and suggestions.
 * 
 * @author AutoDev Team
 * @version 0.1.0
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config();

// Import services from the built package
const { GitHubService, ContextAnalyzer, AnalysisReportGenerator } = require('../dist/index.js');

/**
 * CLI Configuration and Constants
 */
const CLI_NAME = 'autodev-analyze-issue';
const CLI_VERSION = '0.1.0';

/**
 * Load configuration from file
 */
function loadConfig(configPath) {
  try {
    const configFile = configPath || path.join(__dirname, '..', '.autodev-config.json');
    if (fs.existsSync(configFile)) {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return config;
    }
  } catch (error) {
    console.warn(`⚠️  Failed to load config file: ${error.message}`);
  }
  return null;
}

const DEFAULT_OPTIONS = {
  language: 'en',
  upload: false,
  includeContent: false,
  maxFiles: 10,
  workspace: process.cwd(),
  verbose: false
};

/**
 * Exit codes for different error conditions
 */
const EXIT_CODES = {
  SUCCESS: 0,
  INVALID_ARGS: 1,
  MISSING_TOKEN: 2,
  ANALYSIS_ERROR: 3,
  UPLOAD_ERROR: 4,
  VALIDATION_ERROR: 5
};

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${CLI_NAME} v${CLI_VERSION}

DESCRIPTION:
  Analyze GitHub issues with code context and generate detailed reports.
  This tool uses AI-powered analysis to find relevant code files, symbols,
  and generate actionable suggestions for issue resolution.

USAGE:
  ${CLI_NAME} <owner> <repo> <issue_number> [options]

ARGUMENTS:
  owner          GitHub repository owner (username or organization)
  repo           GitHub repository name
  issue_number   GitHub issue number to analyze

OPTIONS:
  --language=LANG     Report language (en|zh) [default: en]
  --upload            Upload analysis report to GitHub as a comment
  --include-content   Include file content in the report [default: false]
  --max-files=N       Maximum number of files to include [default: 10]
  --workspace=PATH    Workspace path to analyze [default: current directory]
  --verbose, -v       Enable verbose output
  --help, -h          Show this help message
  --version           Show version information

ENVIRONMENT VARIABLES:
  GITHUB_TOKEN        GitHub personal access token (required)
  OPENAI_API_KEY      OpenAI API key for enhanced analysis (optional)

EXAMPLES:
  # Basic analysis (dry run)
  ${CLI_NAME} microsoft vscode 12345

  # Generate Chinese report and upload to GitHub
  ${CLI_NAME} microsoft vscode 12345 --language=zh --upload

  # Include file content with custom workspace
  ${CLI_NAME} facebook react 67890 --include-content --workspace=/path/to/repo

  # Verbose analysis with more files
  ${CLI_NAME} nodejs node 11111 --verbose --max-files=20

EXIT CODES:
  0  Success
  1  Invalid arguments
  2  Missing GitHub token
  3  Analysis error
  4  Upload error
  5  Validation error

For more information, visit: https://github.com/autodev-work/autodev
`);
}

/**
 * Display version information
 */
function showVersion() {
  console.log(`${CLI_NAME} v${CLI_VERSION}`);
}

/**
 * Parse command line arguments
 */
function parseArguments(args) {
  const options = { ...DEFAULT_OPTIONS };
  const positionalArgs = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(EXIT_CODES.SUCCESS);
    } else if (arg === '--version') {
      showVersion();
      process.exit(EXIT_CODES.SUCCESS);
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--upload') {
      options.upload = true;
    } else if (arg === '--include-content') {
      options.includeContent = true;
    } else if (arg.startsWith('--language=')) {
      const language = arg.split('=')[1];
      if (!['en', 'zh'].includes(language)) {
        console.error(`Error: Invalid language '${language}'. Supported: en, zh`);
        process.exit(EXIT_CODES.INVALID_ARGS);
      }
      options.language = language;
    } else if (arg.startsWith('--max-files=')) {
      const maxFiles = parseInt(arg.split('=')[1]);
      if (isNaN(maxFiles) || maxFiles < 1 || maxFiles > 100) {
        console.error('Error: max-files must be a number between 1 and 100');
        process.exit(EXIT_CODES.INVALID_ARGS);
      }
      options.maxFiles = maxFiles;
    } else if (arg.startsWith('--workspace=')) {
      const workspace = arg.split('=')[1];
      if (!fs.existsSync(workspace)) {
        console.error(`Error: Workspace path does not exist: ${workspace}`);
        process.exit(EXIT_CODES.INVALID_ARGS);
      }
      options.workspace = path.resolve(workspace);
    } else if (!arg.startsWith('--')) {
      positionalArgs.push(arg);
    } else {
      console.error(`Error: Unknown option '${arg}'`);
      console.error('Use --help for usage information');
      process.exit(EXIT_CODES.INVALID_ARGS);
    }
  }
  
  return { options, positionalArgs };
}

/**
 * Validate required arguments and environment
 */
function validateEnvironment(positionalArgs) {
  // Check positional arguments
  if (positionalArgs.length < 3) {
    console.error('Error: Missing required arguments');
    console.error('Usage: autodev-analyze-issue <owner> <repo> <issue_number> [options]');
    console.error('Use --help for more information');
    process.exit(EXIT_CODES.INVALID_ARGS);
  }

  const [owner, repo, issueNumberStr] = positionalArgs;
  const issueNumber = parseInt(issueNumberStr);

  if (isNaN(issueNumber) || issueNumber < 1) {
    console.error('Error: Issue number must be a positive integer');
    process.exit(EXIT_CODES.INVALID_ARGS);
  }

  // Check GitHub token
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error('Error: GITHUB_TOKEN environment variable is not set');
    console.error('Please set your GitHub personal access token:');
    console.error('  export GITHUB_TOKEN=your_token_here');
    console.error('');
    console.error('You can create a token at: https://github.com/settings/tokens');
    process.exit(EXIT_CODES.MISSING_TOKEN);
  }

  return { owner, repo, issueNumber, githubToken };
}

/**
 * Perform pre-analysis checks
 */
async function performPreChecks(owner, repo, issueNumber, githubToken, options) {
  console.log('🔍 Performing pre-analysis checks...');

  // Check workspace
  if (!fs.existsSync(options.workspace)) {
    console.error(`❌ Workspace not found: ${options.workspace}`);
    process.exit(EXIT_CODES.VALIDATION_ERROR);
  }

  // Check if workspace has code files
  const codeFiles = fs.readdirSync(options.workspace)
    .filter(file => {
      const ext = path.extname(file);
      return ['.ts', '.js', '.py', '.java', '.go', '.rs'].includes(ext);
    });

  if (codeFiles.length === 0) {
    console.warn('⚠️  No common code files found in workspace. Analysis may be limited.');
  }

  // Test GitHub API access
  try {
    const { GitHubService } = require('../dist/index.js');
    const githubService = new GitHubService(githubToken);
    await githubService.getIssue(owner, repo, issueNumber);
    console.log('✅ GitHub API access verified');
  } catch (error) {
    console.error(`❌ GitHub API access failed: ${error.message}`);
    if (error.message.includes('Not Found')) {
      console.error('   - Check if the repository and issue number exist');
      console.error('   - Verify your GitHub token has access to this repository');
    }
    process.exit(EXIT_CODES.VALIDATION_ERROR);
  }

  // Check LLM service availability
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OpenAI API key found');
  } else {
    console.warn('⚠️  No OpenAI API key found. Using fallback analysis methods.');
  }

  console.log('✅ Pre-checks completed successfully\n');
}

/**
 * Log message with optional verbose mode
 */
function log(message, isVerbose = false, options) {
  if (!isVerbose || options.verbose) {
    console.log(message);
  }
}

/**
 * Progress tracker for better user experience
 */
class ProgressTracker {
  constructor(totalSteps, verbose = false) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  step(message) {
    this.currentStep++;
    const progress = Math.round((this.currentStep / this.totalSteps) * 100);
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);

    if (this.verbose) {
      console.log(`[${this.currentStep}/${this.totalSteps}] (${progress}%, ${elapsed}s) ${message}`);
    } else {
      console.log(`[${progress}%] ${message}`);
    }
  }

  complete(message) {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`✅ ${message} (completed in ${elapsed}s)`);
  }
}

/**
 * Main analysis function
 */
async function runAnalysis(owner, repo, issueNumber, githubToken, options) {
  const progress = new ProgressTracker(5, options.verbose);

  try {
    log(`🔍 Analyzing issue #${issueNumber} in ${owner}/${repo}...`, false, options);

    // Initialize services
    const githubService = new GitHubService(githubToken);
    const contextAnalyzer = new ContextAnalyzer(options.workspace);
    const reportGenerator = new AnalysisReportGenerator(githubToken);

    progress.step('Fetching issue details...');

    // Get the issue
    const issue = await githubService.getIssue(owner, repo, issueNumber);
    log(`📋 Issue: ${issue.title}`, false, options);

    if (options.verbose) {
      log(`   Created: ${issue.created_at}`, true, options);
      log(`   State: ${issue.state}`, true, options);
      log(`   Labels: ${issue.labels.map(l => l.name).join(', ') || 'none'}`, true, options);
    }

    progress.step(`Analyzing codebase in: ${options.workspace}`);
    const analysisResult = await contextAnalyzer.analyzeIssue(issue);

    progress.step('Analysis complete, processing results...');
    log(`  - Found ${analysisResult.relatedCode.files.length} relevant files`, false, options);
    log(`  - Found ${analysisResult.relatedCode.symbols.length} relevant symbols`, false, options);
    log(`  - Generated ${analysisResult.suggestions.length} suggestions`, false, options);

    if (options.verbose) {
      log(`\n📁 Top relevant files:`, true, options);
      analysisResult.relatedCode.files.slice(0, 5).forEach((file, index) => {
        log(`  ${index + 1}. ${file.path} (${(file.relevanceScore * 100).toFixed(1)}%)`, true, options);
      });
    }

    progress.step('Generating analysis report...');
    const { report, uploadResult } = await reportGenerator.generateAndUploadReport(
      owner,
      repo,
      issueNumber,
      analysisResult,
      {
        uploadToGitHub: options.upload,
        language: options.language,
        includeFileContent: options.includeContent,
        maxFiles: options.maxFiles
      }
    );

    // Handle results
    if (options.upload) {
      progress.step('Uploading report to GitHub...');
      if (uploadResult?.success) {
        progress.complete('Report uploaded successfully!');
        log(`   Comment ID: ${uploadResult.commentId}`, false, options);
        log(`   Comment URL: ${uploadResult.commentUrl}`, false, options);
      } else {
        console.error(`❌ Upload failed: ${uploadResult?.error}`);
        process.exit(EXIT_CODES.UPLOAD_ERROR);
      }
    } else {
      progress.complete('Analysis report generated');
      log(`📄 Generated report (use --upload to post to GitHub):`, false, options);
      console.log('---');
      console.log(report);
    }

    return EXIT_CODES.SUCCESS;

  } catch (error) {
    console.error(`❌ Analysis failed: ${error.message}`);
    if (options.verbose) {
      console.error('Stack trace:', error.stack);
    }
    return EXIT_CODES.ANALYSIS_ERROR;
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Load configuration
  const config = loadConfig();

  // Parse arguments (config provides defaults)
  const { options, positionalArgs } = parseArguments(args);

  // Merge config with options
  if (config) {
    options.maxFiles = options.maxFiles || config.analysis?.maxFiles || DEFAULT_OPTIONS.maxFiles;
    options.language = options.language || config.analysis?.language || DEFAULT_OPTIONS.language;
    options.includeContent = options.includeContent || config.analysis?.includeContent || DEFAULT_OPTIONS.includeContent;
    options.upload = options.upload || config.github?.uploadByDefault || DEFAULT_OPTIONS.upload;
  }

  // Validate environment
  const { owner, repo, issueNumber, githubToken } = validateEnvironment(positionalArgs);

  // Perform pre-checks
  await performPreChecks(owner, repo, issueNumber, githubToken, options);

  // Run analysis
  const exitCode = await runAnalysis(owner, repo, issueNumber, githubToken, options);
  process.exit(exitCode);
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(EXIT_CODES.ANALYSIS_ERROR);
  });
}

module.exports = { main, parseArguments, validateEnvironment, runAnalysis };
