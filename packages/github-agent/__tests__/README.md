# GitHub Agent Test Suite

This directory contains the comprehensive test suite for the GitHub Agent package, converted from the original test scripts in the `scripts/` directory.

## 📁 Test Structure

```
__tests__/
├── unit/                    # Unit tests for individual components
│   ├── function-parser.test.ts    # Function call parsing logic
│   └── agent-workflow.test.ts     # Agent workflow and tool execution
├── integration/             # Integration tests for external services
│   └── github-api.test.ts         # GitHub API integration
├── e2e/                     # End-to-end tests (future)
├── fixtures/                # Test data and mock responses
│   ├── github-issues.json         # Sample GitHub issue data
│   └── mock-responses.json        # Mock API responses
├── helpers/                 # Test utilities and factories
│   ├── mock-factories.ts          # Factory functions for test data
│   └── test-utils.ts              # Test utility functions
├── setup.ts                 # Jest setup and global test utilities
├── env.setup.js             # Environment configuration for tests
└── README.md               # This file
```

## 🧪 Test Categories

### Unit Tests (`__tests__/unit/`)

**Function Parser Tests** (`function-parser.test.ts`)
- XML function call parsing
- JSON format fallback handling
- Multiple function calls
- Parameter type conversion
- Error handling and edge cases

**Agent Workflow Tests** (`agent-workflow.test.ts`)
- Agent initialization and configuration
- Tool registration and execution
- Multi-round tool chaining
- Error handling and recovery
- Response generation
- Performance metrics

### Integration Tests (`__tests__/integration/`)

**GitHub API Tests** (`github-api.test.ts`)
- Repository access and authentication
- Issue retrieval and analysis
- Batch processing capabilities
- Error handling (rate limiting, network errors)
- Performance benchmarking

## 🛠️ Test Utilities

### Mock Factories (`helpers/mock-factories.ts`)
- `createGitHubIssue()` - Generate mock GitHub issues
- `createToolResult()` - Generate mock tool execution results
- `createAgentResponse()` - Generate mock agent responses
- `createLLMResponse()` - Generate mock LLM responses

### Test Utils (`helpers/test-utils.ts`)
- `createMockConsole()` - Mock console for output testing
- `createMockOctokit()` - Mock GitHub API client
- `createMockLLMService()` - Mock LLM service
- `measureExecutionTime()` - Performance measurement
- `createBenchmark()` - Performance benchmarking

### Global Test Utilities (`setup.ts`)
- Custom Jest matchers (`toBeValidGitHubIssue`, `toBeValidToolResult`)
- Global test helper functions
- Environment setup and cleanup

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only

# Run tests with additional options
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:verbose      # Verbose output
```

## 📊 Test Coverage

The test suite provides comprehensive coverage for:

- ✅ **Function parsing logic** - XML and JSON format handling
- ✅ **Agent workflow** - Tool execution and chaining
- ✅ **GitHub API integration** - Repository and issue operations
- ✅ **Error handling** - Network errors, rate limiting, authentication
- ✅ **Performance testing** - Execution time measurement and benchmarking
- ✅ **Mock data generation** - Realistic test data creation

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with ts-jest
- Module path mapping for imports
- Coverage reporting configuration
- Test environment setup

### Environment Setup (`env.setup.js`)
- Mock environment variables
- Console output control
- Test-specific configurations

## 📝 Writing New Tests

When adding new tests, follow these patterns:

1. **Use the appropriate test category** (unit/integration/e2e)
2. **Leverage existing mock factories** for consistent test data
3. **Use test utilities** for common operations
4. **Follow the existing naming conventions**
5. **Add proper test descriptions** and organize with `describe` blocks
6. **Include both positive and negative test cases**
7. **Test error conditions** and edge cases

### Example Test Structure

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { MockFactories } from '../helpers/mock-factories';
import { TestUtils } from '../helpers/test-utils';

describe('YourComponent', () => {
  let testEnv: ReturnType<typeof TestUtils.createTestEnvironment>;

  beforeEach(() => {
    testEnv = TestUtils.createTestEnvironment();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('feature group', () => {
    test('should handle normal case', async () => {
      // Arrange
      const mockData = MockFactories.createGitHubIssue();
      
      // Act
      const result = await yourFunction(mockData);
      
      // Assert
      expect(result).toBeDefined();
      expect(TestUtils.isValidGitHubIssue(result)).toBe(true);
    });

    test('should handle error case', async () => {
      // Test error scenarios
    });
  });
});
```

## 🔄 Migration from Scripts

The following scripts have been successfully converted to proper test cases:

| Original Script | New Test File | Test Type |
|----------------|---------------|-----------|
| `test-function-parser.js` | `unit/function-parser.test.ts` | Unit |
| `simple-agent-test.js` | `unit/agent-workflow.test.ts` | Unit |
| `test-real-github-api.js` | `integration/github-api.test.ts` | Integration |
| `test-agent-simple.js` | *(Future: integration/agent-basic.test.ts)* | Integration |
| `compare-agent-tool.js` | *(Future: integration/agent-comparison.test.ts)* | Integration |
| `test-agent.js` | *(Future: e2e/agent-full-workflow.test.ts)* | E2E |
| `real-test-comparison.js` | *(Future: e2e/real-world-scenarios.test.ts)* | E2E |

## 📈 Benefits of the New Test Structure

1. **Better Organization** - Clear separation of test types and concerns
2. **Improved Maintainability** - Standardized patterns and utilities
3. **Enhanced CI/CD Integration** - Proper test runners and reporting
4. **Better Debugging** - Jest's testing framework and error reporting
5. **Coverage Reporting** - Detailed metrics and coverage analysis
6. **Faster Development** - Watch mode and selective test running
7. **Consistent Patterns** - Reusable mock factories and utilities

This test suite provides a solid foundation for maintaining code quality and ensuring the reliability of the GitHub Agent functionality.
