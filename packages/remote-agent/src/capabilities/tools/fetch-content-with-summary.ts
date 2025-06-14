import { ToolLike } from "../_typing";
import { z } from "zod";
import { fetchHtmlContent, transformGitHubCodeUrl } from "./web-fetch-content";
import { extractTitle, urlToMarkdown } from "../../utils/markdown-utils";
import { CoreMessage, generateText } from "ai";
import { LLMProviderConfig, configureLLMProvider } from "../../services/llm";
import { LLMLogger } from "../../services/llm/llm-logger";

/**
 * Fetches content from a URL and generates a summary using LLM
 * Especially useful for GitHub/Gist code content
 */
export const installFetchContentWithSummaryTool: ToolLike = (installer) => {
	installer("browse-webpage-with-summary", "Fetch content from a URL and generate an intelligent summary using LLM, especially useful for GitHub/Gist code", {
		url: z.string().describe("URL to fetch content from"),
		timeout: z.number().optional().default(10000).describe("Request timeout in milliseconds"),
		summarize_type: z.enum(["code", "article", "auto"]).optional().default("auto").describe("Type of content to summarize: 'code' for GitHub/Gist code, 'article' for general web content, or 'auto' to detect"),
	}, async ({
		          url,
		          timeout = 10000,
		          summarize_type = "auto"
	          }: {
		url: string;
		timeout?: number;
		summarize_type?: "code" | "article" | "auto";
		llm_config?: LLMProviderConfig;
	}) => {
		try {
			// Validate URL
			let parsedUrl: URL;
			try {
				parsedUrl = new URL(url);
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error: Invalid URL format: ${url}`
						}
					]
				};
			}

			// Only allow HTTP and HTTPS protocols
			if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
				return {
					content: [
						{
							type: "text",
							text: `Error: Only HTTP and HTTPS protocols are supported. Got: ${parsedUrl.protocol}`
						}
					]
				};
			}

			console.log(`🌐 Fetching content from: ${url}`);

			// Auto-detect if it's GitHub/Gist code
			const isGitHubCode = url.includes('github.com') &&
				(url.includes('/blob/') || url.includes('gist.github.com'));

			// If it's GitHub code or explicitly requested code summary, transform the URL
			if (isGitHubCode || summarize_type === "code") {
				url = transformGitHubCodeUrl(url);
			}

			// Fetch the content
			const htmlContent = await fetchHtmlContent(url, timeout);
			const markdownContent = await urlToMarkdown(htmlContent);
			const title = extractTitle(htmlContent) || url;

			// Determine the content type for summarization
			const contentType = summarize_type === "auto"
				? (isGitHubCode ? "code" : "article")
				: summarize_type;

			// Generate summary using LLM
			const llmConfig = configureLLMProvider();
			const summary = await generateContentSummary(markdownContent, title, contentType, llmConfig);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							url: url,
							title: title,
							summary: summary,
							fetched_at: new Date().toISOString()
						}, null, 2)
					}
				]
			};
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `Error fetching or summarizing URL content: ${error.message}`
					}
				]
			};
		}
	});
};

/**
 * Generate a summary of the content using LLM
 */
async function generateContentSummary(
	content: string,
	title: string,
	contentType: "code" | "article",
	llmConfig?: LLMProviderConfig
): Promise<string> {
	// Truncate content if too long
	const maxContentLength = 10000;
	const truncatedContent = content.length > maxContentLength
		? content.substring(0, maxContentLength) + "... [content truncated]"
		: content;

	// Create prompt based on content type
	let systemPrompt = "";
	if (contentType === "code") {
		systemPrompt = `You are an expert code analyst. Analyze the following code snippet from "${title}" and provide a comprehensive summary that includes:
1. The main purpose and functionality of the code
2. Key components, classes, or functions
3. Notable design patterns or architecture choices
4. Dependencies and technologies used
5. Any potential issues or optimization opportunities

Your summary should be concise yet thorough, focusing on the most important aspects of the code.`;
	} else {
		systemPrompt = `You are an expert content analyst. Summarize the following article titled "${title}" with:
1. The main topic and key points
2. Important facts or data presented
3. The author's perspective or conclusions
4. Relevance and significance of the content

Your summary should be concise yet thorough, capturing the essence of the article.`;
	}

	const messages: CoreMessage[] = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: truncatedContent }
	];

	const logger = new LLMLogger();
	try {
		const { text } = await generateText({
			model: llmConfig.openai(llmConfig.fullModel),
			messages,
			temperature: 0.3,
			maxTokens: 1000
		});

		logger.log("Summary WebContent", {
			request: messages,
			response: text,
		});
		return text;
	} catch (error: any) {
		console.error("Error generating content summary:", error);
		return `Failed to generate summary: ${error.message}`;
	}
}
