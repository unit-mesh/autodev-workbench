import { ToolLike } from "../_typing";
import { z } from "zod";
import * as https from "https";
import * as http from "http";
import { URL } from "url";
import { extractTitle, isHtml, urlToMarkdown } from "../../utils/markdown-utils";

export const installExtractWebpageAsMarkdownTool: ToolLike = (installer) => {
	installer("browse-webpage", "Extract and convert web page content by url and clean markdown format, removing navigation and ads for better readability", {
		url: z.string().describe("URL to fetch content from"),
		timeout: z.number().optional().default(10000).describe("Request timeout in milliseconds"),
		extract_urls: z.boolean().optional().default(false).describe("Whether to extract URLs from GitHub issue content"),
		issue_content: z.string().optional().describe("GitHub issue content to extract URLs from (when extract_urls is true)"),
	}, async ({
        url,
        timeout = 10000,
        extract_urls = false,
        issue_content
      }: {
		url: string;
		timeout?: number;
		extract_urls?: boolean;
		issue_content?: string;
	}) => {
		try {
			// If extract_urls is true, extract URLs from issue content
			if (extract_urls && issue_content) {
				const extractedUrls = extractUrlsFromText(issue_content);
				if (extractedUrls.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									message: "No URLs found in the provided issue content",
									extracted_urls: [],
									processed_at: new Date().toISOString()
								}, null, 2)
							}
						]
					};
				}

				// Process all extracted URLs
				const results = [];
				for (const extractedUrl of extractedUrls) {
					try {
						const htmlContent = await fetchHtmlContent(extractedUrl, timeout);
						const markdownContent = await urlToMarkdown(htmlContent);
						results.push({
							url: extractedUrl,
							title: extractTitle(htmlContent),
							content: markdownContent,
							content_length: markdownContent.length,
							status: "success"
						});
					} catch (error: any) {
						results.push({
							url: extractedUrl,
							error: error.message,
							status: "error"
						});
					}
				}

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								extracted_urls: extractedUrls,
								results: results,
								processed_at: new Date().toISOString()
							}, null, 2)
						}
					]
				};
			}

			// Single URL processing
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

			const htmlContent = await fetchHtmlContent(url, timeout);
			const markdownContent = await urlToMarkdown(htmlContent);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							url: url,
							title: extractTitle(htmlContent),
							content: markdownContent,
							content_length: markdownContent.length,
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
						text: `Error fetching URL content: ${error.message}`
					}
				]
			};
		}
	});
};

export function extractUrlsFromText(text: string): string[] {
	// Use simple regex for now to avoid async issues
	const urlRegex = /https?:\/\/[^\s)]+/g;
	const matches = text.match(urlRegex) || [];

	// Remove duplicates and filter out common non-content URLs
	const uniqueUrls = [...new Set(matches)];
	const filteredUrls = uniqueUrls.filter(url => {
		const lowerUrl = url.toLowerCase();
		// Filter out common non-content URLs
		return !lowerUrl.includes('github.com/') ||
			(!lowerUrl.includes('/issues/') &&
				!lowerUrl.includes('/pull/') &&
				!lowerUrl.includes('/commit/'));
	});

	return filteredUrls;
}

export function fetchHtmlContent(url: string, timeout: number): Promise<string> {
	// Transform GitHub code links to raw GitHub URLs
	url = transformGitHubCodeUrl(url);

	return new Promise((resolve, reject) => {
		const parsedUrl = new URL(url);
		const client = parsedUrl.protocol === 'https:' ? https : http;
		const options = {
			hostname: parsedUrl.hostname,
			port: parsedUrl.port,
			path: parsedUrl.pathname + parsedUrl.search,
			method: 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				'Accept-Encoding': 'identity',
				'Connection': 'keep-alive',
				'Upgrade-Insecure-Requests': '1',
			},
			timeout: timeout
		};

		const req = client.request(options, (res) => {
			let data = '';

			// Handle redirects
			if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
				const redirectUrl = new URL(res.headers.location, url).toString();
				fetchHtmlContent(redirectUrl, timeout).then(resolve).catch(reject);
				return;
			}

			if (res.statusCode && res.statusCode >= 400) {
				reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
				return;
			}

			res.setEncoding('utf8');
			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				resolve(data);
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		req.on('timeout', () => {
			req.destroy();
			reject(new Error(`Request timeout after ${timeout}ms`));
		});

		req.end();
	});
}

/**
 * Transform GitHub code URLs to raw GitHub URLs for better content fetching
 * Examples:
 * - https://github.com/zed-industries/zed/blob/main/crates/copilot/src/copilot_chat.rs
 *   → https://raw.githubusercontent.com/zed-industries/zed/refs/heads/main/crates/copilot/src/copilot_chat.rs
 * - https://github.com/username/repo/blob/branch/path/to/file.ext
 *   → https://raw.githubusercontent.com/username/repo/refs/heads/branch/path/to/file.ext
 */
export function transformGitHubCodeUrl(url: string): string {
	try {
		const parsedUrl = new URL(url);

		// Check if it's a GitHub URL
		if (parsedUrl.hostname === 'github.com') {
			const pathParts = parsedUrl.pathname.split('/');

			// Check if it's a code file URL (follows the pattern /username/repo/blob/branch/path/to/file)
			if (pathParts.length >= 5 && pathParts[3] === 'blob') {
				const username = pathParts[1];
				const repo = pathParts[2];
				const branch = pathParts[4];
				const filePath = pathParts.slice(5).join('/');

				// Transform to raw GitHub URL
				return `https://raw.githubusercontent.com/${username}/${repo}/refs/heads/${branch}/${filePath}`;
			}
		}

		// Check if it's a gist URL
		if (parsedUrl.hostname === 'gist.github.com' && parsedUrl.pathname.split('/').length >= 3) {
			const pathParts = parsedUrl.pathname.split('/');
			const username = pathParts[1];
			const gistId = pathParts[2];
			return `https://gist.githubusercontent.com/${username}/${gistId}/raw`;
		}

		// Return the original URL if it's not a GitHub code URL or if transformation fails
		return url;
	} catch (error) {
		// If URL parsing fails, return the original URL
		console.error(`Failed to transform GitHub URL: ${error}`);
		return url;
	}
}

/**
 * Fetch URLs from issue content and return processed results
 */
export async function fetchUrlsFromIssue(issueContent: string, timeout: number = 10000): Promise<Array<{
	url: string;
	title?: string;
	content?: string;
	content_length?: number;
	status: 'success' | 'error';
	error?: string;
}>> {
	const urls = extractUrlsFromText(issueContent);

	if (urls.length === 0) {
		return [];
	}

	console.log(`📋 Found ${urls.length} URLs to fetch: ${urls.join(', ')}`);

	const results = [];
	for (const url of urls) {
		try {
			console.log(`🌐 Fetching: ${url}`);
			const htmlContent = await fetchHtmlContent(url, timeout);
			let markdownContent: string;
			if (isHtml(htmlContent)) {
				markdownContent = await urlToMarkdown(htmlContent);
			} else {
				markdownContent = htmlContent; // If it's not HTML, use it as is
			}

			results.push({
				url: url,
				title: extractTitle(htmlContent),
				content: markdownContent,
				content_length: markdownContent.length,
				status: "success" as const
			});

			const linesCount = markdownContent.split('\n').length;
			console.log(`✅ Successfully fetched: ${url} (${markdownContent.length} chars, ${linesCount} lines)`);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.log(`❌ Failed to fetch: ${url} - ${errorMessage}`);
			results.push({
				url: url,
				error: errorMessage,
				status: "error" as const
			});
		}
	}

	return results;
}
