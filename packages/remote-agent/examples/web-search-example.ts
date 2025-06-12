#!/usr/bin/env node

/**
 * WebSearch Tool Usage Example
 *
 * This example demonstrates how to use the WebSearch tool to search for information
 * when the AI model is uncertain about specific knowledge.
 *
 * Prerequisites:
 * 1. Set up API keys in environment variables:
 *    - GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID (for Google Search)
 *    - BING_SEARCH_API_KEY (for Bing Search)
 *
 * 2. Install dependencies:
 *    npm install
 *
 * Usage:
 *    node examples/web-search-example.ts
 */

import { installWebSearchTool } from '../src/capabilities/tools/web-search';

// Mock installer function to capture tool registration
let registeredTool: any = null;

const mockInstaller = (name: string, description: string, schema: any, handler: any) => {
  console.log(`🔧 Registering tool: ${name}`);
  console.log(`📝 Description: ${description}`);
  registeredTool = { name, description, schema, handler };
};

// Install the WebSearch tool
installWebSearchTool(mockInstaller);

async function runExamples() {
  if (!registeredTool) {
    console.error('❌ Tool registration failed');
    return;
  }

  console.log('\n🚀 WebSearch Tool Examples\n');

  // Example 1: Basic search
  console.log('📍 Example 1: Basic search for TypeScript features');
  try {
    const result1 = await registeredTool.handler({
      query: "TypeScript 5.0 new features",
      num_results: 3,
      search_engine: "auto",
      language: "en",
      safe_search: true
    });

    console.log('✅ Result 1:');
    const response1 = JSON.parse(result1.content[0].text);
    if (response1.error) {
      console.log('⚠️  Error:', response1.error);
      console.log('💡 Suggestion:', response1.suggestion);
    } else {
      console.log(`🔍 Query: ${response1.query}`);
      console.log(`🔧 Engine: ${response1.search_engine}`);
      console.log(`📊 Results: ${response1.num_results}`);
      console.log(`⏱️  Time: ${response1.search_time_ms}ms`);
    }
  } catch (error) {
    console.error('❌ Example 1 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Chinese search
  console.log('📍 Example 2: Chinese search');
  try {
    const result2 = await registeredTool.handler({
      query: "人工智能最新发展趋势",
      num_results: 5,
      search_engine: "auto",
      language: "zh-CN",
      safe_search: true
    });

    console.log('✅ Result 2:');
    const response2 = JSON.parse(result2.content[0].text);
    if (response2.error) {
      console.log('⚠️  Error:', response2.error);
    } else {
      console.log(`🔍 Query: ${response2.query}`);
      console.log(`🌐 Language: ${response2.language}`);
      console.log(`📊 Results: ${response2.num_results}`);
    }
  } catch (error) {
    console.error('❌ Example 2 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 3: Google-specific search
  console.log('📍 Example 3: Google-specific search');
  try {
    const result3 = await registeredTool.handler({
      query: "React Server Components tutorial",
      num_results: 8,
      search_engine: "google",
      language: "en",
      safe_search: false
    });

    console.log('✅ Result 3:');
    const response3 = JSON.parse(result3.content[0].text);
    if (response3.error) {
      console.log('⚠️  Error:', response3.error);
    } else {
      console.log(`🔍 Query: ${response3.query}`);
      console.log(`🔧 Engine: ${response3.search_engine}`);
      console.log(`🔒 Safe Search: ${response3.safe_search}`);
    }
  } catch (error) {
    console.error('❌ Example 3 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 4: Error handling - empty query
  console.log('📍 Example 4: Error handling - empty query');
  try {
    const result4 = await registeredTool.handler({
      query: "",
      num_results: 5,
      search_engine: "auto",
      language: "en",
      safe_search: true
    });

    console.log('✅ Result 4:');
    const response4 = JSON.parse(result4.content[0].text);
    console.log('⚠️  Expected error:', response4.error);
  } catch (error) {
    console.error('❌ Example 4 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 5: Parameter validation - num_results clamping
  console.log('📍 Example 5: Parameter validation - large num_results');
  try {
    const result5 = await registeredTool.handler({
      query: "JavaScript best practices",
      num_results: 15, // Should be clamped to 10
      search_engine: "auto",
      language: "en",
      safe_search: true
    });

    console.log('✅ Result 5:');
    const response5 = JSON.parse(result5.content[0].text);
    if (response5.error) {
      console.log('⚠️  Error (expected due to missing API keys):', response5.error);
    } else {
      console.log(`🔍 Query: ${response5.query}`);
      console.log(`📊 Results requested: 15, actual: ${response5.num_results}`);
    }
  } catch (error) {
    console.error('❌ Example 5 failed:', error.message);
  }

  console.log('\n🎯 Summary:');
  console.log('- All examples demonstrate different aspects of the WebSearch tool');
  console.log('- To get actual search results, configure API keys in environment variables');
  console.log('- The tool handles errors gracefully and provides helpful suggestions');
  console.log('- Parameters are validated and clamped to acceptable ranges');
  console.log('\n📚 For more information, see: packages/remote-agent/docs/web-search-tool.md');
}

// Check if API keys are configured
function checkApiKeys() {
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const bingApiKey = process.env.BING_SEARCH_API_KEY;

  console.log('🔑 API Key Status:');
  console.log(`   Google Search API Key: ${googleApiKey ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Google Search Engine ID: ${googleEngineId ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Bing Search API Key: ${bingApiKey ? '✅ Configured' : '❌ Not configured'}`);

  if (!googleApiKey && !bingApiKey) {
    console.log('\n⚠️  No API keys configured. Examples will show error handling behavior.');
    console.log('   To get actual search results, configure at least one set of API keys:');
    console.log('   - For Google: GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID');
    console.log('   - For Bing: BING_SEARCH_API_KEY');
  }
  console.log('');
}

// Main execution
async function main() {
  console.log('🔍 WebSearch Tool Example\n');

  checkApiKeys();

  await runExamples();
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runWebSearchExample };
