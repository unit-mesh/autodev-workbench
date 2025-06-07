#!/usr/bin/env node

/**
 * Simple test to verify the refactored ContextAnalyzer works
 */

const { ContextAnalyzer } = require('./dist/index.js');

// Test issue
const testIssue = {
  id: 1,
  number: 123,
  title: 'Test authentication bug',
  body: 'Authentication fails with JWT token validation error',
  state: 'open',
  user: { login: 'testuser', id: 1 },
  labels: [{ id: 1, name: 'bug', color: 'red', description: 'Bug report' }],
  assignees: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  closed_at: null,
  html_url: 'https://github.com/test/repo/issues/123'
};

async function testRefactoredAnalyzer() {
  console.log('🧪 Testing Refactored Context Analyzer');
  console.log('='.repeat(50));

  try {
    // Test 1: Basic instantiation
    console.log('1️⃣  Testing basic instantiation...');
    const analyzer = new ContextAnalyzer(process.cwd());
    console.log('✅ ContextAnalyzer created successfully');

    // Test 2: Factory method
    console.log('\n2️⃣  Testing factory method...');
    const factoryAnalyzer = await ContextAnalyzer.create(process.cwd(), {
      strategy: 'rule-based'
    });
    console.log('✅ Factory method works');
    console.log('📊 Analyzer info:', factoryAnalyzer.getAnalysisInfo());

    // Test 3: Basic analysis
    console.log('\n3️⃣  Testing basic analysis...');
    const result = await factoryAnalyzer.findRelevantCode(testIssue);
    console.log('✅ Analysis completed');
    console.log(`📁 Found ${result.files.length} files`);
    console.log(`🔍 Found ${result.symbols.length} symbols`);
    console.log(`🌐 Found ${result.apis.length} APIs`);

    // Test 4: Full issue analysis
    console.log('\n4️⃣  Testing full issue analysis...');
    const issueResult = await factoryAnalyzer.analyzeIssue(testIssue);
    console.log('✅ Issue analysis completed');
    console.log(`📋 Suggestions: ${issueResult.suggestions.length}`);
    console.log(`📄 Summary length: ${issueResult.summary.length} characters`);

    // Test 5: Cache operations
    console.log('\n5️⃣  Testing cache operations...');
    await factoryAnalyzer.clearCache();
    console.log('✅ Cache cleared successfully');

    console.log('\n🎉 All tests passed! Refactoring is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testRefactoredAnalyzer();
