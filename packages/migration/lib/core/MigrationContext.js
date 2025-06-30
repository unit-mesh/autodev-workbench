"use strict";
/**
 * 迁移上下文管理器
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationContext = void 0;
const events_1 = require("events");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const errors_1 = require("../types/errors");
class MigrationContext extends events_1.EventEmitter {
    constructor(projectPath, config = {}) {
        super();
        this.issues = [];
        this.tools = new Map();
        this.projectPath = path.resolve(projectPath);
        this.config = config;
        this.createdAt = new Date();
        this.initializeContext();
        this.setupEventListeners();
    }
    initializeContext() {
        // 项目信息
        this.project = {
            path: this.projectPath,
            name: path.basename(this.projectPath),
            type: null,
            framework: null,
            version: null,
            dependencies: {},
            detectedFramework: null,
            confidence: 0
        };
        // 迁移阶段状态
        this.phases = {
            current: null,
            completed: [],
            failed: [],
            skipped: [],
            results: {}
        };
        // 统计信息
        this.stats = {
            startTime: Date.now(),
            endTime: undefined,
            duration: undefined,
            totalSteps: 0,
            completedSteps: 0,
            successRate: 0,
            filesAnalyzed: 0,
            filesModified: 0,
            errorsFixed: 0,
            aiCalls: 0,
            performance: {}
        };
    }
    setupEventListeners() {
        this.on('phase:start', (phase) => {
            this.phases.current = phase;
            this.emit('context:updated', { type: 'phase:start', phase });
        });
        this.on('phase:complete', (phase, result) => {
            this.phases.completed.push(phase);
            this.phases.results[phase] = result;
            this.phases.current = null;
            this.stats.completedSteps++;
            this.updateSuccessRate();
            this.emit('context:updated', { type: 'phase:complete', phase, result });
        });
        this.on('phase:failed', (phase, error) => {
            this.phases.failed.push(phase);
            this.addError(error, phase);
            this.phases.current = null;
            this.emit('context:updated', { type: 'phase:failed', phase, error });
        });
    }
    setPhase(phase, data) {
        this.emit('phase:start', phase);
    }
    completePhase(phase, result) {
        this.emit('phase:complete', phase, result);
    }
    failPhase(phase, error) {
        this.emit('phase:failed', phase, error);
    }
    setProgress(progress) {
        const clampedProgress = Math.max(0, Math.min(100, progress));
        this.emit('progress:update', clampedProgress);
    }
    addError(error, context) {
        const errorObj = typeof error === 'string' ? new Error(error) : error;
        const issue = {
            type: 'error',
            message: errorObj.message,
            context,
            timestamp: new Date(),
            severity: 'medium'
        };
        this.issues.push(issue);
        this.emit('error:add', { error: errorObj, context });
    }
    addWarning(warning, context) {
        const issue = {
            type: 'warning',
            message: warning,
            context,
            timestamp: new Date(),
            severity: 'low'
        };
        this.issues.push(issue);
        this.emit('warning:add', { warning, context });
    }
    recordResult(step, result) {
        this.phases.results[step] = result;
        this.emit('result:record', { step, result });
    }
    setProjectInfo(info) {
        this.project = { ...this.project, ...info };
        this.emit('context:updated', { type: 'project:updated', project: this.project });
    }
    registerTool(name, tool) {
        this.tools.set(name, tool);
        this.emit('context:updated', { type: 'tool:registered', name, tool });
    }
    getTool(name) {
        return this.tools.get(name);
    }
    updateFileStatus(filePath, status) {
        switch (status) {
            case 'analyzed':
                this.stats.filesAnalyzed++;
                break;
            case 'modified':
                this.stats.filesModified++;
                break;
        }
        this.emit('context:updated', { type: 'file:status', filePath, status });
    }
    recordAICall(callInfo) {
        this.stats.aiCalls++;
        if (callInfo.tokens) {
            this.stats.performance.totalTokens = (this.stats.performance.totalTokens || 0) + callInfo.tokens;
        }
        this.emit('context:updated', { type: 'ai:call', ...callInfo });
    }
    startMigration() {
        this.stats.startTime = Date.now();
        this.emit('migration:start');
    }
    completeMigration() {
        this.stats.endTime = Date.now();
        this.stats.duration = this.stats.endTime - this.stats.startTime;
        this.updateSuccessRate();
        this.emit('migration:complete', this.getSummary());
    }
    failMigration(error) {
        this.stats.endTime = Date.now();
        this.stats.duration = this.stats.endTime - this.stats.startTime;
        this.addError(error, 'migration');
        this.emit('migration:failed', error);
    }
    updateSuccessRate() {
        if (this.stats.totalSteps > 0) {
            this.stats.successRate = this.stats.completedSteps / this.stats.totalSteps;
        }
    }
    getSummary() {
        return {
            project: this.project,
            phases: {
                current: this.phases.current,
                completed: this.phases.completed.length,
                failed: this.phases.failed.length,
                total: this.stats.totalSteps
            },
            stats: this.stats,
            issues: {
                errors: this.issues.filter(i => i.type === 'error').length,
                warnings: this.issues.filter(i => i.type === 'warning').length,
                total: this.issues.length
            },
            success: this.phases.failed.length === 0 && this.stats.completedSteps > 0
        };
    }
    getStatusSummary() {
        return {
            phase: this.phases.current,
            progress: this.stats.successRate * 100,
            completedPhases: this.phases.completed.length,
            totalPhases: this.stats.totalSteps,
            hasErrors: this.issues.some(i => i.type === 'error'),
            duration: this.stats.duration
        };
    }
    async saveToFile(filePath) {
        const outputPath = filePath || path.join(this.projectPath, 'migration-context.json');
        const contextData = {
            projectPath: this.projectPath,
            config: this.config,
            project: this.project,
            phases: this.phases,
            stats: this.stats,
            issues: this.issues,
            createdAt: this.createdAt,
            savedAt: new Date()
        };
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeJson(outputPath, contextData, { spaces: 2 });
        return outputPath;
    }
    static async loadFromFile(filePath) {
        if (!await fs.pathExists(filePath)) {
            throw new errors_1.ContextError(`上下文文件不存在: ${filePath}`);
        }
        const contextData = await fs.readJson(filePath);
        const context = new MigrationContext(contextData.projectPath, contextData.config);
        // 恢复状态
        Object.assign(context.project, contextData.project);
        Object.assign(context.phases, contextData.phases);
        Object.assign(context.stats, contextData.stats);
        context.issues = contextData.issues || [];
        return context;
    }
    // 类型安全的事件方法
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
    off(event, listener) {
        return super.off(event, listener);
    }
}
exports.MigrationContext = MigrationContext;
//# sourceMappingURL=MigrationContext.js.map