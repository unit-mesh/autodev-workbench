import {
  GitHubService,
  ContextAnalyzer,
  AnalysisReportGenerator,
  fetchUrlsFromIssue,
  LLMService
} from '@autodev/github-agent';
import {
  ActionContext,
  AnalysisOptions,
  ActionResult,
  LabelConfig,
  AnalysisProcessInfo
} from './types';
import * as fs from 'fs';
import * as path from 'path';

export class IssueAnalyzer {
  private githubService: GitHubService;
  private contextAnalyzer: ContextAnalyzer;
  private reportGenerator: AnalysisReportGenerator;
  private llmService: LLMService;
  private context: ActionContext;
  private labelConfig: LabelConfig;
  private processInfo: AnalysisProcessInfo;

  constructor(context: ActionContext) {
    this.context = context;

    // Initialize services using the same pattern as analyze-issue.js
    this.githubService = new GitHubService(context.config.githubToken);
    this.contextAnalyzer = new ContextAnalyzer(context.workspacePath);
    this.reportGenerator = new AnalysisReportGenerator(context.config.githubToken);
    this.llmService = new LLMService();

    // Initialize process tracking
    this.processInfo = {
      filesScanned: 0,
      filesAnalyzed: 0,
      filesFiltered: 0,
      filteredFiles: [],
      analysisSteps: [],
      llmCalls: []
    };

    // Default label configuration
    this.labelConfig = {
      bugLabel: 'bug',
      featureLabel: 'enhancement',
      documentationLabel: 'documentation',
      enhancementLabel: 'enhancement',
      questionLabel: 'question',
      analysisCompleteLabel: 'analysis-complete'
    };
  }

  /**
   * Analyze an issue using the same logic as analyze-issue.js
   */
  async analyzeIssue(options: AnalysisOptions = {}): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      console.log(`🔍 Starting analysis for issue #${this.context.issueNumber} in ${this.context.owner}/${this.context.repo}`);

      // Step 0: Scan workspace files for transparency
      await this.scanWorkspaceFiles();

      // Step 1: Get the issue (same as analyze-issue.js line 327)
      const stepStart = Date.now();
      const issue = await this.githubService.getIssue(
          this.context.owner,
          this.context.repo,
          this.context.issueNumber
      );
      this.addAnalysisStep('fetch-issue', 'completed', Date.now() - stepStart, `Fetched issue: "${issue.title}"`);

      console.log(`📋 Issue: "${issue.title}"`);

      // Step 2: Fetch URL content if enabled (same as analyze-issue.js line 360)
      let urlContent: any[] = [];
      if (options.includeCodeSearch !== false && issue.body) {
        const urlStepStart = Date.now();
        try {
          urlContent = await fetchUrlsFromIssue(issue.body, 10000);
          this.addAnalysisStep('fetch-urls', 'completed', Date.now() - urlStepStart, `Fetched content from ${urlContent.length} URLs`);
          console.log(`🔗 Fetched content from ${urlContent.length} URLs`);
        } catch (error) {
          this.addAnalysisStep('fetch-urls', 'failed', Date.now() - urlStepStart, `URL fetching failed: ${error}`);
          console.warn('URL fetching failed:', error);
        }
      } else {
        this.addAnalysisStep('fetch-urls', 'skipped', 0, 'URL fetching disabled or no issue body');
      }

      // Step 3: Enhance issue with URL content
      const enhancedIssue = {
        ...issue,
        urlContent: urlContent
      };

      // Step 4: Perform the analysis (same as analyze-issue.js line 391)
      const analysisStepStart = Date.now();
      console.log('🧠 Starting context analysis...');
      const analysisResult = await this.contextAnalyzer.analyzeIssue(enhancedIssue);
      this.addAnalysisStep('context-analysis', 'completed', Date.now() - analysisStepStart, 'Context analysis completed');

      // Track files that were analyzed vs filtered
      this.trackAnalysisResults(analysisResult);

