import { ToolExecutor, ToolResult } from "./tool-executor";
import { LLMProvider } from "../services/llm";

export interface ExecutionPlan {
  id: string;
  goal: string;
  complexity: 'simple' | 'medium' | 'complex';
  phases: ExecutionPhase[];
  estimatedTime: number;
  risks: Risk[];
  filesToModify: string[];
  validation: ValidationStep[];
  rollbackStrategy?: RollbackStrategy;
}

export interface ExecutionPhase {
  id: string;
  name: string;
  description: string;
  tools: PlannedToolCall[];
  dependencies: string[];
  optional: boolean;
  estimatedTime: number;
}

export interface PlannedToolCall {
  tool: string;
  parameters: Record<string, any>;
  purpose: string;
  expectedOutcome: string;
  fallbackOptions: string[];
}

export interface Risk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface ValidationStep {
  description: string;
  tool: string;
  parameters: Record<string, any>;
  successCriteria: string;
}

export interface RollbackStrategy {
  enabled: boolean;
  backupFiles: string[];
  rollbackSteps: string[];
}

export type TaskComplexity = 'simple' | 'medium' | 'complex';

export class PlanningEngine {
  constructor(
    private toolExecutor: ToolExecutor,
    private llmProvider: any // 使用现有的LLM provider
  ) {}

  /**
   * 创建执行计划
   */
  async createPlan(userInput: string, context: any): Promise<ExecutionPlan> {
    // 1. 信息收集阶段
    const gatheringResults = await this.gatherInformation(userInput, context);
    
    // 2. 分析任务复杂度
    const complexity = this.analyzeTaskComplexity(userInput, gatheringResults);
    
    // 3. 生成执行计划
    const plan = await this.generateExecutionPlan(userInput, gatheringResults, complexity);
    
    return plan;
  }

  /**
   * 信息收集阶段
   */
  private async gatherInformation(userInput: string, context: any): Promise<ToolResult[]> {
    const gatheringTools = this.selectGatheringTools(userInput);
    
    if (gatheringTools.length === 0) {
      return [];
    }

    try {
      return await this.toolExecutor.executeToolsWithContext({
        round: 0,
        previousResults: [],
        userInput,
        workspacePath: context.workspacePath || process.cwd()
      }, gatheringTools);
    } catch (error) {
      console.warn('Information gathering failed:', error);
      return [];
    }
  }

