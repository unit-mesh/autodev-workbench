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
  LabelConfig
} from './types';

export class IssueAnalyzer {
  private githubService: GitHubService;
  private contextAnalyzer: ContextAnalyzer;
  private reportGenerator: AnalysisReportGenerator;
  private llmService: LLMService;
  private context: ActionContext;
  private labelConfig: LabelConfig;

  constructor(context: ActionContext) {
    this.context = context;

    // Initialize services using the same pattern as analyze-issue.js
    this.githubService = new GitHubService(context.config.githubToken);
    this.contextAnalyzer = new ContextAnalyzer(context.workspacePath);
    this.reportGenerator = new AnalysisReportGenerator(context.config.githubToken);
    this.llmService = new LLMService();

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

      // Step 1: Get the issue (same as analyze-issue.js line 327)
      const issue = await this.githubService.getIssue(
        this.context.owner,
        this.context.repo,
        this.context.issueNumber
      );

      console.log(`📋 Issue: "${issue.title}"`);

      // Step 2: Fetch URL content if enabled (same as analyze-issue.js line 360)
      let urlContent: any[] = [];
      if (options.includeCodeSearch !== false && issue.body) {
        try {
          urlContent = await fetchUrlsFromIssue(issue.body, 10000);
          console.log(`🔗 Fetched content from ${urlContent.length} URLs`);
        } catch (error) {
          console.warn('URL fetching failed:', error);
        }
      }

      // Step 3: Enhance issue with URL content (same as analyze-issue.js line 384)
      const enhancedIssue = {
        ...issue,
        urlContent: urlContent
      };

      // Step 4: Perform the analysis (same as analyze-issue.js line 391)
      const analysisResult = await this.contextAnalyzer.analyzeIssue(enhancedIssue);

      // Step 5: Generate comprehensive report (same as analyze-issue.js line 408)
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

      // Use the generated report as our analysis result
      const result: ActionResult = {
        success: true,
        analysisResult: {
          text: report, // This is the detailed analysis text
          analysisResult: analysisResult,
          executionTime: Date.now() - startTime
        },
        executionTime: Date.now() - startTime
      };

      // Generate labels based on the analysis
      const recommendedLabels = this.extractLabelsFromAnalysis(report);
      result.labelsAdded = recommendedLabels;

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
    if (!analysisResult || !analysisResult.analysisResult) {
      return `## 🤖 Automated Issue Analysis

Analysis completed successfully. Please check the analysis results for detailed information.

---
*This analysis was generated automatically by AutoDev GitHub Agent*`;
    }

    // Try to generate enhanced comment using LLM
    try {
      if (this.llmService.isAvailable()) {
        const comment = await this.generateEnhancedComment(analysisResult);
        return comment;
      } else {
        console.log('LLM service not available, using enhanced formatting');
        return this.generateEnhancedFormattedComment(analysisResult);
      }
    } catch (error) {
      console.warn('Failed to generate enhanced comment, falling back to basic format:', error);

      // Fallback to using the report text directly
      return `## 🤖 Automated Issue Analysis

${analysisResult.text || 'Analysis completed successfully.'}

**Analysis completed in:** ${analysisResult.executionTime || 'N/A'}ms

---
*This analysis was generated automatically by AutoDev GitHub Agent*`;
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

      // Use the existing LLM service to generate analysis report
      const llmReport = await this.llmService.generateAnalysisReport(mockIssue, analysis);

      // Format the LLM report as a GitHub comment
      const comment = this.formatLLMReportAsComment(llmReport, analysisResult);
      return comment;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('LLM service failed:', errorMessage);
      throw new Error(`LLM comment generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate enhanced formatted comment without LLM
   */
  private generateEnhancedFormattedComment(analysisResult: any): string {
    const analysis = analysisResult.analysisResult;
    const sections = [];

    // Header
    sections.push('## 🤖 Automated Issue Analysis');
    sections.push('');

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
    if (analysisResult.text) {
      sections.push('### 📊 Detailed Analysis');
      sections.push(analysisResult.text);
      sections.push('');
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
   * Format LLM analysis report as a GitHub comment
   */
  private formatLLMReportAsComment(llmReport: any, analysisResult: any): string {
    const sections = [];

    // Header
    sections.push('## 🤖 Automated Issue Analysis');
    sections.push('');

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
}
