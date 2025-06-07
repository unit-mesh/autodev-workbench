/**
 * Analysis Formatter Service
 * 
 * Formats analysis results into the expected markdown format for GitHub issues
 */

import { GitHubIssue, IssueAnalysisResult } from "../../types/index";

interface StructuredAnalysisPlan {
  title: string;
  current_issues: Array<{
    issue: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  detailed_plan: Array<{
    step_number: number;
    title: string;
    file_to_modify: string;
    changes_needed: string[];
    description: string;
  }>;
  language: 'zh' | 'en';
}

export class AnalysisFormatter {
  /**
   * Format structured analysis plan as markdown for GitHub comment
   */
  static formatStructuredAnalysisPlan(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    structuredPlan: StructuredAnalysisPlan
  ): string {
    const { language } = structuredPlan;
    
    if (language === 'zh') {
      return this.formatChineseAnalysisPlan(issue, analysisResult, structuredPlan);
    } else {
      return this.formatEnglishAnalysisPlan(issue, analysisResult, structuredPlan);
    }
  }

  private static formatChineseAnalysisPlan(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    plan: StructuredAnalysisPlan
  ): string {
    let markdown = `# ${plan.title}\n`;
    markdown += `基于我对代码的分析，我发现了以下问题和改进机会：\n\n`;

    // Current Issues Section
    markdown += `## 当前问题：\n`;
    plan.current_issues.forEach((item, index) => {
      const severityIcon = item.severity === 'high' ? '🔴' : item.severity === 'medium' ? '🟡' : '🟢';
      markdown += `${index + 1}. ${severityIcon} ${item.issue}`;
      if (item.description) {
        markdown += `：${item.description}`;
      }
      markdown += `\n`;
    });
    markdown += `\n`;

    // Detailed Plan Section
    markdown += `## 优化计划：\n`;
    plan.detailed_plan.forEach((step) => {
      markdown += `${step.step_number}. ${step.title}\n`;
      if (step.file_to_modify) {
        markdown += `  - 文件：\`${step.file_to_modify}\`\n`;
      }
      if (step.changes_needed.length > 0) {
        step.changes_needed.forEach(change => {
          markdown += `  - ${change}\n`;
        });
      }
      if (step.description) {
        markdown += `  - 说明：${step.description}\n`;
      }
      markdown += `\n`;
    });

    // Analysis Statistics
    markdown += `## 分析统计：\n`;
    markdown += `- 相关文件：${analysisResult.relatedCode.files.length} 个\n`;
    markdown += `- 相关符号：${analysisResult.relatedCode.symbols.length} 个\n`;
    markdown += `- 相关API：${analysisResult.relatedCode.apis.length} 个\n`;
    markdown += `- 生成建议：${analysisResult.suggestions.length} 条\n\n`;

    // Footer
    markdown += `---\n`;
    markdown += `*此分析由 AutoDev AI 代理自动生成*\n`;

    return markdown;
  }

  private static formatEnglishAnalysisPlan(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    plan: StructuredAnalysisPlan
  ): string {
    let markdown = `# ${plan.title}\n`;
    markdown += `Based on my analysis of the code, I have identified the following issues and improvement opportunities:\n\n`;

    // Current Issues Section
    markdown += `## Current Issues Identified:\n`;
    plan.current_issues.forEach((item, index) => {
      const severityIcon = item.severity === 'high' ? '🔴' : item.severity === 'medium' ? '🟡' : '🟢';
      markdown += `${index + 1}. ${severityIcon} ${item.issue}`;
      if (item.description) {
        markdown += ` - ${item.description}`;
      }
      markdown += `\n`;
    });
    markdown += `\n`;

    // Detailed Plan Section
    markdown += `## Detailed Plan:\n`;
    plan.detailed_plan.forEach((step) => {
      markdown += `### ${step.step_number}. ${step.title}\n`;
      if (step.file_to_modify) {
        markdown += `- File to modify: \`${step.file_to_modify}\`\n`;
      }
      if (step.changes_needed.length > 0) {
        markdown += `- Changes needed:\n`;
        step.changes_needed.forEach(change => {
          markdown += `\t- ${change}\n`;
        });
      }
      if (step.description) {
        markdown += `- Description: ${step.description}\n`;
      }
      markdown += `\n`;
    });

    // Analysis Statistics
    markdown += `## Analysis Statistics:\n`;
    markdown += `- Related Files: ${analysisResult.relatedCode.files.length}\n`;
    markdown += `- Related Symbols: ${analysisResult.relatedCode.symbols.length}\n`;
    markdown += `- Related APIs: ${analysisResult.relatedCode.apis.length}\n`;
    markdown += `- Generated Suggestions: ${analysisResult.suggestions.length}\n\n`;

    // Footer
    markdown += `---\n`;
    markdown += `*This analysis was generated automatically by the AutoDev AI Agent*\n`;

    return markdown;
  }

