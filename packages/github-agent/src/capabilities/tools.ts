import { installGitHubGetIssuesTool } from "./tools/github-get-issues";
import { installGitHubAnalyzeIssueTool } from "./tools/github-analyze-issue";
import { installGitHubGetIssueContextTool } from "./tools/github-get-issue-context";
import { installGitHubSmartSearchTool } from "./tools/github-smart-search";
import { installGitHubUploadAnalysisTool } from "./tools/github-upload-analysis";
import { installFetchUrlContentTool } from "./tools/fetch-url-content";

export const GitHubTools = [
  installGitHubGetIssuesTool,
  installGitHubAnalyzeIssueTool,
  installGitHubGetIssueContextTool,
  installGitHubSmartSearchTool,
  installGitHubUploadAnalysisTool,
  installFetchUrlContentTool,
] as const;
