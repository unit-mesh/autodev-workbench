// File System Tools
import {installListDirectoryTool} from "./tools/fs-list-directory";
import {installReadFileTool} from "./tools/fs-read-file";
import {installWriteFileTool} from "./tools/fs-write-file";
import {installDeleteFileTool} from "./tools/fs-delete-file";

// Planning & Memory Tools

// Terminal Tools
import {installRunTerminalCommandTool} from "./tools/terminal-run-command";
import {installExecuteScriptTool} from "./tools/terminal-execute-script";

import {installGitHubAnalyzeIssueTool} from "./tools/github-analysis-upload";
import {installSymbolSearchTool} from "./tools/code-analyze-symbols";
import {installContextAnalysisTool} from "./tools/planning-context-analyzer";
import {installGrepSearchTool} from "./tools/code-search-regex";
import {installGitHubGetIssueWithAnalysisTool} from "./tools/github-issue-get";
import {installGitHubAddIssueCommentTool} from "./tools/github-issue-comment";
import {installGitHubListRepositoryIssuesTool} from "./tools/github-list-repository-issues";
import {installGitHubFindCodeByDescriptionTool} from "./tools/github-search-smart";
import {installGitHubCreateNewIssueTool} from "./tools/github-issue-create";
import {installExtractWebpageAsMarkdownTool} from "./tools/web-fetch-content";

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
    // installDependencyAnalysisTool,
    // installCodebaseSearchTool,
    installContextAnalysisTool,
    installSymbolSearchTool,
    installGrepSearchTool,
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
    installGitHubAnalyzeIssueTool,
] as const;

// Web Tools
export const WebTools = [
    installExtractWebpageAsMarkdownTool,
] as const;

// All Tools
export const AutoDevRemoteAgentTools = [
    ...FileSystemTools,
    ...CodeAnalysisTools,
    ...TerminalTools,
    ...GitHubTools,
    ...WebTools,
] as const;
