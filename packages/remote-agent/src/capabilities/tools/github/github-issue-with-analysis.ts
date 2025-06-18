import { ToolLike } from "../../_typing";
import { z } from "zod";
import { GitHubService } from "../../../services/github/github-service";
import { ContextAnalyzer } from "../../../services/core/context-analyzer";
import { fetchUrlsFromIssue } from "../web/web-fetch-content";

export const installGitHubGetIssueWithAnalysisTool: ToolLike = (installer) => {
  installer("github-get-issue-with-analysis", "Retrieve a GitHub issue with intelligent code analysis, finding related files, symbols, and APIs in your workspace", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    issue_number: z.number().describe("Issue number to get"),
    workspace_path: z.string().optional().describe("Path to the workspace to analyze (defaults to current directory)"),
    include_file_content: z.boolean().optional().describe("Whether to include full file content in the response"),
    max_files: z.number().min(1).max(20).optional().describe("Maximum number of related files to return (1-20)"),
    fetch_urls: z.boolean().optional().default(true).describe("Whether to fetch content from URLs mentioned in the issue"),
    url_timeout: z.number().optional().default(10000).describe("Timeout for URL fetching in milliseconds"),
    analysis_mode: z.enum(["basic", "full"]).optional().default("basic").describe("Analysis depth: basic (context only) or full (complete analysis)"),
  }, async ({
    owner,
    repo,
    issue_number,
    workspace_path,
    include_file_content = false,
    max_files = 5,
    fetch_urls = true,
    url_timeout = 10000,
    analysis_mode = "basic"
  }: {
    owner: string;
    repo: string;
    issue_number: number;
    workspace_path?: string;
    include_file_content?: boolean;
    max_files?: number;
    fetch_urls?: boolean;
    url_timeout?: number;
    analysis_mode?: "basic" | "full";
  }) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        return {
          content: [
            {
              type: "text",
              text: "Error: GITHUB_TOKEN environment variable is not set. Please set your GitHub personal access token."
            }
          ]
        };
      }

      const githubService = new GitHubService(githubToken);
      const contextAnalyzer = new ContextAnalyzer(workspace_path);

      // Get the specific issue
      const issue = await githubService.getIssue(owner, repo, issue_number);

      // Get repository information
      const repoInfo = await githubService.getRepositoryInfo(owner, repo);

      // Fetch URL content if enabled
      let urlContent: any[] = [];
      if (fetch_urls && issue.body) {
        if (process.env.VERBOSE_URL_LOGS === 'true') {
          console.log('🔗 Fetching URL content from issue...');
        }
        urlContent = await fetchUrlsFromIssue(issue.body, url_timeout);
      }

      const enhancedIssue = { ...issue, urlContent };

      let analysisResult;
      let codeContext;

      if (analysis_mode === "full") {
        analysisResult = await contextAnalyzer.analyzeIssue(enhancedIssue);
        codeContext = analysisResult.relatedCode;
      } else {
        codeContext = await contextAnalyzer.findRelevantCode(enhancedIssue);
      }

      const limitedFiles = codeContext.files.slice(0, max_files);

      const result = {
        issue: {
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          user: issue.user?.login,
          labels: (issue.labels || []).map(label => ({
            name: label.name,
            color: label.color,
            description: label.description,
          })),
          assignees: (issue.assignees || []).map(assignee => assignee.login),
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          closed_at: issue.closed_at,
          html_url: issue.html_url,
        },
        repository: {
          name: repoInfo.name,
          full_name: repoInfo.full_name,
          description: repoInfo.description,
          language: repoInfo.language,
          default_branch: repoInfo.default_branch,
          html_url: repoInfo.html_url,
        },
        context: {
          workspace_path: workspace_path || process.cwd(),
          related_files: limitedFiles.map(file => ({
            path: file.path,
            relevance_score: file.relevanceScore,
            content: include_file_content ? file.content : undefined,
            content_preview: !include_file_content ?
              file.content.substring(0, 200) + (file.content.length > 200 ? "..." : "") :
              undefined,
          })),
          related_symbols: codeContext.symbols.map(symbol => ({
            name: symbol.name,
            type: symbol.type,
            location: symbol.location,
            description: symbol.description,
          })),
          related_apis: codeContext.apis.map(api => ({
            path: api.path,
            method: api.method,
            description: api.description,
          })),
        },
        analysis: analysis_mode === "full" && analysisResult ? {
          suggestions: analysisResult.suggestions,
          summary: analysisResult.summary,
        } : undefined,
        url_content: urlContent.length > 0 ? urlContent : undefined,
        statistics: {
          total_files_found: codeContext.files.length,
          files_returned: limitedFiles.length,
          total_symbols: codeContext.symbols.length,
          total_apis: codeContext.apis.length,
          urls_processed: urlContent.length,
        },
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting GitHub issue: ${error.message}`
          }
        ]
      };
    }
  });
};
