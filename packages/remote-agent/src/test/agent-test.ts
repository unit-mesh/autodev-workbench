import { AIAgent } from '../agent';
import { BugFixAgent } from '../agents/bug-fix-agent';
import { FeatureAnalysisAgent } from '../agents/feature-analysis-agent';
import { IssueAnalysisPlaybook, BugFixPlaybook, FeatureRequestPlaybook } from '../playbooks';
import { configureLLMProvider } from '../services/llm';
import 'dotenv/config';

interface TestCase {
  name: string;
  input: string;
  expectedTools?: string[];
  expectedRounds?: number;
}

interface TestResult {
  name: string;
  success: boolean;
  rounds: number;
  toolsUsed: number;
  responseLength: number;
  error?: string;
}

async function runTest(agent: AIAgent, testCase: TestCase): Promise<TestResult> {
  console.log(`\n🧪 Running test: ${testCase.name}`);
  console.log(`Input: ${testCase.input}`);

  try {
    const response = await agent.start(testCase.input);
    
    const result: TestResult = {
      name: testCase.name,
      success: response.success,
      rounds: response.totalRounds || 0,
      toolsUsed: response.toolResults.length,
      responseLength: response.text.length
    };

    if (!response.success) {
      result.error = response.error;
    }

    // Print test results
    console.log('\n📊 Test Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`🔄 Rounds: ${result.rounds}`);
    console.log(`🛠️ Tools Used: ${result.toolsUsed}`);
    console.log(`📝 Response Length: ${result.responseLength} chars`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Test failed with error: ${errorMessage}`);
    
    return {
      name: testCase.name,
      success: false,
      rounds: 0,
      toolsUsed: 0,
      responseLength: 0,
      error: errorMessage
    };
  }
}

async function runTestSuite() {
  // Configure LLM provider
  const llmConfig = configureLLMProvider();
  if (!llmConfig) {
    console.error('❌ No LLM provider configured. Please set GLM_TOKEN, DEEPSEEK_TOKEN, or OPENAI_API_KEY');
    process.exit(1);
  }

  // Define test cases
  const testCases: TestCase[] = [
    {
      name: 'Bug Report Analysis',
      input: 'Analyze GitHub issue #105 in unit-mesh/autodev-workbench',
      expectedTools: ['github-get-issue-with-analysis', 'grep-search'],
      expectedRounds: 2
    },
    {
      name: 'Bug Fix',
      input: 'Fix the null pointer exception in UserService.java',
      expectedTools: ['grep-search', 'str-replace-editor'],
      expectedRounds: 2
    },
    {
      name: 'Feature Request Analysis',
      input: 'Implement user authentication with OAuth2',
      expectedTools: ['grep-search', 'codebase-search'],
      expectedRounds: 2
    }
  ];

  // Initialize agents
  const agents = {
    issueAnalysisAgent: new AIAgent({
      llmConfig,
      maxToolRounds: 3,
      enableToolChaining: true,
      playbook: new IssueAnalysisPlaybook()
    }),
    bugFixAgent: new BugFixAgent({
      llmConfig,
      maxToolRounds: 3,
      enableToolChaining: true,
      playbook: new BugFixPlaybook()
    }),
    featureAnalysisAgent: new FeatureAnalysisAgent({
      llmConfig,
      maxToolRounds: 3,
      enableToolChaining: true,
      analysisStrategy: 'requirements-first',
      generateTechnicalDocs: true,
      analyzeCompatibility: true
    })
  };

  // Run tests for each agent
  const results: { [key: string]: TestResult[] } = {};

  for (const [agentName, agent] of Object.entries(agents)) {
    console.log(`\n🚀 Testing ${agentName}...`);
    results[agentName] = [];
    
    for (const testCase of testCases) {
      const result = await runTest(agent, testCase);
      results[agentName].push(result);
    }
  }

  // Print summary
  console.log('\n📋 Overall Test Summary:');
  for (const [agentName, agentResults] of Object.entries(results)) {
    const passed = agentResults.filter(r => r.success).length;
    const total = agentResults.length;
    console.log(`\n${agentName}:`);
    console.log(`  ✅ Passed: ${passed}/${total}`);
    
    // Print failed tests
    const failed = agentResults.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('  ❌ Failed tests:');
      failed.forEach(f => console.log(`    - ${f.name}: ${f.error}`));
    }
  }
}

// Run the test suite
runTestSuite().catch(console.error); 