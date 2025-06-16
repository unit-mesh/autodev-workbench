import { z } from "zod";
import { ToolLike } from "../../_typing";
import { GitHubService } from "../../../services/github/github-service";
import { ContextAnalyzer } from "../../../services/core/context-analyzer";
import { AnalysisReportGenerator } from "../../../services/reporting/analysis-report-generator";
import { ProjectContextAnalyzer } from "../analyzers/project-context-analyzer";
import { LLMService } from "../../../services/llm";
import { generateText, CoreMessage } from "ai";
import { configureLLMProvider } from "../../../services/llm";
import { LLMLogger } from "../../../services/llm/llm-logger";
import { IssueAnalysisResult, UrlCacheResult } from "../../../types";

export const installGitHubAnalyzeIssueTool: ToolLike = (installer) => {
	installer("github-analyze-issue", "🎯 PRIMARY TOOL for GitHub issue analysis and comment posting. Use this tool when the user asks to 'analyze GitHub issue and post results', 'analyze issue and upload to GitHub', 'analyze issue and comment', or similar requests that involve both analysis AND posting results to GitHub. This tool performs comprehensive analysis of a GitHub issue to find related code, then automatically posts a detailed analysis report as a comment to the issue. It also includes basic project context analysis features to provide a complete understanding of the codebase.",
		{
			owner: z.string().describe("Repository owner (username or organization)"),
			repo: z.string().describe("Repository name"),
			issue_number: z.number().describe("Issue number to analyze and upload results to"),
			language: z.enum(['en', 'zh']).optional().describe("Language for the report (en or zh, defaults to en)"),
			include_file_content: z.boolean().optional().describe("Whether to include file content in the report (defaults to false)"),
			max_files: z.number().optional().describe("Maximum number of files to include in the report (defaults to 10)"),
			analysis_scope: z.enum(["basic", "full"]).optional().describe("Project analysis scope: basic (essential info only) or full (detailed analysis)")
		},
		async ({
           owner,
           repo,
           issue_number,
           language = 'en',
           include_file_content = false,
           max_files = 10,
           analysis_scope = "basic"
         }: {
			owner: string;
			repo: string;
			issue_number: number;
			workspace_path?: string;
			language?: 'en' | 'zh';
			include_file_content?: boolean;
			max_files?: number;
			analysis_scope?: "basic" | "full";
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

				const workspacePath = process.env.WORKSPACE_PATH || process.cwd();

				// Get project context analysis
				console.log(`🔍 Analyzing project context...`);
				const projectAnalyzer = new ProjectContextAnalyzer();
				const projectContext = await projectAnalyzer.analyze(workspacePath, analysis_scope);

				const githubService = new GitHubService(githubToken);
				const contextAnalyzer = new ContextAnalyzer(workspacePath);
				const reportGenerator = new AnalysisReportGenerator(githubToken);

				// Get the specific issue
				const issue = await githubService.getIssue(owner, repo, issue_number);

				// Analyze the issue and find related code
				console.log(`🔍 Analyzing issue #${issue_number}: ${issue.title}`);
				const analysisResult = await contextAnalyzer.analyzeIssue(issue);

				// Add project context to analysis result
				if (analysis_scope === "full") {
					analysisResult.projectContext = projectContext;

					// Add URL content summary if available
					if (analysisResult.issue.urlContent && analysisResult.issue.urlContent.length > 0) {
						console.log(`🔄 Generating summary for URL content in issue #${issue_number}...`);
						const urlContentSummary = await generateUrlContentSummary(analysisResult);
						analysisResult.urlContentSummary = urlContentSummary;
					}
				}

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

				const llmService = new LLMService()
				const projectContextSummary = llmService.generateAnalysisReport(issue, analysisResult);

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
  ${projectContextSummary}

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
								text: `Analysis completed:

**Issue:** #${issue_number} - ${issue.title}
**Issue Body:**: #${issue.body}

**Search Results**

- Found relevant files: ${analysisResult.relatedCode.files}
- Found relevant symbols: ${analysisResult.relatedCode.symbols}

**Related Web Resources Summary:**
${analysisResult.urlContentSummary}

**Analysis Results:**
${JSON.stringify(analysisResult)}
`
							}
						]
					};
				}
			} catch (error: any) {
				console.error('Error in GitHub issue analysis:', error);
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

/**
 * Generate a summary of URL content from a GitHub result using LLM
 */
async function generateUrlContentSummary(result: IssueAnalysisResult): Promise<string> {
	try {
		const llmConfig = configureLLMProvider();
		const logger = new LLMLogger();

		if (!llmConfig) {
			console.warn('⚠️ No LLM provider available for generating URL content summary');
			return "URL content summary is not available due to missing LLM provider.";
		}

		const urlContents = result.issue.urlContent;
		if (!urlContents || urlContents.length === 0) {
			return "No URL content available to summarize.";
		}

		// Filter successful URL content entries
		const validUrlContents = urlContents.filter(item => item.status === 'success' && item.content);

		if (validUrlContents.length === 0) {
			return "No valid URL content available to summarize.";
		}

		// Process each URL individually
		const summaries = await Promise.all(validUrlContents.map(async urlItem => {
			try {
				// Truncate if too long
				const maxContentLength = 10000;
				const content = urlItem.content || '';
				const truncatedContent = content.length > maxContentLength
					? content.substring(0, maxContentLength) + "... [content truncated]"
					: content;

				// Create prompt for individual URL content analysis
				const systemPrompt = `You are an expert content analyst. You are analyzing a specific URL content referenced in a GitHub issue.

Issue Title: ${result.issue.title}
Issue Description: ${result.issue.body || 'No description provided'}
URL: ${urlItem.url}
${urlItem.title ? `URL Title: ${urlItem.title}` : ''}

Based on the URL content provided, summarize:
1. The key information in this URL relevant to the GitHub issue
2. How this content relates to the issue being analyzed
3. Any technical details, code examples, or specifications that are important for understanding the issue
4. Actionable insights derived from this URL content

Be concise, factual, and focus on information that directly helps address the GitHub issue.`;

				const messages: CoreMessage[] = [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: truncatedContent }
				];

				// Generate summary for this URL
				const { text } = await generateText({
					model: llmConfig.openai(llmConfig.fullModel),
					messages,
					temperature: 0.3,
					maxTokens: 500
				});

				logger.log("Individual URL Content Summary", {
					request: {
						url: urlItem.url,
						contentLength: content.length
					},
					response: text,
				});

				// Return the summary with the URL information
				return `## [${urlItem.title || urlItem.url}](${urlItem.url})\n\n${text}`;
			} catch (error: any) {
				console.error(`❌ Error summarizing URL ${urlItem.url}:`, error.message);
				return `## [${urlItem.url}](${urlItem.url})\n\nFailed to generate summary: ${error.message}`;
			}
		}));

		// Combine all URL summaries
		return summaries.join('\n\n---\n\n');
	} catch (error: any) {
		console.error("❌ Error generating URL content summaries:", error.message);
		return `Failed to generate URL content summaries: ${error.message}`;
	}
}
