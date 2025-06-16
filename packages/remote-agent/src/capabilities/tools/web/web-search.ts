import { ToolLike } from "../../_typing";
import { z } from "zod";
import * as https from "https";
import { URL } from "url";

export const installWebSearchTool: ToolLike = (installer) => {
  installer("google-search", "Search the web for issue or related information when you are uncertain about something or some knowledge.", {
    query: z.string().describe("Search query to find information"),
    num_results: z.number().optional().default(5).describe("Number of search results to return (1-10)"),
    search_engine: z.enum(["google", "bing", "auto"]).optional().default("auto").describe("Search engine to use. 'auto' will try Google first, then Bing"),
    language: z.string().optional().default("en").describe("Language for search results (e.g., 'en', 'zh-CN')"),
    safe_search: z.boolean().optional().default(true).describe("Enable safe search filtering"),
  }, async ({
    query,
    num_results = 5,
    search_engine = "auto",
    language = "en",
    safe_search = true
  }: {
    query: string;
    num_results?: number;
    search_engine?: "google" | "bing" | "auto";
    language?: string;
    safe_search?: boolean;
  }) => {
    try {
      // Validate input
      if (!query || query.trim().length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Search query cannot be empty",
                query: query,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ]
        };
      }

      // Clamp num_results to valid range
      num_results = Math.max(1, Math.min(10, num_results));

      const startTime = Date.now();
      let searchResults: SearchResult[] = [];
      let searchEngine = "";
      let error = null;

      // Try search engines based on preference
      if (search_engine === "google" || search_engine === "auto") {
        try {
          const results = await searchWithGoogle(query, num_results, language, safe_search);
          searchResults = results;
          searchEngine = "google";
        } catch (err: any) {
          error = err.message;
          console.warn("Google search failed:", err.message);

          // If auto mode and Google failed, try Bing
          if (search_engine === "auto") {
            try {
              const results = await searchWithBing(query, num_results, language, safe_search);
              searchResults = results;
              searchEngine = "bing";
              error = null; // Clear error if Bing succeeds
            } catch (bingErr: any) {
              console.warn("Bing search also failed:", bingErr.message);
              error = `Both Google and Bing search failed. Google: ${error}, Bing: ${bingErr.message}`;
            }
          }
        }
      } else if (search_engine === "bing") {
        try {
          const results = await searchWithBing(query, num_results, language, safe_search);
          searchResults = results;
          searchEngine = "bing";
        } catch (err: any) {
          error = err.message;
          console.warn("Bing search failed:", err.message);
        }
      }

      const searchTime = Date.now() - startTime;

      // Return results or error
      if (error && searchResults.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error,
                query: query,
                search_engine: search_engine,
                language: language,
                safe_search: safe_search,
                timestamp: new Date().toISOString(),
                search_time_ms: searchTime,
                suggestion: "Please check your API keys in environment variables (GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID, BING_SEARCH_API_KEY)"
              }, null, 2)
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query: query,
              search_engine: searchEngine,
              language: language,
              safe_search: safe_search,
              num_results: searchResults.length,
              search_time_ms: searchTime,
              timestamp: new Date().toISOString(),
              results: searchResults
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Web search failed: ${error.message}`,
              query: query,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  });
};

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl?: string;
  datePublished?: string;
}

async function searchWithGoogle(
  query: string,
  numResults: number,
  language: string,
  safeSearch: boolean
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
      throw new Error("Google Search API key or Search Engine ID not configured. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.");
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: searchEngineId,
    q: query,
    num: numResults.toString(),
    hl: language,
    safe: safeSearch ? 'active' : 'off'
  });

  const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;

  const response = await makeHttpRequest(url);
  const data = JSON.parse(response);

  if (data.error) {
    throw new Error(`Google Search API error: ${data.error.message}`);
  }

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map((item: any) => ({
    title: item.title || "No title",
    url: item.link || "",
    snippet: item.snippet || "No description available",
    displayUrl: item.displayLink || item.link,
  }));
}

async function searchWithBing(
  query: string,
  numResults: number,
  language: string,
  safeSearch: boolean
): Promise<SearchResult[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;

  if (!apiKey) {
    throw new Error("Bing Search API key not configured. Please set BING_SEARCH_API_KEY environment variable.");
  }

  const params = new URLSearchParams({
    q: query,
    count: numResults.toString(),
    mkt: language === 'zh-CN' ? 'zh-CN' : 'en-US',
    safeSearch: safeSearch ? 'Strict' : 'Off'
  });

  const url = `https://api.bing.microsoft.com/v7.0/search?${params.toString()}`;

  const response = await makeHttpRequest(url, {
    'Ocp-Apim-Subscription-Key': apiKey
  });
  const data = JSON.parse(response);

  if (data.error) {
    throw new Error(`Bing Search API error: ${data.error.message}`);
  }

  if (!data.webPages || !data.webPages.value || data.webPages.value.length === 0) {
    return [];
  }

  return data.webPages.value.map((item: any) => ({
    title: item.name || "No title",
    url: item.url || "",
    snippet: item.snippet || "No description available",
    displayUrl: item.displayUrl || item.url,
    datePublished: item.datePublished
  }));
}

function makeHttpRequest(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'AutoDev-WebSearch/1.0',
        'Accept': 'application/json',
        ...headers
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';

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
      reject(new Error('Request timeout after 10 seconds'));
    });

    req.end();
  });
}
