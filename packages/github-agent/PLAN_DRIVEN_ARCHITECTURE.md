# 🎯 计划驱动架构改造方案

## 🔄 当前架构 vs 目标架构

### 当前架构 (工具驱动)
```
用户输入 → LLM分析 → 直接调用工具 → 返回结果
```

### 目标架构 (计划驱动)
```
用户输入 → 信息收集 → 制定计划 → 用户确认 → 执行计划 → 验证结果
```

## 🏗️ 架构改造设计

### 1. 新增核心组件

#### PlanningEngine - 计划引擎
```typescript
export class PlanningEngine {
  constructor(
    private toolExecutor: ToolExecutor,
    private llmProvider: LLMProvider
  ) {}

  async createPlan(userInput: string, context: any): Promise<ExecutionPlan> {
    // 1. 信息收集阶段
    const gatheringResults = await this.gatherInformation(userInput, context);
    
    // 2. 分析任务复杂度
    const complexity = this.analyzeTaskComplexity(userInput, gatheringResults);
    
    // 3. 制定执行计划
    const plan = await this.generateExecutionPlan(userInput, gatheringResults, complexity);
    
    return plan;
  }

  private async gatherInformation(userInput: string, context: any): Promise<ToolResult[]> {
    const gatheringTools = this.selectGatheringTools(userInput);
    return await this.toolExecutor.executeTools(gatheringTools);
  }

  private analyzeTaskComplexity(userInput: string, gatheringResults: ToolResult[]): TaskComplexity {
    // 分析任务复杂度：simple, medium, complex
    return this.llmProvider.analyzeComplexity(userInput, gatheringResults);
  }
}
```

#### ExecutionPlan - 执行计划
```typescript
export interface ExecutionPlan {
  id: string;
  goal: string;
  complexity: 'simple' | 'medium' | 'complex';
  phases: ExecutionPhase[];
  estimatedTime: number;
  risks: Risk[];
  rollbackStrategy: RollbackStrategy;
  validation: ValidationStep[];
}

export interface ExecutionPhase {
  id: string;
  name: string;
  description: string;
  tools: PlannedToolCall[];
  dependencies: string[];  // 依赖的其他phase
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
```

#### PlanPresenter - 计划展示器
```typescript
export class PlanPresenter {
  static formatPlanForUser(plan: ExecutionPlan): string {
    return `
## 📋 执行计划

**目标**: ${plan.goal}
**复杂度**: ${plan.complexity}
**预估时间**: ${plan.estimatedTime}秒

### 执行步骤:
${plan.phases.map((phase, index) => `
${index + 1}. **${phase.name}**
   - ${phase.description}
   - 工具: ${phase.tools.map(t => t.tool).join(', ')}
   - 预期结果: ${phase.tools[0]?.expectedOutcome}
`).join('')}

### 风险评估:
${plan.risks.map(risk => `- ${risk.description} (概率: ${risk.probability})`).join('\n')}

### 需要修改的文件:
${this.extractFilesToModify(plan)}

**这个计划可以吗？输入 'yes' 继续执行，或者告诉我需要调整什么。**
    `;
  }
}
```

### 2. 改造现有Agent类

#### 新的Agent工作流
```typescript
export class PlanDrivenAgent extends Agent {
  private planningEngine: PlanningEngine;
  private planPresenter: PlanPresenter;
  private currentPlan?: ExecutionPlan;

  async start(userInput: string, context?: any): Promise<AgentResponse> {
    // 检查是否是计划确认
    if (this.isPlanConfirmation(userInput)) {
      return await this.executePlan(this.currentPlan!);
    }

    // 分析任务类型
    const taskType = await this.analyzeTaskType(userInput);
    
    switch (taskType) {
      case 'simple':
        return await this.handleSimpleTask(userInput, context);
      
      case 'complex':
        return await this.handleComplexTask(userInput, context);
      
      case 'professional':
        return await this.handleProfessionalTask(userInput, context);
    }
  }

  private async handleComplexTask(userInput: string, context: any): Promise<AgentResponse> {
    // 1. 创建计划
    this.currentPlan = await this.planningEngine.createPlan(userInput, context);
    
    // 2. 展示计划给用户
    const planPresentation = this.planPresenter.formatPlanForUser(this.currentPlan);
    
    return {
      text: planPresentation,
      toolResults: [],
      success: true,
      requiresConfirmation: true,
      plan: this.currentPlan
    };
  }

  private async executePlan(plan: ExecutionPlan): Promise<AgentResponse> {
    const results: ToolResult[] = [];
    
    for (const phase of plan.phases) {
      const phaseResults = await this.executePhase(phase);
      results.push(...phaseResults);
      
      // 验证阶段结果
      const validation = await this.validatePhaseResults(phase, phaseResults);
      if (!validation.success) {
        return this.handleExecutionFailure(phase, validation.error);
      }
    }
    
    return this.generateFinalResponse(plan, results);
  }
}
```