      // Step 5: Generate comprehensive report (same as analyze-issue.js line 408)
      const reportStepStart = Date.now();
      console.log('📊 Generating analysis report...');
      const { report } = await this.reportGenerator.generateAndUploadReport(
          this.context.owner,
          this.context.repo,
          this.context.issueNumber,
          analysisResult,
          {
            uploadToGitHub: false, // We'll handle comment separately
            language: 'en',
            includeFileContent: options.includeCodeSearch !== false,
            maxFiles: 10
          }
      );
      this.addAnalysisStep('generate-report', 'completed', Date.now() - reportStepStart, `Generated report (${report?.length || 0} characters)`);

      // Use the generated report as our analysis result
      const result: ActionResult = {
        success: true,
        analysisResult: {
          text: report, // This is the detailed analysis text
          analysisResult: analysisResult,
          executionTime: Date.now() - startTime
        },
        executionTime: Date.now() - startTime,
        processInfo: this.processInfo
      };

      // Generate labels based on the analysis
      const recommendedLabels = this.extractLabelsFromAnalysis(report);
      result.labelsAdded = recommendedLabels;

      // Log summary of analysis process
      this.logAnalysisSummary();

      console.log(`✅ Analysis completed in ${result.executionTime}ms`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Analysis failed:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Extract labels from analysis text using simple pattern matching
   */
  private extractLabelsFromAnalysis(analysisText: string): string[] {
    const labels: string[] = [];

    // Convert to lowercase for pattern matching
    const text = analysisText.toLowerCase();

    // Pattern matching for different types of issues
    if (text.includes('bug') || text.includes('error') || text.includes('issue') || text.includes('problem')) {
      labels.push(this.labelConfig.bugLabel || 'bug');
    }

    if (text.includes('enhancement') || text.includes('feature') || text.includes('improve')) {
      labels.push(this.labelConfig.enhancementLabel || 'enhancement');
    }

    if (text.includes('documentation') || text.includes('docs') || text.includes('readme')) {
      labels.push(this.labelConfig.documentationLabel || 'documentation');
    }

    if (text.includes('question') || text.includes('help') || text.includes('how to')) {
      labels.push(this.labelConfig.questionLabel || 'question');
    }

    // Complexity assessment
    if (text.includes('complex') || text.includes('difficult') || text.includes('challenging')) {
      labels.push('complex');
    }

    // Always add analysis complete label
    if (this.labelConfig.analysisCompleteLabel) {
      labels.push(this.labelConfig.analysisCompleteLabel);
    }

    // Remove duplicates
    return [...new Set(labels)];
  }

  /**
   * Generate comment text for the issue using LLM (similar to agent.ts approach)
   */
  async generateComment(analysisResult: any): Promise<string> {
    // Debug logging to understand the structure
    console.log('🔍 Generating comment for analysis result:', {
      hasAnalysisResult: !!analysisResult,
      hasNestedAnalysisResult: !!(analysisResult?.analysisResult),
      hasText: !!(analysisResult?.text),
      textLength: analysisResult?.text?.length || 0,
      executionTime: analysisResult?.executionTime,
      hasProcessInfo: !!(analysisResult?.processInfo)
    });

    if (!analysisResult || !analysisResult.analysisResult) {
      console.warn('⚠️ Missing analysis result data for comment generation');
      return this.generateProcessDiagnosticComment(analysisResult);
    }

    // Try to generate enhanced comment using LLM
    try {
      if (this.llmService.isAvailable()) {
        console.log('Using LLM service for comment generation');
        const comment = await this.generateEnhancedComment(analysisResult);
        return comment;
      } else {
        console.log('LLM service not available, using enhanced formatting');
        return this.generateEnhancedFormattedComment(analysisResult);
      }
    } catch (error) {
      console.warn('Failed to generate enhanced comment, falling back to enhanced format:', error);

      // First try the enhanced formatted comment as fallback
      try {
        return this.generateEnhancedFormattedComment(analysisResult);
      } catch (enhancedError) {
        console.warn('Enhanced formatting also failed, using basic format with detailed content:', enhancedError);

        // Final fallback with detailed content
        return this.generateBasicFormattedComment(analysisResult);
      }
    }
  }

  /**
   * Generate enhanced comment using LLM
   */
  private async generateEnhancedComment(analysisResult: any): Promise<string> {
    const issue = analysisResult.analysisResult?.issue;
    const analysis = analysisResult.analysisResult;

    if (!issue || !analysis) {
      throw new Error('Missing issue or analysis data for LLM comment generation');
    }

    const llmCallStart = Date.now();
    try {
      // Create a mock issue for the LLM service
      const mockIssue = {
        ...issue,
        number: this.context.issueNumber,
        state: 'open' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        html_url: `https://github.com/${this.context.owner}/${this.context.repo}/issues/${this.context.issueNumber}`,
        labels: issue.labels || []
      };

      console.log('🧠 Calling LLM service for enhanced comment generation...');

      // Use the existing LLM service to generate analysis report
      const llmReport = await this.llmService.generateAnalysisReport(mockIssue, analysis);

      // Track successful LLM call
      this.addLLMCall('comment-generation', true, Date.now() - llmCallStart);

      // Format the LLM report as a GitHub comment
      const comment = this.formatLLMReportAsComment(llmReport, analysisResult);
      return comment;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('LLM service failed:', errorMessage);

      // Track failed LLM call
      this.addLLMCall('comment-generation', false, Date.now() - llmCallStart, errorMessage);

      throw new Error(`LLM comment generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate basic formatted comment with detailed content as final fallback
   */
  private generateBasicFormattedComment(analysisResult: any): string {
    const sections = [];

    // Header
    sections.push('## 🤖 Automated Issue Analysis');
    sections.push('');

    // Include the detailed analysis text if available
    if (analysisResult.text && analysisResult.text.trim()) {
      sections.push('### 📊 Analysis Results');
      sections.push(analysisResult.text);
      sections.push('');
    } else {
      sections.push('Analysis completed successfully.');
      sections.push('');
    }

    // Execution info
    if (analysisResult.executionTime) {
      sections.push(`**Analysis completed in:** ${analysisResult.executionTime}ms`);
      sections.push('');
    }

    // Footer
    sections.push('---');
    sections.push('*This analysis was generated automatically by AutoDev GitHub Agent*');

    return sections.join('\n');
  }

  /**
   * Generate enhanced formatted comment without LLM
   */
  private generateEnhancedFormattedComment(analysisResult: any): string {
    const analysis = analysisResult.analysisResult;
    const processInfo = analysisResult.processInfo;
    const sections = [];

    // Header
    sections.push('## 🤖 Automated Issue Analysis');
    sections.push('');

    // Process Summary (new section for transparency)
    if (processInfo) {
      sections.push('### 🔍 Analysis Process');
      sections.push(`- **Files scanned:** ${processInfo.filesScanned}`);
      sections.push(`- **Files analyzed:** ${processInfo.filesAnalyzed}`);
      if (processInfo.filesFiltered > 0) {
        sections.push(`- **Files filtered:** ${processInfo.filesFiltered} (see details below)`);
      }
      sections.push(`- **Analysis steps:** ${processInfo.analysisSteps.length}`);
      sections.push('');
    }

    // Summary
    if (analysis?.summary) {
      sections.push('### 📋 Summary');
      sections.push(analysis.summary);
      sections.push('');
    }

    // Files analyzed
    if (analysis?.relatedCode?.files && analysis.relatedCode.files.length > 0) {
      sections.push('### 📁 Relevant Files');
      const topFiles = analysis.relatedCode.files.slice(0, 5);
      topFiles.forEach((file: any) => {
        sections.push(`- \`${file.path}\``);
      });
      if (analysis.relatedCode.files.length > 5) {
        sections.push(`- ... and ${analysis.relatedCode.files.length - 5} more files`);
      }
      sections.push('');
    }

