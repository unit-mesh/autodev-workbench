#!/usr/bin/env node

/**
 * Usage Examples for Refactored Context Analyzer
 * 
 * This file demonstrates how to use the refactored ContextAnalyzer
 * with different design patterns and configurations.
 */

import { ContextAnalyzer } from '../../../services/context-analyzer';
import { AnalyzerFactory } from '../factories/AnalyzerFactory';
import { LLMAnalysisStrategy } from '../strategies/LLMAnalysisStrategy';
import { RuleBasedAnalysisStrategy } from '../strategies/RuleBasedAnalysisStrategy';
import { HybridAnalysisStrategy } from '../strategies/HybridAnalysisStrategy';
import { MemoryCacheManager } from '../cache/MemoryCacheManager';
import { RipgrepSearchProvider } from '../search/RipgrepSearchProvider';
import { GitHubIssue } from '../../../types/index';

// Example issue for testing
const exampleIssue: GitHubIssue = {
  id: 1,
  number: 123,
  title: 'Bug: Authentication fails with invalid token error',
  body: 'When trying to authenticate with the API, users get an "invalid token" error even with valid tokens. This seems to be related to the JWT validation logic in the auth service.',
  state: 'open',
  user: { login: 'testuser', id: 1 },
  labels: [{ id: 1, name: 'bug', color: 'red', description: 'Bug report' }],
  assignees: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  closed_at: null,
  html_url: 'https://github.com/test/repo/issues/123'
};

/**
 * Example 1: Basic usage with auto-configuration
 */
async function basicUsageExample() {
  console.log('\n🔧 Example 1: Basic Usage with Auto-Configuration');
  console.log('='.repeat(60));

  try {
    // Create analyzer with automatic strategy selection
    const analyzer = await ContextAnalyzer.create(process.cwd(), {
      strategy: 'auto'
    });

    console.log('📊 Analyzer Info:', analyzer.getAnalysisInfo());

    // Analyze the issue
    const result = await analyzer.analyzeIssue(exampleIssue);

    console.log(`✅ Found ${result.relatedCode.files.length} relevant files`);
    console.log(`✅ Found ${result.relatedCode.symbols.length} relevant symbols`);
    console.log(`✅ Found ${result.relatedCode.apis.length} relevant APIs`);

    // Show top 3 files
    result.relatedCode.files.slice(0, 3).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.path} (${(file.relevanceScore * 100).toFixed(1)}%)`);
    });

  } catch (error) {
    console.error('❌ Basic usage example failed:', error.message);
  }
}

/**
 * Example 2: Custom strategy configuration
 */
async function customStrategyExample() {
  console.log('\n🔧 Example 2: Custom Strategy Configuration');
  console.log('='.repeat(60));

  try {
    // Create analyzer with specific strategy
    const analyzer = await ContextAnalyzer.create(process.cwd(), {
      strategy: 'hybrid',
      cacheType: 'memory',
      searchType: 'ripgrep'
    });

    console.log('📊 Analyzer Info:', analyzer.getAnalysisInfo());

    // Analyze with custom configuration
    const result = await analyzer.findRelevantCode(exampleIssue);

    console.log(`✅ Analysis complete with ${analyzer.getAnalysisInfo().strategy} strategy`);
    console.log(`📁 Files: ${result.files.length}, 🔍 Symbols: ${result.symbols.length}, 🌐 APIs: ${result.apis.length}`);

  } catch (error) {
    console.error('❌ Custom strategy example failed:', error.message);
  }
}

/**
 * Example 3: Direct component usage
 */
async function directComponentExample() {
  console.log('\n🔧 Example 3: Direct Component Usage');
  console.log('='.repeat(60));

  try {
    // Create components directly using factory
    const components = await AnalyzerFactory.create({
      type: 'rule-based',
      workspacePath: process.cwd(),
      cacheType: 'memory',
      searchType: 'filesystem'
    });

    console.log(`📊 Strategy: ${components.strategy.name}`);
    console.log(`📊 Search Provider: ${components.searchProvider.name}`);

    // Use strategy directly
    const keywords = await components.strategy.generateKeywords(exampleIssue);
    console.log('🔑 Generated Keywords:');
    console.log(`   Primary: ${keywords.primary.slice(0, 5).join(', ')}`);
    console.log(`   Technical: ${keywords.technical.slice(0, 5).join(', ')}`);

    // Use search provider directly
    if (keywords.primary.length > 0) {
      const searchResult = await components.searchProvider.searchInDirectory(
        keywords.primary[0],
        process.cwd(),
        { extensions: ['ts', 'js'] }
      );
      console.log(`🔍 Search for "${keywords.primary[0]}": ${searchResult.totalMatches} matches`);
    }

  } catch (error) {
    console.error('❌ Direct component example failed:', error.message);
  }
}

/**
 * Example 4: Strategy comparison
 */
async function strategyComparisonExample() {
  console.log('\n🔧 Example 4: Strategy Comparison');
  console.log('='.repeat(60));

  const strategies = [
    { name: 'Rule-Based', strategy: new RuleBasedAnalysisStrategy() },
    { name: 'Hybrid', strategy: new HybridAnalysisStrategy() }
  ];

  for (const { name, strategy } of strategies) {
    try {
      console.log(`\n📊 Testing ${name} Strategy:`);
      
      const startTime = Date.now();
      const keywords = await strategy.generateKeywords(exampleIssue);
      const endTime = Date.now();

      console.log(`   ⏱️  Time: ${endTime - startTime}ms`);
      console.log(`   🔑 Keywords: ${keywords.primary.length + keywords.secondary.length + keywords.technical.length}`);
      console.log(`   📋 Primary: ${keywords.primary.slice(0, 3).join(', ')}`);
      
      const available = await strategy.isAvailable();
      console.log(`   ✅ Available: ${available}`);

    } catch (error) {
      console.error(`   ❌ ${name} strategy failed:`, error.message);
    }
  }
}

/**
 * Example 5: Cache management
 */
async function cacheManagementExample() {
  console.log('\n🔧 Example 5: Cache Management');
  console.log('='.repeat(60));

  try {
    const analyzer = await ContextAnalyzer.create(process.cwd());

    // First analysis (will cache results)
    console.log('📊 First analysis (caching results)...');
    const start1 = Date.now();
    await analyzer.findRelevantCode(exampleIssue);
    const time1 = Date.now() - start1;
    console.log(`   ⏱️  Time: ${time1}ms`);

    // Second analysis (should use cache)
    console.log('📊 Second analysis (using cache)...');
    const start2 = Date.now();
    await analyzer.findRelevantCode(exampleIssue);
    const time2 = Date.now() - start2;
    console.log(`   ⏱️  Time: ${time2}ms`);

    console.log(`🚀 Cache speedup: ${(time1 / Math.max(time2, 1)).toFixed(2)}x`);

    // Clear cache
    await analyzer.clearCache();
    console.log('🧹 Cache cleared');

  } catch (error) {
    console.error('❌ Cache management example failed:', error.message);
  }
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('🎯 Context Analyzer Design Patterns Examples');
  console.log('='.repeat(60));

  const examples = [
    basicUsageExample,
    customStrategyExample,
    directComponentExample,
    strategyComparisonExample,
    cacheManagementExample
  ];

  for (const example of examples) {
    try {
      await example();
    } catch (error) {
      console.error(`❌ Example failed:`, error);
    }
  }

  console.log('\n✅ All examples completed!');
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicUsageExample,
  customStrategyExample,
  directComponentExample,
  strategyComparisonExample,
  cacheManagementExample
};
