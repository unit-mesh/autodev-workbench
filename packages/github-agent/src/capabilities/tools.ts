import { installGitHubGetIssuesTool } from "./tools/github-get-issues";
import { installGitHubAnalyzeIssueTool } from "./tools/github-analyze-issue";
import { installGitHubGetIssueContextTool } from "./tools/github-get-issue-context";

export const GitHubTools = [
  installGitHubGetIssuesTool,
  installGitHubAnalyzeIssueTool,
  installGitHubGetIssueContextTool,
] as const;
