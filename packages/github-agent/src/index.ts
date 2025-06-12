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
export { ResponseGenerator } from "./agent/response-generator";
export { GitHubContextManager } from "./agent/github-context-manager";
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
// Analysis Services
// =============================================================================
export * from "./services/analysis";

// =============================================================================
// Platform Services
// =============================================================================
export * from "./services/platform";
export { PlatformAdapter } from "./services/platform/adapters/PlatformAdapter";

// =============================================================================
// Capabilities and Tool Collections
// =============================================================================
export { installCapabilities } from "./capabilities";
export {
  FileSystemTools,
  CodeAnalysisTools,
  TerminalTools,
  GitHubTools,
  WebTools,
  AutoDevRemoteAgentTools
} from "./capabilities/tools";

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
// File System Tools
// =============================================================================
export { installListDirectoryTool } from "./capabilities/tools/fs-list-directory";
export { installReadFileTool } from "./capabilities/tools/fs-read-file";
export { installWriteFileTool } from "./capabilities/tools/fs-write-file";
export { installDeleteFileTool } from "./capabilities/tools/fs-delete-file";

// =============================================================================
// Analysis and Search Tools
// =============================================================================
export { installAnalysisBasiContextTool } from "./capabilities/tools/planning-context-analyzer";
export { installGrepSearchTool } from "./capabilities/tools/code-search-regex";
export { installKeywordSearchTool } from "./capabilities/tools/keyword-search";

// =============================================================================
// Terminal Tools
// =============================================================================
export { installRunTerminalCommandTool } from "./capabilities/tools/terminal-run-command";

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
export { installWebSearchTool } from "./capabilities/tools/web-search";

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