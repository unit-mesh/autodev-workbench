#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { GitHubAgentServer, GitHubService, ContextAnalyzer } = require('./dist/index.js');

async function analyzeIssue81() {
  console.log('🔍 Analyzing GitHub Issue #81 from unit-mesh/autodev-workbench...\n');
  
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
    
    console.log('🔗 Fetching Issue #81 from unit-mesh/autodev-workbench...');
    
    // Fetch the specific issue
    const issue = await githubService.getIssue('unit-mesh', 'autodev-workbench', 81);
    
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

analyzeIssue81();
