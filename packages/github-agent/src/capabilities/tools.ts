import { ToolLike } from "./_typing";

// File System Tools
import { installListDirectoryTool } from "./tools/fs-list-directory";
import { installReadFileTool } from "./tools/fs-read-file";
import { installWriteFileTool } from "./tools/fs-write-file";
import { installDeleteFileTool } from "./tools/fs-delete-file";

// Code Analysis Tools
import { installFileSearchTool } from "./tools/file-search";
import { installSymbolAnalysisTool } from "./tools/analyze-symbols";
import { installDependencyAnalysisTool } from "./tools/analyze-dependencies";
import { installContextAnalysisTool } from "./tools/analyze-context";
import { installCodebaseSearchTool } from "./tools/codebase-search";
import { installGrepSearchTool } from "./tools/grep-search";

// Planning & Memory Tools
import { installTaskPlannerTool } from "./tools/task-planner";
import { installMemoryStoreTool } from "./tools/memory-store";

// Terminal Tools
import { installRunTerminalCommandTool } from "./tools/terminal-run-command";
import { installExecuteScriptTool } from "./tools/terminal-execute-script";

// GitHub Tools
import { installGitHubGetIssueWithAnalysisTool } from "./tools/github-get-issue-with-analysis";
import { installGitHubCreateNewIssueTool } from "./tools/github-create-new-issue";
import { installGitHubAddIssueCommentTool } from "./tools/github-add-issue-comment";
import { installGitHubListRepositoryIssuesTool } from "./tools/github-list-repository-issues";
import { installGitHubFindCodeByDescriptionTool } from "./tools/github-find-code-by-description";
import { installGitHubAnalyzeIssueAndPostResultsTool } from "./tools/github-analysis-upload";

// Web Tools
import { installExtractWebpageAsMarkdownTool } from "./tools/extract-webpage-as-markdown";

// File System Tools
export const FileSystemTools = [
  installListDirectoryTool,
  installReadFileTool,
  installWriteFileTool,
  installDeleteFileTool,
] as const;

// Code Analysis Tools
export const CodeAnalysisTools = [
  installFileSearchTool,
  installSymbolAnalysisTool,
  installDependencyAnalysisTool,
  installContextAnalysisTool,
  installCodebaseSearchTool,
  installGrepSearchTool,
] as const;

// Planning & Memory Tools
export const PlanningTools = [
  installTaskPlannerTool,
  installMemoryStoreTool,
] as const;

// Terminal Tools
export const TerminalTools = [
  installRunTerminalCommandTool,
  installExecuteScriptTool,
] as const;

// GitHub Tools
export const GitHubTools = [
  installGitHubGetIssueWithAnalysisTool,
  installGitHubCreateNewIssueTool,
  installGitHubAddIssueCommentTool,
  installGitHubListRepositoryIssuesTool,
  installGitHubFindCodeByDescriptionTool,
  installGitHubAnalyzeIssueAndPostResultsTool,
] as const;

// Web Tools
export const WebTools = [
  installExtractWebpageAsMarkdownTool,
] as const;

// All Tools
export const AllTools = [
  ...FileSystemTools,
  ...CodeAnalysisTools,
  ...PlanningTools,
  ...TerminalTools,
  ...GitHubTools,
  ...WebTools,
] as const;
