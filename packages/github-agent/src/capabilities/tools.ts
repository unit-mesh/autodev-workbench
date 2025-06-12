// File System Tools
import { installListDirectoryTool } from "./tools/fs-list-directory";
import { installReadFileTool } from "./tools/fs-read-file";
import { installWriteFileTool } from "./tools/fs-write-file";
import { installDeleteFileTool } from "./tools/fs-delete-file";

// Terminal Tools
import { installRunTerminalCommandTool } from "./tools/terminal-run-command";

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

// Tool Categories
export const FileSystemTools = [
  installListDirectoryTool,
  installReadFileTool,
  installWriteFileTool,
  installDeleteFileTool,
] as const;

export const CodeAnalysisTools = [
  installAnalysisBasicContextTool,
  installSearchKeywordsTool,
  installGrepSearchTool,
] as const;

export const TerminalTools = [
  installRunTerminalCommandTool,
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

// Tool Collections
export const CoreTools = [
  ...FileSystemTools,
  ...CodeAnalysisTools,
  ...TerminalTools,
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
] as const;

// All Tools (including comment tool for full agent)
export const AllTools = [
  ...CoreTools,
  ...IntegrationTools,
] as const;