  /**
   * Format analysis results with most relevant files (legacy format)
   */
  static formatLegacyAnalysisAsMarkdown(
    issue: GitHubIssue, 
    analysisResult: IssueAnalysisResult, 
    keywords: any
  ): string {
    let markdown = `## 🤖 AI Analysis for Issue #${issue.number}\n\n`;

    markdown += `**Issue**: [${issue.title}](${issue.html_url})\n`;
    markdown += `**Analysis Date**: ${new Date().toISOString().split('T')[0]}\n`;
    markdown += `**Status**: ${issue.state}\n\n`;

    // Keywords section
    markdown += `### 🎯 Extracted Keywords\n\n`;
    markdown += `- **Primary**: ${keywords.primary.slice(0, 8).join(', ')}\n`;
    markdown += `- **Technical**: ${keywords.technical.slice(0, 8).join(', ')}\n`;
    markdown += `- **Secondary**: ${keywords.secondary.slice(0, 6).join(', ')}\n`;
    markdown += `- **Contextual**: ${keywords.contextual.slice(0, 6).join(', ')}\n\n`;

    // Analysis results section
    markdown += `### 📊 Analysis Results\n\n`;
    markdown += `- **Related Files**: ${analysisResult.relatedCode.files.length}\n`;
    markdown += `- **Related Symbols**: ${analysisResult.relatedCode.symbols.length}\n`;
    markdown += `- **Related APIs**: ${analysisResult.relatedCode.apis.length}\n`;
    markdown += `- **Generated Suggestions**: ${analysisResult.suggestions.length}\n\n`;

    // Most relevant files
    if (analysisResult.relatedCode.files.length > 0) {
      markdown += `### 📁 Most Relevant Files\n\n`;
      analysisResult.relatedCode.files.slice(0, 5).forEach((file, index) => {
        markdown += `${index + 1}. **${file.path}** (${(file.relevanceScore * 100).toFixed(1)}% relevance)\n`;
        markdown += `   \`\`\`\n   ${file.content.substring(0, 150).replace(/\n/g, ' ')}...\n   \`\`\`\n\n`;
      });
    }

    // Related symbols
    if (analysisResult.relatedCode.symbols.length > 0) {
      markdown += `### 🔧 Related Symbols\n\n`;
      analysisResult.relatedCode.symbols.slice(0, 5).forEach((symbol, index) => {
        markdown += `${index + 1}. **${symbol.name}** (${symbol.type})\n`;
        markdown += `   - Location: \`${symbol.location.file}:${symbol.location.line}\`\n`;
        if (symbol.description) {
          markdown += `   - Description: ${symbol.description.substring(0, 100)}...\n`;
        }
        markdown += `\n`;
      });
    }

    // AI suggestions
    if (analysisResult.suggestions.length > 0) {
      markdown += `### 💡 AI Suggestions\n\n`;
      analysisResult.suggestions.slice(0, 5).forEach((suggestion, index) => {
        markdown += `${index + 1}. **[${suggestion.type.toUpperCase()}]** ${suggestion.description}\n`;
        if (suggestion.location) {
          markdown += `   - Location: \`${suggestion.location}\`\n`;
        }
        markdown += `   - Confidence: ${(suggestion.confidence * 100).toFixed(1)}%\n\n`;
      });
    }

    // Summary
    markdown += `### 📋 Summary\n\n`;
    markdown += `${analysisResult.summary}\n\n`;

    markdown += `---\n`;
    markdown += `*This analysis was generated automatically by the AutoDev AI Agent*\n`;

    return markdown;
  }
}
