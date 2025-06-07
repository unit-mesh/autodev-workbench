#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { GitHubAgentServer, GitHubService, ContextAnalyzer } = require('./dist/index.js');

/**
 * Format analysis results as markdown for GitHub comment
 */
function formatAnalysisAsMarkdown(issue, analysisResult, keywords) {
  let markdown = `## 🤖 AI Analysis for Issue #${issue.number}\n\n`;

  markdown += `**Issue**: [${issue.title}](${issue.html_url})\n`;
  markdown += `**Analysis Date**: ${new Date().toISOString().split('T')[0]}\n`;
  markdown += `**Status**: ${issue.state}\n\n`;

  // Keywords section
  markdown += `### 🎯 Extracted Keywords\n\n`;
  markdown += `- **Primary**: ${keywords.primary.slice(0, 8).join(', ')}\n`;
  markdown += `- **Technical**: ${keywords.technical.slice(0, 8).join(', ')}\n`;
  markdown += `- **Secondary**: ${keywords.secondary.slice(0, 6).join(', ')}\n`;
  markdown += `- **Contextual**: ${keywords.contextual.slice(0, 6).join(', ')}\n\n`;

  // Analysis results section
  markdown += `### 📊 Analysis Results\n\n`;
  markdown += `- **Related Files**: ${analysisResult.relatedCode.files.length}\n`;
  markdown += `- **Related Symbols**: ${analysisResult.relatedCode.symbols.length}\n`;
  markdown += `- **Related APIs**: ${analysisResult.relatedCode.apis.length}\n`;
  markdown += `- **Generated Suggestions**: ${analysisResult.suggestions.length}\n\n`;

  // Most relevant files
  if (analysisResult.relatedCode.files.length > 0) {
    markdown += `### 📁 Most Relevant Files\n\n`;
    analysisResult.relatedCode.files.slice(0, 5).forEach((file, index) => {
      markdown += `${index + 1}. **${file.path}** (${(file.relevanceScore * 100).toFixed(1)}% relevance)\n`;
      markdown += `   \`\`\`\n   ${file.content.substring(0, 150).replace(/\n/g, ' ')}...\n   \`\`\`\n\n`;
    });
  }

  // Related symbols
  if (analysisResult.relatedCode.symbols.length > 0) {
    markdown += `### 🔧 Related Symbols\n\n`;
    analysisResult.relatedCode.symbols.slice(0, 5).forEach((symbol, index) => {
      markdown += `${index + 1}. **${symbol.name}** (${symbol.type})\n`;
      markdown += `   - Location: \`${symbol.location.file}:${symbol.location.line}\`\n`;
      if (symbol.description) {
        markdown += `   - Description: ${symbol.description.substring(0, 100)}...\n`;
      }
      markdown += `\n`;
    });
  }

  // AI suggestions
  if (analysisResult.suggestions.length > 0) {
    markdown += `### 💡 AI Suggestions\n\n`;
    analysisResult.suggestions.slice(0, 5).forEach((suggestion, index) => {
      markdown += `${index + 1}. **[${suggestion.type.toUpperCase()}]** ${suggestion.description}\n`;
      if (suggestion.location) {
        markdown += `   - Location: \`${suggestion.location}\`\n`;
      }
      markdown += `   - Confidence: ${(suggestion.confidence * 100).toFixed(1)}%\n\n`;
    });
  }

  // Summary
  markdown += `### 📋 Summary\n\n`;
  markdown += `${analysisResult.summary}\n\n`;

  markdown += `---\n`;
  markdown += `*This analysis was generated automatically by the AutoDev AI Agent*\n`;

  return markdown;
}

