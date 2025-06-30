"use strict";
/**
 * 通用AI辅助迁移框架 - 主入口文件
 *
 * @packageDocumentation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRAMEWORK_INFO = exports.VERSION = exports.defaultConfig = exports.GLMAIService = exports.MockAIService = exports.PresetManager = exports.ConfigManager = exports.ValidationAgent = exports.FixAgent = exports.AnalysisAgent = exports.BaseAIAgent = exports.StrategyPlanner = exports.MigrationOrchestrator = exports.ToolExecutor = exports.ToolRegistry = exports.AIService = exports.ContextAwareComponent = exports.MigrationContext = void 0;
exports.createMigrationContext = createMigrationContext;
exports.createToolExecutor = createToolExecutor;
exports.createMigrationOrchestrator = createMigrationOrchestrator;
exports.createMockAIService = createMockAIService;
exports.createGLMAIService = createGLMAIService;
exports.checkDependencies = checkDependencies;
exports.getFrameworkStatus = getFrameworkStatus;
// 核心组件
var MigrationContext_1 = require("./core/MigrationContext");
Object.defineProperty(exports, "MigrationContext", { enumerable: true, get: function () { return MigrationContext_1.MigrationContext; } });
var ContextAwareComponent_1 = require("./core/ContextAwareComponent");
Object.defineProperty(exports, "ContextAwareComponent", { enumerable: true, get: function () { return ContextAwareComponent_1.ContextAwareComponent; } });
var AIService_1 = require("./core/AIService");
Object.defineProperty(exports, "AIService", { enumerable: true, get: function () { return AIService_1.AIService; } });
// 工具系统
var ToolRegistry_1 = require("./tools/ToolRegistry");
Object.defineProperty(exports, "ToolRegistry", { enumerable: true, get: function () { return ToolRegistry_1.ToolRegistry; } });
var ToolExecutor_1 = require("./tools/ToolExecutor");
Object.defineProperty(exports, "ToolExecutor", { enumerable: true, get: function () { return ToolExecutor_1.ToolExecutor; } });
// 编排器
var MigrationOrchestrator_1 = require("./orchestrator/MigrationOrchestrator");
Object.defineProperty(exports, "MigrationOrchestrator", { enumerable: true, get: function () { return MigrationOrchestrator_1.MigrationOrchestrator; } });
var StrategyPlanner_1 = require("./orchestrator/StrategyPlanner");
Object.defineProperty(exports, "StrategyPlanner", { enumerable: true, get: function () { return StrategyPlanner_1.StrategyPlanner; } });
// AI代理
var BaseAIAgent_1 = require("./agents/BaseAIAgent");
Object.defineProperty(exports, "BaseAIAgent", { enumerable: true, get: function () { return BaseAIAgent_1.BaseAIAgent; } });
var AnalysisAgent_1 = require("./agents/AnalysisAgent");
Object.defineProperty(exports, "AnalysisAgent", { enumerable: true, get: function () { return AnalysisAgent_1.AnalysisAgent; } });
var FixAgent_1 = require("./agents/FixAgent");
Object.defineProperty(exports, "FixAgent", { enumerable: true, get: function () { return FixAgent_1.FixAgent; } });
var ValidationAgent_1 = require("./agents/ValidationAgent");
Object.defineProperty(exports, "ValidationAgent", { enumerable: true, get: function () { return ValidationAgent_1.ValidationAgent; } });
// 配置管理
var ConfigManager_1 = require("./config/ConfigManager");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return ConfigManager_1.ConfigManager; } });
var PresetManager_1 = require("./config/PresetManager");
Object.defineProperty(exports, "PresetManager", { enumerable: true, get: function () { return PresetManager_1.PresetManager; } });
// AI服务实现
var MockAIService_1 = require("./core/MockAIService");
Object.defineProperty(exports, "MockAIService", { enumerable: true, get: function () { return MockAIService_1.MockAIService; } });
var GLMAIService_1 = require("./core/GLMAIService");
Object.defineProperty(exports, "GLMAIService", { enumerable: true, get: function () { return GLMAIService_1.GLMAIService; } });
// 工具函数
__exportStar(require("./utils"), exports);
// 类型定义
__exportStar(require("./types"), exports);
// 错误类型
__exportStar(require("./types/errors"), exports);
// 默认配置
var defaults_1 = require("./config/defaults");
Object.defineProperty(exports, "defaultConfig", { enumerable: true, get: function () { return defaults_1.defaultConfig; } });
// 版本信息
exports.VERSION = '1.0.0';
/**
 * 创建迁移上下文的便捷函数
 */
function createMigrationContext(projectPath, config = {}) {
    const { MigrationContext } = require('./core/MigrationContext');
    return new MigrationContext(projectPath, config);
}
/**
 * 创建工具执行器的便捷函数
 */
function createToolExecutor(context, options = {}) {
    const { ToolExecutor } = require('./tools/ToolExecutor');
    return new ToolExecutor('DefaultToolExecutor', context, options);
}
/**
 * 创建迁移编排器的便捷函数
 */
function createMigrationOrchestrator(options = {}) {
    const { MigrationOrchestrator } = require('./orchestrator/MigrationOrchestrator');
    return new MigrationOrchestrator(options);
}
/**
 * 创建模拟AI服务的便捷函数
 */
function createMockAIService(config = {}) {
    const { MockAIService } = require('./core/MockAIService');
    return new MockAIService(config);
}
/**
 * 创建GLM AI服务的便捷函数
 */
function createGLMAIService(config = {}) {
    const { GLMAIService } = require('./core/GLMAIService');
    return new GLMAIService(config);
}
/**
 * 框架信息
 */
exports.FRAMEWORK_INFO = {
    name: '@ai-migration/framework',
    version: exports.VERSION,
    description: '通用AI辅助迁移框架',
    author: 'AI Migration Team',
    license: 'MIT'
};
/**
 * 检查框架依赖是否满足
 */
function checkDependencies() {
    const required = [];
    const missing = [];
    const optional = [];
    // 检查可选的AI依赖
    try {
        require('ai');
        require('@ai-sdk/openai');
    }
    catch (error) {
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
function getFrameworkStatus() {
    const deps = checkDependencies();
    return {
        ...exports.FRAMEWORK_INFO,
        dependencies: deps,
        ready: deps.satisfied,
        timestamp: new Date().toISOString()
    };
}
//# sourceMappingURL=index.js.map