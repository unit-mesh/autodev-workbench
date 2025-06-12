// =============================================================================
// Core Server and Types
// =============================================================================
export { GitHubAgentServer } from "./server";
export type * from "./server";
export type * from "./types/index";

// =============================================================================
// AI Agent System
// =============================================================================
export { AIAgent, type AgentConfig, type AgentResponse } from "./agent";
export { PromptBuilder } from "./agent/prompt-builder";
export { FunctionParser } from "./agent/function-parser";
export { ToolExecutor, type ToolResult, type ToolExecutionContext } from "./agent/tool-executor";
export { ToolDefinition } from "./agent/tool-definition";
export * from "./agent/tool-definition";

// =============================================================================
// Core Services
// =============================================================================
export { ContextAnalyzer, FileLoader } from "./services/core";
export { GitHubService } from "./services/github";
export {
  LLMService, 
  configureLLMProvider, 
  hasLLMProvider, 
  getLLMProviderStatus, 
  type LLMProviderConfig
} from "./services/llm";
export { AnalysisReportGenerator } from "./services/reporting";

// =============================================================================
// Platform Services
// =============================================================================
export * from "./services/platform";
export { PlatformAdapter } from "./services/platform/adapters/PlatformAdapter";

// =============================================================================
// GitHub Tools
// =============================================================================
export { installGitHubListRepositoryIssuesTool } from "./capabilities/tools/github-list-repository-issues";
export { installGitHubGetIssueWithAnalysisTool } from "./capabilities/tools/github-issue-get";
export { installGitHubCreateNewIssueTool } from "./capabilities/tools/github-issue-create";
export { installGitHubAddIssueCommentTool } from "./capabilities/tools/github-issue-comment";
export { installGitHubFindCodeByDescriptionTool } from "./capabilities/tools/github-search-smart";
export { installGitHubAnalyzeIssueTool } from "./capabilities/tools/github-analysis-upload";

// =============================================================================
// Web Tools
// =============================================================================
export {
  installExtractWebpageAsMarkdownTool,
  fetchUrlsFromIssue,
  extractUrlsFromText,
  fetchHtmlContent,
  urlToMarkdown,
  extractTitle
} from "./capabilities/tools/web-fetch-content";

// =============================================================================
// Tool Collections and Utilities
// =============================================================================
export * from "./capabilities/tools";
export * from "./capabilities/tools/index";

// =============================================================================
// Utility Services
// =============================================================================
export { performanceMonitor, PerformanceMonitor, MemoryTracker, timed } from "./utils/performance-monitor";
export { EnhancedUI } from "./utils/enhanced-ui";