import { CoreMessage } from "ai";
import { AIAgent, AgentConfig, AgentResponse } from "../agent";
import { ToolResult } from "../agent/tool-definition";
import { FeatureRequestPlaybook } from "../playbooks/feature-request-playbook";
import { generateText } from "ai";

/**
 * FeatureAnalysisAgent 配置选项
 */
export interface FeatureAnalysisAgentConfig extends AgentConfig {
  // 分析策略: 'requirements-first' (默认) 或 'technical-first'
  analysisStrategy?: 'requirements-first' | 'technical-first';

  // 是否生成详细的技术文档
  generateTechnicalDocs?: boolean;

  // 是否进行代码兼容性分析
  analyzeCompatibility?: boolean;
}

/**
 * FeatureAnalysisAgent 专注于功能请求分析和澄清的 Agent
 * 扩展了基础 AIAgent，添加了功能分析的专用功能
 */
export class FeatureAnalysisAgent extends AIAgent {
  protected featureAnalysisConfig: FeatureAnalysisAgentConfig;
  protected featureRequestPlaybook: FeatureRequestPlaybook;

  constructor(config: FeatureAnalysisAgentConfig = {}) {
    // 初始化基础 AIAgent
    super(config);

    // 设置 FeatureAnalysis 配置的默认值
    this.featureAnalysisConfig = {
      analysisStrategy: 'requirements-first',
      generateTechnicalDocs: true,
      analyzeCompatibility: true,
      ...config
    };

    // 初始化 FeatureRequestPlaybook
    this.featureRequestPlaybook = new FeatureRequestPlaybook();

    this.log('FeatureAnalysisAgent 已初始化，使用策略:', this.featureAnalysisConfig.analysisStrategy);
  }

  /**
   * 重写 start 方法以使用特定的 Playbook
   */
  async start(input: string): Promise<AgentResponse> {
    // 使用 FeatureRequestPlaybook 替换默认的 Playbook
    this.playbook = this.featureRequestPlaybook;
    return super.start(input);
  }

  /**
   * 生成功能分析报告
   */
  private async generateFeatureAnalysisReport(
    userInput: string,
    lastLLMResponse: string,
    toolResults: ToolResult[],
    totalRounds: number
  ): Promise<string> {
    const summaryPrompt = this.featureRequestPlaybook.prepareSummaryPrompt(userInput, toolResults, lastLLMResponse);
    const verificationPrompt = this.featureRequestPlaybook.prepareVerificationPrompt(userInput, toolResults);

    const messages: CoreMessage[] = [
      { role: "system", content: this.featureRequestPlaybook.getSystemPrompt() },
      { role: "user", content: summaryPrompt },
      { role: "user", content: verificationPrompt }
    ];

    const { text } = await generateText({
      model: this.llmConfig.openai(this.llmConfig.fullModel),
      messages,
      temperature: 0.3,
      maxTokens: 4000
    });

    return text;
  }
} 