  /**
   * 选择信息收集工具
   */
  private selectGatheringTools(userInput: string): Array<{name: string, parameters: any}> {
    const tools: Array<{name: string, parameters: any}> = [];

    // GitHub相关任务
    if (/github.*issue/i.test(userInput)) {
      const issueMatch = userInput.match(/#(\d+)/);
      if (issueMatch) {
        tools.push({
          name: 'github-get-issue-with-analysis',
          parameters: {
            issue_number: parseInt(issueMatch[1]),
            include_file_content: true,
            analysis_mode: 'basic'
          }
        });
      }
    }

    // 代码相关任务
    if (/code|function|class|file/i.test(userInput)) {
      tools.push({
        name: 'analyze-basic-context',
        parameters: {
          analysis_scope: 'basic'
        }
      });
    }

    // 文件操作相关
    const fileMatch = userInput.match(/([a-zA-Z0-9_.-]+\.[a-zA-Z]+)/);
    if (fileMatch) {
      tools.push({
        name: 'read-file',
        parameters: {
          file_path: fileMatch[1],
          max_size: 10000
        }
      });
    }

    return tools;
  }

  /**
   * 分析任务复杂度
   */
  private analyzeTaskComplexity(userInput: string, gatheringResults: ToolResult[]): TaskComplexity {
    let score = 0;

    // 基于关键词分析
    const complexKeywords = [
      'implement', 'create', 'build', 'refactor', 'migrate', 'fix bug',
      'multiple files', 'architecture', 'system'
    ];
    
    const mediumKeywords = [
      'modify', 'update', 'change', 'add', 'remove', 'configure'
    ];

    const simpleKeywords = [
      'read', 'show', 'list', 'display', 'what is', 'how to', 'explain'
    ];

    if (complexKeywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
      score += 3;
    } else if (mediumKeywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
      score += 2;
    } else if (simpleKeywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
      score += 1;
    }

    // 基于收集到的信息分析
    if (gatheringResults.length > 2) score += 1;
    if (gatheringResults.some(r => r.result && JSON.stringify(r.result).length > 5000)) score += 1;

    // 基于文件数量分析
    const fileMatches = userInput.match(/\b\w+\.\w+\b/g);
    if (fileMatches && fileMatches.length > 2) score += 1;

    if (score >= 4) return 'complex';
    if (score >= 2) return 'medium';
    return 'simple';
  }

  /**
   * 生成执行计划
   */
  private async generateExecutionPlan(
    userInput: string, 
    gatheringResults: ToolResult[], 
    complexity: TaskComplexity
  ): Promise<ExecutionPlan> {
    const planId = `plan_${Date.now()}`;
    
    // 根据复杂度生成不同的计划
    switch (complexity) {
      case 'simple':
        return this.generateSimplePlan(planId, userInput, gatheringResults);
      
      case 'medium':
        return this.generateMediumPlan(planId, userInput, gatheringResults);
      
      case 'complex':
        return this.generateComplexPlan(planId, userInput, gatheringResults);
    }
  }

  /**
   * 生成简单任务计划
   */
  private generateSimplePlan(planId: string, userInput: string, gatheringResults: ToolResult[]): ExecutionPlan {
    const tool = this.selectPrimaryTool(userInput);
    
    return {
      id: planId,
      goal: `Execute simple task: ${userInput}`,
      complexity: 'simple',
      estimatedTime: 30,
      filesToModify: [],
      phases: [{
        id: 'phase_1',
        name: 'Execute Task',
        description: `Use ${tool.name} to complete the request`,
        tools: [tool],
        dependencies: [],
        optional: false,
        estimatedTime: 30
      }],
      risks: [{
        description: 'Tool execution might fail',
        probability: 'low',
        impact: 'low',
        mitigation: 'Retry with different parameters'
      }],
      validation: [{
        description: 'Verify task completion',
        tool: 'read-file',
        parameters: {},
        successCriteria: 'Task completed successfully'
      }]
    };
  }

  /**
   * 生成中等复杂度任务计划
   */
  private generateMediumPlan(planId: string, userInput: string, gatheringResults: ToolResult[]): ExecutionPlan {
    const phases: ExecutionPhase[] = [
      {
        id: 'analysis_phase',
        name: 'Analysis Phase',
        description: 'Analyze current state and requirements',
        tools: [
          {
            tool: 'read-file',
            parameters: {},
            purpose: 'Understand current code structure',
            expectedOutcome: 'Clear understanding of existing code',
            fallbackOptions: ['list-directory']
          }
        ],
        dependencies: [],
        optional: false,
        estimatedTime: 45
      },
      {
        id: 'modification_phase',
        name: 'Modification Phase',
        description: 'Apply necessary changes',
        tools: [
          {
            tool: 'str-replace-editor',
            parameters: { dry_run: true, create_backup: true },
            purpose: 'Make required code changes',
            expectedOutcome: 'Code successfully modified',
            fallbackOptions: ['write-file']
          }
        ],
        dependencies: ['analysis_phase'],
        optional: false,
        estimatedTime: 60
      },
      {
        id: 'validation_phase',
        name: 'Validation Phase',
        description: 'Verify changes are correct',
        tools: [
          {
            tool: 'diagnostics',
            parameters: {},
            purpose: 'Check for errors after modification',
            expectedOutcome: 'No errors or warnings',
            fallbackOptions: ['run-terminal-command']
          }
        ],
        dependencies: ['modification_phase'],
        optional: false,
        estimatedTime: 30
      }
    ];

    return {
      id: planId,
      goal: `Complete medium complexity task: ${userInput}`,
      complexity: 'medium',
      estimatedTime: 135,
      filesToModify: this.extractFilesToModify(userInput, gatheringResults),
      phases,
      risks: [
        {
          description: 'Code changes might introduce bugs',
          probability: 'medium',
          impact: 'medium',
          mitigation: 'Use backup and validation steps'
        }
      ],
      validation: [
        {
          description: 'Run tests to verify changes',
          tool: 'launch-process',
          parameters: { command: 'npm test' },
          successCriteria: 'All tests pass'
        }
      ],
      rollbackStrategy: {
        enabled: true,
        backupFiles: [],
        rollbackSteps: ['Restore from backup', 'Verify restoration']
      }
    };
  }

  /**
   * 生成复杂任务计划
   */
  private generateComplexPlan(planId: string, userInput: string, gatheringResults: ToolResult[]): ExecutionPlan {
    // 复杂任务需要更详细的分析和多阶段执行
    // 这里可以调用LLM来生成更智能的计划
    return this.generateMediumPlan(planId, userInput, gatheringResults);
  }

  /**
   * 选择主要工具
   */
  private selectPrimaryTool(userInput: string): PlannedToolCall {
    if (/read|show|display/i.test(userInput)) {
      return {
        tool: 'read-file',
        parameters: {},
        purpose: 'Read file content',
        expectedOutcome: 'File content displayed',
        fallbackOptions: ['list-directory']
      };
    }

    if (/list|directory/i.test(userInput)) {
      return {
        tool: 'list-directory',
        parameters: {},
        purpose: 'List directory contents',
        expectedOutcome: 'Directory structure shown',
        fallbackOptions: ['read-file']
      };
    }

    // 默认工具
    return {
      tool: 'analyze-basic-context',
      parameters: {},
      purpose: 'Analyze project context',
      expectedOutcome: 'Project structure understood',
      fallbackOptions: ['list-directory']
    };
  }

  /**
   * 提取需要修改的文件
   */
  private extractFilesToModify(userInput: string, gatheringResults: ToolResult[]): string[] {
    const files: string[] = [];
    
    // 从用户输入中提取文件名
    const fileMatches = userInput.match(/\b[\w.-]+\.\w+\b/g);
    if (fileMatches) {
      files.push(...fileMatches);
    }

    // 从收集的结果中提取文件信息
    gatheringResults.forEach(result => {
      if (result.functionCall.name === 'read-file' && result.functionCall.parameters.file_path) {
        files.push(result.functionCall.parameters.file_path);
      }
    });

    return [...new Set(files)]; // 去重
  }
}
