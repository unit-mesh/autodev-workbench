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

// All GitHub Tools (for backward compatibility)
export const GitHubTools = [
  ...GitHubIssueTools,
  ...GitHubAnalysisTools,
  ...WebContentTools,
] as const;
