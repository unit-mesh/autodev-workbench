// File System Tools
import {installListDirectoryTool} from "./tools/fs-list-directory";
import {installReadFileTool} from "./tools/fs-read-file";
import {installWriteFileTool} from "./tools/fs-write-file";
import {installDeleteFileTool} from "./tools/fs-delete-file";

// Terminal Tools
import {installRunTerminalCommandTool} from "./tools/terminal-run-command";

// context engine
import {installAnalysisBasicContextTool} from "./tools/context-analyzer";
import {installGrepSearchTool} from "./tools/code-search-regex";
import {installSearchKeywordsTool} from "./tools/keyword-search";

// git related
import {installGitHubAnalyzeIssueTool} from "./tools/github-analysis-issue";
import {installGitHubGetIssueWithAnalysisTool} from "./tools/github-issue-get";
import {installGitHubAddIssueCommentTool} from "./tools/github-issue-comment";
import {installGitHubListRepositoryIssuesTool} from "./tools/github-list-repository-issues";
import {installGitHubFindCodeByDescriptionTool} from "./tools/github-search-smart";
import {installGitHubCreateNewIssueTool} from "./tools/github-issue-create";

// web search
import {installExtractWebpageAsMarkdownTool} from "./tools/web-fetch-content";
import {installWebSearchTool} from "./tools/web-search";

// File System Tools
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

// Terminal Tools
export const TerminalTools = [
    installRunTerminalCommandTool,
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
    installWebSearchTool,
] as const;

// All Tools
export const AutoDevRemoteAgentTools = [
    ...FileSystemTools,
    ...CodeAnalysisTools,
    ...TerminalTools,
    ...GitHubTools.filter(it => it.name !== installGitHubAddIssueCommentTool.name),
    ...WebTools,
] as const;
