import { ExecutionPlan, ExecutionPhase, Risk } from "./planning-engine";

export class PlanPresenter {
  /**
   * 格式化计划供用户查看
   */
  static formatPlanForUser(plan: ExecutionPlan): string {
    const complexityEmoji = {
      'simple': '🟢',
      'medium': '🟡', 
      'complex': '🔴'
    };

    const riskEmoji = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🔴'
    };

    return `
## 📋 执行计划

**目标**: ${plan.goal}
**复杂度**: ${complexityEmoji[plan.complexity]} ${plan.complexity.toUpperCase()}
**预估时间**: ${plan.estimatedTime}秒 (${Math.round(plan.estimatedTime / 60)}分钟)
**计划ID**: \`${plan.id}\`

### 🔄 执行步骤:
${plan.phases.map((phase, index) => this.formatPhase(phase, index + 1)).join('\n')}

${plan.risks.length > 0 ? `### ⚠️ 风险评估:
${plan.risks.map(risk => `- ${riskEmoji[risk.probability]} **${risk.description}**
  - 概率: ${risk.probability} | 影响: ${risk.impact}
  - 缓解措施: ${risk.mitigation}`).join('\n')}` : ''}

${plan.filesToModify.length > 0 ? `### 📝 需要修改的文件:
${plan.filesToModify.map(file => `- \`${file}\``).join('\n')}` : ''}

${plan.validation.length > 0 ? `### ✅ 验证步骤:
${plan.validation.map(v => `- ${v.description}`).join('\n')}` : ''}

${plan.rollbackStrategy?.enabled ? `### 🔄 回滚策略:
- 自动备份: ✅ 启用
- 回滚步骤: ${plan.rollbackStrategy.rollbackSteps.join(' → ')}` : ''}

---

**这个计划可以吗？**
- 输入 \`yes\` 或 \`执行\` 开始执行
- 输入 \`modify\` 或 \`修改\` 来调整计划  
- 输入 \`cancel\` 或 \`取消\` 来取消计划
- 或者告诉我具体需要调整什么
    `;
  }

  /**
   * 格式化单个阶段
   */
  private static formatPhase(phase: ExecutionPhase, index: number): string {
    const dependencyText = phase.dependencies.length > 0 
      ? ` (依赖: ${phase.dependencies.join(', ')})`
      : '';
    
    const optionalText = phase.optional ? ' [可选]' : '';

    return `
**${index}. ${phase.name}**${optionalText}${dependencyText}
   - 📝 ${phase.description}
   - 🔧 工具: ${phase.tools.map(t => `\`${t.tool}\``).join(', ')}
   - 🎯 目的: ${phase.tools[0]?.purpose || '执行任务'}
   - ⏱️ 预估时间: ${phase.estimatedTime}秒
   - 📊 预期结果: ${phase.tools[0]?.expectedOutcome || '任务完成'}`;
  }

  /**
   * 格式化计划执行进度
   */
  static formatExecutionProgress(
    plan: ExecutionPlan, 
    currentPhaseIndex: number, 
    phaseResults: any[]
  ): string {
    const totalPhases = plan.phases.length;
    const progress = Math.round((currentPhaseIndex / totalPhases) * 100);
    
    return `
## 🔄 执行进度

**计划**: ${plan.goal}
**进度**: ${progress}% (${currentPhaseIndex}/${totalPhases} 阶段完成)

### 📊 阶段状态:
${plan.phases.map((phase, index) => {
  let status = '⏳ 等待中';
  if (index < currentPhaseIndex) {
    const result = phaseResults[index];
    status = result?.success ? '✅ 已完成' : '❌ 失败';
  } else if (index === currentPhaseIndex) {
    status = '🔄 执行中';
  }
  
  return `${index + 1}. ${phase.name}: ${status}`;
}).join('\n')}

${currentPhaseIndex < totalPhases ? `
### 🎯 当前阶段: ${plan.phases[currentPhaseIndex].name}
${plan.phases[currentPhaseIndex].description}
` : ''}
    `;
  }

  /**
   * 格式化执行结果
   */
  static formatExecutionResults(
    plan: ExecutionPlan, 
    results: any[], 
    success: boolean,
    executionTime: number
  ): string {
    const statusEmoji = success ? '✅' : '❌';
    const statusText = success ? '成功完成' : '执行失败';
    
    return `
