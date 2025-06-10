# WebSearch Tool

The WebSearch tool allows the AI agent to search the web for information when it's uncertain about specific knowledge. This tool is particularly useful for finding up-to-date information, technical documentation, or verifying facts.

## Features

- **Multiple Search Engines**: Supports Google Custom Search API and Bing Search API
- **Automatic Fallback**: Can automatically fallback from Google to Bing if one fails
- **Configurable Results**: Control the number of search results (1-10)
- **Language Support**: Search in different languages (English, Chinese, etc.)
- **Safe Search**: Optional safe search filtering
- **Structured Output**: Returns well-formatted JSON with titles, URLs, and snippets

## Configuration

### Google Custom Search API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Custom Search API
4. Create credentials (API Key)
5. Set up a Custom Search Engine at [Google Custom Search](https://cse.google.com/)
6. Get your Search Engine ID

Set the following environment variables:
```bash
export GOOGLE_SEARCH_API_KEY="your_google_api_key"
export GOOGLE_SEARCH_ENGINE_ID="your_search_engine_id"
```

### Bing Search API

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a Bing Search v7 resource
3. Get your subscription key

Set the following environment variable:
```bash
export BING_SEARCH_API_KEY="your_bing_api_key"
```

## Usage

### Basic Search

```typescript
// Search with default settings
{
  "tool": "web-search",
  "parameters": {
    "query": "latest TypeScript features 2024"
  }
}
```

### Advanced Search

```typescript
// Search with custom settings
{
  "tool": "web-search",
  "parameters": {
    "query": "React Server Components tutorial",
    "num_results": 8,
    "search_engine": "google",
    "language": "en",
    "safe_search": true
  }
}
```

### Chinese Search

```typescript
// Search in Chinese
{
  "tool": "web-search",
  "parameters": {
    "query": "人工智能最新发展",
    "num_results": 5,
    "search_engine": "auto",
    "language": "zh-CN",
    "safe_search": true
  }
}
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | The search query |
| `num_results` | number | 5 | Number of results to return (1-10) |
| `search_engine` | enum | "auto" | Search engine: "google", "bing", or "auto" |
| `language` | string | "en" | Language code (e.g., "en", "zh-CN") |
| `safe_search` | boolean | true | Enable safe search filtering |

## Response Format

```json
{
  "query": "TypeScript generics tutorial",
  "search_engine": "google",
  "language": "en",
  "safe_search": true,
  "num_results": 3,
  "search_time_ms": 1250,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "results": [
    {
      "title": "TypeScript Generics: A Complete Guide",
      "url": "https://example.com/typescript-generics",
      "snippet": "Learn how to use TypeScript generics to write reusable and type-safe code...",
      "displayUrl": "example.com"
    },
    {
      "title": "Advanced TypeScript Generics Patterns",
      "url": "https://another-example.com/advanced-generics",
      "snippet": "Explore advanced patterns and techniques for TypeScript generics...",
      "displayUrl": "another-example.com"
    }
  ]
}
```

## Error Handling

The tool provides detailed error messages for common issues:

### Missing API Keys
```json
{
  "error": "Google Search API key or Search Engine ID not configured. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.",
  "query": "test search",
  "search_engine": "google",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "suggestion": "Please check your API keys in environment variables"
}
```

### Empty Query
```json
{
  "error": "Search query cannot be empty",
  "query": "",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### API Failures
```json
{
  "error": "Both Google and Bing search failed. Google: API quota exceeded, Bing: Invalid API key",
  "query": "test search",
  "search_engine": "auto",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Best Practices

1. **Use Specific Queries**: More specific queries yield better results
2. **Set Appropriate Result Count**: Use fewer results for quick answers, more for comprehensive research
3. **Choose the Right Engine**: Google generally has more comprehensive results, Bing may be better for certain technical queries
4. **Handle Errors Gracefully**: Always check for errors in the response
5. **Respect Rate Limits**: Both APIs have rate limits, so avoid excessive requests

## Use Cases

- **Knowledge Verification**: When the AI needs to verify or update its knowledge
- **Current Events**: Finding recent news or developments
- **Technical Documentation**: Searching for API documentation or tutorials
- **Research**: Gathering information on specific topics
- **Fact Checking**: Verifying claims or statements

## Troubleshooting

### Common Issues

1. **"API key not configured"**: Set the required environment variables
2. **"Request timeout"**: Check your internet connection and API service status
3. **"No results found"**: Try different search terms or check if the query is too specific
4. **"HTTP 403"**: Check your API key permissions and quota limits
5. **"HTTP 429"**: You've exceeded the rate limit, wait before making more requests

### Testing

Run the unit tests to verify the tool is working correctly:

```bash
npm test -- web-search.test.ts
```

For integration testing with real APIs, set up your API keys and run:

```bash
# Set your API keys first
export GOOGLE_SEARCH_API_KEY="your_key"
export GOOGLE_SEARCH_ENGINE_ID="your_id"
export BING_SEARCH_API_KEY="your_key"

# Run integration tests
npm run test:integration
```
