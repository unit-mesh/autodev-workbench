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
const https = require('https');
const http = require('http');

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
  verbose: false,
  fetchUrls: true,
  urlTimeout: 10000
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
  --fetch-urls        Fetch and analyze URLs from issue content [default: true]
  --no-fetch-urls     Disable URL fetching
  --url-timeout=MS    Timeout for URL fetching in milliseconds [default: 10000]
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
    } else if (arg === '--fetch-urls') {
      options.fetchUrls = true;
    } else if (arg === '--no-fetch-urls') {
      options.fetchUrls = false;
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
    } else if (arg.startsWith('--url-timeout=')) {
      const timeout = parseInt(arg.split('=')[1]);
      if (isNaN(timeout) || timeout < 1000 || timeout > 60000) {
        console.error('Error: url-timeout must be a number between 1000 and 60000 milliseconds');
        process.exit(EXIT_CODES.INVALID_ARGS);
      }
      options.urlTimeout = timeout;
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
 * Enhanced logging system for better user experience and debugging
 */
class AnalysisLogger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.logFile = options.logFile || path.join(process.cwd(), 'analysis.log');
    this.startTime = Date.now();
    this.stepLogs = [];

    // Initialize log file
    this.writeToFile(`\n=== Analysis Session Started at ${new Date().toISOString()} ===\n`);
  }

  writeToFile(message) {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      // Silently fail if can't write to log file
    }
  }

  // User-friendly output
  info(message) {
    console.log(message);
    this.writeToFile(`[INFO] ${message}`);
  }

  // Success messages
  success(message) {
    console.log(`✅ ${message}`);
    this.writeToFile(`[SUCCESS] ${message}`);
  }

  // Warning messages
  warn(message) {
    console.log(`⚠️  ${message}`);
    this.writeToFile(`[WARN] ${message}`);
  }

  // Error messages
  error(message) {
    console.log(`❌ ${message}`);
    this.writeToFile(`[ERROR] ${message}`);
  }

  // Verbose-only messages
  debug(message, data = null) {
    if (this.verbose) {
      console.log(`🔍 ${message}`);
    }
    this.writeToFile(`[DEBUG] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
  }

  // Step logging with details
  step(stepName, details = null) {
    const stepInfo = {
      name: stepName,
      timestamp: new Date().toISOString(),
      details: details
    };
    this.stepLogs.push(stepInfo);
    this.writeToFile(`[STEP] ${stepName}${details ? '\n' + JSON.stringify(details, null, 2) : ''}`);
  }

  // LLM call logging
  llmCall(provider, model, operation, input = null, output = null) {
    const llmLog = {
      provider,
      model,
      operation,
      timestamp: new Date().toISOString(),
      inputLength: input ? input.length : 0,
      outputLength: output ? output.length : 0
    };

    this.info(`🤖 ${operation} using ${provider} (${model})`);
    this.writeToFile(`[LLM] ${JSON.stringify(llmLog, null, 2)}`);

    if (input && this.verbose) {
      this.writeToFile(`[LLM_INPUT] ${input.substring(0, 1000)}${input.length > 1000 ? '...' : ''}`);
    }
    if (output) {
      this.writeToFile(`[LLM_OUTPUT] ${output.substring(0, 2000)}${output.length > 2000 ? '...' : ''}`);
    }
  }

  // URL processing logging
  urlProcessing(urls, results) {
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    this.info(`🌐 Processed ${urls.length} URLs: ${successful} successful, ${failed} failed`);

    if (this.verbose && successful > 0) {
      results.filter(r => r.status === 'success').forEach(result => {
        this.debug(`  ✅ ${result.url} (${result.content_length} chars)`);
      });
    }

    if (failed > 0) {
      results.filter(r => r.status === 'error').forEach(result => {
        this.debug(`  ❌ ${result.url}: ${result.error}`);
      });
    }

    this.writeToFile(`[URL_PROCESSING] ${JSON.stringify({ urls, results }, null, 2)}`);
  }

  // Analysis results logging
  analysisResults(results) {
    const { relatedCode, suggestions } = results;

    this.info(`📊 Analysis Results:`);
    this.info(`   • ${relatedCode.files.length} relevant files found`);
    this.info(`   • ${relatedCode.symbols.length} symbols identified`);
    this.info(`   • ${suggestions.length} suggestions generated`);

    if (this.verbose && relatedCode.files.length > 0) {
      this.debug('Top relevant files:');
      relatedCode.files.slice(0, 5).forEach((file, index) => {
        this.debug(`  ${index + 1}. ${file.path} (${(file.relevanceScore * 100).toFixed(1)}% relevance)`);
      });
    }

    this.writeToFile(`[ANALYSIS_RESULTS] ${JSON.stringify(results, null, 2)}`);
  }

  // Final summary
  complete(message) {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    this.success(`${message} (completed in ${elapsed}s)`);
    this.info(`📝 Detailed logs saved to: ${this.logFile}`);
    this.writeToFile(`=== Analysis Session Completed in ${elapsed}s ===\n`);
  }
}

/**
 * Enhanced progress tracker with cleaner output
 */
class ProgressTracker {
  constructor(totalSteps, logger) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.logger = logger;
    this.startTime = Date.now();
  }

  step(message, details = null) {
    this.currentStep++;
    const progress = Math.round((this.currentStep / this.totalSteps) * 100);

    console.log(`\n[${this.currentStep}/${this.totalSteps}] ${message}`);
    this.logger.step(message, details);
  }

  complete(message) {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    this.logger.complete(message);
  }
}

/**
 * Main analysis function
 */
async function runAnalysis(owner, repo, issueNumber, githubToken, options) {
  // Initialize enhanced logging
  const logger = new AnalysisLogger({
    verbose: options.verbose,
    logFile: path.join(process.cwd(), `analysis-${owner}-${repo}-${issueNumber}.log`)
  });

  const progress = new ProgressTracker(5, logger);

  try {
    logger.info(`🔍 Analyzing issue #${issueNumber} in ${owner}/${repo}`);

    // Initialize performance monitoring
    const { performanceMonitor } = require('../dist/utils/performance-monitor.js');
    performanceMonitor.start('total_analysis');

    // Initialize services
    const githubService = new GitHubService(githubToken);
    const contextAnalyzer = new ContextAnalyzer(options.workspace);
    const reportGenerator = new AnalysisReportGenerator(githubToken);

    progress.step('Fetching issue details from GitHub', {
      repository: `${owner}/${repo}`,
      issueNumber: issueNumber
    });

    // Get the issue
    const issue = await githubService.getIssue(owner, repo, issueNumber);
    logger.info(`📋 Issue: "${issue.title}"`);
    logger.debug('Issue details', {
      created: issue.created_at,
      state: issue.state,
      labels: issue.labels.map(l => l.name),
      bodyLength: issue.body ? issue.body.length : 0
    });

    // Fetch URL content if enabled
    let urlContent = [];
    if (options.fetchUrls && issue.body) {
      progress.step('Extracting and fetching URLs from issue content', {
        fetchUrls: true,
        timeout: options.urlTimeout
      });

      try {
        // Use the existing URL fetching capability from github-analyze-issue
        const { fetchUrlsFromIssue, extractUrlsFromText } = require('../dist/index.js');

        // First extract URLs to show what we found
        const extractedUrls = extractUrlsFromText(issue.body);
        if (extractedUrls.length > 0) {
          logger.debug(`Found ${extractedUrls.length} URLs to process`, extractedUrls);
        } else {
          logger.debug('No URLs found in issue content');
        }

        // Fetch content from URLs
        urlContent = await fetchUrlsFromIssue(issue.body, options.urlTimeout);

        // Log results in a clean, summarized way
        if (urlContent.length > 0) {
          logger.urlProcessing(extractedUrls, urlContent);
        }
      } catch (error) {
        logger.warn(`URL fetching failed: ${error.message}`);
        logger.debug('URL fetching error details', { error: error.stack });
      }
    } else if (!options.fetchUrls) {
      logger.debug('URL fetching disabled by user option');
    } else {
      logger.debug('No issue body content to extract URLs from');
    }

    progress.step('Analyzing codebase for relevant code', {
      workspace: options.workspace,
      urlContentAvailable: urlContent.length > 0
    });

    // Enhance issue with URL content for better analysis
    const enhancedIssue = {
      ...issue,
      urlContent: urlContent
    };

    // Perform the analysis
    const analysisResult = await contextAnalyzer.analyzeIssue(enhancedIssue);

    progress.step('Processing analysis results');

    // Log analysis results in a structured way
    logger.analysisResults(analysisResult);

    progress.step('Generating comprehensive analysis report', {
      language: options.language,
      includeFileContent: options.includeContent,
      maxFiles: options.maxFiles,
      uploadToGitHub: options.upload
    });

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
      if (uploadResult?.success) {
        logger.success('Report uploaded to GitHub successfully!');
        logger.info(`   📝 Comment ID: ${uploadResult.commentId}`);
        logger.info(`   🔗 Comment URL: ${uploadResult.commentUrl}`);
        progress.complete('Analysis completed and uploaded to GitHub');
      } else {
        logger.error(`Upload failed: ${uploadResult?.error}`);
        logger.debug('Upload error details', uploadResult);
        process.exit(EXIT_CODES.UPLOAD_ERROR);
      }
    } else {
      progress.complete('Analysis report generated');
      logger.info(`\n📄 Generated Analysis Report:`);
      logger.info(`   Use --upload flag to post this report to GitHub issue #${issueNumber}`);
      console.log('\n' + '='.repeat(80));
      console.log(report);
      console.log('='.repeat(80));
    }

    // End performance monitoring and log summary
    performanceMonitor.end('total_analysis');
    if (options.verbose) {
      performanceMonitor.logSummary();
    }

    return EXIT_CODES.SUCCESS;

  } catch (error) {
    logger.error(`Analysis failed: ${error.message}`);
    logger.debug('Error details', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Provide user-friendly error messages based on error type
    if (error.message.includes('GitHub API')) {
      logger.info('💡 Tip: Check your GITHUB_TOKEN and repository access permissions');
    } else if (error.message.includes('workspace')) {
      logger.info('💡 Tip: Verify the workspace path exists and contains code files');
    } else if (error.message.includes('LLM') || error.message.includes('model')) {
      logger.info('💡 Tip: Check your LLM provider configuration (GLM_TOKEN, DEEPSEEK_TOKEN, etc.)');
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

  // Set environment variables for verbose logging based on user options
  if (options.verbose) {
    process.env.VERBOSE_LLM_LOGS = 'true';
    process.env.VERBOSE_ANALYSIS_LOGS = 'true';
    process.env.VERBOSE_URL_LOGS = 'true';
  }

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
