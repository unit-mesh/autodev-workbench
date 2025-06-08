import { ToolLike } from "../_typing";
import { z } from "zod";
import * as https from "https";
import * as http from "http";
import { URL } from "url";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

export const installExtractWebpageAsMarkdownTool: ToolLike = (installer) => {
  installer("extract-webpage-as-markdown", "Extract and convert web page content to clean markdown format, removing navigation and ads for better readability", {
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

export function extractTitle(html: string): string {
  const $ = cheerio.load(html);
  const title = $('title').text().trim();
  return title || 'Untitled';
}

export async function urlToMarkdown(html: string): Promise<string> {
  // Use cheerio to parse and clean up the HTML
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer, header elements
  $("script, style, nav, footer, header").remove();

  // Convert cleaned HTML to markdown using TurndownService
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full'
  });

  // Add custom rules for better conversion
  turndownService.addRule('removeComments', {
    filter: function (node: any) {
      return node.nodeType === 8; // Comment node
    },
    replacement: function () {
      return '';
    }
  });

  const markdown = turndownService.turndown($.html());

  // Clean up excessive whitespace
  return markdown
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .replace(/^\s+|\s+$/g, '') // Trim
    .replace(/\s+$/gm, ''); // Remove trailing spaces from lines
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
      const markdownContent = await urlToMarkdown(htmlContent);
      results.push({
        url: url,
        title: extractTitle(htmlContent),
        content: markdownContent,
        content_length: markdownContent.length,
        status: "success" as const
      });
      console.log(`✅ Successfully fetched: ${url} (${markdownContent.length} chars)`);
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