## ${statusEmoji} 计划执行结果

**计划**: ${plan.goal}
**状态**: ${statusText}
**执行时间**: ${executionTime}秒 (预估: ${plan.estimatedTime}秒)

### 📊 阶段执行结果:
${plan.phases.map((phase, index) => {
  const result = results[index];
  if (!result) return `${index + 1}. ${phase.name}: ⏭️ 未执行`;
  
  const phaseStatus = result.success ? '✅ 成功' : '❌ 失败';
  const timing = result.executionTime ? ` (${result.executionTime}ms)` : '';
  
  return `${index + 1}. ${phase.name}: ${phaseStatus}${timing}`;
}).join('\n')}

${!success ? `
### ❌ 失败原因:
${results.filter(r => !r.success).map(r => `- ${r.error || '未知错误'}`).join('\n')}

### 🔄 建议操作:
- 检查错误信息并修复问题
- 使用 \`retry\` 重新执行失败的阶段
- 使用 \`rollback\` 回滚到执行前状态
` : `
### 🎉 执行成功!
所有阶段都已成功完成。

${plan.validation.length > 0 ? `### ✅ 建议验证:
${plan.validation.map(v => `- ${v.description}`).join('\n')}` : ''}
`}
    `;
  }

  /**
   * 格式化计划修改建议
   */
  static formatPlanModificationOptions(plan: ExecutionPlan): string {
    return `
## 🔧 计划修改选项

当前计划: **${plan.goal}**

### 可以修改的内容:

**1. 调整执行步骤**
- 添加新的阶段: \`add phase [阶段名称] [描述]\`
- 删除阶段: \`remove phase [阶段编号]\`
- 修改阶段顺序: \`reorder phases [新顺序]\`

**2. 修改工具选择**
- 更换工具: \`change tool [阶段编号] [新工具名]\`
- 添加备选工具: \`add fallback [阶段编号] [工具名]\`

**3. 调整安全设置**
- 启用/禁用备份: \`backup on/off\`
- 启用/禁用预览模式: \`dry-run on/off\`
- 修改超时时间: \`timeout [秒数]\`

**4. 风险管理**
- 添加风险缓解措施: \`add mitigation [风险描述] [缓解措施]\`
- 调整风险等级: \`risk level [风险编号] [low/medium/high]\`

### 💡 常见修改示例:
- "添加测试验证阶段"
- "在修改前先备份所有文件"  
- "使用更安全的工具"
- "增加错误检查步骤"

请告诉我你想要如何修改这个计划。
    `;
  }

  /**
   * 格式化简化版计划 (用于日志)
   */
  static formatPlanSummary(plan: ExecutionPlan): string {
    return `Plan ${plan.id}: ${plan.goal} (${plan.complexity}, ${plan.phases.length} phases, ${plan.estimatedTime}s)`;
  }

  /**
   * 格式化计划比较 (当有多个计划选项时)
   */
  static formatPlanComparison(plans: ExecutionPlan[]): string {
    if (plans.length <= 1) {
      return plans.length === 1 ? this.formatPlanForUser(plans[0]) : '没有可用的计划。';
    }

    return `
## 🔍 计划选项比较

我为你生成了 ${plans.length} 个不同的执行计划，请选择最适合的：

${plans.map((plan, index) => `
### 选项 ${index + 1}: ${plan.goal}
- **复杂度**: ${plan.complexity}
- **预估时间**: ${plan.estimatedTime}秒
- **阶段数**: ${plan.phases.length}个
- **风险等级**: ${plan.risks.length > 0 ? plan.risks[0].probability : 'low'}
- **需要修改文件**: ${plan.filesToModify.length}个

**主要步骤**: ${plan.phases.map(p => p.name).join(' → ')}
`).join('')}

请输入选项编号 (1-${plans.length}) 来选择计划，或者输入 \`custom\` 来自定义计划。
    `;
  }
}
