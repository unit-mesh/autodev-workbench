/**
 * 通用AI辅助迁移框架 - 主入口文件
 *
 * @packageDocumentation
 */
export { MigrationContext } from './core/MigrationContext';
export { ContextAwareComponent } from './core/ContextAwareComponent';
export { AIService } from './core/AIService';
export { ToolRegistry } from './tools/ToolRegistry';
export { ToolExecutor } from './tools/ToolExecutor';
export { MigrationOrchestrator } from './orchestrator/MigrationOrchestrator';
export { StrategyPlanner } from './orchestrator/StrategyPlanner';
export { BaseAIAgent } from './agents/BaseAIAgent';
export { AnalysisAgent } from './agents/AnalysisAgent';
export { FixAgent } from './agents/FixAgent';
export { ValidationAgent } from './agents/ValidationAgent';
export { ConfigManager } from './config/ConfigManager';
export { PresetManager } from './config/PresetManager';
export { MockAIService } from './core/MockAIService';
export { GLMAIService } from './core/GLMAIService';
export * from './utils';
export * from './types';
export * from './types/errors';
export { defaultConfig } from './config/defaults';
export declare const VERSION = "1.0.0";
/**
 * 创建迁移上下文的便捷函数
 */
export declare function createMigrationContext(projectPath: string, config?: any): any;
/**
 * 创建工具执行器的便捷函数
 */
export declare function createToolExecutor(context: any, options?: any): any;
/**
 * 创建迁移编排器的便捷函数
 */
export declare function createMigrationOrchestrator(options?: any): any;
/**
 * 创建模拟AI服务的便捷函数
 */
export declare function createMockAIService(config?: any): any;
/**
 * 创建GLM AI服务的便捷函数
 */
export declare function createGLMAIService(config?: any): any;
/**
 * 框架信息
 */
export declare const FRAMEWORK_INFO: {
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
};
/**
 * 检查框架依赖是否满足
 */
export declare function checkDependencies(): {
    satisfied: boolean;
    missing: string[];
    optional: string[];
};
/**
 * 获取框架状态信息
 */
export declare function getFrameworkStatus(): {
    dependencies: {
        satisfied: boolean;
        missing: string[];
        optional: string[];
    };
    ready: boolean;
    timestamp: string;
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
};
//# sourceMappingURL=index.d.ts.map