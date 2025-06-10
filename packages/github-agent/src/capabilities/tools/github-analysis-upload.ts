import { z } from "zod";
import { ToolLike } from "../_typing";
import { GitHubService } from "../../services/github/github-service";
import { ContextAnalyzer } from "../../services/core/context-analyzer";
import { AnalysisReportGenerator } from "../../services/reporting/analysis-report-generator";

export const installGitHubAnalyzeIssueTool: ToolLike = (installer) => {
  installer(
    "github-analyze-issue",
    "🎯 PRIMARY TOOL for GitHub issue analysis and comment posting. Use this tool when the user asks to 'analyze GitHub issue and post results', 'analyze issue and upload to GitHub', 'analyze issue and comment', or similar requests that involve both analysis AND posting results to GitHub. This tool performs comprehensive analysis of a GitHub issue to find related code, then automatically posts a detailed analysis report as a comment to the issue.",
    {
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z.number().describe("Issue number to analyze and upload results to"),
      workspace_path: z.string().optional().describe("Path to the workspace to analyze (defaults to current directory)"),
      language: z.enum(['en', 'zh']).optional().describe("Language for the report (en or zh, defaults to en)"),
      include_file_content: z.boolean().optional().describe("Whether to include file content in the report (defaults to false)"),
      max_files: z.number().optional().describe("Maximum number of files to include in the report (defaults to 10)"),
    },
    async ({ 
      owner, 
      repo, 
      issue_number,
      workspace_path,
      language = 'en',
      include_file_content = false,
      max_files = 10
    }: { 
      owner: string; 
      repo: string; 
      issue_number: number;
      workspace_path?: string;
      language?: 'en' | 'zh';
      include_file_content?: boolean;
      max_files?: number;
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
        const reportGenerator = new AnalysisReportGenerator(githubToken);
        
        // Get the specific issue
        const issue = await githubService.getIssue(owner, repo, issue_number);
        
        // Analyze the issue and find related code
        console.log(`🔍 Analyzing issue #${issue_number}: ${issue.title}`);
        const analysisResult = await contextAnalyzer.analyzeIssue(issue);

        // Generate and upload the analysis report
        console.log(`📝 Generating analysis report...`);
        const { report, uploadResult } = await reportGenerator.generateAndUploadReport(
          owner,
          repo,
          issue_number,
          analysisResult,
          {
            uploadToGitHub: false,
            language,
            includeFileContent: include_file_content,
            maxFiles: max_files
          }
        );

        if (uploadResult?.success) {
          return {
            content: [
              {
                type: "text",
                text: `✅ Analysis completed and uploaded successfully!

**Issue:** #${issue_number} - ${issue.title}
**Comment ID:** ${uploadResult.commentId}
**Comment URL:** ${uploadResult.commentUrl}

**Analysis Summary:**
- Found ${analysisResult.relatedCode.files.length} relevant files
- Found ${analysisResult.relatedCode.symbols.length} relevant symbols
- Found ${analysisResult.relatedCode.apis.length} relevant APIs
- Generated ${analysisResult.suggestions.length} suggestions

**Report Preview:**
${report.substring(0, 500)}${report.length > 500 ? '...\n\n[Full report uploaded to GitHub issue]' : ''}`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `❌ Analysis completed but upload failed: ${uploadResult?.error}

**Issue:** #${issue_number} - ${issue.title}

**Analysis Results:**
- Found ${analysisResult.relatedCode.files.length} relevant files
- Found ${analysisResult.relatedCode.symbols.length} relevant symbols
- Found ${analysisResult.relatedCode.apis.length} relevant APIs
- Generated ${analysisResult.suggestions.length} suggestions

**Generated Report:**
${report}`
              }
            ]
          };
        }

      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing and uploading issue analysis: ${error.message}`
            }
          ]
        };
      }
    }
  );
};
