import { GitHubIssue, IssueAnalysisResult } from "../../types/index";
import { configureLLMProvider, LLMProviderConfig } from "./llm-provider";
import {
  LLMKeywordAnalysis,
  CodeRelevanceAnalysis,
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
    this.llmConfig = configureLLMProvider();
    this.logger = new LLMLogger('llm-service.log');

    this.keywordAnalysisService = new KeywordAnalysisService();
    this.codeRelevanceAnalysisService = new CodeRelevanceAnalysisService();
    this.analysisReportService = new AnalysisReportService();

    if (this.llmConfig && process.env.VERBOSE_LLM_LOGS === 'true') {
      console.log(`🤖 Using LLM provider: ${this.llmConfig.providerName}`);
    } else if (!this.llmConfig && process.env.VERBOSE_LLM_LOGS === 'true') {
      console.warn('⚠️  No LLM provider available. LLM features will be disabled.');
    }
  }

  isAvailable(): boolean {
    return this.llmConfig !== null;
  }

  async analyzeIssueForKeywords(issue: GitHubIssue & { urlContent?: any[] }): Promise<LLMKeywordAnalysis> {
    this.logger.log('Delegating keyword analysis to KeywordAnalysisService', {
      issueNumber: issue.number,
      issueTitle: issue.title
    });

    return this.keywordAnalysisService.analyzeIssueForKeywords(issue, this.llmConfig);
  }

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

  async generateAnalysisReport(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult
  ): Promise<LLMAnalysisReport> {
    this.logger.log('Delegating analysis report generation to AnalysisReportService', { issueNumber: issue.number });

    return this.analysisReportService.generateAnalysisReport(issue, analysisResult, this.llmConfig);
  }
}
