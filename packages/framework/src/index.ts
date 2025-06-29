/**
 * 通用AI辅助迁移框架 - 主入口文件
 * 
 * @packageDocumentation
 */

// 核心组件
export { MigrationContext } from './core/MigrationContext';
export { ContextAwareComponent } from './core/ContextAwareComponent';
export { AIService } from './core/AIService';

// 工具系统
export { ToolRegistry } from './tools/ToolRegistry';
export { ToolExecutor } from './tools/ToolExecutor';

// 编排器
export { MigrationOrchestrator } from './orchestrator/MigrationOrchestrator';
export { StrategyPlanner } from './orchestrator/StrategyPlanner';

// AI代理
export { BaseAIAgent } from './agents/BaseAIAgent';
export { AnalysisAgent } from './agents/AnalysisAgent';
export { FixAgent } from './agents/FixAgent';
export { ValidationAgent } from './agents/ValidationAgent';

// 配置管理
export { ConfigManager } from './config/ConfigManager';
export { PresetManager } from './config/PresetManager';

// AI服务实现
export { MockAIService } from './core/MockAIService';
export { GLMAIService } from './core/GLMAIService';

// 工具函数
export * from './utils';

// 类型定义
export * from './types';

// 错误类型
export * from './types/errors';

// 默认配置
export { defaultConfig } from './config/defaults';

// 版本信息
export const VERSION = '1.0.0';

/**
 * 创建迁移上下文的便捷函数
 */
export function createMigrationContext(projectPath: string, config: any = {}) {
  const { MigrationContext } = require('./core/MigrationContext');
  return new MigrationContext(projectPath, config);
}

/**
 * 创建工具执行器的便捷函数
 */
export function createToolExecutor(context: any, options: any = {}) {
  const { ToolExecutor } = require('./tools/ToolExecutor');
  return new ToolExecutor('DefaultToolExecutor', context, options);
}

/**
 * 创建迁移编排器的便捷函数
 */
export function createMigrationOrchestrator(options: any = {}) {
  const { MigrationOrchestrator } = require('./orchestrator/MigrationOrchestrator');
  return new MigrationOrchestrator(options);
}

/**
 * 创建模拟AI服务的便捷函数
 */
export function createMockAIService(config: any = {}) {
  const { MockAIService } = require('./core/MockAIService');
  return new MockAIService(config);
}

/**
 * 创建GLM AI服务的便捷函数
 */
export function createGLMAIService(config: any = {}) {
  const { GLMAIService } = require('./core/GLMAIService');
  return new GLMAIService(config);
}

/**
 * 框架信息
 */
export const FRAMEWORK_INFO = {
  name: '@ai-migration/framework',
  version: VERSION,
  description: '通用AI辅助迁移框架',
  author: 'AI Migration Team',
  license: 'MIT'
};

/**
 * 检查框架依赖是否满足
 */
export function checkDependencies(): { 
  satisfied: boolean; 
  missing: string[]; 
  optional: string[] 
} {
  const required: string[] = [];
  const missing: string[] = [];
  const optional: string[] = [];

  // 检查可选的AI依赖
  try {
    require('ai');
    require('@ai-sdk/openai');
  } catch (error) {
    optional.push('AI SDK (ai, @ai-sdk/openai)');
  }

  return {
    satisfied: missing.length === 0,
    missing,
    optional
  };
}

/**
 * 获取框架状态信息
 */
export function getFrameworkStatus() {
  const deps = checkDependencies();
  
  return {
    ...FRAMEWORK_INFO,
    dependencies: deps,
    ready: deps.satisfied,
    timestamp: new Date().toISOString()
  };
}
