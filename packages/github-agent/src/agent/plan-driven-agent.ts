import { AIAgent, AgentConfig, AgentResponse } from "../agent";
import { PlanningEngine, ExecutionPlan, TaskComplexity } from "./planning-engine";
import { PlanPresenter } from "./plan-presenter";
import { ToolResult } from "./tool-definition";

export interface PlanDrivenConfig extends AgentConfig {
  // 计划模式配置
  planningMode?: 'always' | 'auto' | 'never';
  
  // 复杂度阈值
  complexityThreshold?: {
    simple: number;    // 工具数量 <= 1
    medium: number;    // 工具数量 <= 3  
    complex: number;   // 工具数量 > 3
  };
  
  // 自动执行设置
  autoExecuteSimple?: boolean;  // 简单任务自动执行
  requireConfirmation?: boolean; // 是否需要用户确认
  
  // 计划生成设置
  maxPlanningRounds?: number;   // 最大计划轮次
  enableRiskAnalysis?: boolean; // 启用风险分析
  enableRollback?: boolean;     // 启用回滚机制
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

/**
 * 计划驱动的智能代理
 * 在AIAgent基础上添加规划能力，支持复杂任务的分解和执行
 */
export class PlanDrivenAgent extends AIAgent {
  private planningEngine: PlanningEngine;
  private currentPlan?: ExecutionPlan;
  private planDrivenConfig: PlanDrivenConfig & Required<Pick<PlanDrivenConfig, 'planningMode' | 'complexityThreshold' | 'autoExecuteSimple' | 'requireConfirmation' | 'maxPlanningRounds' | 'enableRiskAnalysis' | 'enableRollback'>>;

  constructor(config: PlanDrivenConfig = {}) {
    super(config);
    
    // 设置默认的计划驱动配置
    this.planDrivenConfig = {
      ...this.config,
      planningMode: config.planningMode || 'auto',
      complexityThreshold: {
        simple: 1,
        medium: 3,
        complex: 5,
        ...config.complexityThreshold
      },
      autoExecuteSimple: config.autoExecuteSimple ?? true,
      requireConfirmation: config.requireConfirmation ?? true,
      maxPlanningRounds: config.maxPlanningRounds || 3,
      enableRiskAnalysis: config.enableRiskAnalysis ?? true,
      enableRollback: config.enableRollback ?? true
    };

    this.planningEngine = new PlanningEngine(this.toolExecutor, this.llmConfig);
    this.log('PlanDrivenAgent initialized with planning capabilities');
  }

