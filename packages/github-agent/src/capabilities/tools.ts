// Issue Management Tools
import { installGitHubListRepositoryIssuesTool } from "./tools/github-list-repository-issues";
import { installGitHubGetIssueWithAnalysisTool } from "./tools/github-issue-get";
import { installGitHubCreateNewIssueTool } from "./tools/github-issue-create";
import { installGitHubAddIssueCommentTool } from "./tools/github-issue-comment";

// Analysis & Search Tools
import { installGitHubFindCodeByDescriptionTool } from "./tools/github-search-smart";
import { installGitHubAnalyzeIssueAndPostResultsTool } from "./tools/github-analysis-upload";

// Web Content Tools
import { installExtractWebpageAsMarkdownTool } from "./tools/web-fetch-content";

// File System Operations Tools
import { installListDirectoryTool } from "./tools/fs-list-directory";
import { installReadFileTool } from "./tools/fs-read-file";
import { installWriteFileTool } from "./tools/fs-write-file";
import { installDeleteFileTool } from "./tools/fs-delete-file";

// Terminal & Execution Tools
import { installRunTerminalCommandTool } from "./tools/terminal-run-command";
import { installExecuteScriptTool } from "./tools/terminal-execute-script";

// Code Analysis & Understanding Tools
import { installCodebaseSearchTool } from "./tools/code-search-semantic";
import { installGrepSearchTool } from "./tools/code-search-regex";
import { installFileSearchTool } from "./tools/code-search-filename";
import { installSymbolAnalysisTool } from "./tools/code-analyze-symbols";
import { installDependencyAnalysisTool } from "./tools/code-analyze-dependencies";

// Planning & Memory Tools
import { installTaskPlannerTool } from "./tools/planning-task-manager";
import { installMemoryStoreTool } from "./tools/memory-store";
import { installContextAnalysisTool } from "./tools/planning-context-analyzer";

// Issue Management Tools
export const GitHubIssueTools = [
  installGitHubListRepositoryIssuesTool,
  installGitHubGetIssueWithAnalysisTool,
  installGitHubCreateNewIssueTool,
  installGitHubAddIssueCommentTool,
] as const;

// Analysis & Search Tools
export const GitHubAnalysisTools = [
  installGitHubFindCodeByDescriptionTool,
  installGitHubAnalyzeIssueAndPostResultsTool,
] as const;

// Web Content Tools
export const WebContentTools = [
  installExtractWebpageAsMarkdownTool,
] as const;

// File System Operations Tools
export const FileSystemTools = [
  installListDirectoryTool,
  installReadFileTool,
  installWriteFileTool,
  installDeleteFileTool,
] as const;

// Terminal & Execution Tools
export const TerminalTools = [
  installRunTerminalCommandTool,
  installExecuteScriptTool,
] as const;

// Code Analysis & Understanding Tools
export const CodeAnalysisTools = [
  installCodebaseSearchTool,
  installGrepSearchTool,
  installFileSearchTool,
  installSymbolAnalysisTool,
  installDependencyAnalysisTool,
] as const;

// Planning & Memory Tools
export const PlanningTools = [
  installTaskPlannerTool,
  installMemoryStoreTool,
  installContextAnalysisTool,
] as const;

// All GitHub Tools (for backward compatibility)
export const GitHubTools = [
  ...GitHubIssueTools,
  ...GitHubAnalysisTools,
  ...WebContentTools,
] as const;

// All Enhanced Tools (comprehensive set)
export const AllEnhancedTools = [
  ...GitHubIssueTools,
  ...GitHubAnalysisTools,
  ...WebContentTools,
  ...FileSystemTools,
  ...TerminalTools,
  ...CodeAnalysisTools,
  ...PlanningTools,
] as const;
