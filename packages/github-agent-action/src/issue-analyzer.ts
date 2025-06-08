import { AIAgent, AgentConfig } from '@autodev/github-agent';
import {
  ActionContext,
  AnalysisOptions,
  ActionResult,
  CommentTemplate,
  LabelConfig
} from './types';

export class IssueAnalyzer {
  private agent: AIAgent;
  private context: ActionContext;
  private commentTemplate: CommentTemplate;
  private labelConfig: LabelConfig;

  constructor(context: ActionContext, agentConfig?: AgentConfig) {
    this.context = context;

    // Initialize AI Agent with enhanced configuration matching github-agent behavior
    const enhancedConfig: AgentConfig = {
      workspacePath: context.workspacePath,
      githubToken: context.config.githubToken,
      verbose: true,
      maxToolRounds: 3,
      enableToolChaining: true,
      toolTimeout: 120000,
      ...agentConfig
    };

    this.agent = new AIAgent(enhancedConfig);

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
   * Analyze an issue using the same logic as github-agent
   */
  async analyzeIssue(options: AnalysisOptions = {}): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      console.log(`🔍 Starting analysis for issue #${this.context.issueNumber} in ${this.context.owner}/${this.context.repo}`);

      // Use the same prompt format as the original github-agent
      const analysisPrompt = `Analyze GitHub issue #${this.context.issueNumber} in repository ${this.context.owner}/${this.context.repo}. Please provide a comprehensive analysis including code search, root cause analysis, and actionable recommendations.`;

      // Execute analysis using AI Agent with the same context format as github-agent
      const agentResponse = await this.agent.processInput(analysisPrompt, {
        owner: this.context.owner,
        repo: this.context.repo,
        issue_number: this.context.issueNumber,
        workspace_path: this.context.workspacePath,
        analysis_depth: options.depth || 'medium'
      });

      if (!agentResponse.success) {
        throw new Error(`Analysis failed: ${agentResponse.error}`);
      }

      // Use the agent's response directly instead of generating our own report
      const result: ActionResult = {
        success: true,
        analysisResult: {
          text: agentResponse.text,
          toolResults: agentResponse.toolResults,
          totalRounds: agentResponse.totalRounds,
          executionTime: agentResponse.executionTime
        },
        executionTime: Date.now() - startTime
      };

      // Generate labels based on the agent's analysis
      const recommendedLabels = this.extractLabelsFromAnalysis(agentResponse.text);
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