### 3. 任务复杂度分析器

```typescript
export class TaskComplexityAnalyzer {
  static analyze(userInput: string, context?: any): TaskType {
    const indicators = {
      simple: [
        /^(read|show|list|display)/i,
        /^what is/i,
        /^how to/i
      ],
      
      complex: [
        /^(implement|create|build|refactor)/i,
        /^fix.*bug/i,
        /multiple.*files?/i,
        /^migrate/i
      ],
      
      professional: [
        /github.*issue/i,
        /analyze.*project/i,
        /review.*code/i
      ]
    };

    // 分析用户输入匹配哪种类型
    for (const [type, patterns] of Object.entries(indicators)) {
      if (patterns.some(pattern => pattern.test(userInput))) {
        return type as TaskType;
      }
    }

    return 'simple'; // 默认简单任务
  }
}
```

### 4. 计划生成提示词

```typescript
export class PlanningPrompts {
  static generatePlanningPrompt(userInput: string, gatheringResults: ToolResult[]): string {
    return `
You are a planning expert. Based on the user request and gathered information, create a detailed execution plan.

User Request: ${userInput}

Gathered Information:
${gatheringResults.map(r => `- ${r.functionCall.name}: ${JSON.stringify(r.result).substring(0, 200)}`).join('\n')}

Create a plan with the following structure:
1. Goal: Clear statement of what we want to achieve
2. Phases: Break down into logical phases
3. Tools: Specific tools needed for each phase
4. Risks: Potential issues and mitigation strategies
5. Validation: How to verify success

Format as JSON with this structure:
{
  "goal": "...",
  "complexity": "simple|medium|complex",
  "phases": [
    {
      "name": "...",
      "description": "...",
      "tools": [
        {
          "tool": "tool-name",
          "parameters": {...},
          "purpose": "why this tool",
          "expectedOutcome": "what we expect"
        }
      ]
    }
  ],
  "risks": [
    {
      "description": "...",
      "probability": "low|medium|high",
      "mitigation": "..."
    }
  ]
}
    `;
  }
}
```

## 🔧 实施步骤

### 阶段1: 基础架构 (1-2天)
1. **创建PlanningEngine类**
2. **创建ExecutionPlan接口**
3. **创建TaskComplexityAnalyzer**
4. **修改Agent类支持计划模式**

### 阶段2: 计划生成 (2-3天)
1. **实现信息收集逻辑**
2. **实现计划生成算法**
3. **创建计划展示格式**
4. **添加用户确认机制**

### 阶段3: 执行引擎 (2-3天)
1. **实现分阶段执行**
2. **添加执行验证**
3. **实现错误恢复**
4. **添加回滚机制**

### 阶段4: 优化和测试 (1-2天)
1. **性能优化**
2. **错误处理完善**
3. **用户体验优化**
4. **全面测试**

## 🎯 配置选项

```typescript
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
```

## 🚀 使用示例

### 简单任务 (直接执行)
```typescript
用户: "读取 package.json 文件"
AI: 直接调用 read-file → 返回结果
```

### 复杂任务 (计划模式)
```typescript
用户: "重构用户认证模块"

AI: 
## 📋 执行计划

**目标**: 重构用户认证模块，提高安全性和可维护性
**复杂度**: complex
**预估时间**: 180秒

### 执行步骤:
1. **代码分析阶段**
   - 使用 codebase-retrieval 查找认证相关代码
   - 使用 read-file 读取核心认证文件
   - 预期结果: 了解当前认证架构

2. **问题诊断阶段**  
   - 使用 diagnostics 检查现有问题
   - 使用 web-search 查找最佳实践
   - 预期结果: 识别需要改进的地方

3. **重构实施阶段**
   - 使用 str-replace-editor 修改认证逻辑
   - 使用 str-replace-editor 更新测试文件
   - 预期结果: 完成代码重构

4. **验证测试阶段**
   - 使用 launch-process 运行测试
   - 使用 diagnostics 检查新问题
   - 预期结果: 确保重构成功

### 风险评估:
- 可能破坏现有功能 (概率: medium)
- 测试可能失败 (概率: low)

### 需要修改的文件:
- src/auth/authentication.ts
- src/auth/middleware.ts  
- tests/auth.test.ts

**这个计划可以吗？输入 'yes' 继续执行，或者告诉我需要调整什么。**

用户: "yes"
AI: 开始执行计划...
```

这种架构改造让你的Agent既保持了专业工具的优势，又获得了计划驱动的透明性和可控性！
