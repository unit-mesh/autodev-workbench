import { GitHubIssue, IssueAnalysisResult } from "../../types/index";
import { configureLLMProvider, LLMProviderConfig } from "./llm-provider";
import {
  LLMKeywordAnalysis,
  CodeRelevanceAnalysis,
  StructuredAnalysisPlan,
  LLMAnalysisReport
} from "../analysis/FallbackAnalysisService";
import { KeywordAnalysisService } from "./keyword-analysis-service";
import { CodeRelevanceAnalysisService } from "./code-relevance-analysis-service";
import { AnalysisReportService } from "./analysis-report-service";
import { LLMLogger } from "./llm-logger";

export class LLMService {
  private llmConfig: LLMProviderConfig | null;
  private logger: LLMLogger;
  private keywordAnalysisService: KeywordAnalysisService;
  private codeRelevanceAnalysisService: CodeRelevanceAnalysisService;
  private analysisReportService: AnalysisReportService;

  constructor() {
    // Configure LLM provider
    this.llmConfig = configureLLMProvider();

    // Initialize logger
    this.logger = new LLMLogger('llm-service.log');

    // Initialize specialized services
    this.keywordAnalysisService = new KeywordAnalysisService();
    this.codeRelevanceAnalysisService = new CodeRelevanceAnalysisService();
    this.analysisReportService = new AnalysisReportService();

    // Only log LLM provider info in verbose mode to reduce noise
    if (this.llmConfig && process.env.VERBOSE_LLM_LOGS === 'true') {
      console.log(`🤖 Using LLM provider: ${this.llmConfig.providerName}`);
    } else if (!this.llmConfig && process.env.VERBOSE_LLM_LOGS === 'true') {
      console.warn('⚠️  No LLM provider available. LLM features will be disabled.');
    }
  }

  /**
   * Check if LLM service is available
   */
  isAvailable(): boolean {
    return this.llmConfig !== null;
  }

  /**
   * Get the current LLM provider name
   */
  getProviderName(): string {
    return this.llmConfig?.providerName || 'None';
  }

  /**
   * Analyze issue for keywords - delegates to KeywordAnalysisService
   */
  async analyzeIssueForKeywords(issue: GitHubIssue & { urlContent?: any[] }): Promise<LLMKeywordAnalysis> {
    this.logger.log('Delegating keyword analysis to KeywordAnalysisService', {
      issueNumber: issue.number,
      issueTitle: issue.title
    });

    return this.keywordAnalysisService.analyzeIssueForKeywords(issue, this.llmConfig);
  }

  /**
   * Analyze code relevance - delegates to CodeRelevanceAnalysisService
   */
  async analyzeCodeRelevance(
    issue: GitHubIssue & { urlContent?: any[] },
    filePath: string,
    fileContent: string
  ): Promise<CodeRelevanceAnalysis> {
    this.logger.log('Delegating code relevance analysis to CodeRelevanceAnalysisService', {
      issueNumber: issue.number,
      filePath: filePath,
      contentLength: fileContent.length
    });

    return this.codeRelevanceAnalysisService.analyzeCodeRelevance(
      issue,
      filePath,
      fileContent,
      this.llmConfig
    );
  }

  /**
   * Generate analysis report - delegates to AnalysisReportService
   */
  async generateAnalysisReport(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult
  ): Promise<LLMAnalysisReport> {
    this.logger.log('Delegating analysis report generation to AnalysisReportService', {
      issueNumber: issue.number,
      analysisResultSummary: analysisResult.summary
    });

    return this.analysisReportService.generateAnalysisReport(issue, analysisResult, this.llmConfig);
  }

  /**
   * Generate structured analysis plan - delegates to AnalysisReportService
   */
  async generateStructuredAnalysisPlan(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    language: 'zh' | 'en' = 'en'
  ): Promise<StructuredAnalysisPlan> {
    this.logger.log('Delegating structured analysis plan generation to AnalysisReportService', {
      issueNumber: issue.number,
      language: language,
      analysisResultSummary: analysisResult.summary
    });

    return this.analysisReportService.generateStructuredAnalysisPlan(
      issue,
      analysisResult,
      language,
      this.llmConfig
    );
  }

  /**
   * Get the LLM configuration (for backward compatibility)
   */
  getLLMConfig(): LLMProviderConfig | null {
    return this.llmConfig;
  }

  /**
   * Get logger instance (for debugging or external use)
   */
  getLogger(): LLMLogger {
    return this.logger;
  }

  /**
   * Get individual service instances (for advanced usage or testing)
   */
  getServices() {
    return {
      keywordAnalysis: this.keywordAnalysisService,
      codeRelevanceAnalysis: this.codeRelevanceAnalysisService,
      analysisReport: this.analysisReportService
    };
  }
}
