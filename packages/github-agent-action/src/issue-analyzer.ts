import {
  GitHubService,
  ContextAnalyzer,
  AnalysisReportGenerator,
  fetchUrlsFromIssue
} from '@autodev/github-agent';
import {
  ActionContext,
  AnalysisOptions,
  ActionResult,
  CommentTemplate,
  LabelConfig
} from './types';

export class IssueAnalyzer {
  private githubService: GitHubService;
  private contextAnalyzer: ContextAnalyzer;
  private reportGenerator: AnalysisReportGenerator;
  private context: ActionContext;
  private commentTemplate: CommentTemplate;
  private labelConfig: LabelConfig;

  constructor(context: ActionContext) {
    this.context = context;

    // Initialize services using the same pattern as analyze-issue.js
    this.githubService = new GitHubService(context.config.githubToken);
    this.contextAnalyzer = new ContextAnalyzer(context.workspacePath);
    this.reportGenerator = new AnalysisReportGenerator(context.config.githubToken);

    // Default comment template
    this.commentTemplate = {
      header: '## 🤖 Automated Issue Analysis',
      analysisSection: '### Analysis Results',
      suggestionsSection: '### Recommendations',
      footer: '\n---\n*This analysis was generated automatically by AutoDev GitHub Agent*'
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
   * Generate comment text for the issue using agent's response directly
   */
  generateComment(analysisResult: any): string {
    if (!analysisResult || !analysisResult.text) {
      return `${this.commentTemplate.header}

Analysis completed successfully. Please check the analysis results for detailed information.

${this.commentTemplate.footer}`;
    }

    // Use the agent's response directly as it already contains comprehensive analysis
    return `${this.commentTemplate.header}

${analysisResult.text}

Analysis completed in: ${analysisResult.executionTime || 'N/A'}ms

${this.commentTemplate.footer}`;
  }

  /**
   * Update comment template
   */
  setCommentTemplate(template: Partial<CommentTemplate>): void {
    this.commentTemplate = { ...this.commentTemplate, ...template };
  }

  /**
   * Update label configuration
   */
  setLabelConfig(config: Partial<LabelConfig>): void {
    this.labelConfig = { ...this.labelConfig, ...config };
  }
}
