import { Agent, AgentConfig, AgentResponse } from "../agent";
import { PlanningEngine, ExecutionPlan, TaskComplexity } from "./planning-engine";
import { PlanPresenter } from "./plan-presenter";
import { ToolResult } from "./tool-definition";

export interface PlanDrivenConfig extends AgentConfig {
  // 计划模式配置
  planningMode: 'always' | 'auto' | 'never';
  
  // 复杂度阈值
  complexityThreshold: {
    simple: number;    // 工具数量 <= 1
    medium: number;    // 工具数量 <= 3  
    complex: number;   // 工具数量 > 3
  };
  
  // 自动执行设置
  autoExecuteSimple: boolean;  // 简单任务自动执行
  requireConfirmation: boolean; // 是否需要用户确认
  
  // 计划生成设置
  maxPlanningRounds: number;   // 最大计划轮次
  enableRiskAnalysis: boolean; // 启用风险分析
  enableRollback: boolean;     // 启用回滚机制
}

export interface PlanDrivenResponse extends AgentResponse {
  plan?: ExecutionPlan;
  requiresConfirmation?: boolean;
  planningPhase?: 'gathering' | 'planning' | 'presenting' | 'executing' | 'completed';
  executionProgress?: {
    currentPhase: number;
    totalPhases: number;
    phaseResults: ToolResult[];
  };
}

export class PlanDrivenAgent extends Agent {
  private planningEngine: PlanningEngine;
  private currentPlan?: ExecutionPlan;
  private planDrivenConfig: PlanDrivenConfig;

  constructor(config: PlanDrivenConfig) {
    super(config);
    
    // 设置默认配置
    this.planDrivenConfig = {
      planningMode: 'auto',
      complexityThreshold: {
        simple: 1,
        medium: 3,
        complex: 5
      },
      autoExecuteSimple: true,
      requireConfirmation: true,
      maxPlanningRounds: 3,
      enableRiskAnalysis: true,
      enableRollback: true,
      ...config
    };

    this.planningEngine = new PlanningEngine(this.toolExecutor, this.llmProvider);
  }

