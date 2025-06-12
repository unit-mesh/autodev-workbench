import { generateText, CoreMessage } from "ai";
import { GitHubIssue, IssueAnalysisResult } from "../../types/index";
import { LLMProviderConfig } from "./llm-provider";
import { LLMAnalysisReport, StructuredAnalysisPlan, FallbackAnalysisService } from "../analysis/FallbackAnalysisService";
import { LLMLogger } from "./llm-logger";

export class AnalysisReportService {
  private logger: LLMLogger;
  private fallbackService: FallbackAnalysisService;

  constructor() {
    this.logger = new LLMLogger('analysis-report.log');
    this.fallbackService = new FallbackAnalysisService();
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateAnalysisReport(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    llmConfig: LLMProviderConfig | null
  ): Promise<LLMAnalysisReport> {
    if (!llmConfig) {
      return this.fallbackService.generateAnalysisReport(issue, analysisResult);
    }

    const prompt = this.buildAnalysisReportPrompt(issue, analysisResult);

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: "You are an expert software architect and code analyst. Generate comprehensive analysis reports for GitHub issues based on code analysis results. Always respond with valid JSON in the specified format."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const { text } = await generateText({
        model: llmConfig.openai(llmConfig.fullModel),
        messages,
        temperature: 0.3,
      });

      const report = this.parseAnalysisReport(text);
      this.logger.log('Generated analysis report:', report);
      return report;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`LLM analysis report generation failed: ${errorMessage}`);
      this.logger.logAnalysisFailure('ANALYSIS REPORT GENERATION', error);
      return this.fallbackService.generateAnalysisReport(issue, analysisResult);
    }
  }

  /**
   * Generate structured analysis plan
   */
  async generateStructuredAnalysisPlan(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    language: 'zh' | 'en' = 'en',
    llmConfig: LLMProviderConfig | null
  ): Promise<StructuredAnalysisPlan> {
    if (!llmConfig) {
      return this.fallbackService.generateStructuredAnalysisPlan(issue, analysisResult, language);
    }

    const prompt = this.buildStructuredAnalysisPlanPrompt(issue, analysisResult, language);

    try {
      const messages: CoreMessage[] = [
        {
          role: "system",
          content: language === 'zh' 
            ? "你是一个专业的软件架构师和代码分析专家。基于GitHub问题和代码分析结果生成结构化的分析和优化计划。始终以指定格式的有效JSON回应。"
            : "You are an expert software architect and code analyst. Generate structured analysis and optimization plans for GitHub issues based on code analysis results. Always respond with valid JSON in the specified format."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const { text } = await generateText({
        model: llmConfig.openai(llmConfig.fullModel),
        messages,
        temperature: 0.3,
      });

      const plan = this.parseStructuredAnalysisPlan(text, language);
      this.logger.log('Generated structured analysis plan:', plan);
      return plan;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`LLM structured analysis plan generation failed: ${errorMessage}`);
      this.logger.logAnalysisFailure('STRUCTURED ANALYSIS PLAN GENERATION', error);
      return this.fallbackService.generateStructuredAnalysisPlan(issue, analysisResult, language);
    }
  }

  private buildAnalysisReportPrompt(issue: GitHubIssue, analysisResult: IssueAnalysisResult): string {
    const relevantFiles = analysisResult.relatedCode.files.slice(0, 10);
    const relevantSymbols = analysisResult.relatedCode.symbols.slice(0, 8);

    return `Analyze the following GitHub issue and code analysis results to generate a comprehensive analysis report.

**GitHub Issue:**
- Title: ${issue.title}
- Body: ${issue.body || 'No description provided'}
- Labels: ${issue.labels.map(l => l.name).join(', ') || 'None'}
- State: ${issue.state}

**Code Analysis Results:**
- Relevant Files Found: ${relevantFiles.length}
- Top Files: ${relevantFiles.map(f => f.path).join(', ')}
- Relevant Symbols: ${relevantSymbols.map(s => s.name).join(', ')}
- Current Summary: ${analysisResult.summary}

**Current Suggestions:**
${analysisResult.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Please generate a comprehensive analysis report in the following JSON format:

{
  "summary": "Brief summary of the issue and analysis findings",
  "current_issues": [
    "List of specific issues identified from the analysis",
    "Each item should be a clear, actionable problem statement"
  ],
  "detailed_plan": {
    "title": "Overall plan title",
    "steps": [
      {
        "step_number": 1,
        "title": "Step title",
        "description": "Detailed description of what needs to be done",
        "files_to_modify": ["list", "of", "files"],
        "changes_needed": ["specific", "changes", "required"]
      }
    ]
  },
  "recommendations": [
    "High-level recommendations for addressing the issue",
    "Best practices and considerations"
  ],
  "confidence": 0.85
}

Focus on:
1. Identifying specific problems from the code analysis
2. Creating actionable steps with file-level details
3. Providing practical recommendations
4. Being specific about what files need changes and what changes are needed`;
  }

  private buildStructuredAnalysisPlanPrompt(
    issue: GitHubIssue,
    analysisResult: IssueAnalysisResult,
    language: 'zh' | 'en'
  ): string {
    const relevantFiles = analysisResult.relatedCode.files.slice(0, 10);
    const relevantSymbols = analysisResult.relatedCode.symbols.slice(0, 8);

    if (language === 'zh') {
      return `基于以下GitHub问题和代码分析结果，生成结构化的分析和优化计划。

**GitHub 问题:**
- 标题: ${issue.title}
- 描述: ${issue.body || '无描述'}
- 标签: ${issue.labels.map(l => l.name).join(', ') || '无'}
- 状态: ${issue.state}

**代码分析结果:**
- 找到相关文件: ${relevantFiles.length}个
- 主要文件: ${relevantFiles.map(f => f.path).join(', ')}
- 相关符号: ${relevantSymbols.map(s => s.name).join(', ')}
- 当前摘要: ${analysisResult.summary}

**当前建议:**
${analysisResult.suggestions.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}

请生成以下JSON格式的结构化分析计划:

{
  "title": "分析和优化计划",
  "current_issues": [
    {
      "issue": "具体问题描述",
      "description": "问题的详细说明和影响",
      "severity": "high|medium|low"
    }
  ],
  "detailed_plan": [
    {
      "step_number": 1,
      "title": "步骤标题",
      "file_to_modify": "需要修改的文件路径",
      "changes_needed": [
        "具体需要的修改1",
        "具体需要的修改2"
      ],
      "description": "详细的实施说明"
    }
  ],
  "language": "zh"
}

重点关注:
1. 从代码分析中识别具体问题
2. 提供可操作的步骤和文件级别的详细信息
3. 确保修改建议具体且实用
4. 明确指出需要修改哪些文件以及需要什么样的修改`;
    } else {
      return `Based on the following GitHub issue and code analysis results, generate a structured analysis and optimization plan.

**GitHub Issue:**
- Title: ${issue.title}
- Body: ${issue.body || 'No description provided'}
- Labels: ${issue.labels.map(l => l.name).join(', ') || 'None'}
- State: ${issue.state}

**Code Analysis Results:**
- Relevant Files Found: ${relevantFiles.length}
- Top Files: ${relevantFiles.map(f => f.path).join(', ')}
- Relevant Symbols: ${relevantSymbols.map(s => s.name).join(', ')}
- Current Summary: ${analysisResult.summary}

**Current Suggestions:**
${analysisResult.suggestions.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}

Please generate a structured analysis plan in the following JSON format:

{
  "title": "Analysis and Optimization Plan",
  "current_issues": [
    {
      "issue": "Specific issue description",
      "description": "Detailed explanation and impact of the issue",
      "severity": "high|medium|low"
    }
  ],
  "detailed_plan": [
    {
      "step_number": 1,
      "title": "Step title",
      "file_to_modify": "Path to file that needs modification",
      "changes_needed": [
        "Specific change needed 1",
        "Specific change needed 2"
      ],
      "description": "Detailed implementation instructions"
    }
  ],
  "language": "en"
}

Focus on:
1. Identifying specific problems from the code analysis
2. Providing actionable steps with file-level details
3. Ensuring modification suggestions are specific and practical
4. Clearly stating which files need changes and what kind of changes are needed`;
    }
  }

  private parseAnalysisReport(text: string): LLMAnalysisReport {
    try {
      // Clean the text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.summary || !parsed.current_issues || !parsed.detailed_plan || !parsed.recommendations) {
        throw new Error('Missing required fields in analysis report');
      }

      return {
        summary: parsed.summary,
        current_issues: Array.isArray(parsed.current_issues) ? parsed.current_issues : [],
        detailed_plan: {
          title: parsed.detailed_plan?.title || 'Analysis and Implementation Plan',
          steps: Array.isArray(parsed.detailed_plan?.steps) ? parsed.detailed_plan.steps : []
        },
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7
      };
    } catch (error) {
      console.warn(`Failed to parse LLM analysis report: ${error.message}`);
      throw error;
    }
  }

  private parseStructuredAnalysisPlan(text: string, language: 'zh' | 'en'): StructuredAnalysisPlan {
    try {
      // Clean the text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.title || !parsed.current_issues || !parsed.detailed_plan) {
        throw new Error('Missing required fields in structured analysis plan');
      }

      return {
        title: parsed.title || (language === 'zh' ? '分析和优化计划' : 'Analysis and Optimization Plan'),
        current_issues: Array.isArray(parsed.current_issues) ? parsed.current_issues.map((item: any) => ({
          issue: item.issue || item,
          description: item.description || '',
          severity: ['high', 'medium', 'low'].includes(item.severity) ? item.severity : 'medium'
        })) : [],
        detailed_plan: Array.isArray(parsed.detailed_plan) ? parsed.detailed_plan.map((step: any, index: number) => ({
          step_number: step.step_number || index + 1,
          title: step.title || `Step ${index + 1}`,
          file_to_modify: step.file_to_modify || '',
          changes_needed: Array.isArray(step.changes_needed) ? step.changes_needed : [],
          description: step.description || ''
        })) : [],
        language: language
      };
    } catch (error) {
      console.warn(`Failed to parse LLM structured analysis plan: ${error.message}`);
      throw error;
    }
  }
}