    // Suggestions
    if (analysis?.suggestions && analysis.suggestions.length > 0) {
      sections.push('### 💡 Recommendations');
      analysis.suggestions.forEach((suggestion: any, index: number) => {
        const desc = suggestion.description || suggestion;
        sections.push(`${index + 1}. ${desc}`);
      });
      sections.push('');
    }

    // Original report content if available
    if (analysisResult.text && analysisResult.text.trim()) {
      sections.push('### 📊 Detailed Analysis');
      sections.push(analysisResult.text);
      sections.push('');
    } else {
      // If no detailed text, show a basic message
      sections.push('### 📊 Analysis Status');
      sections.push('Analysis completed successfully. The issue has been processed and analyzed.');
      sections.push('');
    }

    // Process details for transparency
    if (processInfo) {
      this.addProcessDetailsToComment(sections, processInfo);
    }

    // Execution info
    if (analysisResult.executionTime) {
      sections.push(`**Analysis completed in:** ${analysisResult.executionTime}ms`);
      sections.push('');
    }

    // Footer
    sections.push('---');
    sections.push('*This analysis was generated automatically by [AutoDev GitHub Agent](https://github.com/unit-mesh/autodev-worker)*');

    return sections.join('\n');
  }

  /**
   * Add process details to comment for transparency
   */
  private addProcessDetailsToComment(sections: string[], processInfo: AnalysisProcessInfo): void {
    // Show filtered files if any
    if (processInfo.filesFiltered > 0) {
      sections.push('### ⚠️ Files Filtered from Analysis');
      sections.push(`${processInfo.filesFiltered} files were not included in the analysis. This may include:`);
      sections.push('');

      if (processInfo.filteredFiles.length > 0) {
        processInfo.filteredFiles.forEach(file => {
          sections.push(`- \`${file.path}\` - ${file.reason}`);
        });
      } else {
        sections.push('- Configuration files (jest.config.js, rollup.config.mjs, etc.)');
        sections.push('- Test setup files (__tests__/setup.ts, etc.)');
        sections.push('- Build and package files (package.json, etc.)');
      }
      sections.push('');
      // Provide specific suggestions based on filtered files
      const suggestions = this.generateFilteringSuggestions(processInfo.filteredFiles);
      if (suggestions.length > 0) {
        sections.push('💡 **Suggestions to include these files:**');
        suggestions.forEach(suggestion => {
          sections.push(`- ${suggestion}`);
        });
      } else {
        sections.push('💡 **Tip:** If important files were filtered, try rephrasing your issue to mention specific file types or configurations.');
      }
      sections.push('');
    }

    // Show LLM call information
    if (processInfo.llmCalls.length > 0) {
      const failedLLMCalls = processInfo.llmCalls.filter(call => !call.success);
      if (failedLLMCalls.length > 0) {
        sections.push('### 🧠 LLM Analysis Issues');
        sections.push('Some AI analysis calls encountered issues:');
        sections.push('');
        failedLLMCalls.forEach(call => {
          sections.push(`- **${call.purpose}**: ${call.error || 'Unknown error'} (${call.duration}ms)`);
        });
        sections.push('');
      }
    }

    // Show analysis steps if there were failures
    const failedSteps = processInfo.analysisSteps.filter(s => s.status === 'failed');
    if (failedSteps.length > 0) {
      sections.push('### 🔧 Analysis Issues');
      sections.push('Some analysis steps encountered issues:');
      sections.push('');
      failedSteps.forEach(step => {
        sections.push(`- **${step.step}**: ${step.details}`);
      });
      sections.push('');
    }
  }

  /**
   * Generate diagnostic comment when analysis results are insufficient
   */
  private generateProcessDiagnosticComment(analysisResult: any): string {
    const sections = [];
    const processInfo = analysisResult?.processInfo;

    sections.push('## 🤖 Automated Issue Analysis');
    sections.push('');
    sections.push('### ⚠️ Analysis Completed with Limited Results');
    sections.push('');
    sections.push('The analysis process completed, but generated limited results. Here\'s what happened:');
    sections.push('');

    if (processInfo) {
      sections.push('### 🔍 Process Summary');
      sections.push(`- **Files scanned:** ${processInfo.filesScanned}`);
      sections.push(`- **Files analyzed:** ${processInfo.filesAnalyzed}`);
      sections.push(`- **Files filtered:** ${processInfo.filesFiltered}`);
      sections.push(`- **LLM calls made:** ${processInfo.llmCalls.length}`);

      const successfulLLMCalls = processInfo.llmCalls.filter(call => call.success).length;
      if (processInfo.llmCalls.length > 0) {
        sections.push(`- **LLM calls successful:** ${successfulLLMCalls}/${processInfo.llmCalls.length}`);
      }
      sections.push('');

      if (processInfo.filesFiltered > processInfo.filesAnalyzed) {
        sections.push('### 🚨 Possible Issue: Too Many Files Filtered');
        sections.push('Most files in your repository were filtered out as "not relevant" by the AI analysis.');
        sections.push('This might happen when:');
        sections.push('');
        sections.push('- The issue description is too vague or generic');
        sections.push('- The issue doesn\'t mention specific files, functions, or code areas');
        sections.push('- Configuration and test files are being excluded');
        sections.push('');
        sections.push('### 💡 Suggestions to Improve Analysis');
        sections.push('');
        sections.push('1. **Be more specific** in your issue description');
        sections.push('2. **Mention specific files** you think are related');
        sections.push('3. **Include error messages** or stack traces if applicable');
        sections.push('4. **Reference specific functions or classes** that might be involved');
        sections.push('5. **Mention configuration files** if the issue relates to build/test setup');
        sections.push('');
      }

      // Show failed LLM calls
      const failedLLMCalls = processInfo.llmCalls.filter(call => !call.success);
      if (failedLLMCalls.length > 0) {
        sections.push('### 🧠 LLM Analysis Issues');
        sections.push('AI analysis encountered some issues:');
        sections.push('');
        failedLLMCalls.forEach(call => {
          sections.push(`- **${call.purpose}**: ${call.error || 'Unknown error'}`);
        });
        sections.push('');
      }

      // Show failed steps
      const failedSteps = processInfo.analysisSteps.filter(s => s.status === 'failed');
      if (failedSteps.length > 0) {
        sections.push('### 🔧 Analysis Steps That Failed');
        failedSteps.forEach(step => {
          sections.push(`- **${step.step}**: ${step.details}`);
        });
        sections.push('');
      }
    }

    sections.push(`**Analysis completed in:** ${analysisResult?.executionTime || 'N/A'}ms`);
    sections.push('');
    sections.push('---');
    sections.push('*This analysis was generated automatically by [AutoDev GitHub Agent](https://github.com/unit-mesh/autodev-worker)*');

    return sections.join('\n');
  }

  /**
   * Format LLM analysis report as a GitHub comment
   */
  private formatLLMReportAsComment(llmReport: any, analysisResult: any): string {
    const sections = [];
    const processInfo = analysisResult.processInfo;

    // Header
    sections.push('## 🤖 Automated Issue Analysis');
    sections.push('');

    // Process Summary for transparency
    if (processInfo) {
      sections.push('### 🔍 Analysis Process');
      sections.push(`- **Files scanned:** ${processInfo.filesScanned}`);
      sections.push(`- **Files analyzed:** ${processInfo.filesAnalyzed}`);
      if (processInfo.filesFiltered > 0) {
        sections.push(`- **Files filtered:** ${processInfo.filesFiltered}`);
      }
      sections.push('');
    }

    // Summary
    if (llmReport.summary) {
      sections.push('### 📋 Summary');
      sections.push(llmReport.summary);
      sections.push('');
    }

    // Current Issues
    if (llmReport.current_issues && llmReport.current_issues.length > 0) {
      sections.push('### 🔍 Issues Identified');
      llmReport.current_issues.forEach((issue: string) => {
        sections.push(`- ${issue}`);
      });
      sections.push('');
    }

    // Recommendations
    if (llmReport.recommendations && llmReport.recommendations.length > 0) {
      sections.push('### 💡 Recommendations');
      llmReport.recommendations.forEach((rec: string, index: number) => {
        sections.push(`${index + 1}. ${rec}`);
      });
      sections.push('');
    }

    // Detailed Plan
    if (llmReport.detailed_plan && llmReport.detailed_plan.steps && llmReport.detailed_plan.steps.length > 0) {
      sections.push('### 📝 Implementation Plan');
      llmReport.detailed_plan.steps.forEach((step: any, index: number) => {
        sections.push(`#### ${index + 1}. ${step.title}`);
        if (step.description) {
          sections.push(step.description);
        }
        if (step.files_to_modify && step.files_to_modify.length > 0) {
          sections.push(`**Files to modify:** ${step.files_to_modify.join(', ')}`);
        }
        if (step.changes_needed && step.changes_needed.length > 0) {
          sections.push('**Changes needed:**');
          step.changes_needed.forEach((change: string) => {
            sections.push(`- ${change}`);
          });
        }
        sections.push('');
      });
    }

    // Process details for transparency
    if (processInfo) {
      this.addProcessDetailsToComment(sections, processInfo);
    }

    // Execution info
    if (analysisResult.executionTime) {
      sections.push(`**Analysis completed in:** ${analysisResult.executionTime}ms`);
      sections.push('');
    }

    // Footer
    sections.push('---');
    sections.push('*This analysis was generated automatically by [AutoDev GitHub Agent](https://github.com/unit-mesh/autodev-worker)*');

    return sections.join('\n');
  }

  /**
   * Update label configuration
   */
  setLabelConfig(config: Partial<LabelConfig>): void {
    this.labelConfig = { ...this.labelConfig, ...config };
  }

  /**
   * Scan workspace files to understand what's available
   */
  private async scanWorkspaceFiles(): Promise<void> {
    const scanStart = Date.now();
    try {
      const files = await this.getWorkspaceFiles(this.context.workspacePath);
      this.processInfo.filesScanned = files.length;

      console.log(`📁 Scanned ${files.length} files in workspace`);

      // Log some key files for transparency
      const configFiles = files.filter(f => this.isConfigFile(f));
      const testFiles = files.filter(f => this.isTestFile(f));
      const sourceFiles = files.filter(f => this.isSourceFile(f));

      console.log(`   - ${configFiles.length} configuration files`);
      console.log(`   - ${testFiles.length} test files`);
      console.log(`   - ${sourceFiles.length} source files`);

      this.addAnalysisStep('scan-workspace', 'completed', Date.now() - scanStart,
          `Scanned ${files.length} files (${configFiles.length} config, ${testFiles.length} test, ${sourceFiles.length} source)`);
    } catch (error) {
      this.addAnalysisStep('scan-workspace', 'failed', Date.now() - scanStart, `Failed to scan workspace: ${error}`);
      console.warn('Failed to scan workspace files:', error);
    }
  }

  /**
   * Get all files in workspace recursively
   */
  private async getWorkspaceFiles(dir: string, allFiles: string[] = []): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(dir);

      for (const file of files) {
        // Skip hidden files and common ignore patterns
        if (file.startsWith('.') || file === 'node_modules' || file === 'dist' || file === 'build') {
          continue;
        }

        const fullPath = path.join(dir, file);
        const stat = await fs.promises.stat(fullPath);

        if (stat.isDirectory()) {
          await this.getWorkspaceFiles(fullPath, allFiles);
        } else {
          allFiles.push(path.relative(this.context.workspacePath, fullPath));
        }
      }
    } catch (error) {
      // Ignore errors for individual files/directories
    }

    return allFiles;
  }

  /**
   * Check if file is a configuration file
   */
  private isConfigFile(filePath: string): boolean {
    const configPatterns = [
      /\.config\.(js|ts|mjs|json)$/,
      /^(package|tsconfig|jest|rollup|webpack|vite|babel)\..*$/,
      /\.(json|yaml|yml|toml)$/,
      /^(Dockerfile|docker-compose).*$/,
      /^\..*rc$/,
      /^\..*ignore$/
    ];

    const fileName = path.basename(filePath);
    return configPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Check if file is a test file
   */
  private isTestFile(filePath: string): boolean {
    const testPatterns = [
      /\.(test|spec)\.(js|ts|jsx|tsx)$/,
      /^__tests__\//,
      /\/tests?\//,
      /\/spec\//
    ];

    return testPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if file is a source file
   */
  private isSourceFile(filePath: string): boolean {
    const sourcePatterns = [
      /\.(js|ts|jsx|tsx|py|java|cpp|c|h|cs|php|rb|go|rs)$/
    ];

    return sourcePatterns.some(pattern => pattern.test(filePath)) &&
        !this.isTestFile(filePath) &&
        !this.isConfigFile(filePath);
  }

  /**
   * Add an analysis step to the process tracking
   */
  private addAnalysisStep(step: string, status: 'completed' | 'failed' | 'skipped', duration: number, details?: string): void {
    this.processInfo.analysisSteps.push({
      step,
      status,
      duration,
      details
    });
  }

  /**
   * Add an LLM call to the process tracking
   */
  private addLLMCall(purpose: string, success: boolean, duration: number, error?: string): void {
    this.processInfo.llmCalls.push({
      purpose,
      success,
      duration,
      error
    });
  }

  /**
   * Track which files were analyzed vs filtered by the ContextAnalyzer
   */
  private trackAnalysisResults(analysisResult: any): void {
    if (analysisResult?.relatedCode?.files) {
      this.processInfo.filesAnalyzed = analysisResult.relatedCode.files.length;
      console.log(`📊 Context analyzer processed ${this.processInfo.filesAnalyzed} files as relevant`);

      // Get the list of analyzed files
      const analyzedFiles = analysisResult.relatedCode.files.map((file: any) => file.path || file.name || file);

      // Calculate filtered files (this is an approximation since we don't have direct access to the filtering logic)
      this.processInfo.filesFiltered = Math.max(0, this.processInfo.filesScanned - this.processInfo.filesAnalyzed);

      if (this.processInfo.filesFiltered > 0) {
        console.log(`⚠️ ${this.processInfo.filesFiltered} files were filtered out as not relevant`);

        // Identify specific important files that were filtered (async, but don't wait)
        this.identifyFilteredImportantFiles(analyzedFiles).catch(error => {
          console.warn('Failed to identify filtered files:', error);
        });
      }
    }
  }

  /**
   * Identify specific important files that were filtered out
   */
  private async identifyFilteredImportantFiles(analyzedFiles: string[]): Promise<void> {
    try {
      // Get all files that were scanned
      const allFiles = await this.getWorkspaceFiles(this.context.workspacePath);

      // Find important files that were not analyzed
      const filteredImportantFiles = allFiles.filter(file => {
        // Skip if this file was analyzed
        if (analyzedFiles.some(analyzed => analyzed.includes(file) || file.includes(analyzed))) {
          return false;
        }

        // Check if this is an important file type
        return this.isImportantFile(file);
      });

      // Add specific filtered files with reasons
      filteredImportantFiles.slice(0, 5).forEach(file => {
        this.processInfo.filteredFiles.push({
          path: file,
          reason: this.getFilterReason(file)
        });
      });

      if (filteredImportantFiles.length > 0) {
        console.log(`🔍 Identified ${filteredImportantFiles.length} important files that were filtered:`);
        filteredImportantFiles.slice(0, 3).forEach(file => {
          console.log(`   - ${file}`);
        });
      }
    } catch (error) {
      console.warn('Failed to identify filtered files:', error);
      // Fallback to generic examples
      this.addGenericFilteredFileExamples();
    }
  }

  /**
   * Check if a file is considered important for analysis
   */
  private isImportantFile(filePath: string): boolean {
    return this.isConfigFile(filePath) ||
        this.isTestFile(filePath) ||
        this.isPackageFile(filePath) ||
        this.isDocumentationFile(filePath);
  }

  /**
   * Check if file is a package/dependency file
   */
  private isPackageFile(filePath: string): boolean {
    const packagePatterns = [
      /^package\.json$/,
      /^package-lock\.json$/,
      /^yarn\.lock$/,
      /^pnpm-lock\.yaml$/,
      /^Cargo\.toml$/,
      /^requirements\.txt$/,
      /^go\.mod$/
    ];

    const fileName = path.basename(filePath);
    return packagePatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Check if file is a documentation file
   */
  private isDocumentationFile(filePath: string): boolean {
    const docPatterns = [
      /^README\.(md|txt|rst)$/i,
      /^CHANGELOG\.(md|txt|rst)$/i,
      /^CONTRIBUTING\.(md|txt|rst)$/i,
      /\.md$/,
      /\/docs?\//
    ];

    return docPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Get the reason why a file was likely filtered
   */
  private getFilterReason(filePath: string): string {
    if (this.isConfigFile(filePath)) {
      return 'Configuration files are often filtered unless specifically mentioned in the issue';
    }
    if (this.isTestFile(filePath)) {
      return 'Test files may be filtered if the issue doesn\'t mention testing or test failures';
    }
    if (this.isPackageFile(filePath)) {
      return 'Package files are filtered unless the issue mentions dependencies or installation problems';
    }
    if (this.isDocumentationFile(filePath)) {
      return 'Documentation files are filtered unless the issue is about documentation';
    }
    return 'File was determined to be not directly relevant to the issue content';
  }

  /**
   * Add generic examples when specific detection fails
   */
  private addGenericFilteredFileExamples(): void {
    const commonFilteredTypes = [
      { path: 'jest.config.js', reason: 'Configuration files often filtered by LLM as not directly relevant to issue content' },
      { path: 'rollup.config.mjs', reason: 'Build configuration files typically excluded from issue analysis' },
      { path: '__tests__/setup.ts', reason: 'Test setup files may be filtered if issue doesn\'t mention testing' }
    ];

    this.processInfo.filteredFiles.push(...commonFilteredTypes);
  }

  /**
   * Generate specific suggestions based on filtered file types
   */
  private generateFilteringSuggestions(filteredFiles: Array<{path: string; reason: string}>): string[] {
    const suggestions: string[] = [];
    const fileTypes = new Set<string>();

    filteredFiles.forEach(file => {
      if (this.isConfigFile(file.path)) {
        fileTypes.add('config');
      }
      if (this.isTestFile(file.path)) {
        fileTypes.add('test');
      }
      if (this.isPackageFile(file.path)) {
        fileTypes.add('package');
      }
      if (this.isDocumentationFile(file.path)) {
        fileTypes.add('docs');
      }
    });

    if (fileTypes.has('config')) {
      suggestions.push('Mention "configuration", "config files", or specific config file names if your issue relates to build/setup');
    }
    if (fileTypes.has('test')) {
      suggestions.push('Include "test", "testing", or "test failure" if your issue involves test problems');
    }
    if (fileTypes.has('package')) {
      suggestions.push('Reference "dependencies", "package.json", or "installation" if your issue involves packages');
    }
    if (fileTypes.has('docs')) {
      suggestions.push('Mention "documentation" or "README" if your issue is about docs or examples');
    }

    return suggestions;
  }

  /**
   * Log a summary of the analysis process
   */
  private logAnalysisSummary(): void {
    console.log('\n📋 Analysis Process Summary:');
    console.log(`   Files scanned: ${this.processInfo.filesScanned}`);
    console.log(`   Files analyzed: ${this.processInfo.filesAnalyzed}`);
    console.log(`   Files filtered: ${this.processInfo.filesFiltered}`);
    console.log(`   Analysis steps: ${this.processInfo.analysisSteps.length}`);
    console.log(`   LLM calls: ${this.processInfo.llmCalls.length}`);

    const failedSteps = this.processInfo.analysisSteps.filter(s => s.status === 'failed');
    if (failedSteps.length > 0) {
      console.log(`   Failed steps: ${failedSteps.length}`);
      failedSteps.forEach(step => {
        console.log(`     - ${step.step}: ${step.details}`);
      });
    }

    const failedLLMCalls = this.processInfo.llmCalls.filter(call => !call.success);
    if (failedLLMCalls.length > 0) {
      console.log(`   Failed LLM calls: ${failedLLMCalls.length}`);
      failedLLMCalls.forEach(call => {
        console.log(`     - ${call.purpose}: ${call.error}`);
      });
    }

    // Provide insights about filtering
    if (this.processInfo.filesFiltered > this.processInfo.filesAnalyzed) {
      console.log('\n⚠️ Notice: More files were filtered than analyzed.');
      console.log('   This might indicate that the issue description is too generic.');
      console.log('   Consider being more specific about which files or areas are affected.');
    }
  }
}
