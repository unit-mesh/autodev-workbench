import { LLMService } from "../llm";
import { GitHubService } from "../github";
import { IssueAnalysisResult } from "../../types";

interface AnalysisReportOptions {
  uploadToGitHub?: boolean;
  language?: 'en' | 'zh';
  includeFileContent?: boolean;
  maxFiles?: number;
}

interface UploadResult {
  success: boolean;
  commentId?: number;
  commentUrl?: string;
  error?: string;
}

export class AnalysisReportGenerator {
  private llmService: LLMService;
  private githubService: GitHubService;

  constructor(githubToken: string) {
    this.llmService = new LLMService();
    this.githubService = new GitHubService(githubToken);
  }

  /**
   * Generate and optionally upload analysis report to GitHub issue
   */
  async generateAndUploadReport(
    owner: string,
    repo: string,
    issueNumber: number,
    analysisResult: IssueAnalysisResult,
    options: AnalysisReportOptions = {}
  ): Promise<{
    report: string;
    uploadResult?: UploadResult;
  }> {
    const {
      uploadToGitHub = false,
      language = 'en',
      includeFileContent = false,
      maxFiles = 10
    } = options;

    // Generate LLM-powered analysis report
    const llmReport = await this.llmService.generateAnalysisReport(
      analysisResult.issue,
      analysisResult
    );

    // Format the report as markdown
    const markdownReport = this.formatReportAsMarkdown(
      llmReport,
      analysisResult,
      language,
      includeFileContent,
      maxFiles
    );

    let uploadResult: UploadResult | undefined;

    if (uploadToGitHub) {
      try {
        const comment = await this.githubService.addIssueComment(
          owner,
          repo,
          issueNumber,
          markdownReport
        );

        uploadResult = {
          success: true,
          commentId: comment.id,
          commentUrl: comment.html_url
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        uploadResult = {
          success: false,
          error: errorMessage
        };
      }
    }

    return {
      report: markdownReport,
      uploadResult
    };
  }

  /**
   * Format LLM analysis report as GitHub-compatible markdown
   */
  private formatReportAsMarkdown(
    llmReport: any,
    _analysisResult: IssueAnalysisResult,
    language: 'en' | 'zh',
    _includeFileContent: boolean,
    _maxFiles: number
  ): string {
    const isZh = language === 'zh';

    const sections = [];

    // Header
    sections.push(isZh ? '# 分析和优化计划' : '# Analysis and Plan');

    if (isZh) {
      sections.push('基于我对代码的分析，我发现了以下问题和改进机会：');
    }

    // Current Issues - Format as bullet points with descriptions
    if (llmReport.current_issues && llmReport.current_issues.length > 0) {
      sections.push(isZh ? '## 当前问题：' : '## Current Issues Identified:');
      llmReport.current_issues.forEach((issue: string) => {
        sections.push(`- ${issue}`);
      });
    }

    // Detailed Plan - Format as numbered sections with sub-bullets
    if (llmReport.detailed_plan && llmReport.detailed_plan.steps) {
      sections.push('');
      sections.push(isZh ? '## 优化计划：' : '## Detailed Plan:');
      llmReport.detailed_plan.steps.forEach((step: any, index: number) => {
        sections.push(`### ${index + 1}. ${step.title}`);

        if (step.files_to_modify && step.files_to_modify.length > 0) {
          sections.push(`- File to modify: ${step.files_to_modify.join(', ')}`);
        }

        if (step.changes_needed && step.changes_needed.length > 0) {
          sections.push(`- Changes needed:`);
          step.changes_needed.forEach((change: string) => {
            sections.push(`\t- ${change}`);
          });
        }

        if (step.description && !step.files_to_modify && !step.changes_needed) {
          sections.push(`- ${step.description}`);
        }
      });
    }

    // Footer
    sections.push('');
    sections.push('---');
    sections.push('');
    sections.push('Powered by [AutoDev Remote AI Agent](https://github.com/unit-mesh/autodev-workbench)');

    return sections.join('\n');
  }
}
