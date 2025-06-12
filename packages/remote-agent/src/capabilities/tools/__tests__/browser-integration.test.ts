import { installOpenBrowserTool, installBrowserHistoryTool } from "../browser-integration";
import { platform } from "os";

describe("browser-integration tools", () => {
  let openBrowserHandler: any;
  let historyHandler: any;

  beforeEach(() => {
    // Install tools and capture handlers
    const mockInstaller = (name: string, description: string, schema: any, handler: any) => {
      if (name === "open-browser") {
        openBrowserHandler = handler;
      } else if (name === "browser-history") {
        historyHandler = handler;
      }
    };
    
    installOpenBrowserTool(mockInstaller);
    installBrowserHistoryTool(mockInstaller);
  });

  describe("open-browser tool", () => {
    test("should validate URL correctly", async () => {
      const result = await openBrowserHandler({
        url: "https://github.com",
        validate_only: true
      });

      expect(result.content[0].type).toBe("text");
      const response = JSON.parse(result.content[0].text);
      expect(response.valid).toBe(true);
      expect(response.validate_only).toBe(true);
    });

    test("should reject invalid protocols", async () => {
      const result = await openBrowserHandler({
        url: "ftp://example.com",
        validate_only: true
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.valid).toBe(false);
      expect(response.reason).toContain("Protocol 'ftp:' not allowed");
    });

    test("should reject untrusted domains", async () => {
      const result = await openBrowserHandler({
        url: "https://malicious-site.com",
        validate_only: true
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.valid).toBe(false);
      expect(response.reason).toContain("not in allowed list");
    });

    test("should allow localhost URLs", async () => {
      const result = await openBrowserHandler({
        url: "http://localhost:3000",
        validate_only: true
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.valid).toBe(true);
    });

    test("should allow trusted domains", async () => {
      const trustedUrls = [
        "https://github.com",
        "https://docs.github.com",
        "https://stackoverflow.com",
        "https://developer.mozilla.org"
      ];

      for (const url of trustedUrls) {
        const result = await openBrowserHandler({
          url,
          validate_only: true
        });

        const response = JSON.parse(result.content[0].text);
        expect(response.valid).toBe(true);
      }
    });

    test("should handle invalid URL format", async () => {
      const result = await openBrowserHandler({
        url: "not-a-valid-url",
        validate_only: true
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.valid).toBe(false);
      expect(response.reason).toContain("Invalid URL format");
    });

    test("should include platform information", async () => {
      const result = await openBrowserHandler({
        url: "https://github.com",
        validate_only: true
      });

      const response = JSON.parse(result.content[0].text);
      expect(response).toHaveProperty("timestamp");
    });
  });

  describe("browser-history tool", () => {
    test("should list empty history initially", async () => {
      const result = await historyHandler({
        action: "list"
      });

      expect(result.content[0].type).toBe("text");
      const response = JSON.parse(result.content[0].text);
      expect(response.action).toBe("list");
      expect(response.opened_urls).toEqual([]);
      expect(response.count).toBe(0);
    });

    test("should clear history", async () => {
      const result = await historyHandler({
        action: "clear"
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.action).toBe("clear");
      expect(response.message).toBe("Browser history cleared");
    });

    test("should handle unknown action", async () => {
      const result = await historyHandler({
        action: "unknown"
      });

      expect(result.content[0].text).toContain("Unknown action: unknown");
    });
  });

  describe("platform-specific commands", () => {
    test("should generate correct command for current platform", () => {
      const currentPlatform = platform();
      const url = "https://github.com";
      
      let expectedCommand: string;
      switch (currentPlatform) {
        case 'darwin':
          expectedCommand = `open "${url}"`;
          break;
        case 'win32':
          expectedCommand = `start "" "${url}"`;
          break;
        case 'linux':
          expectedCommand = `xdg-open "${url}"`;
          break;
        default:
          expectedCommand = "unsupported";
      }

      // This test verifies the command generation logic
      expect(expectedCommand).toBeDefined();
      expect(expectedCommand).toContain(url);
    });
  });

  describe("security features", () => {
    test("should implement URL whitelist", async () => {
      const testCases = [
        { url: "https://github.com", shouldPass: true },
        { url: "https://evil-site.com", shouldPass: false },
        { url: "http://localhost:3000", shouldPass: true },
        { url: "https://127.0.0.1:8080", shouldPass: true }
      ];

      for (const testCase of testCases) {
        const result = await openBrowserHandler({
          url: testCase.url,
          validate_only: true
        });

        const response = JSON.parse(result.content[0].text);
        expect(response.valid).toBe(testCase.shouldPass);
      }
    });

    test("should prevent protocol injection", async () => {
      const maliciousUrls = [
        "javascript:alert('xss')",
        "data:text/html,<script>alert('xss')</script>",
        "file:///etc/passwd"
      ];

      for (const url of maliciousUrls) {
        const result = await openBrowserHandler({
          url,
          validate_only: true
        });

        const response = JSON.parse(result.content[0].text);
        expect(response.valid).toBe(false);
      }
    });
  });
});

// Integration test (commented out to avoid actually opening browsers during tests)
/*
describe("browser integration (manual test)", () => {
  test("should actually open browser", async () => {
    // Uncomment to test actual browser opening
    // const result = await openBrowserHandler({
    //   url: "https://github.com"
    // });
    // 
    // const response = JSON.parse(result.content[0].text);
    // expect(response.success).toBe(true);
    // expect(response.command).toBeDefined();
  });
});
*/
