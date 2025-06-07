import { ToolLike } from "../_typing";
import { z } from "zod";
import { GitHubService } from "../../services/github-service";
import { ContextAnalyzer } from "../../services/context-analyzer";

export const installGitHubAnalyzeIssueTool: ToolLike = (installer) => {
  installer("github_analyze_issue", "Analyze a specific GitHub issue and find related code in the current workspace", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    issue_number: z.number().describe("Issue number to analyze"),
    workspace_path: z.string().optional().describe("Path to the workspace to analyze (defaults to current directory)"),
  }, async ({ 
    owner, 
    repo, 
    issue_number,
    workspace_path
  }: { 
    owner: string; 
    repo: string; 
    issue_number: number;
    workspace_path?: string;
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
      
      // Analyze the issue and find related code
      const analysisResult = await contextAnalyzer.analyzeIssue(issue);

      const result = {
        issue: {
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          user: issue.user?.login,
          labels: issue.labels.map(label => label.name),
          assignees: issue.assignees.map(assignee => assignee.login),
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          html_url: issue.html_url,
        },
        analysis: {
          summary: analysisResult.summary,
          related_files: analysisResult.relatedCode.files.map(file => ({
            path: file.path,
            relevance_score: file.relevanceScore,
            content_preview: file.content.substring(0, 300) + (file.content.length > 300 ? "..." : ""),
          })),
          related_symbols: analysisResult.relatedCode.symbols.map(symbol => ({
            name: symbol.name,
            type: symbol.type,
            location: symbol.location,
            description: symbol.description,
          })),
          related_apis: analysisResult.relatedCode.apis.map(api => ({
            path: api.path,
            method: api.method,
            description: api.description,
          })),
          suggestions: analysisResult.suggestions.map(suggestion => ({
            type: suggestion.type,
            description: suggestion.description,
            location: suggestion.location,
            confidence: suggestion.confidence,
          })),
        },
        workspace_info: {
          analyzed_path: workspace_path || process.cwd(),
          total_related_files: analysisResult.relatedCode.files.length,
          total_related_symbols: analysisResult.relatedCode.symbols.length,
          total_related_apis: analysisResult.relatedCode.apis.length,
        }
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
            text: `Error analyzing GitHub issue: ${error.message}`
          }
        ]
      };
    }
  });
};
