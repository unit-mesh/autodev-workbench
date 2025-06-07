import { GitHubIssue, IssueAnalysisResult } from "../types/index";
import { LLMService } from "./llm-service";
import { GitHubService } from "./github-service";

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
      } catch (error: any) {
        uploadResult = {
          success: false,
          error: error.message
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
    analysisResult: IssueAnalysisResult,
    language: 'en' | 'zh',
    includeFileContent: boolean,
    maxFiles: number
  ): string {
    const isZh = language === 'zh';
    
    const sections = [];

    // Header
    sections.push(isZh ? '# 分析和优化计划' : '# Analysis and Plan');
    sections.push('');
    sections.push(isZh ? 
      `基于我对代码的分析，我发现了以下问题和改进机会：` :
      `Based on my code analysis, I have identified the following issues and improvement opportunities:`
    );
    sections.push('');

    // Summary
    sections.push(isZh ? '## 分析摘要' : '## Analysis Summary');
    sections.push(llmReport.summary);
    sections.push('');

    // Current Issues
    if (llmReport.current_issues && llmReport.current_issues.length > 0) {
      sections.push(isZh ? '## 当前问题：' : '## Current Issues:');
      llmReport.current_issues.forEach((issue: string, index: number) => {
        sections.push(`${index + 1}. ${issue}`);
      });
      sections.push('');
    }

    // Detailed Plan
    if (llmReport.detailed_plan && llmReport.detailed_plan.steps) {
      sections.push(isZh ? '## 优化计划：' : '## Optimization Plan:');
      llmReport.detailed_plan.steps.forEach((step: any) => {
        sections.push(`### ${step.step_number}. ${step.title}`);
        sections.push(step.description);
        
        if (step.files_to_modify && step.files_to_modify.length > 0) {
          sections.push(isZh ? '**需要修改的文件：**' : '**Files to modify:**');
          step.files_to_modify.forEach((file: string) => {
            sections.push(`- ${file}`);
          });
        }
        
        if (step.changes_needed && step.changes_needed.length > 0) {
          sections.push(isZh ? '**需要的更改：**' : '**Changes needed:**');
          step.changes_needed.forEach((change: string) => {
            sections.push(`- ${change}`);
          });
        }
        sections.push('');
      });
    }

    // Recommendations
    if (llmReport.recommendations && llmReport.recommendations.length > 0) {
      sections.push(isZh ? '## 建议：' : '## Recommendations:');
      llmReport.recommendations.forEach((rec: string, index: number) => {
        sections.push(`${index + 1}. ${rec}`);
      });
      sections.push('');
    }

    // Relevant Files Section
    const relevantFiles = analysisResult.relatedCode.files.slice(0, maxFiles);
    if (relevantFiles.length > 0) {
      sections.push(isZh ? '## 相关文件：' : '## Relevant Files:');
      relevantFiles.forEach((file: any) => {
        sections.push(`### ${file.path}`);
        sections.push(isZh ? `**相关性评分：** ${file.relevance}` : `**Relevance Score:** ${file.relevance}`);
        
        if (file.reason) {
          sections.push(isZh ? `**原因：** ${file.reason}` : `**Reason:** ${file.reason}`);
        }
        
        if (includeFileContent && file.content) {
          sections.push('');
          sections.push('```' + (file.language || ''));
          sections.push(file.content.substring(0, 2000)); // Limit content length
          if (file.content.length > 2000) {
            sections.push('...');
          }
          sections.push('```');
        }
        sections.push('');
      });
    }

    // Relevant Symbols
    const relevantSymbols = analysisResult.relatedCode.symbols.slice(0, 8);
    if (relevantSymbols.length > 0) {
      sections.push(isZh ? '## 相关符号：' : '## Relevant Symbols:');
      relevantSymbols.forEach((symbol: any) => {
        sections.push(`- **${symbol.name}** (${symbol.kind}) - ${symbol.file}`);
      });
      sections.push('');
    }

    // Footer
    sections.push('---');
    sections.push('');
    sections.push(isZh ? 
      `*此分析报告由 AI 生成，置信度：${Math.round((llmReport.confidence || 0.7) * 100)}%*` :
      `*This analysis report was generated by AI with ${Math.round((llmReport.confidence || 0.7) * 100)}% confidence*`
    );

    return sections.join('\n');
  }

  /**
   * Generate analysis report in Chinese format (as shown in user examples)
   */
  async generateChineseReport(
    analysisResult: IssueAnalysisResult,
    options: { uploadToGitHub?: boolean } = {}
  ): Promise<string> {
    const llmReport = await this.llmService.generateAnalysisReport(
      analysisResult.issue,
      analysisResult
    );

    const sections = [];
    
    sections.push('# 分析和优化计划');
    sections.push('基于我对代码的分析，我发现了以下问题和改进机会：');
    sections.push('');
    
    sections.push('## 当前问题：');
    if (llmReport.current_issues) {
      llmReport.current_issues.forEach((issue: string, index: number) => {
        sections.push(`${index + 1}. ${issue}`);
      });
    }
    sections.push('');
    
    sections.push('## 优化计划：');
    if (llmReport.detailed_plan && llmReport.detailed_plan.steps) {
      llmReport.detailed_plan.steps.forEach((step: any, index: number) => {
        sections.push(`${index + 1}. ${step.title}`);
        sections.push(`  - ${step.description}`);
        if (step.files_to_modify && step.files_to_modify.length > 0) {
          sections.push(`  - 修改文件：${step.files_to_modify.join(', ')}`);
        }
      });
    }

    return sections.join('\n');
  }
}
