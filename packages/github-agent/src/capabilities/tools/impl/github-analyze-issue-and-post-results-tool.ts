import { z } from "zod";
import { BaseMCPTool, MCPToolName, MCPToolCategory, MCPToolResult } from "../base/tool-registry";
import { GitHubService } from "../../../services/github/github-service";
import { AnalysisService } from "../../../services/analysis/AnalysisService";
import { fetchUrlsFromIssue } from "../web-fetch-content";

/**
 * Parameters for GitHub Analyze Issue And Post Results tool
 */
export interface GitHubAnalyzeIssueAndPostResultsParams {
  owner: string;
  repo: string;
  issue_number: number;
  workspace_path?: string;
  analysis_depth?: "shallow" | "medium" | "deep";
  include_file_content?: boolean;
  max_files?: number;
  post_comment?: boolean;
}

/**
 * GitHub Analyze Issue And Post Results Tool
 * Perform comprehensive analysis of a GitHub issue to find related code, then automatically post a detailed analysis report as a comment
 */
export class GitHubAnalyzeIssueAndPostResultsTool extends BaseMCPTool<GitHubAnalyzeIssueAndPostResultsParams> {
  protected schema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    issue_number: z.number().describe("Issue number to analyze"),
    workspace_path: z.string().optional().describe("Path to the workspace to analyze (defaults to current directory)"),
    analysis_depth: z.enum(["shallow", "medium", "deep"]).optional().describe("Analysis depth: shallow (basic), medium (detailed), deep (comprehensive)"),
    include_file_content: z.boolean().optional().describe("Whether to include file content in the analysis"),
    max_files: z.number().min(1).max(100).optional().describe("Maximum number of files to analyze (1-100)"),
    post_comment: z.boolean().optional().describe("Whether to post the analysis results as a comment on the issue"),
  });

  constructor() {
    super({
      name: MCPToolName.GITHUB_ANALYZE_ISSUE_AND_POST_RESULTS,
      category: MCPToolCategory.GITHUB_ANALYSIS,
      description: "Perform comprehensive analysis of a GitHub issue to find related code, then automatically post a detailed analysis report as a comment",
      aliases: ["github_upload_analysis", "github-analysis-upload"] // Backward compatibility
    });
  }

  async execute(params: GitHubAnalyzeIssueAndPostResultsParams): Promise<MCPToolResult> {
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
      const analysisService = new AnalysisService();
      const workspacePath = params.workspace_path || process.cwd();

      // Get the issue details
      const issue = await githubService.getIssue(params.owner, params.repo, params.issue_number);
      
      if (!issue) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Issue #${params.issue_number} not found in ${params.owner}/${params.repo}`
            }
          ]
        };
      }

      // Perform comprehensive analysis
      const analysisResult = await analysisService.analyzeIssue({
        issue,
        workspacePath,
        includeFileContent: params.include_file_content || false,
        maxFiles: params.max_files || 20,
        analysisDepth: params.analysis_depth || "medium"
      });

      // Fetch URLs from issue if present
      let urlContent: any[] = [];
      if (issue.body) {
        try {
          urlContent = await fetchUrlsFromIssue(issue.body);
        } catch (error) {
          console.warn('Failed to fetch URLs from issue:', error);
        }
      }

      // Generate analysis report
      const report = this.generateAnalysisReport(issue, analysisResult, urlContent, {
        workspacePath,
        analysisDepth: params.analysis_depth || "medium",
        includeFileContent: params.include_file_content || false,
      });

      let commentResult = null;
      
      // Post comment if requested
      if (params.post_comment !== false) { // Default to true
        try {
          const comment = await githubService.addIssueComment(
            params.owner, 
            params.repo, 
            params.issue_number, 
            report
          );
          
          commentResult = {
            id: comment.id,
            html_url: comment.html_url,
            created_at: comment.created_at,
          };
        } catch (error) {
          console.error('Failed to post comment:', error);
        }
      }

      const result = {
        success: true,
        issue: {
          number: issue.number,
          title: issue.title,
          html_url: issue.html_url,
        },
        analysis: {
          relevant_files_count: analysisResult.relevantFiles.length,
          symbols_found_count: analysisResult.symbolsFound.length,
          confidence_score: analysisResult.confidenceScore,
          analysis_depth: params.analysis_depth || "medium",
        },
        report_length: report.length,
        comment_posted: commentResult !== null,
        comment: commentResult,
        full_report: report,
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
            text: `Error analyzing issue and posting results: ${error.message}`
          }
        ]
      };
    }
  }

  private generateAnalysisReport(
    issue: any, 
    analysisResult: any, 
    urlContent: any[], 
    options: any
  ): string {
    const timestamp = new Date().toISOString();
    
    let report = `# 🔍 Issue Analysis Report

**Issue**: #${issue.number} - ${issue.title}
**Repository**: ${issue.html_url}
**Analysis Date**: ${timestamp}
**Analysis Depth**: ${options.analysisDepth}

---

## 📋 Current Issues Identified

`;

    // Add relevant files section
    if (analysisResult.relevantFiles.length > 0) {
      report += `### 🗂️ Relevant Files (${analysisResult.relevantFiles.length} found)

`;
      analysisResult.relevantFiles.slice(0, 10).forEach((file: any, index: number) => {
        report += `${index + 1}. **${file.path}** (Score: ${file.relevanceScore.toFixed(2)})
   - ${file.reason}
`;
      });
      
      if (analysisResult.relevantFiles.length > 10) {
        report += `   - ... and ${analysisResult.relevantFiles.length - 10} more files\n`;
      }
      report += '\n';
    }

    // Add symbols section
    if (analysisResult.symbolsFound.length > 0) {
      report += `### 🔧 Related Symbols (${analysisResult.symbolsFound.length} found)

`;
      analysisResult.symbolsFound.slice(0, 15).forEach((symbol: any) => {
        report += `- **${symbol.name}** (${symbol.type}) in \`${symbol.file}\`
`;
      });
      report += '\n';
    }

    // Add URL content if available
    if (urlContent.length > 0) {
      report += `### 🌐 Referenced URLs (${urlContent.length} processed)

`;
      urlContent.forEach((url: any) => {
        report += `- [${url.title || url.url}](${url.url})
`;
        if (url.summary) {
          report += `  - ${url.summary}\n`;
        }
      });
      report += '\n';
    }

    // Add detailed plan
    report += `## 📝 Detailed Plan

${analysisResult.summary || 'Based on the analysis, this issue appears to be related to the identified files and symbols above.'}

### Confidence Score: ${(analysisResult.confidenceScore * 100).toFixed(1)}%

---

*Powered by AutoDev Backend Agent*
`;

    return report;
  }
}

/**
 * Factory function for backward compatibility
 */
export function createGitHubAnalyzeIssueAndPostResultsTool(): GitHubAnalyzeIssueAndPostResultsTool {
  return new GitHubAnalyzeIssueAndPostResultsTool();
}

/**
 * Legacy installer function for backward compatibility
 */
export function installGitHubAnalyzeIssueAndPostResultsTool(installer: (name: string, description: string, schema: Record<string, any>, handler: Function) => void): void {
  const tool = createGitHubAnalyzeIssueAndPostResultsTool();
  tool.install(installer);
}
