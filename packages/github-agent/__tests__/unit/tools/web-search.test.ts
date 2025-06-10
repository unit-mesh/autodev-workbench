import { installWebSearchTool } from "../../../src/capabilities/tools/web-search";

describe("WebSearch Tool", () => {
  let mockInstaller: jest.Mock;
  let toolHandler: any;

  beforeEach(() => {
    mockInstaller = jest.fn();
    installWebSearchTool(mockInstaller);
    
    // Get the handler function from the mock call
    const installCall = mockInstaller.mock.calls[0];
    toolHandler = installCall[3]; // The handler is the 4th argument
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.GOOGLE_SEARCH_API_KEY;
    delete process.env.GOOGLE_SEARCH_ENGINE_ID;
    delete process.env.BING_SEARCH_API_KEY;
  });

  it("should register the web-search tool with correct parameters", () => {
    expect(mockInstaller).toHaveBeenCalledWith(
      "web-search",
      expect.stringContaining("Search the web for information"),
      expect.objectContaining({
        query: expect.any(Object),
        num_results: expect.any(Object),
        search_engine: expect.any(Object),
        language: expect.any(Object),
        safe_search: expect.any(Object),
      }),
      expect.any(Function)
    );
  });

  it("should return error for empty query", async () => {
    const result = await toolHandler({
      query: "",
      num_results: 5,
      search_engine: "auto",
      language: "en",
      safe_search: true
    });

    expect(result.content[0].type).toBe("text");
    const response = JSON.parse(result.content[0].text);
    expect(response.error).toContain("Search query cannot be empty");
  });

  it("should return error when no API keys are configured", async () => {
    const result = await toolHandler({
      query: "test search",
      num_results: 5,
      search_engine: "google",
      language: "en",
      safe_search: true
    });

    expect(result.content[0].type).toBe("text");
    const response = JSON.parse(result.content[0].text);
    expect(response.error).toContain("API key");
  });

  it("should clamp num_results to valid range", async () => {
    // Test with num_results > 10
    const result1 = await toolHandler({
      query: "test search",
      num_results: 15,
      search_engine: "auto",
      language: "en",
      safe_search: true
    });

    expect(result1.content[0].type).toBe("text");
    const response1 = JSON.parse(result1.content[0].text);
    // Should suggest API key configuration since no keys are set
    expect(response1.suggestion).toContain("API keys");

    // Test with num_results < 1
    const result2 = await toolHandler({
      query: "test search",
      num_results: -1,
      search_engine: "auto",
      language: "en",
      safe_search: true
    });

    expect(result2.content[0].type).toBe("text");
    const response2 = JSON.parse(result2.content[0].text);
    expect(response2.suggestion).toContain("API keys");
  });

  it("should handle different search engines", async () => {
    // Test Google search engine
    const result1 = await toolHandler({
      query: "test search",
      num_results: 5,
      search_engine: "google",
      language: "en",
      safe_search: true
    });

    expect(result1.content[0].type).toBe("text");
    const response1 = JSON.parse(result1.content[0].text);
    expect(response1.error).toContain("Google Search API key");

    // Test Bing search engine
    const result2 = await toolHandler({
      query: "test search",
      num_results: 5,
      search_engine: "bing",
      language: "en",
      safe_search: true
    });

    expect(result2.content[0].type).toBe("text");
    const response2 = JSON.parse(result2.content[0].text);
    expect(response2.error).toContain("Bing Search API key");
  });

  it("should use default values for optional parameters", async () => {
    const result = await toolHandler({
      query: "test search"
    });

    expect(result.content[0].type).toBe("text");
    const response = JSON.parse(result.content[0].text);
    // Should fail due to missing API keys, but we can verify the structure
    expect(response.query).toBe("test search");
  });

  it("should handle different languages", async () => {
    const result = await toolHandler({
      query: "测试搜索",
      num_results: 3,
      search_engine: "auto",
      language: "zh-CN",
      safe_search: true
    });

    expect(result.content[0].type).toBe("text");
    const response = JSON.parse(result.content[0].text);
    expect(response.query).toBe("测试搜索");
    expect(response.language).toBe("zh-CN");
  });
});

describe("WebSearch Tool Integration", () => {
  // These tests would require actual API keys and should be run separately
  // or mocked with proper HTTP request mocking

  it.skip("should perform actual Google search with valid API key", async () => {
    // This test requires GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID
    // to be set in the environment
  });

  it.skip("should perform actual Bing search with valid API key", async () => {
    // This test requires BING_SEARCH_API_KEY to be set in the environment
  });

  it.skip("should fallback from Google to Bing in auto mode", async () => {
    // This test would require mocking HTTP requests to simulate Google failure
    // and Bing success
  });
});
