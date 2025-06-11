import * as fs from "fs";
import * as path from "path";

export class LLMLogger {
  private logFile: string;

  constructor(logFileName: string = 'llm-service.log') {
    this.logFile = path.join(process.cwd(), logFileName);
  }

  /**
   * Log a message with optional data
   */
  log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;

    try {
      fs.appendFileSync(this.logFile, logEntry);
      // Only log to console in verbose mode - reduce noise
      if (process.env.VERBOSE_LLM_LOGS === 'true') {
        console.log(`📝 Logged to ${this.logFile}: ${message}`);
      }
    } catch (error) {
      // Silently fail if can't write to log file to avoid noise
    }
  }

  /**
   * Log start of an analysis operation
   */
  logAnalysisStart(operationType: string, context?: any): void {
    this.log(`=== ${operationType.toUpperCase()} START ===`, context);
  }

  /**
   * Log successful completion of an analysis operation
   */
  logAnalysisSuccess(operationType: string, result?: any): void {
    this.log(`=== ${operationType.toUpperCase()} SUCCESS ===`, result);
  }

  /**
   * Log fallback usage
   */
  logAnalysisFallback(operationType: string, reason?: string, result?: any): void {
    this.log(`=== ${operationType.toUpperCase()} FALLBACK ===`, { reason, result });
  }

  /**
   * Log analysis failure
   */
  logAnalysisFailure(operationType: string, error: Error, context?: any): void {
    this.log(`${operationType} failed:`, { 
      error: error.message, 
      stack: error.stack,
      context 
    });
  }

  /**
   * Get the log file path
   */
  getLogFilePath(): string {
    return this.logFile;
  }
}