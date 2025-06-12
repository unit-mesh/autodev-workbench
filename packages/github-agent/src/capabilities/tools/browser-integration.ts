import { ToolLike } from "../_typing";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { platform } from "os";
import { URL } from "url";

const execAsync = promisify(exec);

/**
 * 浏览器集成工具 - 演示如何"打开浏览器"
 * 
 * 技术原理：
 * 1. 使用操作系统的默认程序关联机制
 * 2. 通过命令行调用系统的浏览器启动命令
 * 3. 跨平台兼容 (macOS/Windows/Linux)
 */

// 浏览器管理器
class BrowserManager {
  private static instance: BrowserManager;
  private openedUrls: Set<string> = new Set();

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  /**
   * 获取平台特定的浏览器启动命令
   */
  private getBrowserCommand(url: string): string {
    const os = platform();
    
    switch (os) {
      case 'darwin':  // macOS
        return `open "${url}"`;
      
      case 'win32':   // Windows
        return `start "" "${url}"`;
      
      case 'linux':   // Linux
        return `xdg-open "${url}"`;
      
      default:
        throw new Error(`Unsupported platform: ${os}`);
    }
  }

  /**
   * 验证URL的安全性
   */
  private validateUrl(url: string): { valid: boolean; reason?: string } {
    try {
      const parsedUrl = new URL(url);
      
      // 只允许HTTP/HTTPS协议
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, reason: `Protocol '${parsedUrl.protocol}' not allowed. Only HTTP/HTTPS are supported.` };
      }
      
      // 检查是否是本地开发服务器或可信域名
      const allowedHosts = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        'github.com',
        'docs.github.com',
        'stackoverflow.com',
        'developer.mozilla.org'
      ];
      
      const isLocalhost = parsedUrl.hostname === 'localhost' || 
                         parsedUrl.hostname === '127.0.0.1' || 
                         parsedUrl.hostname === '0.0.0.0';
      
      const isTrustedDomain = allowedHosts.some(host => 
        parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
      );
      
      if (!isLocalhost && !isTrustedDomain) {
        return { valid: false, reason: `Domain '${parsedUrl.hostname}' not in allowed list. For security, only localhost and trusted domains are allowed.` };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, reason: `Invalid URL format: ${error}` };
    }
  }

  /**
   * 打开浏览器
   */
  async openBrowser(url: string, options: { newWindow?: boolean } = {}): Promise<{
    success: boolean;
    command?: string;
    error?: string;
    alreadyOpen?: boolean;
  }> {
    // 验证URL
    const validation = this.validateUrl(url);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    // 检查是否已经打开过
    if (this.openedUrls.has(url)) {
      return { 
        success: true, 
        alreadyOpen: true,
        command: `URL already opened in browser: ${url}`
      };
    }

    try {
      const command = this.getBrowserCommand(url);
      
      // 执行命令
      await execAsync(command);
      
      // 记录已打开的URL
      this.openedUrls.add(url);
      
      return { 
        success: true, 
        command: command,
        alreadyOpen: false
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: `Failed to open browser: ${error.message}` 
      };
    }
  }

  /**
   * 获取已打开的URLs
   */
  getOpenedUrls(): string[] {
    return Array.from(this.openedUrls);
  }

  /**
   * 清理记录
   */
  clearHistory(): void {
    this.openedUrls.clear();
  }
}

// 打开浏览器工具
export const installOpenBrowserTool: ToolLike = (installer) => {
  installer("open-browser", "Open URLs in the default browser with security validation", {
    url: z.string().describe("URL to open in browser (HTTP/HTTPS only, localhost and trusted domains)"),
    new_window: z.boolean().optional().describe("Open in new window/tab (default: false)"),
    validate_only: z.boolean().optional().describe("Only validate URL without opening (default: false)")
  }, async ({ url, new_window = false, validate_only = false }) => {
    try {
      const manager = BrowserManager.getInstance();
      
      // 如果只是验证
      if (validate_only) {
        const validation = manager['validateUrl'](url);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              url,
              valid: validation.valid,
              reason: validation.reason,
              validate_only: true,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }

      // 打开浏览器
      const result = await manager.openBrowser(url, { newWindow: new_window });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            url,
            success: result.success,
            command: result.command,
            error: result.error,
            already_open: result.alreadyOpen,
            new_window,
            platform: platform(),
            opened_urls_count: manager.getOpenedUrls().length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error opening browser: ${error.message}`
        }]
      };
    }
  });
};

// 浏览器历史工具
export const installBrowserHistoryTool: ToolLike = (installer) => {
  installer("browser-history", "Manage browser opening history", {
    action: z.enum(["list", "clear"]).describe("Action to perform"),
  }, async ({ action }) => {
    try {
      const manager = BrowserManager.getInstance();
      
      switch (action) {
        case "list":
          const urls = manager.getOpenedUrls();
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                action: "list",
                opened_urls: urls,
                count: urls.length,
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          };
          
        case "clear":
          manager.clearHistory();
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                action: "clear",
                message: "Browser history cleared",
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          };
          
        default:
          return {
            content: [{
              type: "text",
              text: `Unknown action: ${action}`
            }]
          };
      }
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error managing browser history: ${error.message}`
        }]
      };
    }
  });
};

/**
 * 技术说明：为什么AI可以"打开浏览器"
 * 
 * 1. **操作系统API**: 每个操作系统都有默认程序关联机制
 *    - macOS: `open` 命令
 *    - Windows: `start` 命令  
 *    - Linux: `xdg-open` 命令
 * 
 * 2. **进程调用**: Node.js 可以启动子进程执行系统命令
 *    - child_process.exec() 执行shell命令
 *    - 命令会启动默认浏览器
 * 
 * 3. **用户权限**: 在用户权限下运行，可以访问桌面环境
 *    - 继承用户的桌面会话
 *    - 使用用户的默认浏览器设置
 * 
 * 4. **安全限制**: 
 *    - URL白名单验证
 *    - 协议限制 (只允许HTTP/HTTPS)
 *    - 域名验证 (只允许localhost和可信域名)
 * 
 * 这就是AI Agent如何"打开浏览器"的技术原理！
 */
