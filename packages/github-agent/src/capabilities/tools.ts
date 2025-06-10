// File System Tools
import {installListDirectoryTool} from "./tools/fs-list-directory";
import {installReadFileTool} from "./tools/fs-read-file";
import {installWriteFileTool} from "./tools/fs-write-file";
import {installDeleteFileTool} from "./tools/fs-delete-file";

// Planning & Memory Tools
import {installMemoryStoreTool} from "./tools/memory-store";

// Terminal Tools
import {installRunTerminalCommandTool} from "./tools/terminal-run-command";
import {installExecuteScriptTool} from "./tools/terminal-execute-script";

import {installGitHubAnalyzeIssueAndPostResultsTool} from "./tools/github-analysis-upload";
import {installSymbolAnalysisTool} from "./tools/code-analyze-symbols";
import {installFileSearchTool} from "./tools/code-search-filename";
import {installContextAnalysisTool} from "./tools/planning-context-analyzer";
import {installGrepSearchTool} from "./tools/code-search-regex";
import {installDependencyAnalysisTool} from "./tools/code-analyze-dependencies";
import {installGitHubGetIssueWithAnalysisTool} from "./tools/github-issue-get";
import {installGitHubAddIssueCommentTool} from "./tools/github-issue-comment";
import {installGitHubListRepositoryIssuesTool} from "./tools/github-list-repository-issues";
import {installGitHubFindCodeByDescriptionTool} from "./tools/github-search-smart";
import {installGitHubCreateNewIssueTool} from "./tools/github-issue-create";
import {installExtractWebpageAsMarkdownTool} from "./tools/web-fetch-content";
import {installCodebaseSearchTool} from "./tools/code-search-semantic";

// File System Tools
export const FileSystemTools = [
    installListDirectoryTool,
    installReadFileTool,
    installWriteFileTool,
    installDeleteFileTool,
] as const;

// Code Analysis Tools
export const CodeAnalysisTools = [
    // installFileSearchTool,
    installSymbolAnalysisTool,
    installDependencyAnalysisTool,
    installContextAnalysisTool,
    // installCodebaseSearchTool,
    installGrepSearchTool,
] as const;

// Planning & Memory Tools
export const PlanningTools = [
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
export const AllEnhancedTools = [
    ...FileSystemTools,
    ...CodeAnalysisTools,
    ...PlanningTools,
    ...TerminalTools,
    ...GitHubTools,
    ...WebTools,
] as const;
