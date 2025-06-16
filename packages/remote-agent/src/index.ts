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
export { BugFixAgent, type BugFixAgentConfig, type BugFixAgentResponse } from "./agents";
export { PromptBuilder } from "./agent/prompt-builder";
export { FunctionParser } from "./agent/function-parser";
export { ToolExecutor, type ToolResult, type ToolExecutionContext } from "./agent/tool-executor";
export { ToolDefinition } from "./agent/tool-definition";
export { FinalReportGenerator } from "./agent/final-report-generator";
export { GitHubContextManager } from "./agent/github-context-manager";
export * from "./agent/tool-definition";

// =============================================================================
// Playbooks
// =============================================================================
export { Playbook, IssuePlaybook, BugFixPlaybook } from "./playbooks";

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
export { installGitHubListRepositoryIssuesTool } from "./capabilities/tools/github/github-list-repository-issues";
export { installGitHubGetIssueWithAnalysisTool } from "./capabilities/tools/github/github-issue-with-analysis";
export { installGitHubCreateNewIssueTool } from "./capabilities/tools/github/github-issue-create";
export { installGitHubAddIssueCommentTool } from "./capabilities/tools/github/github-issue-comment";
export { installGitHubFindCodeByDescriptionTool } from "./capabilities/tools/github/github-find-code-by-description";
export { installGitHubAnalyzeIssueTool } from "./capabilities/tools/github/github-analysis-issue";

// =============================================================================
// File System Tools
// =============================================================================
export { installListDirectoryTool } from "./capabilities/tools/file-systems/fs-list-directory";
export { installReadFileTool } from "./capabilities/tools/file-systems/fs-read-file";
export { installWriteFileTool } from "./capabilities/tools/file-systems/fs-write-file";
export { installDeleteFileTool } from "./capabilities/tools/file-systems/fs-delete-file";

// =============================================================================
// Analysis and Search Tools
// =============================================================================
export { installAnalysisBasicContextTool } from "./capabilities/tools/code/context-analyzer";
export { installGrepSearchTool } from "./capabilities/tools/code/code-search-regex";
export { installSearchKeywordsTool } from "./capabilities/tools/code/keyword-search";
export { ProjectDetector, type ProjectDetectionResult, type ProjectConfig } from "./capabilities/tools/analyzers/project-detector";

// =============================================================================
// Terminal Tools
// =============================================================================
export { installRunTerminalCommandTool } from "./capabilities/tools/terminal/terminal-run-command";

// =============================================================================
// Web Tools
// =============================================================================
export {
  installExtractWebpageAsMarkdownTool,
  fetchUrlsFromIssue,
  extractUrlsFromText,
  fetchHtmlContent,
} from "./capabilities/tools/web/web-fetch-content";
export { installWebSearchTool } from "./capabilities/tools/web/web-search";

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
export { urlToMarkdown, extractTitle } from "./utils/markdown-utils";
