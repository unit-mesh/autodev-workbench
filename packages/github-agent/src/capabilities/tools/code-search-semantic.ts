import { ToolLike } from "../_typing";
import { z } from "zod";
import { ContextAnalyzer } from "../../services/core/context-analyzer";

export const installCodebaseSearchTool: ToolLike = (installer) => {
  installer("codebase-search", "Semantic search across the codebase using AI-powered analysis", {
    query: z.string().describe("Natural language description of what you're looking for"),
    workspace_path: z.string().optional().describe("Path to the workspace to analyze (defaults to current directory)"),
    search_depth: z.enum(["shallow", "medium", "deep"]).optional().describe("Search depth - affects analysis detail"),
    include_symbols: z.boolean().optional().describe("Include symbol analysis in results (default: true)"),
    include_apis: z.boolean().optional().describe("Include API endpoint analysis (default: true)"),
    file_types: z.array(z.string()).optional().describe("Filter by file extensions (e.g., ['js', 'ts', 'py'])"),
    max_results: z.number().optional().describe("Maximum number of results to return (default: 20)")
  }, async ({ 
    query,
    workspace_path,
    search_depth = "medium",
    include_symbols = true,
    include_apis = true,
    file_types,
    max_results = 20
  }: { 
    query: string;
    workspace_path?: string;
    search_depth?: "shallow" | "medium" | "deep";
    include_symbols?: boolean;
    include_apis?: boolean;
    file_types?: string[];
    max_results?: number;
  }) => {
    try {
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
        html_url: 'semantic-search'
      };

      // Perform intelligent code search
      const searchResults = await contextAnalyzer.findRelevantCode(mockIssue);
      
      // Generate analysis
      const analysisResult = await contextAnalyzer.analyzeIssue(mockIssue);

      // Filter by file types if specified
      let filteredFiles = searchResults.files;
      if (file_types && file_types.length > 0) {
        filteredFiles = searchResults.files.filter(file => {
          const ext = file.path.split('.').pop()?.toLowerCase();
          return ext && file_types.some(type => type.toLowerCase().replace('.', '') === ext);
        });
      }

      // Apply search depth limits
      const maxFiles = search_depth === "shallow" ? 5 : search_depth === "medium" ? 15 : 30;
      const maxSymbols = search_depth === "shallow" ? 10 : search_depth === "medium" ? 25 : 50;
      const maxApis = search_depth === "shallow" ? 5 : search_depth === "medium" ? 10 : 20;

      const result = {
        query: {
          original: query,
          workspace_path: workspace_path || process.cwd(),
          search_depth,
          include_symbols,
          include_apis,
          file_types: file_types || null,
          max_results
        },
        search_results: {
          relevant_files: filteredFiles.slice(0, Math.min(maxFiles, max_results)).map(file => ({
            path: file.path,
            relevance_score: file.relevanceScore,
            content_preview: file.content.substring(0, 300) + (file.content.length > 300 ? "..." : ""),
            line_count: file.content.split('\n').length,
            size_bytes: Buffer.byteLength(file.content, 'utf8'),
            why_relevant: `Relevance score: ${(file.relevanceScore * 100).toFixed(1)}% based on semantic analysis and keyword matching.`,
            language: file.path.split('.').pop()?.toLowerCase() || 'unknown'
          })),
          relevant_symbols: include_symbols ? searchResults.symbols.slice(0, Math.min(maxSymbols, Math.floor(max_results / 2))).map(symbol => ({
            name: symbol.name,
            type: symbol.type,
            location: symbol.location,
            description: symbol.description,
            file_path: symbol.location.split(':')[0],
            line_number: parseInt(symbol.location.split(':')[1]) || null,
            why_relevant: `This ${symbol.type.toLowerCase()} appears to be semantically related to your search query.`
          })) : [],
          relevant_apis: include_apis ? searchResults.apis.slice(0, Math.min(maxApis, Math.floor(max_results / 3))).map(api => ({
            path: api.path,
            method: api.method,
            description: api.description,
            file_location: api.path,
            why_relevant: "This API endpoint might be related to your search query based on semantic analysis."
          })) : []
        },
        analysis: {
          summary: analysisResult.summary,
          key_insights: analysisResult.suggestions.slice(0, 5).map(suggestion => ({
            type: suggestion.type,
            description: suggestion.description,
            location: suggestion.location,
            confidence: suggestion.confidence,
            priority: suggestion.confidence > 0.8 ? "high" : suggestion.confidence > 0.5 ? "medium" : "low"
          })),
          patterns_found: [
            "Code structure analysis",
            "Semantic relationship mapping",
            "Symbol dependency tracking",
            include_apis ? "API endpoint discovery" : null
          ].filter(Boolean)
        },
        search_strategy: {
          method: "AI-powered semantic analysis",
          techniques_used: [
            "Natural language processing",
            "Code structure analysis",
            "Symbol relationship mapping",
            "Relevance scoring",
            "Context-aware filtering"
          ],
          confidence: filteredFiles.length > 0 ? "high" : searchResults.symbols.length > 0 ? "medium" : "low"
        },
        statistics: {
          total_files_analyzed: searchResults.files.length,
          files_returned: Math.min(filteredFiles.length, maxFiles, max_results),
          total_symbols_found: searchResults.symbols.length,
          symbols_returned: include_symbols ? Math.min(searchResults.symbols.length, maxSymbols, Math.floor(max_results / 2)) : 0,
          total_apis_found: searchResults.apis.length,
          apis_returned: include_apis ? Math.min(searchResults.apis.length, maxApis, Math.floor(max_results / 3)) : 0,
          search_depth_used: search_depth,
          file_types_filter: file_types || "none"
        },
        recommendations: [
          filteredFiles.length === 0 ? "No files found matching your query. Try broadening your search terms." : null,
          search_depth === "shallow" && filteredFiles.length >= 5 ? "Consider using 'medium' or 'deep' search for more comprehensive results" : null,
          file_types && filteredFiles.length < searchResults.files.length ? "File type filter reduced results. Consider removing filter for broader search." : null,
          "Review files with highest relevance scores first",
          "Pay attention to symbols and APIs that match your search criteria"
        ].filter(Boolean)
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
            text: `Error performing semantic codebase search: ${error.message}`
          }
        ]
      };
    }
  });
};
