import { installGitHubGetIssuesTool } from "./tools/github-get-issues";
import { installGitHubAnalyzeIssueTool } from "./tools/github-analyze-issue";
import { installGitHubGetIssueContextTool } from "./tools/github-get-issue-context";
import { installGitHubSmartSearchTool } from "./tools/github-smart-search";

export const GitHubTools = [
  installGitHubGetIssuesTool,
  installGitHubAnalyzeIssueTool,
  installGitHubGetIssueContextTool,
  installGitHubSmartSearchTool,
] as const;