  /**
   * 主要入口点 - 处理用户输入
   */
  async start(userInput: string, context?: any): Promise<PlanDrivenResponse> {
    const startTime = Date.now();

    try {
      // 检查是否是计划确认或控制命令
      const controlResponse = await this.handleControlCommands(userInput);
      if (controlResponse) {
        return controlResponse;
      }

      // 分析任务类型
      const taskType = await this.analyzeTaskType(userInput, context);
      
      this.log(`Task type analyzed: ${taskType}`);

      switch (taskType) {
        case 'simple':
          return await this.handleSimpleTask(userInput, context, startTime);
        
        case 'medium':
        case 'complex':
          return await this.handleComplexTask(userInput, context, startTime);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('Error in plan-driven processing:', errorMessage);

      return {
        text: `执行过程中发生错误: ${errorMessage}`,
        toolResults: [],
        success: false,
        error: errorMessage,
        executionTime: Date.now() - startTime,
        planningPhase: 'completed'
      };
    }
  }

  /**
   * 处理控制命令 (yes, no, modify, cancel等)
   */
  private async handleControlCommands(userInput: string): Promise<PlanDrivenResponse | null> {
    const input = userInput.toLowerCase().trim();

    // 计划确认
    if (['yes', 'y', '是', '执行', 'execute'].includes(input)) {
      if (this.currentPlan) {
        return await this.executePlan(this.currentPlan);
      } else {
        return {
          text: '没有待执行的计划。请先提出一个任务请求。',
          toolResults: [],
          success: false,
          planningPhase: 'completed'
        };
      }
    }

    // 计划取消
    if (['no', 'n', '否', '取消', 'cancel'].includes(input)) {
      this.currentPlan = undefined;
      return {
        text: '计划已取消。请提出新的任务请求。',
        toolResults: [],
        success: true,
        planningPhase: 'completed'
      };
    }

    // 计划修改
    if (['modify', '修改', 'change', 'adjust'].includes(input)) {
      if (this.currentPlan) {
        return {
          text: PlanPresenter.formatPlanModificationOptions(this.currentPlan),
          toolResults: [],
          success: true,
          plan: this.currentPlan,
          requiresConfirmation: true,
          planningPhase: 'presenting'
        };
      }
    }

    return null; // 不是控制命令
  }

  /**
   * 分析任务类型
   */
  private async analyzeTaskType(userInput: string, context?: any): Promise<TaskComplexity> {
    // 如果强制使用计划模式
    if (this.planDrivenConfig.planningMode === 'always') {
      return 'complex';
    }

    // 如果禁用计划模式
    if (this.planDrivenConfig.planningMode === 'never') {
      return 'simple';
    }

    // 自动分析模式
    let score = 0;

    // 基于关键词分析
    const complexKeywords = [
      'implement', 'create', 'build', 'refactor', 'migrate', 'fix bug',
      'multiple files', 'architecture', 'system', 'deploy'
    ];
    
    const mediumKeywords = [
      'modify', 'update', 'change', 'add', 'remove', 'configure',
      'install', 'setup', 'test'
    ];

    const simpleKeywords = [
      'read', 'show', 'list', 'display', 'what is', 'how to', 'explain',
      'find', 'search', 'get'
    ];

    if (complexKeywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
      score += 3;
    } else if (mediumKeywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
      score += 2;
    } else if (simpleKeywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
      score += 1;
    }

    // 基于文件数量分析
    const fileMatches = userInput.match(/\b\w+\.\w+\b/g);
    if (fileMatches && fileMatches.length > 2) score += 1;

    // 基于GitHub相关任务
    if (/github.*issue/i.test(userInput)) score += 1;

    // 基于长度和复杂度
    if (userInput.length > 100) score += 1;
    if (userInput.split(' ').length > 20) score += 1;

    if (score >= this.planDrivenConfig.complexityThreshold.complex) return 'complex';
    if (score >= this.planDrivenConfig.complexityThreshold.medium) return 'medium';
    return 'simple';
  }

  /**
   * 处理简单任务 (直接执行)
   */
  private async handleSimpleTask(
    userInput: string, 
    context: any, 
    startTime: number
  ): Promise<PlanDrivenResponse> {
    this.log('Handling simple task directly');

    if (this.planDrivenConfig.autoExecuteSimple) {
      // 直接执行，使用原有的单轮模式
      const response = await super.start(userInput, context);
      return {
        ...response,
        planningPhase: 'completed'
      };
    } else {
      // 即使是简单任务也创建计划
      return await this.handleComplexTask(userInput, context, startTime);
    }
  }

  /**
   * 处理复杂任务 (计划模式)
   */
  private async handleComplexTask(
    userInput: string, 
    context: any, 
    startTime: number
  ): Promise<PlanDrivenResponse> {
    this.log('Handling complex task with planning');

    try {
      // 1. 创建执行计划
      this.log('Creating execution plan...');
      this.currentPlan = await this.planningEngine.createPlan(userInput, {
        workspacePath: this.config.workspacePath,
        ...context
      });

      this.log(`Plan created: ${PlanPresenter.formatPlanSummary(this.currentPlan)}`);

      // 2. 展示计划给用户
      const planPresentation = PlanPresenter.formatPlanForUser(this.currentPlan);
      
      return {
        text: planPresentation,
        toolResults: [],
        success: true,
        plan: this.currentPlan,
        requiresConfirmation: this.planDrivenConfig.requireConfirmation,
        planningPhase: 'presenting',
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('Error creating plan:', errorMessage);

      // 如果计划创建失败，回退到直接执行
      this.log('Falling back to direct execution');
      const response = await super.start(userInput, context);
      return {
        ...response,
        planningPhase: 'completed'
      };
    }
  }

  /**
   * 执行计划
   */
  private async executePlan(plan: ExecutionPlan): Promise<PlanDrivenResponse> {
    const startTime = Date.now();
    const results: ToolResult[] = [];
    let currentPhaseIndex = 0;

    this.log(`Starting plan execution: ${plan.id}`);

    try {
      for (const phase of plan.phases) {
        this.log(`Executing phase ${currentPhaseIndex + 1}/${plan.phases.length}: ${phase.name}`);

        // 显示进度
        const progressText = PlanPresenter.formatExecutionProgress(plan, currentPhaseIndex, results);
        
        // 执行阶段
        const phaseResults = await this.executePhase(phase, {
          round: currentPhaseIndex + 1,
          previousResults: results,
          userInput: plan.goal,
          workspacePath: this.config.workspacePath || process.cwd()
        });

        results.push(...phaseResults);

        // 验证阶段结果
        const validation = this.validatePhaseResults(phase, phaseResults);
        if (!validation.success) {
          return this.handleExecutionFailure(plan, phase, validation.error, results, startTime);
        }

        currentPhaseIndex++;
      }

      // 执行成功
      const executionTime = Date.now() - startTime;
      const finalText = PlanPresenter.formatExecutionResults(plan, results, true, executionTime);

      this.currentPlan = undefined; // 清除当前计划

      return {
        text: finalText,
        toolResults: results,
        success: true,
        plan: plan,
        planningPhase: 'completed',
        executionTime,
        executionProgress: {
          currentPhase: currentPhaseIndex,
          totalPhases: plan.phases.length,
          phaseResults: results
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.handleExecutionFailure(plan, plan.phases[currentPhaseIndex], errorMessage, results, startTime);
    }
  }

  /**
   * 执行单个阶段
   */
  private async executePhase(phase: any, context: any): Promise<ToolResult[]> {
    const functionCalls = phase.tools.map((tool: any) => ({
      name: tool.tool,
      parameters: tool.parameters
    }));

    return await this.toolExecutor.executeToolsWithContext(context, functionCalls);
  }

  /**
   * 验证阶段结果
   */
  private validatePhaseResults(phase: any, results: ToolResult[]): { success: boolean; error?: string } {
    // 检查是否有工具执行失败
    const failedTools = results.filter(r => !r.success);
    if (failedTools.length > 0) {
      return {
        success: false,
        error: `Phase "${phase.name}" failed: ${failedTools.map(t => t.error).join(', ')}`
      };
    }

    return { success: true };
  }

  /**
   * 处理执行失败
   */
  private handleExecutionFailure(
    plan: ExecutionPlan,
    failedPhase: any,
    error: string,
    results: ToolResult[],
    startTime: number
  ): PlanDrivenResponse {
    const executionTime = Date.now() - startTime;
    const failureText = PlanPresenter.formatExecutionResults(plan, results, false, executionTime);

    this.log(`Plan execution failed at phase "${failedPhase.name}": ${error}`);

    return {
      text: failureText,
      toolResults: results,
      success: false,
      error: `执行失败在阶段 "${failedPhase.name}": ${error}`,
      plan: plan,
      planningPhase: 'completed',
      executionTime
    };
  }
}
