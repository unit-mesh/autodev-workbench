import * as fs from 'fs';
import * as path from 'path';

const SEPARATORS = {
  full: '='.repeat(80),
  dash: '─'.repeat(80)
} as const;

const HELP_TIPS = {
  github: 'Check your GITHUB_TOKEN and repository access permissions',
  workspace: 'Verify the workspace path exists and contains code files',
  llm: 'Check your LLM provider configuration (GLM_TOKEN, DEEPSEEK_TOKEN, etc.)',
  general: 'Run with --verbose flag for more detailed information'
} as const;

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

export interface AnalysisResults {
  relatedCode: { 
    files: any[]; 
    symbols: any[]; 
    apis?: any[]; 
  };
  suggestions: any[];
  urlContent?: any[];
}

export class EnhancedUI {
  private readonly options: Required<UIOptions>;
  private readonly startTime: number;
  private readonly steps: StepInfo[] = [];
  private currentStep: number = 0;

  constructor(options: UIOptions = {}) {
    this.options = {
      verbose: options.verbose || false,
      logFile: options.logFile || path.join(process.cwd(), 'analysis.log'),
      showProgress: options.showProgress !== false,
      colorOutput: options.colorOutput !== false
    };
    
    this.startTime = Date.now();
    this.initializeLogFile();
  }

