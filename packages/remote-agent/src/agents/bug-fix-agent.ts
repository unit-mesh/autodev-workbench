import { CoreMessage } from "ai";
import { AIAgent, AgentConfig, AgentResponse } from "../agent";
import { ToolResult } from "../agent/tool-definition";
import { FunctionParser } from "../agent/function-parser";
import { BugFixPlaybook } from "../playbooks/bug-fix-playbook";
import { generateText } from "ai";

/**
 * BugFixAgent 配置选项
 */
export interface BugFixAgentConfig extends AgentConfig {
  // 修复策略: 'analysis-first' (默认) 或 'direct'
  fixStrategy?: 'analysis-first' | 'direct';

  // 是否在修改代码前创建备份
  createBackups?: boolean;

  // 是否在修复后验证更改
  verifyChanges?: boolean;
}

/**
 * BugFixAgent 响应类型，扩展自基本 AgentResponse
 */
export interface BugFixAgentResponse extends AgentResponse {
  modifiedFiles?: string[];
  totalChanges?: number;
}

/**
 * BugFixAgent 专注于代码问题修复和重构的 Agent
 * 扩展了基础 AIAgent，添加了代码修复的专用功能
 */
export class BugFixAgent extends AIAgent {
  protected bugFixConfig: BugFixAgentConfig;
  protected bugFixPlaybook: BugFixPlaybook;

  constructor(config: BugFixAgentConfig = {}) {
    // 初始化基础 AIAgent
    super(config);

    // 设置 BugFix 配置的默认值
    this.bugFixConfig = {
      fixStrategy: 'analysis-first',
      createBackups: true,
      verifyChanges: true,
      ...config
    };

    // 初始化 BugFixPlaybook
    this.bugFixPlaybook = new BugFixPlaybook();

    this.log('BugFixAgent 已初始化，使用策略:', this.bugFixConfig.fixStrategy);
  }

  /**
   * 重写 start 方法，添加代码修复特定的流程
   */
  async start(userInput: string, context?: any): Promise<BugFixAgentResponse> {
    const startTime = Date.now();

    try {
      this.log('处理代码修复请求:', userInput);

      if (this.bugFixConfig.fixStrategy === 'direct') {
        return await this.processDirectFix(userInput, startTime, context);
      } else {
        return await this.processAnalysisFirstFix(userInput, startTime, context);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('处理代码修复时出错:', errorMessage);

      return {
        text: '',
        toolResults: [],
        success: false,
        error: errorMessage,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * 直接修复策略 - 立即应用代码更改，无需广泛分析
   * 适用于简单更改或用户提供具体指令的情况
   */
  private async processDirectFix(userInput: string, startTime: number, context?: any): Promise<BugFixAgentResponse> {
    const directFixPrompt = this.bugFixPlaybook.preparePrompt(userInput, context);
    const response = await super.processInputWithToolChaining(directFixPrompt, startTime, context) as AgentResponse;
    const modifiedFiles = this.extractModifiedFiles(response.toolResults);

    return {
      ...response,
      modifiedFiles,
      totalChanges: modifiedFiles.length
    };
  }

  /**
   * 分析优先修复策略 - 在进行更改前分析代码
   * 更彻底的方法，适用于复杂重构
   */
  private async processAnalysisFirstFix(userInput: string, startTime: number, context?: any): Promise<BugFixAgentResponse> {
    this.log('阶段 1: 在修复前分析代码库');
    const analysisMessages = await this.bugFixPlaybook.buildMessagesForRound(userInput, context, 1);

    const analysisResponse = await this.callLLM(analysisMessages);
    const parsedAnalysis = FunctionParser.parseResponse(analysisResponse);

    const analysisResults = await this.toolExecutor.executeToolsWithContext({
      round: 1,
      previousResults: [],
      userInput,
      workspacePath: this.config.workspacePath || process.cwd()
    }, parsedAnalysis.functionCalls);

    this.log('阶段 2: 基于分析应用代码修复');
    const fixMessages = await this.bugFixPlaybook.buildMessagesForRound(userInput, context, 2);

    const fixResponse = await this.callLLM(fixMessages);
    const parsedFix = FunctionParser.parseResponse(fixResponse);

    const fixResults = await this.toolExecutor.executeToolsWithContext({
      round: 2,
      previousResults: analysisResults,
      userInput,
      workspacePath: this.config.workspacePath || process.cwd()
    }, parsedFix.functionCalls);

    const allToolResults = [...analysisResults, ...fixResults];

    if (this.bugFixConfig.verifyChanges) {
      this.log('阶段 3: 验证代码修复');
      const verificationMessages = await this.bugFixPlaybook.buildMessagesForRound(userInput, context, 3);
      const verificationResponse = await this.callLLM(verificationMessages);

      const finalText = await this.generateBugFixFinalResponse(userInput, verificationResponse, allToolResults, 3);

      const modifiedFiles = this.extractModifiedFiles(allToolResults);

      return {
        text: finalText,
        toolResults: allToolResults,
        success: true,
        totalRounds: 3,
        executionTime: Date.now() - startTime,
        modifiedFiles,
        totalChanges: modifiedFiles.length
      };
    }

    const summaryPrompt = this.bugFixPlaybook.prepareSummaryPrompt(
      userInput,
      allToolResults,
      parsedFix.text
    );

    const summaryMessages = [
      { role: "system", content: this.bugFixPlaybook.getSystemPrompt() },
      { role: "user", content: summaryPrompt }
    ] as CoreMessage[];

    const summaryResponse = await this.callLLM(summaryMessages);
    const modifiedFiles = this.extractModifiedFiles(allToolResults);

    return {
      text: summaryResponse,
      toolResults: allToolResults,
      success: true,
      totalRounds: 2,
      executionTime: Date.now() - startTime,
      modifiedFiles,
      totalChanges: modifiedFiles.length
    };
  }

  private extractModifiedFiles(toolResults: ToolResult[]): string[] {
    const modifiedFiles = new Set<string>();

    for (const result of toolResults) {
      if (result.success &&
         (result.functionCall.name === 'str-replace-editor' ||
          result.functionCall.name === 'fs-write-file')) {

        const targetFile = result.functionCall.parameters.targetFile;
        if (targetFile) {
          modifiedFiles.add(targetFile);
        }
      }
    }

    return Array.from(modifiedFiles);
  }

  private async generateBugFixFinalResponse(
    userInput: string,
    lastLLMResponse: string,
    toolResults: ToolResult[],
    totalRounds: number
  ): Promise<string> {
    const summaryPrompt = this.bugFixPlaybook.prepareSummaryPrompt(userInput, toolResults, lastLLMResponse);
    const verificationPrompt = this.bugFixPlaybook.prepareVerificationPrompt(userInput, toolResults);

    const messages: CoreMessage[] = [
      { role: "system", content: this.bugFixPlaybook.getSystemPrompt() },
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