async function analyzeIssue81() {
  console.log('🔍 Analyzing GitHub Issue #81 from unit-mesh/autodev-workbench...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const shouldUpload = args.includes('--upload') || args.includes('-u');
  const owner = args.find(arg => arg.startsWith('--owner='))?.split('=')[1] || 'unit-mesh';
  const repo = args.find(arg => arg.startsWith('--repo='))?.split('=')[1] || 'autodev-workbench';
  const issueNumber = parseInt(args.find(arg => arg.startsWith('--issue='))?.split('=')[1] || '81');

  try {
    // Check environment variables
    if (!process.env.GITHUB_TOKEN) {
      console.error('❌ GITHUB_TOKEN not found in environment variables');
      process.exit(1);
    }

    if (!process.env.GLM_TOKEN) {
      console.warn('⚠️  GLM_TOKEN not found, will use fallback keyword extraction');
    }
    
    console.log('✅ Environment variables loaded');
    console.log(`   GITHUB_TOKEN: ${process.env.GITHUB_TOKEN.substring(0, 10)}...`);
    console.log(`   GLM_TOKEN: ${process.env.GLM_TOKEN ? process.env.GLM_TOKEN.substring(0, 10) + '...' : 'Not set'}`);
    console.log();

    // Initialize services
    const githubService = new GitHubService(process.env.GITHUB_TOKEN);
    const contextAnalyzer = new ContextAnalyzer(process.cwd());
    
    console.log(`🔗 Fetching Issue #${issueNumber} from ${owner}/${repo}...`);

    // Fetch the specific issue
    const issue = await githubService.getIssue(owner, repo, issueNumber);
    
    console.log('📋 Issue Details:');
    console.log(`   Title: ${issue.title}`);
    console.log(`   State: ${issue.state}`);
    console.log(`   Author: ${issue.user?.login || 'Unknown'}`);
    console.log(`   Labels: ${issue.labels.map(l => l.name).join(', ') || 'None'}`);
    console.log(`   Created: ${new Date(issue.created_at).toLocaleDateString()}`);
    console.log(`   URL: ${issue.html_url}`);
    console.log();
    
    if (issue.body) {
      console.log('📝 Issue Body:');
      console.log('   ' + issue.body.split('\n').slice(0, 10).join('\n   '));
      if (issue.body.split('\n').length > 10) {
        console.log('   ... (truncated)');
      }
      console.log();
    }

    console.log('🧠 Performing AI-powered keyword analysis...');
    
    // Generate smart keywords
    const keywords = await contextAnalyzer.generateSmartKeywords(issue);
    
    console.log('🎯 Extracted Keywords:');
    console.log(`   Primary: ${keywords.primary.slice(0, 8).join(', ')}`);
    console.log(`   Technical: ${keywords.technical.slice(0, 8).join(', ')}`);
    console.log(`   Secondary: ${keywords.secondary.slice(0, 6).join(', ')}`);
    console.log(`   Contextual: ${keywords.contextual.slice(0, 6).join(', ')}`);
    console.log();

    console.log('🔍 Searching for relevant code in current workspace...');
    
    // Perform full issue analysis
    const analysisResult = await contextAnalyzer.analyzeIssue(issue);
    
    console.log('📊 Analysis Results:');
    console.log(`   Related Files: ${analysisResult.relatedCode.files.length}`);
    console.log(`   Related Symbols: ${analysisResult.relatedCode.symbols.length}`);
    console.log(`   Related APIs: ${analysisResult.relatedCode.apis.length}`);
    console.log(`   Generated Suggestions: ${analysisResult.suggestions.length}`);
    console.log();

    if (analysisResult.relatedCode.files.length > 0) {
      console.log('📁 Most Relevant Files:');
      analysisResult.relatedCode.files.slice(0, 8).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.path}`);
        console.log(`      Relevance: ${(file.relevanceScore * 100).toFixed(1)}%`);
        console.log(`      Preview: ${file.content.substring(0, 100).replace(/\n/g, ' ')}...`);
        console.log();
      });
    }

    if (analysisResult.relatedCode.symbols.length > 0) {
      console.log('🔧 Related Symbols:');
      analysisResult.relatedCode.symbols.slice(0, 5).forEach((symbol, index) => {
        console.log(`   ${index + 1}. ${symbol.name} (${symbol.type})`);
        console.log(`      Location: ${symbol.location.file}:${symbol.location.line}`);
        if (symbol.description) {
          console.log(`      Description: ${symbol.description.substring(0, 80)}...`);
        }
        console.log();
      });
    }

    if (analysisResult.suggestions.length > 0) {
      console.log('💡 AI Suggestions:');
      analysisResult.suggestions.slice(0, 6).forEach((suggestion, index) => {
        console.log(`   ${index + 1}. [${suggestion.type.toUpperCase()}] ${suggestion.description}`);
        if (suggestion.location) {
          console.log(`      Location: ${suggestion.location}`);
        }
        console.log(`      Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
        console.log();
      });
    }

    console.log('📋 Analysis Summary:');
    console.log(analysisResult.summary);
    console.log();

    console.log('✅ Issue Analysis Complete!');

    console.log('\n🎯 Key Insights:');
    console.log(`• Issue Type: Detected as ${await contextAnalyzer.analyzeIssueType(issue)}`);
    console.log(`• Search Strategy: Used ${keywords.primary.length + keywords.technical.length} keywords`);
    console.log(`• Code Coverage: Found ${analysisResult.relatedCode.files.length} relevant files`);
    console.log(`• Actionable Items: Generated ${analysisResult.suggestions.length} suggestions`);

    // Upload results to GitHub if requested
    if (shouldUpload) {
      console.log('\n📤 Uploading analysis results to GitHub...');
      try {
        const markdownComment = formatAnalysisAsMarkdown(issue, analysisResult, keywords);
        const comment = await githubService.addIssueComment(owner, repo, issueNumber, markdownComment);

        console.log('✅ Analysis results uploaded successfully!');
        console.log(`📝 Comment URL: ${comment.html_url}`);
        console.log(`🆔 Comment ID: ${comment.id}`);
      } catch (uploadError) {
        console.error('❌ Failed to upload analysis results:', uploadError.message);
        console.log('💾 Analysis completed locally, but upload failed.');
      }
    } else {
      console.log('\n💡 Tip: Use --upload flag to automatically post analysis results to the GitHub issue');
      console.log(`   Example: node analyze-issue-81.js --upload --owner=${owner} --repo=${repo} --issue=${issueNumber}`);
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Add dotenv dependency check
try {
  require('dotenv');
} catch (error) {
  console.error('❌ dotenv package not found. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install dotenv', { stdio: 'inherit' });
  console.log('✅ dotenv installed successfully');
}

// Show usage information if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🤖 AutoDev GitHub Issue Analyzer

Usage: node analyze-issue-81.js [options]

Options:
  --upload, -u              Upload analysis results to GitHub issue as comment
  --owner=<owner>           GitHub repository owner (default: unit-mesh)
  --repo=<repo>             GitHub repository name (default: autodev-workbench)
  --issue=<number>          Issue number to analyze (default: 81)
  --help, -h                Show this help message

Environment Variables:
  GITHUB_TOKEN              Required: GitHub personal access token
  GLM_TOKEN                 Optional: AI model token (fallback to rule-based if not set)

Examples:
  node analyze-issue-81.js
  node analyze-issue-81.js --upload
  node analyze-issue-81.js --upload --owner=myorg --repo=myproject --issue=123
`);
  process.exit(0);
}

analyzeIssue81();