  private initializeLogFile(): void {
    const sessionStart = `\n=== Analysis Session Started at ${new Date().toISOString()} ===\n`;
    this.writeToFile(sessionStart);
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.options.logFile, message + '\n');
    } catch {
      // Silently fail if can't write to log file
    }
  }

  private logMessage(type: string, message: string, data?: any): void {
    const logEntry = `[${type}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
    this.writeToFile(logEntry);
  }

  header(title: string, subtitle?: string): void {
    console.log(`\n${SEPARATORS.full}`);
    console.log(`🚀 ${title}`);
    if (subtitle) {
      console.log(`   ${subtitle}`);
    }
    console.log(`${SEPARATORS.full}\n`);
    this.logMessage('HEADER', `${title}${subtitle ? ' - ' + subtitle : ''}`);
  }

  section(title: string): void {
    console.log(`\n📋 ${title}`);
    console.log('-'.repeat(title.length + 4));
    this.logMessage('SECTION', title);
  }

  step(stepName: string, details?: any): void {
    this.currentStep++;
    const stepInfo: StepInfo = {
      name: stepName,
      status: 'running',
      details,
      timestamp: new Date().toISOString()
    };
    
    this.steps.push(stepInfo);
    
    if (this.options.showProgress) {
      console.log(`\n📍 Step ${this.currentStep}: ${stepName}`);
      if (details && this.options.verbose) {
        console.log(`   ${JSON.stringify(details, null, 2)}`);
      }
    }
    
    this.logMessage(`STEP ${this.currentStep}`, stepName, details);
  }

  stepComplete(duration?: number): void {
    const currentStep = this.steps[this.steps.length - 1];
    if (!currentStep) return;

    currentStep.status = 'completed';
    currentStep.duration = duration;
    
    if (this.options.showProgress) {
      const durationText = duration ? ` (${duration.toFixed(0)}ms)` : '';
      console.log(`   ✅ Completed${durationText}`);
    }
  }

  stepFailed(error: string): void {
    const currentStep = this.steps[this.steps.length - 1];
    if (!currentStep) return;

    currentStep.status = 'failed';
    console.log(`   ❌ Failed: ${error}`);
  }

  info(message: string, data?: any): void {
    console.log(`📋 ${message}`);
    this.logMessage('INFO', message, data);
  }

  success(message: string, data?: any): void {
    console.log(`✅ ${message}`);
    this.logMessage('SUCCESS', message, data);
  }

  warn(message: string, data?: any): void {
    console.log(`⚠️ ${message}`);
    this.logMessage('WARN', message, data);
  }

  error(message: string, data?: any): void {
    console.log(`❌ ${message}`);
    this.logMessage('ERROR', message, data);
  }

  debug(message: string, data?: any): void {
    if (this.options.verbose) {
      console.log(`🔍 ${message}`);
    }
    this.logMessage('DEBUG', message, data);
  }

  analysisResults(results: AnalysisResults): void {
    this.section('Analysis Results');
    
    const { relatedCode, suggestions, urlContent } = results;
    
    console.log(`📊 Code Analysis:`);
    console.log(`   • ${relatedCode.files.length} relevant files identified`);
    console.log(`   • ${relatedCode.symbols.length} symbols found`);
    
    if (relatedCode.apis) {
      console.log(`   • ${relatedCode.apis.length} API references detected`);
    }
    
    console.log(`   • ${suggestions.length} suggestions generated`);
    
    if (urlContent?.length) {
      const successful = urlContent.filter(u => u.status === 'success').length;
      console.log(`   • ${successful}/${urlContent.length} URLs processed successfully`);
    }

    if (this.options.verbose && relatedCode.files.length > 0) {
      this.displayTopFiles(relatedCode.files);
    }

    this.logMessage('ANALYSIS_RESULTS', 'Analysis completed', results);
  }

  private displayTopFiles(files: any[]): void {
    console.log(`\n🔍 Top Relevant Files:`);
    files.slice(0, 5).forEach((file, index) => {
      const relevance = file.relevanceScore 
        ? `${(file.relevanceScore * 100).toFixed(1)}%` 
        : 'N/A';
      console.log(`   ${index + 1}. ${file.path} (${relevance} relevance)`);
    });
  }

  urlProcessing(urls: string[], results: any[]): void {
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    this.info(`🌐 URL Processing: ${successful} successful, ${failed} failed`);

    if (this.options.verbose && successful > 0) {
      this.displaySuccessfulUrls(results);
    }

    if (failed > 0) {
      this.displayFailedUrls(results);
    }

    this.logMessage('URL_PROCESSING', 'URL processing completed', { urls, results });
  }

  private displaySuccessfulUrls(results: any[]): void {
    console.log(`\n📄 Successfully processed URLs:`);
    results
      .filter(r => r.status === 'success')
      .forEach(result => {
        const contentLength = result.content_length || 'unknown';
        console.log(`   ✅ ${result.url} (${contentLength} chars)`);
      });
  }

  private displayFailedUrls(results: any[]): void {
    console.log(`\n❌ Failed URLs:`);
    results
      .filter(r => r.status === 'error')
      .forEach(result => {
        console.log(`   • ${result.url}: ${result.error}`);
      });
  }

  llmOperation(provider: string, model: string, operation: string, inputLength?: number, outputLength?: number): void {
    this.info(`🤖 ${operation} using ${provider} (${model})`);
    
    if (this.options.verbose) {
      if (inputLength !== undefined) {
        console.log(`   Input: ${inputLength} characters`);
      }
      if (outputLength !== undefined) {
        console.log(`   Output: ${outputLength} characters`);
      }
    }

    this.logMessage('LLM', 'LLM operation', { provider, model, operation, inputLength, outputLength });
  }

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
    
    console.log(`   • Detailed logs: ${this.options.logFile}`);
    console.log(`\n${SEPARATORS.full}\n`);
    
    this.writeToFile(`=== Analysis Session Completed in ${elapsed}s ===\n`);
  }

  displayReport(report: string, issueNumber: number): void {
    this.section(`Analysis Report for Issue #${issueNumber}`);
    console.log(`\n📄 Generated Report:`);
    console.log(`   Use --upload flag to post this report to GitHub\n`);
    
    console.log(SEPARATORS.dash);
    console.log(report);
    console.log(SEPARATORS.dash);
  }

  uploadSuccess(commentId: number, commentUrl: string): void {
    this.success('Report uploaded to GitHub successfully!');
    console.log(`   📝 Comment ID: ${commentId}`);
    console.log(`   🔗 View at: ${commentUrl}`);
  }

  helpTip(errorType: keyof typeof HELP_TIPS, message?: string): void {
    console.log(`\n💡 Tip: ${HELP_TIPS[errorType]}`);
    if (message) {
      console.log(`   ${message}`);
    }
  }
}