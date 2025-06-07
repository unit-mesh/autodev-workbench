#!/usr/bin/env node

const { LLMService, ContextAnalyzer } = require('./dist/index.js');

async function testLLMKeywordExtraction() {
  console.log('Testing LLM-powered Keyword Extraction...\n');
  
  try {
    // Test issue examples
    const testIssues = [
      {
        id: 1,
        number: 123,
        title: "TypeError: Cannot read property 'length' of undefined in FileExplorer component",
        body: "When I try to open a large directory in the file explorer, I get this error. It seems to happen when the directory contains more than 1000 files. The error occurs in the FileExplorer component when it tries to render the file list.\n\nStack trace:\n```\nTypeError: Cannot read property 'length' of undefined\n    at FileExplorer.render (FileExplorer.tsx:45)\n    at ReactDOM.render\n```\n\nSteps to reproduce:\n1. Open a directory with 1000+ files\n2. Click on the file explorer tab\n3. Error appears",
        state: 'open',
        user: { login: 'testuser', id: 1 },
        labels: [
          { id: 1, name: 'bug', color: 'red', description: 'Something is broken' },
          { id: 2, name: 'frontend', color: 'blue', description: 'Frontend issue' }
        ],
        assignees: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/123'
      },
      {
        id: 2,
        number: 456,
        title: "Add dark mode support to the application",
        body: "We need to implement dark mode support across the entire application. This should include:\n\n- Theme switching in the settings\n- Dark variants for all components\n- Proper contrast ratios for accessibility\n- Persistence of theme preference\n- System theme detection\n\nThe implementation should use CSS custom properties and a theme context provider.",
        state: 'open',
        user: { login: 'designer', id: 2 },
        labels: [
          { id: 3, name: 'enhancement', color: 'green', description: 'New feature' },
          { id: 4, name: 'ui/ux', color: 'purple', description: 'User interface' }
        ],
        assignees: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/456'
      },
      {
        id: 3,
        number: 789,
        title: "API endpoint /users/:id returns 500 error for non-existent users",
        body: "The GET /users/:id endpoint is returning a 500 Internal Server Error when queried with a user ID that doesn't exist in the database. It should return a 404 Not Found instead.\n\nCurrent behavior:\n```\nGET /api/users/999999\nResponse: 500 Internal Server Error\n{\n  \"error\": \"Cannot read property 'name' of null\"\n}\n```\n\nExpected behavior:\n```\nGET /api/users/999999\nResponse: 404 Not Found\n{\n  \"error\": \"User not found\"\n}\n```",
        state: 'open',
        user: { login: 'backend-dev', id: 3 },
        labels: [
          { id: 1, name: 'bug', color: 'red', description: 'Something is broken' },
          { id: 5, name: 'api', color: 'orange', description: 'API related' }
        ],
        assignees: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        html_url: 'https://github.com/test/repo/issues/789'
      }
    ];

    const llmService = new LLMService();
    const analyzer = new ContextAnalyzer(process.cwd());

    console.log('🧠 Testing LLM Service...\n');

    for (let i = 0; i < testIssues.length; i++) {
      const issue = testIssues[i];
      console.log(`--- Test Case ${i + 1}: Issue #${issue.number} ---`);
      console.log(`Title: ${issue.title}`);
      console.log(`Type: ${issue.labels.map(l => l.name).join(', ')}`);
      console.log();

      try {
        // Test LLM keyword analysis
        console.log('🔍 LLM Keyword Analysis:');
        const llmAnalysis = await llmService.analyzeIssueForKeywords(issue);
        
        console.log(`  Issue Type: ${llmAnalysis.issue_type} (confidence: ${llmAnalysis.confidence})`);
        console.log(`  Primary Keywords: ${llmAnalysis.primary_keywords.slice(0, 5).join(', ')}`);
        console.log(`  Technical Terms: ${llmAnalysis.technical_terms.slice(0, 5).join(', ')}`);
        console.log(`  Error Patterns: ${llmAnalysis.error_patterns.slice(0, 3).join(', ')}`);
        console.log(`  Component Names: ${llmAnalysis.component_names.slice(0, 3).join(', ')}`);
        console.log(`  File Patterns: ${llmAnalysis.file_patterns.slice(0, 3).join(', ')}`);
        console.log();

        // Test integrated smart keyword generation
        console.log('🎯 Smart Keyword Generation:');
        const smartKeywords = await analyzer.generateSmartKeywords(issue);
        
        console.log(`  Primary: ${smartKeywords.primary.slice(0, 5).join(', ')}`);
        console.log(`  Technical: ${smartKeywords.technical.slice(0, 5).join(', ')}`);
        console.log(`  Secondary: ${smartKeywords.secondary.slice(0, 5).join(', ')}`);
        console.log(`  Contextual: ${smartKeywords.contextual.slice(0, 5).join(', ')}`);
        console.log();

      } catch (error) {
        console.log(`  ⚠️  LLM analysis failed: ${error.message}`);
        console.log('  Falling back to rule-based extraction...');
        
        // Test fallback
        const smartKeywords = await analyzer.generateSmartKeywords(issue);
        console.log(`  Fallback Keywords: ${smartKeywords.primary.slice(0, 5).join(', ')}`);
        console.log();
      }

      console.log('---\n');
    }

    console.log('✅ LLM Keyword Extraction Test Complete!\n');
    
    console.log('🚀 Enhanced Features:');
    console.log('✓ LLM-powered keyword extraction');
    console.log('✓ Intelligent issue type detection');
    console.log('✓ Context-aware search term generation');
    console.log('✓ Fallback to rule-based extraction');
    console.log('✓ Multi-category keyword classification');
    
    console.log('\n📋 Configuration:');
    console.log('• Set GLM_TOKEN or OPENAI_API_KEY for LLM features');
    console.log('• Set LLM_BASE_URL for custom endpoints');
    console.log('• Set LLM_MODEL for specific model selection');
    console.log('• Fallback works without LLM configuration');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Check if LLM is configured
const hasLLMConfig = process.env.GLM_TOKEN || process.env.OPENAI_API_KEY;
if (!hasLLMConfig) {
  console.log('⚠️  No LLM configuration found (GLM_TOKEN or OPENAI_API_KEY)');
  console.log('   Testing will use fallback rule-based extraction only.\n');
}

testLLMKeywordExtraction();
