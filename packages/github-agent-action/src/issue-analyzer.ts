import { AIAgent, AgentConfig } from '@autodev/github-agent';
import { 
  ActionContext, 
  AnalysisOptions, 
  AnalysisReport, 
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
    
    // Initialize AI Agent with enhanced configuration
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
   * Analyze an issue and generate comprehensive report
   */
  async analyzeIssue(options: AnalysisOptions = {}): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      console.log(`🔍 Starting analysis for issue #${this.context.issueNumber} in ${this.context.owner}/${this.context.repo}`);

      // Build analysis prompt based on context
      const analysisPrompt = this.buildAnalysisPrompt(options);

      // Execute analysis using AI Agent
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

      // Generate structured report
      const report = await this.generateReport(agentResponse);

      // Determine recommended actions
      const recommendedLabels = this.determineLabels(report);

      const result: ActionResult = {
        success: true,
        analysisResult: agentResponse.toolResults.find((r: any) => r.success)?.result,
        labelsAdded: recommendedLabels,
        executionTime: Date.now() - startTime
      };

      // Add comment if configured
      if (this.context.config.autoComment) {
        const comment = this.generateComment(report);
        result.commentAdded = true;
        console.log('📝 Generated analysis comment:', comment.substring(0, 200) + '...');
      }

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
   * Build analysis prompt based on issue context and options
   */
  private buildAnalysisPrompt(options: AnalysisOptions): string {
    const { depth = 'medium', includeCodeSearch = true, includeSymbolAnalysis = true } = options;

    let prompt = `Analyze GitHub issue #${this.context.issueNumber} in repository ${this.context.owner}/${this.context.repo}.

Please provide a comprehensive analysis including:

1. **Issue Understanding**: Summarize what the issue is about
2. **Code Analysis**: Find relevant code files and functions related to this issue
3. **Root Cause Analysis**: Identify potential causes and areas of concern
4. **Recommendations**: Provide specific, actionable suggestions for resolution
5. **Complexity Assessment**: Estimate the complexity and effort required

Analysis Configuration:
- Depth: ${depth}
- Include Code Search: ${includeCodeSearch}
- Include Symbol Analysis: ${includeSymbolAnalysis}
- Workspace: ${this.context.workspacePath}

Focus on providing practical, actionable insights that will help developers understand and resolve the issue efficiently.`;

    // Add specific instructions based on depth
    switch (depth) {
      case 'shallow':
        prompt += '\n\nPerform a quick analysis focusing on the most obvious patterns and immediate code references.';
        break;
      case 'deep':
        prompt += '\n\nPerform an in-depth analysis including dependency analysis, architectural patterns, and comprehensive code exploration.';
        break;
      default: // medium
        prompt += '\n\nPerform a balanced analysis covering key code areas and providing meaningful insights without excessive detail.';
    }

    return prompt;
  }

  /**
   * Generate structured analysis report
   */
  private async generateReport(agentResponse: any): Promise<AnalysisReport> {
    const report: AnalysisReport = {
      issueNumber: this.context.issueNumber,
      repository: `${this.context.owner}/${this.context.repo}`,
      analysisTimestamp: new Date().toISOString(),
      summary: agentResponse.text || 'Analysis completed',
      codeReferences: [],
      suggestions: [],
      relatedIssues: [],
      estimatedComplexity: 'medium',
      recommendedLabels: []
    };

    // Extract code references from tool results
    const toolResults = agentResponse.toolResults || [];
    for (const result of toolResults) {
      if (result.success && result.result?.content) {
        // Parse tool results to extract code references
        // This would be enhanced based on actual tool result structure
        report.codeReferences.push({
          file: result.functionCall?.parameters?.file || 'unknown',
          relevance: 0.8,
          description: 'Found relevant code section'
        });
      }
    }

    // Generate suggestions based on analysis
    report.suggestions = this.extractSuggestions(agentResponse.text);

    // Estimate complexity
    report.estimatedComplexity = this.estimateComplexity(report);

    return report;
  }

  /**
   * Extract actionable suggestions from analysis text
   */
  private extractSuggestions(analysisText: string): AnalysisReport['suggestions'] {
    const suggestions: AnalysisReport['suggestions'] = [];

    // Simple pattern matching for common suggestion types
    if (analysisText.toLowerCase().includes('bug') || analysisText.toLowerCase().includes('error')) {
      suggestions.push({
        type: 'fix',
        priority: 'high',
        description: 'Investigate and fix the identified bug or error'
      });
    }

    if (analysisText.toLowerCase().includes('enhancement') || analysisText.toLowerCase().includes('improve')) {
      suggestions.push({
        type: 'enhancement',
        priority: 'medium',
        description: 'Consider implementing the suggested enhancement'
      });
    }

    if (analysisText.toLowerCase().includes('investigate') || analysisText.toLowerCase().includes('unclear')) {
      suggestions.push({
        type: 'investigation',
        priority: 'medium',
        description: 'Further investigation needed to understand the issue'
      });
    }

    return suggestions;
  }

  /**
   * Estimate issue complexity based on analysis
   */
  private estimateComplexity(report: AnalysisReport): 'low' | 'medium' | 'high' {
    let complexityScore = 0;

    // Factor in number of code references
    complexityScore += Math.min(report.codeReferences.length * 0.2, 1);

    // Factor in number of suggestions
    complexityScore += Math.min(report.suggestions.length * 0.3, 1);

    // Factor in suggestion types
    const hasHighPriority = report.suggestions.some(s => s.priority === 'high');
    if (hasHighPriority) complexityScore += 0.5;

    if (complexityScore < 0.3) return 'low';
    if (complexityScore < 0.7) return 'medium';
    return 'high';
  }

  /**
   * Determine appropriate labels based on analysis
   */
  private determineLabels(report: AnalysisReport): string[] {
    const labels: string[] = [];

    // Add complexity-based labels
    if (report.estimatedComplexity === 'high') {
      labels.push('complex');
    }

    // Add suggestion-based labels
    const hasBugSuggestion = report.suggestions.some(s => s.type === 'fix');
    const hasEnhancementSuggestion = report.suggestions.some(s => s.type === 'enhancement');

    if (hasBugSuggestion && this.labelConfig.bugLabel) {
      labels.push(this.labelConfig.bugLabel);
    }

    if (hasEnhancementSuggestion && this.labelConfig.enhancementLabel) {
      labels.push(this.labelConfig.enhancementLabel);
    }

    // Add analysis complete label
    if (this.labelConfig.analysisCompleteLabel) {
      labels.push(this.labelConfig.analysisCompleteLabel);
    }

    return labels;
  }

  /**
   * Generate comment text for the issue
   */
  private generateComment(report: AnalysisReport): string {
    const sections: string[] = [];

    // Header
    if (this.commentTemplate.header) {
      sections.push(this.commentTemplate.header);
    }

    // Analysis section
    sections.push(`\n${this.commentTemplate.analysisSection || '### Analysis'}`);
    sections.push(`\n**Complexity**: ${report.estimatedComplexity}`);
    sections.push(`**Code References Found**: ${report.codeReferences.length}`);
    
    if (report.summary) {
      sections.push(`\n${report.summary}`);
    }

    // Code references
    if (report.codeReferences.length > 0) {
      sections.push('\n**Relevant Code Files:**');
      report.codeReferences.slice(0, 5).forEach(ref => {
        sections.push(`- \`${ref.file}\`${ref.line ? ` (line ${ref.line})` : ''}: ${ref.description}`);
      });
    }

    // Suggestions section
    if (report.suggestions.length > 0) {
      sections.push(`\n${this.commentTemplate.suggestionsSection || '### Recommendations'}`);
      report.suggestions.forEach((suggestion, index) => {
        const priority = suggestion.priority === 'high' ? '🔴' : suggestion.priority === 'medium' ? '🟡' : '🟢';
        sections.push(`${index + 1}. ${priority} **${suggestion.type.toUpperCase()}**: ${suggestion.description}`);
      });
    }

    // Footer
    if (this.commentTemplate.footer) {
      sections.push(this.commentTemplate.footer);
    }

    return sections.join('\n');
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
