// File System Tools
import { installListDirectoryTool } from "./tools/fs-list-directory";
import { installReadFileTool } from "./tools/fs-read-file";
import { installWriteFileTool } from "./tools/fs-write-file";
import { installDeleteFileTool } from "./tools/fs-delete-file";

// Advanced File Editing Tools
import { installStrReplaceEditorTool } from "./tools/str-replace-editor";

// Terminal Tools
import { installRunTerminalCommandTool } from "./tools/terminal-run-command";
import { installReadTerminalTool, installWriteProcessTool, installKillProcessTool } from "./tools/terminal-interaction";

// Process Management Tools
import { installLaunchProcessTool, installListProcessesTool, installReadProcessTool } from "./tools/process-management";

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
import { installAnalysisBasicContextTool } from "./tools/context-analyzer";
import { installGrepSearchTool } from "./tools/code-search-regex";
import { installSearchKeywordsTool } from "./tools/keyword-search";

// GitHub Tools
import { installGitHubAnalyzeIssueTool } from "./tools/github-analysis-issue";
import { installGitHubGetIssueWithAnalysisTool } from "./tools/github-issue-get";
import { installGitHubAddIssueCommentTool } from "./tools/github-issue-comment";
import { installGitHubListRepositoryIssuesTool } from "./tools/github-list-repository-issues";
import { installGitHubFindCodeByDescriptionTool } from "./tools/github-find-code-by-description";
import { installGitHubCreateNewIssueTool } from "./tools/github-issue-create";

// Web Tools
import { installExtractWebpageAsMarkdownTool } from "./tools/web-fetch-content";
import { installWebSearchTool } from "./tools/web-search";

// Enhanced Tools - New Implementations
import { installSemanticCodeSearchTool } from "./tools/semantic-code-search";
import { installIntelligentAgentTool } from "./tools/intelligent-agent";
import { installProjectMemoryTool } from "./tools/project-memory";

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
  installSemanticCodeSearchTool,
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
  installWebSearchTool,
] as const;

// New Enhanced Tools Category
export const EnhancedIntelligenceTools = [
  installIntelligentAgentTool,
  installProjectMemoryTool,
  installSemanticCodeSearchTool,
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
  ...GitHubTools.filter(tool => tool !== installGitHubAddIssueCommentTool),
  ...WebTools,
  ...EnhancedIntelligenceTools,
] as const;

// All Tools (including comment tool for full agent)
export const AllTools = [
  ...CoreTools,
  ...IntegrationTools,
  ...EnhancedIntelligenceTools,
] as const;

// Enhanced Tools (with advanced capabilities)
export const EnhancedAgentTools = [
  ...CoreTools,
  ...AdvancedTools,
  ...IntegrationTools,
] as const;