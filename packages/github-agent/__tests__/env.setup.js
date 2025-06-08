/**
 * Environment setup for tests
 * Sets up mock environment variables and configurations
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'mock_github_token_for_testing';
process.env.GLM_TOKEN = process.env.GLM_TOKEN || 'mock_glm_token_for_testing';
process.env.DEEPSEEK_TOKEN = process.env.DEEPSEEK_TOKEN || 'mock_deepseek_token_for_testing';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'mock_openai_key_for_testing';

// Disable console output during tests unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  const originalConsole = { ...console };
  
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsole.error; // Keep error logs for debugging
  
  // Provide a way to restore console for specific tests
  global.restoreConsole = () => {
    Object.assign(console, originalConsole);
  };
  
  global.mockConsole = () => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
  };
}
