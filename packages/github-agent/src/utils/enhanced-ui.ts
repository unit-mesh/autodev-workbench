/**
 * Enhanced User Interface for better developer experience
 * Provides clean, structured output with clear separation between user-facing and debug information
 */

import * as fs from 'fs';
import * as path from 'path';

export interface UIOptions {
  verbose?: boolean;
  logFile?: string;
  showProgress?: boolean;
  colorOutput?: boolean;
}

export interface StepInfo {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: any;
  duration?: number;
  timestamp?: string;
}

/**
 * Enhanced UI class for better user experience
 */
export class EnhancedUI {
  private verbose: boolean;
  private logFile: string;
  private showProgress: boolean;
  private colorOutput: boolean;
  private startTime: number;
  private steps: StepInfo[] = [];
  private currentStep: number = 0;

  constructor(options: UIOptions = {}) {
    this.verbose = options.verbose || false;
    this.logFile = options.logFile || path.join(process.cwd(), 'analysis.log');
    this.showProgress = options.showProgress !== false;
    this.colorOutput = options.colorOutput !== false;
    this.startTime = Date.now();

    // Initialize log file
    this.writeToFile(`\n=== Analysis Session Started at ${new Date().toISOString()} ===\n`);
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      // Silently fail if can't write to log file
    }
  }

  private formatTime(): string {
    return new Date().toLocaleTimeString();
  }

  private getIcon(type: 'info' | 'success' | 'warn' | 'error' | 'debug' | 'step'): string {
    const icons = {
      info: '📋',
      success: '✅',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      step: '📍'
    };
    return icons[type];
  }

  /**
   * Display a clean header for the analysis
   */
  header(title: string, subtitle?: string): void {
    const separator = '='.repeat(80);
    console.log(`\n${separator}`);
    console.log(`🚀 ${title}`);
    if (subtitle) {
      console.log(`   ${subtitle}`);
    }
    console.log(`${separator}\n`);
    this.writeToFile(`[HEADER] ${title}${subtitle ? ' - ' + subtitle : ''}`);
  }

  /**
   * Display section headers
   */
  section(title: string): void {
    console.log(`\n📋 ${title}`);
    console.log('-'.repeat(title.length + 4));
    this.writeToFile(`[SECTION] ${title}`);
  }

  /**
   * Display step progress with enhanced formatting
   */
  step(stepName: string, details?: any): void {
    this.currentStep++;
    const stepInfo: StepInfo = {
      name: stepName,
      status: 'running',
      details,
      timestamp: new Date().toISOString()
    };
    
    this.steps.push(stepInfo);
    
    if (this.showProgress) {
      console.log(`\n${this.getIcon('step')} Step ${this.currentStep}: ${stepName}`);
      if (details && this.verbose) {
        console.log(`   ${JSON.stringify(details, null, 2)}`);
      }
    }
    
    this.writeToFile(`[STEP ${this.currentStep}] ${stepName}${details ? '\n' + JSON.stringify(details, null, 2) : ''}`);
  }

  /**
   * Mark current step as completed
   */
  stepComplete(duration?: number): void {
    if (this.steps.length > 0) {
      const currentStep = this.steps[this.steps.length - 1];
      currentStep.status = 'completed';
      currentStep.duration = duration;
      
      if (this.showProgress) {
        const durationText = duration ? ` (${duration.toFixed(0)}ms)` : '';
        console.log(`   ${this.getIcon('success')} Completed${durationText}`);
      }
    }
  }

  /**
   * Mark current step as failed
   */
  stepFailed(error: string): void {
    if (this.steps.length > 0) {
      const currentStep = this.steps[this.steps.length - 1];
      currentStep.status = 'failed';
      
      console.log(`   ${this.getIcon('error')} Failed: ${error}`);
    }
  }

  /**
   * Display informational messages
   */
  info(message: string, data?: any): void {
    console.log(`${this.getIcon('info')} ${message}`);
    this.writeToFile(`[INFO] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
  }

  /**
   * Display success messages
   */
  success(message: string, data?: any): void {
    console.log(`${this.getIcon('success')} ${message}`);
    this.writeToFile(`[SUCCESS] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
  }

  /**
   * Display warning messages
   */
  warn(message: string, data?: any): void {
    console.log(`${this.getIcon('warn')} ${message}`);
    this.writeToFile(`[WARN] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
  }

  /**
   * Display error messages
   */
  error(message: string, data?: any): void {
    console.log(`${this.getIcon('error')} ${message}`);
    this.writeToFile(`[ERROR] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
  }

  /**
   * Display debug messages (only in verbose mode)
   */
  debug(message: string, data?: any): void {
    if (this.verbose) {
      console.log(`${this.getIcon('debug')} ${message}`);
    }
    this.writeToFile(`[DEBUG] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
  }

  /**
   * Display analysis results in a structured format
   */
  analysisResults(results: {
    relatedCode: { files: any[], symbols: any[], apis?: any[] };
    suggestions: any[];
    urlContent?: any[];
  }): void {
    this.section('Analysis Results');
    
    const { relatedCode, suggestions, urlContent } = results;
    
    console.log(`📊 Code Analysis:`);
    console.log(`   • ${relatedCode.files.length} relevant files identified`);
    console.log(`   • ${relatedCode.symbols.length} symbols found`);
    if (relatedCode.apis) {
      console.log(`   • ${relatedCode.apis.length} API references detected`);
    }
    console.log(`   • ${suggestions.length} suggestions generated`);
    
    if (urlContent && urlContent.length > 0) {
      const successful = urlContent.filter(u => u.status === 'success').length;
      console.log(`   • ${successful}/${urlContent.length} URLs processed successfully`);
    }

    if (this.verbose && relatedCode.files.length > 0) {
      console.log(`\n🔍 Top Relevant Files:`);
      relatedCode.files.slice(0, 5).forEach((file, index) => {
        const relevance = file.relevanceScore ? `${(file.relevanceScore * 100).toFixed(1)}%` : 'N/A';
        console.log(`   ${index + 1}. ${file.path} (${relevance} relevance)`);
      });
    }

    this.writeToFile(`[ANALYSIS_RESULTS] ${JSON.stringify(results, null, 2)}`);
  }

  /**
   * Display URL processing results
   */
  urlProcessing(urls: string[], results: any[]): void {
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    this.info(`🌐 URL Processing: ${successful} successful, ${failed} failed`);

    if (this.verbose && successful > 0) {
      console.log(`\n📄 Successfully processed URLs:`);
      results.filter(r => r.status === 'success').forEach(result => {
        const contentLength = result.content_length || 'unknown';
        console.log(`   ✅ ${result.url} (${contentLength} chars)`);
      });
    }

    if (failed > 0) {
      console.log(`\n❌ Failed URLs:`);
      results.filter(r => r.status === 'error').forEach(result => {
        console.log(`   • ${result.url}: ${result.error}`);
      });
    }

    this.writeToFile(`[URL_PROCESSING] ${JSON.stringify({ urls, results }, null, 2)}`);
  }

  /**
   * Display LLM operation information
   */
  llmOperation(provider: string, model: string, operation: string, inputLength?: number, outputLength?: number): void {
    this.info(`🤖 ${operation} using ${provider} (${model})`);
    
    if (this.verbose && inputLength !== undefined) {
      console.log(`   Input: ${inputLength} characters`);
    }
    if (this.verbose && outputLength !== undefined) {
      console.log(`   Output: ${outputLength} characters`);
    }

    this.writeToFile(`[LLM] ${JSON.stringify({ provider, model, operation, inputLength, outputLength }, null, 2)}`);
  }

  /**
   * Display final completion message with summary
   */
  complete(message: string): void {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    const completedSteps = this.steps.filter(s => s.status === 'completed').length;
    const failedSteps = this.steps.filter(s => s.status === 'failed').length;
    
    this.section('Analysis Complete');
    this.success(`${message} (${elapsed}s)`);
    
    console.log(`\n📈 Summary:`);
    console.log(`   • Total time: ${elapsed} seconds`);
    console.log(`   • Steps completed: ${completedSteps}/${this.steps.length}`);
    if (failedSteps > 0) {
      console.log(`   • Steps failed: ${failedSteps}`);
    }
    console.log(`   • Detailed logs: ${this.logFile}`);
    
    console.log(`\n${'='.repeat(80)}\n`);
    
    this.writeToFile(`=== Analysis Session Completed in ${elapsed}s ===\n`);
  }

  /**
   * Display a clean report output
   */
  displayReport(report: string, issueNumber: number): void {
    this.section(`Analysis Report for Issue #${issueNumber}`);
    console.log(`\n📄 Generated Report:`);
    console.log(`   Use --upload flag to post this report to GitHub\n`);
    
    const separator = '─'.repeat(80);
    console.log(separator);
    console.log(report);
    console.log(separator);
  }

  /**
   * Display upload success information
   */
  uploadSuccess(commentId: number, commentUrl: string): void {
    this.success('Report uploaded to GitHub successfully!');
    console.log(`   📝 Comment ID: ${commentId}`);
    console.log(`   🔗 View at: ${commentUrl}`);
  }

  /**
   * Display helpful tips based on error type
   */
  helpTip(errorType: 'github' | 'workspace' | 'llm' | 'general', message?: string): void {
    const tips = {
      github: '💡 Tip: Check your GITHUB_TOKEN and repository access permissions',
      workspace: '💡 Tip: Verify the workspace path exists and contains code files',
      llm: '💡 Tip: Check your LLM provider configuration (GLM_TOKEN, DEEPSEEK_TOKEN, etc.)',
      general: '💡 Tip: Run with --verbose flag for more detailed information'
    };
    
    console.log(`\n${tips[errorType]}`);
    if (message) {
      console.log(`   ${message}`);
    }
  }
}
