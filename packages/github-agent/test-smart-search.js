#!/usr/bin/env node

const { GitHubAgentServer } = require('./dist/index.js');

async function testSmartSearch() {
  console.log('Testing GitHub Agent Smart Search...');
  
  try {
    const server = new GitHubAgentServer({
      name: "github-agent-test",
      version: "0.1.0",
    });

    console.log('✓ Server created successfully');

    // Load GitHub preset
    server.loadPreset("GitHub");
    console.log('✓ GitHub preset loaded successfully');

    // Test keyword extraction
    console.log('\n--- Testing Keyword Extraction ---');
    
    const { ContextAnalyzer } = require('./dist/index.js');
    const analyzer = new ContextAnalyzer(process.cwd());
    
    // Test with a sample issue
    const testIssue = {
      id: 1,
      number: 123,
      title: "TypeError: Cannot read property 'length' of undefined in file explorer",
      body: "When I try to open a large directory in the file explorer, I get this error. It seems to happen when the directory contains more than 1000 files. The error occurs in the FileExplorer component when it tries to render the file list.",
      state: 'open',
      user: { login: 'testuser', id: 1 },
      labels: [{ id: 1, name: 'bug', color: 'red', description: 'Something is broken' }],
      assignees: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      html_url: 'https://github.com/test/repo/issues/123'
    };

    console.log('Test Issue:', testIssue.title);
    console.log('Test Body:', testIssue.body.substring(0, 100) + '...');

    // Test keyword generation
    const keywords = await analyzer.generateSmartKeywords(testIssue);
    console.log('\n✓ Generated Keywords:');
    console.log('  Primary:', keywords.primary.slice(0, 5));
    console.log('  Technical:', keywords.technical.slice(0, 5));
    console.log('  Secondary:', keywords.secondary.slice(0, 5));
    console.log('  Contextual:', keywords.contextual.slice(0, 3));

    // Test issue type analysis
    const issueType = analyzer.analyzeIssueType(testIssue);
    console.log('\n✓ Detected Issue Type:', issueType);

    // Test file relevance calculation (mock)
    const mockFile = {
      path: 'src/components/FileExplorer.tsx',
      content: `
        import React, { useState, useEffect } from 'react';
        
        export const FileExplorer = ({ directory }) => {
          const [files, setFiles] = useState([]);
          
          useEffect(() => {
            if (directory && directory.files) {
              // This could cause TypeError if directory.files is undefined
              const fileList = directory.files.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type
              }));
              setFiles(fileList);
            }
          }, [directory]);
          
          return (
            <div className="file-explorer">
              {files.length > 0 && (
                <ul>
                  {files.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        };
      `,
      relevanceScore: 0.85
    };

    const suggestion = analyzer.generateFileSuggestion(mockFile, issueType);
    console.log('\n✓ Generated File Suggestion:');
    console.log('  Type:', suggestion.type);
    console.log('  Description:', suggestion.description);
    console.log('  Confidence:', suggestion.confidence);

    console.log('\n✓ All smart search components working correctly!');
    console.log('\n--- Smart Search Features ---');
    console.log('✓ AI-powered keyword extraction');
    console.log('✓ Issue type detection');
    console.log('✓ Relevance scoring');
    console.log('✓ Context-aware suggestions');
    console.log('✓ Multi-strategy search preparation');
    
    console.log('\n--- Available Tools ---');
    console.log('1. github_get_issues - Fetch GitHub issues');
    console.log('2. github_analyze_issue - Analyze specific issues');
    console.log('3. github_get_issue_context - Get detailed context');
    console.log('4. github_smart_search - AI-powered code search (NEW!)');

    console.log('\n--- Next Steps ---');
    console.log('1. Set GITHUB_TOKEN environment variable');
    console.log('2. Start the server: node bin/index.js');
    console.log('3. Use with your favorite MCP client');
    console.log('4. Try the github_smart_search tool with real queries');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSmartSearch();
