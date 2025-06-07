#!/usr/bin/env node

/**
 * Standalone script to analyze a GitHub issue and upload results
 * Usage: node scripts/analyze-and-upload.js <owner> <repo> <issue_number> [options]
 *
 * Example:
 * node scripts/analyze-and-upload.js microsoft vscode 12345 --language=zh --upload
 */

// Load environment variables from .env file
require('dotenv').config();

const { GitHubService } = require('../dist/index.js');
const { ContextAnalyzer } = require('../dist/index.js');
const { AnalysisReportGenerator } = require('../dist/index.js');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node analyze-and-upload.js <owner> <repo> <issue_number> [options]');
    console.error('Options:');
    console.error('  --language=en|zh    Report language (default: en)');
    console.error('  --upload            Upload to GitHub (default: false)');
    console.error('  --include-content   Include file content (default: false)');
    console.error('  --max-files=N       Max files to include (default: 10)');
    console.error('  --workspace=PATH    Workspace path (default: current directory)');
    process.exit(1);
  }

  const [owner, repo, issueNumberStr] = args;
  const issueNumber = parseInt(issueNumberStr);

  if (isNaN(issueNumber)) {
    console.error('Error: Issue number must be a valid integer');
    process.exit(1);
  }

  // Parse options
  const options = {
    language: 'en',
    upload: false,
    includeContent: false,
    maxFiles: 10,
    workspace: process.cwd()
  };

  args.slice(3).forEach(arg => {
    if (arg.startsWith('--language=')) {
      options.language = arg.split('=')[1];
    } else if (arg === '--upload') {
      options.upload = true;
    } else if (arg === '--include-content') {
      options.includeContent = true;
    } else if (arg.startsWith('--max-files=')) {
      options.maxFiles = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--workspace=')) {
      options.workspace = arg.split('=')[1];
    }
  });

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error('Error: GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  try {
    console.log(`🔍 Analyzing issue #${issueNumber} in ${owner}/${repo}...`);
    
    const githubService = new GitHubService(githubToken);
    const contextAnalyzer = new ContextAnalyzer(options.workspace);
    const reportGenerator = new AnalysisReportGenerator(githubToken);

    // Get the issue
    const issue = await githubService.getIssue(owner, repo, issueNumber);
    console.log(`📋 Issue: ${issue.title}`);

    // Analyze the issue
    console.log(`🔎 Analyzing codebase...`);
    const analysisResult = await contextAnalyzer.analyzeIssue(issue);

    console.log(`✅ Analysis complete:`);
    console.log(`  - Found ${analysisResult.relatedCode.files.length} relevant files`);
    console.log(`  - Found ${analysisResult.relatedCode.symbols.length} relevant symbols`);
    console.log(`  - Generated ${analysisResult.suggestions.length} suggestions`);

    // Generate report
    console.log(`📝 Generating analysis report...`);
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

    if (options.upload) {
      if (uploadResult?.success) {
        console.log(`✅ Report uploaded successfully!`);
        console.log(`   Comment ID: ${uploadResult.commentId}`);
        console.log(`   Comment URL: ${uploadResult.commentUrl}`);
      } else {
        console.error(`❌ Upload failed: ${uploadResult?.error}`);
      }
    } else {
      console.log(`📄 Generated report (not uploaded):`);
      console.log('---');
      console.log(report);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
