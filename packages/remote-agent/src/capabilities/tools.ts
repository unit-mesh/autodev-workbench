// File System Tools
import { installListDirectoryTool } from "./tools/file-systems/fs-list-directory";
import { installReadFileTool } from "./tools/file-systems/fs-read-file";
import { installWriteFileTool } from "./tools/file-systems/fs-write-file";
import { installDeleteFileTool } from "./tools/file-systems/fs-delete-file";

// Advanced File Editing Tools
import { installStrReplaceEditorTool } from "./tools/code/str-replace-editor";

// Terminal Tools
import { installRunTerminalCommandTool } from "./tools/terminal/terminal-run-command";
import { installReadTerminalTool, installWriteProcessTool } from "./tools/terminal/terminal-interaction";

// Process Management Tools
import { installLaunchProcessTool } from "./tools/process/launch-process-tool";

// Process Management Tools
// TODO: Implement interactive process management
// - installLaunchProcessTool: Launch processes with wait/background modes
// - installListProcessesTool: List all active processes with status
// - installReadProcessTool: Read output from specific process
// - installWriteProcessTool: Send input to interactive processes
// - installKillProcessTool: Terminate processes by ID
// Terminal Interaction Tools
// TODO: Implement advanced terminal capabilities
// - installReadTerminalTool: Read current terminal output/selected text
// - installTerminalSessionTool: Manage persistent terminal sessions
// Diagnostic Tools
// TODO: Implement development environment diagnostics
// - installDiagnosticsTool: Get IDE errors, warnings, type issues
// - installHealthCheckTool: System and environment health monitoring
// Codebase Intelligence Tools
// TODO: Implement semantic code understanding
// - installCodebaseRetrievalTool: AI-powered code search and context
// - installSymbolAnalysisTool: Deep symbol relationship analysis
// - installDependencyMapTool: Project dependency visualization
// Visualization Tools
// TODO: Implement rich content rendering
// - installRenderMermaidTool: Generate interactive diagrams
// - installOpenBrowserTool: Launch URLs in browser
// - installMarkdownRenderTool: Rich markdown preview
// Memory Management Tools
// TODO: Implement persistent context
// - installRememberTool: Store long-term memories across sessions
// - installContextManagerTool: Manage conversation context
// Code Analysis Tools
import { installAnalysisBasicContextTool } from "./tools/code/context-analyzer";
import { installGrepSearchTool } from "./tools/code/code-search-regex";
import { installSearchKeywordsTool } from "./tools/code/keyword-search";

// GitHub Tools
import { installGitHubAnalyzeIssueTool } from "./tools/github/github-analysis-issue";
import { installGitHubGetIssueWithAnalysisTool } from "./tools/github/github-issue-with-analysis";
import { installGitHubAddIssueCommentTool } from "./tools/github/github-issue-comment";
import { installGitHubListRepositoryIssuesTool } from "./tools/github/github-list-repository-issues";
import { installGitHubFindCodeByDescriptionTool } from "./tools/github/github-find-code-by-description";
import { installGitHubCreateNewIssueTool } from "./tools/github/github-issue-create";

// Web Tools
import { installExtractWebpageAsMarkdownTool } from "./tools/web/web-fetch-content";
import { installFetchContentWithSummaryTool } from "./tools/web/fetch-content-with-summary";
import { installWebSearchTool } from "./tools/web/web-search";
import { installProjectMemoryTool } from "./tools/project-memory";
import { installListProcessesTool } from "./tools/process/list-processes-tool";
import { installReadProcessTool } from "./tools/process/read-process-tool";
import { installKillProcessTool } from "./tools/terminal/kill-process-tool";

// Tool Categories
export const FileSystemTools = [
  installListDirectoryTool,
  installReadFileTool,
  installWriteFileTool,
  installDeleteFileTool,
] as const;

export const AdvancedEditingTools = [
  installStrReplaceEditorTool,
] as const;

export const CodeAnalysisTools = [
  installAnalysisBasicContextTool,
  installSearchKeywordsTool,
  installGrepSearchTool,
] as const;

export const TerminalTools = [
  installRunTerminalCommandTool,
] as const;

export const TerminalInteractionTools = [
  installReadTerminalTool,
  installWriteProcessTool,
  installKillProcessTool,
] as const;

export const ProcessManagementTools = [
  installLaunchProcessTool,
  installListProcessesTool,
  installReadProcessTool,
] as const;

export const GitHubTools = [
  installGitHubGetIssueWithAnalysisTool,
  installGitHubCreateNewIssueTool,
  installGitHubAddIssueCommentTool,
  installGitHubListRepositoryIssuesTool,
  installGitHubFindCodeByDescriptionTool,
  installGitHubAnalyzeIssueTool,
] as const;

export const WebTools = [
  installExtractWebpageAsMarkdownTool,
  installFetchContentWithSummaryTool,
  installWebSearchTool,
] as const;

export const EnhancedIntelligenceTools = [
  installProjectMemoryTool,
] as const;

// Tool Collections
export const CoreTools = [
  ...FileSystemTools,
  ...AdvancedEditingTools,
  ...CodeAnalysisTools,
  ...TerminalTools,
] as const;

export const AdvancedTools = [
  ...TerminalInteractionTools,
  ...ProcessManagementTools,
  ...EnhancedIntelligenceTools,
] as const;

export const IntegrationTools = [
  ...GitHubTools,
  ...WebTools,
] as const;

// All Tools (excluding comment tool for remote agent)
export const AutoDevRemoteAgentTools = [
  ...CoreTools,
  ...GitHubTools.filter(tool =>
    tool !== installGitHubAddIssueCommentTool &&
    tool !== installGitHubFindCodeByDescriptionTool
  ),
  ...WebTools,
  ...EnhancedIntelligenceTools,
] as const;
