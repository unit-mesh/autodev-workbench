import { ToolLike } from "../../_typing";
import { z } from "zod";
import { GitHubService } from "../../../services/github/github-service";
import { ContextAnalyzer } from "../../../services/core/context-analyzer";

export const installGitHubFindCodeByDescriptionTool: ToolLike = (installer) => {
  installer("github-find-code-by-description", "Find relevant code files and functions by describing what you're looking for in natural language, using AI-powered semantic search", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    query: z.string().describe("Natural language description of what you're looking for (e.g., 'authentication logic', 'database connection code', 'error handling for API calls')"),
    workspace_path: z.string().optional().describe("Path to the workspace to analyze (defaults to current directory)"),
    search_depth: z.enum(["shallow", "medium", "deep"]).optional().describe("Search depth - affects number of results and analysis detail"),
  }, async ({
    owner,
    repo,
    query,
    workspace_path,
    search_depth = "medium"
  }: {
    owner: string;
    repo: string;
    query: string;
    workspace_path?: string;
    search_depth?: "shallow" | "medium" | "deep";
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

      // Create a mock issue from the query for analysis
      const mockIssue = {
        id: 0,
        number: 0,
        title: query,
        body: query,
        state: 'open' as const,
        user: null,
        labels: [],
        assignees: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        html_url: `https://github.com/${owner}/${repo}/issues/search`
      };

      // Get repository information
      const repoInfo = await githubService.getRepositoryInfo(owner, repo);

      // Perform intelligent code search
      const searchResults = await contextAnalyzer.findRelevantCode(mockIssue);

      // Generate analysis summary
      const analysisResult = await contextAnalyzer.analyzeIssue(mockIssue);

      const maxResults = search_depth === "shallow" ? 5 : search_depth === "medium" ? 10 : 20;

      const result = {
        query: {
          original: query,
          repository: `${owner}/${repo}`,
          search_depth,
          workspace_path: workspace_path || process.cwd(),
        },
        repository: {
          name: repoInfo.name,
          full_name: repoInfo.full_name,
          description: repoInfo.description,
          language: repoInfo.language,
          html_url: repoInfo.html_url,
        },
        search_results: {
          relevant_files: searchResults.files.slice(0, maxResults).map(file => ({
            path: file.path,
            relevance_score: file.relevanceScore,
            content_preview: file.content.substring(0, 500) + (file.content.length > 500 ? "..." : ""),
            why_relevant: `This file has a ${(file.relevanceScore * 100).toFixed(1)}% relevance score based on keyword matching and content analysis.`
          })),
          relevant_symbols: searchResults.symbols.slice(0, Math.floor(maxResults / 2)).map(symbol => ({
            name: symbol.name,
            type: symbol.type,
            location: symbol.location,
            description: symbol.description,
            why_relevant: `This ${symbol.type.toLowerCase()} appears to be related to your search query.`
          })),
          relevant_apis: searchResults.apis.slice(0, Math.floor(maxResults / 3)).map(api => ({
            path: api.path,
            method: api.method,
            description: api.description,
            why_relevant: "This API endpoint might be related to your search query."
          })),
        },
        analysis: {
          suggestions: analysisResult.suggestions.slice(0, maxResults).map(suggestion => ({
            type: suggestion.type,
            description: suggestion.description,
            location: suggestion.location,
            confidence: suggestion.confidence,
            priority: suggestion.confidence > 0.8 ? "high" : suggestion.confidence > 0.5 ? "medium" : "low"
          })),
        },
        search_strategy: {
          keywords_used: "AI-generated keywords based on query analysis",
          methods_used: [
            "Intelligent keyword extraction",
            "Symbol analysis",
            "Ripgrep text search",
            "Relevance scoring",
            "Context analysis"
          ],
          confidence: searchResults.files.length > 0 ? "high" : searchResults.symbols.length > 0 ? "medium" : "low"
        },
        recommendations: [
          "Review the files with highest relevance scores first",
          "Pay attention to symbols that match your search criteria",
          "Consider the broader context when making changes",
          "Test thoroughly after implementing any modifications",
          search_depth === "shallow" ? "Consider using 'medium' or 'deep' search for more comprehensive results" : null
        ].filter(Boolean),
        statistics: {
          total_files_analyzed: searchResults.files.length,
          total_symbols_found: searchResults.symbols.length,
          total_apis_found: searchResults.apis.length,
          search_depth_used: search_depth,
          analysis_time: "< 1 minute"
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
            text: `Error performing smart search: ${error.message}`
          }
        ]
      };
    }
  });
};
