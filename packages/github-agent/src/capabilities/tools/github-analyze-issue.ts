import { ToolLike } from "../_typing";
import { z } from "zod";
import { GitHubService } from "../../services/github-service";
import { ContextAnalyzer } from "../../services/context-analyzer";
import * as https from "https";
import * as http from "http";
import { URL } from "url";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

export const installGitHubAnalyzeIssueTool: ToolLike = (installer) => {
  installer("github_analyze_issue", "Analyze a specific GitHub issue and find related code in the current workspace, including fetching content from URLs mentioned in the issue", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    issue_number: z.number().describe("Issue number to analyze"),
    workspace_path: z.string().optional().describe("Path to the workspace to analyze (defaults to current directory)"),
    fetch_urls: z.boolean().optional().default(true).describe("Whether to fetch content from URLs mentioned in the issue"),
    url_timeout: z.number().optional().default(10000).describe("Timeout for URL fetching in milliseconds"),
  }, async ({
    owner,
    repo,
    issue_number,
    workspace_path,
    fetch_urls = true,
    url_timeout = 10000
  }: {
    owner: string;
    repo: string;
    issue_number: number;
    workspace_path?: string;
    fetch_urls?: boolean;
    url_timeout?: number;
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

      // Fetch URL content if enabled
      let urlContent: any[] = [];
      if (fetch_urls && issue.body) {
        if (process.env.VERBOSE_URL_LOGS === 'true') {
          console.log('🔗 Fetching URL content from issue...');
        }
        urlContent = await fetchUrlsFromIssue(issue.body, url_timeout);
      }

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
          url_content: urlContent,
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

// Helper functions for URL content fetching
function extractUrlsFromText(text: string): string[] {
  // Regular expression to match URLs
  const urlRegex = /https?:\/\/[^\s\)]+/g;
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

async function fetchUrlsFromIssue(issueContent: string, timeout: number): Promise<any[]> {
  const urls = extractUrlsFromText(issueContent);

  if (urls.length === 0) {
    return [];
  }

  if (process.env.VERBOSE_URL_LOGS === 'true') {
    console.log(`📋 Found ${urls.length} URLs to fetch: ${urls.join(', ')}`);
  }

  const results = [];
  for (const url of urls) {
    try {
      if (process.env.VERBOSE_URL_LOGS === 'true') {
        console.log(`🌐 Fetching: ${url}`);
      }
      const htmlContent = await fetchHtmlContent(url, timeout);
      const markdownContent = await urlToMarkdown(htmlContent);
      results.push({
        url: url,
        title: extractTitle(htmlContent),
        content: markdownContent,
        content_length: markdownContent.length,
        status: "success"
      });
      if (process.env.VERBOSE_URL_LOGS === 'true') {
        console.log(`✅ Successfully fetched: ${url} (${markdownContent.length} chars)`);
      }
    } catch (error: any) {
      if (process.env.VERBOSE_URL_LOGS === 'true') {
        console.log(`❌ Failed to fetch: ${url} - ${error.message}`);
      }
      results.push({
        url: url,
        error: error.message,
        status: "error"
      });
    }
  }

  return results;
}

function fetchHtmlContent(url: string, timeout: number): Promise<string> {
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

function extractTitle(html: string): string {
  const $ = cheerio.load(html);
  const title = $('title').text().trim();
  return title || 'Untitled';
}

async function urlToMarkdown(html: string): Promise<string> {
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
    filter: function (node) {
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