  /**
   * 重写start方法，集成计划功能
   */
  async start(userInput: string, context?: any): Promise<PlanDrivenResponse> {
    const startTime = Date.now();

    try {
      // 处理计划相关的控制命令
      const controlResponse = await this.handlePlanningCommands(userInput);
      if (controlResponse) {
        return this.extendResponse(controlResponse, startTime);
      }

      // 根据配置决定是否启用计划模式
      const shouldUsePlanning = await this.shouldUsePlanning(userInput, context);
      
      if (shouldUsePlanning) {
        return await this.executeWithPlanning(userInput, context, startTime);
      } else {
        // 使用父类的标准处理流程
        const response = await super.start(userInput, context);
        return this.extendResponse(response, startTime);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('Error in plan-driven processing:', errorMessage);

      return {
        text: `执行过程中发生错误: ${errorMessage}`,
        toolResults: [],
        success: false,
        error: errorMessage,
        totalRounds: 0,
        executionTime: Date.now() - startTime,
        planningPhase: 'completed'
      };
    }
  }

  /**
   * 处理计划相关的控制命令
   */
  private async handlePlanningCommands(userInput: string): Promise<AgentResponse | null> {
    const input = userInput.toLowerCase().trim();
    
    if (input === 'confirm' || input === 'yes' || input === 'y') {
      if (this.currentPlan) {
        return await this.executePlan(this.currentPlan);
      }
    }
    
    if (input === 'cancel' || input === 'no' || input === 'n') {
      if (this.currentPlan) {
        this.currentPlan = undefined;
        return {
          text: '已取消当前计划',
          toolResults: [],
          success: true
        };
      }
    }
    
    if (input === 'show plan' || input === 'plan') {
      if (this.currentPlan) {
        return {
          text: PlanPresenter.formatPlanForUser(this.currentPlan),
          toolResults: [],
          success: true
        };
      }
    }
    
    return null;
  }

  /**
   * 判断是否应该使用计划模式
   */
  private async shouldUsePlanning(userInput: string, context?: any): Promise<boolean> {
    const mode = this.planDrivenConfig.planningMode;
    
    if (mode === 'never') return false;
    if (mode === 'always') return true;
    
    // auto模式下分析任务复杂度
    try {
      const taskType = await this.analyzeTaskComplexity(userInput, context);
      const threshold = this.planDrivenConfig.complexityThreshold;
      
      // 简单任务可选择跳过计划阶段
      if (taskType === 'simple' && this.planDrivenConfig.autoExecuteSimple) {
        return false;
      }
      
      return taskType === 'medium' || taskType === 'complex';
    } catch (error) {
      this.log('Error analyzing task complexity, falling back to standard mode:', error);
      return false;
    }
  }

  /**
   * 带计划的执行流程
   */
  private async executeWithPlanning(
    userInput: string, 
    context: any, 
    startTime: number
  ): Promise<PlanDrivenResponse> {
    // 1. 生成执行计划
    this.log('Generating execution plan...');
    const plan = await this.planningEngine.createPlan(userInput, context);
    this.currentPlan = plan;

    // 2. 展示计划并等待确认
    if (this.planDrivenConfig.requireConfirmation) {
      return {
        text: PlanPresenter.formatPlanForUser(plan) + '\n\n请输入 "confirm" 确认执行，或 "cancel" 取消计划',
        toolResults: [],
        success: true,
        plan,
        requiresConfirmation: true,
        planningPhase: 'presenting',
        executionTime: Date.now() - startTime
      };
    }

    // 3. 直接执行計劃
    const result = await this.executePlan(plan);
    return this.extendResponse(result, startTime, { plan, planningPhase: 'completed' });
  }

  /**
   * 执行计划
   */
  private async executePlan(plan: ExecutionPlan): Promise<AgentResponse> {
    const phaseResults: ToolResult[] = [];
    let currentPhaseIndex = 0;

    try {
      for (const phase of plan.phases) {
        this.log(`Executing phase ${currentPhaseIndex + 1}: ${phase.name}`);
        
        // 构建该阶段的prompt
        const phasePrompt = this.buildPhasePrompt(phase, phaseResults);
        
        // 使用父类的处理逻辑执行该阶段
        const phaseResult = await super.start(phasePrompt);
        
        if (!phaseResult.success) {
          throw new Error(`Phase ${phase.name} failed: ${phaseResult.error}`);
        }
        
        phaseResults.push(...phaseResult.toolResults);
        currentPhaseIndex++;
      }

      return {
        text: '计划执行完成！',
        toolResults: phaseResults,
        success: true,
        totalRounds: phaseResults.length,
        executionTime: 0 // 将在extendResponse中计算
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        text: `计划执行失败: ${errorMessage}`,
        toolResults: phaseResults,
        success: false,
        error: errorMessage,
        totalRounds: phaseResults.length,
        executionTime: 0
      };
    } finally {
      this.currentPlan = undefined;
    }
  }

  /**
   * 构建阶段执行的prompt
   */
  private buildPhasePrompt(phase: any, previousResults: ToolResult[]): string {
    let prompt = `执行任务阶段: ${phase.name}\n`;
    prompt += `目标: ${phase.description}\n`;
    
    if (phase.tools && phase.tools.length > 0) {
      prompt += `需要使用的工具: ${phase.tools.map((t: any) => t.tool).join(', ')}\n`;
    }
    
    if (previousResults.length > 0) {
      prompt += `\n前置步骤结果:\n`;
      previousResults.forEach((result, index) => {
        prompt += `${index + 1}. ${result.functionCall.name}: ${result.success ? '成功' : '失败'}\n`;
      });
    }
    
    return prompt;
  }

  /**
   * 分析任务复杂度
   */
  private async analyzeTaskComplexity(userInput: string, context?: any): Promise<TaskComplexity> {
    // 简化版本的复杂度分析
    const toolKeywords = ['file', 'search', 'git', 'create', 'update', 'delete', 'run', 'execute'];
    const foundTools = toolKeywords.filter(keyword => 
      userInput.toLowerCase().includes(keyword)
    ).length;

    const threshold = this.planDrivenConfig.complexityThreshold;
    
    if (foundTools <= threshold.simple) return 'simple';
    if (foundTools <= threshold.medium) return 'medium';
    return 'complex';
  }

  /**
   * 扩展响应对象，添加计划相关信息
   */
  private extendResponse(
    response: AgentResponse, 
    startTime: number, 
    planInfo?: Partial<PlanDrivenResponse>
  ): PlanDrivenResponse {
    return {
      ...response,
      executionTime: Date.now() - startTime,
      plan: planInfo?.plan || this.currentPlan,
      requiresConfirmation: planInfo?.requiresConfirmation,
      planningPhase: planInfo?.planningPhase || 'completed',
      executionProgress: planInfo?.executionProgress
    };
  }
}
