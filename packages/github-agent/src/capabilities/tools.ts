// Issue Management Tools
import { installGitHubIssueListTool } from "./tools/github-issue-list";
import { installGitHubIssueGetTool } from "./tools/github-issue-get";
import { installGitHubIssueCreateTool } from "./tools/github-issue-create";
import { installGitHubIssueCommentTool } from "./tools/github-issue-comment";

// Analysis & Search Tools
import { installGitHubSearchSmartTool } from "./tools/github-search-smart";
import { installGitHubAnalysisUploadTool } from "./tools/github-analysis-upload";

// Web Content Tools
import { installWebFetchContentTool } from "./tools/web-fetch-content";

// Issue Management Tools
export const GitHubIssueTools = [
  installGitHubIssueListTool,
  installGitHubIssueGetTool,
  installGitHubIssueCreateTool,
  installGitHubIssueCommentTool,
] as const;

// Analysis & Search Tools
export const GitHubAnalysisTools = [
  installGitHubSearchSmartTool,
  installGitHubAnalysisUploadTool,
] as const;

// Web Content Tools
export const WebContentTools = [
  installWebFetchContentTool,
] as const;

// All GitHub Tools (for backward compatibility)
export const GitHubTools = [
  ...GitHubIssueTools,
  ...GitHubAnalysisTools,
  ...WebContentTools,
] as const;
