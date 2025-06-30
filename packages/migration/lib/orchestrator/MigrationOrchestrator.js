"use strict";
/**
 * 迁移编排器 - 核心编排组件
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationOrchestrator = void 0;
const events_1 = require("events");
const MigrationContext_1 = require("../core/MigrationContext");
const StrategyPlanner_1 = require("./StrategyPlanner");
const errors_1 = require("../types/errors");
class MigrationOrchestrator extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.options = options;
        this.context = null;
        this.planner = null;
        this.isPaused = false;
        this.currentStep = null;
        this.options = {
            dryRun: false,
            verbose: false,
            maxRetries: 3,
            ...options
        };
    }
    async initialize(projectPath, config = {}) {
        this.log('初始化迁移编排器...');
        // 创建迁移上下文
        this.context = new MigrationContext_1.MigrationContext(projectPath, config);
        // 创建策略规划器
        this.planner = new StrategyPlanner_1.StrategyPlanner(this.context, this.options);
        await this.planner.initialize();
        // 设置事件监听
        this.setupEventListeners();
        this.log('迁移编排器初始化完成');
        return this.context;
    }
    async execute(customPlan) {
        if (!this.context || !this.planner) {
            throw new errors_1.MigrationError('请先调用 initialize() 方法');
        }
        try {
            this.context.startMigration();
            this.context.setPhase('analyzing');
            // 分析项目
            const analysis = await this.planner.analyzeProject(this.context.projectPath);
            this.context.setProjectInfo(analysis);
            // 生成迁移计划
            const plan = customPlan || await this.planner.generateMigrationPlan(analysis);
            this.context.recordResult('analysis', analysis);
            this.context.recordResult('plan', plan);
            this.context.setPhase('executing');
            this.context.stats.totalSteps = plan.steps.length;
            // 执行迁移步骤
            const results = await this.executeSteps(plan.steps);
            this.context.setPhase('completed');
            this.context.setProgress(100);
            this.context.completeMigration();
            const summary = this.generateSummary(analysis, plan, results);
            this.log('迁移执行完成');
            return {
                success: true,
                analysis,
                plan,
                results,
                context: this.context.getSummary(),
                summary,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            this.context.setPhase('failed');
            this.context.failMigration(error);
            this.logError('迁移执行失败', error);
            throw error;
        }
    }
    async executeSteps(steps) {
        const results = [];
        const totalSteps = steps.length;
        for (let i = 0; i < steps.length; i++) {
            if (this.isPaused) {
                this.log('迁移已暂停');
                break;
            }
            const step = steps[i];
            this.currentStep = step;
            this.log(`执行步骤 ${i + 1}/${totalSteps}: ${step.name}`);
            try {
                const result = await this.executeStep(step);
                results.push({ step: step.name, success: true, result });
                // 更新进度
                const progress = Math.round(((i + 1) / totalSteps) * 100);
                this.context.setProgress(progress);
            }
            catch (error) {
                const result = { step: step.name, success: false, error: error.message };
                results.push(result);
                if (step.required) {
                    throw error; // 必需步骤失败则终止
                }
                else {
                    this.log(`可选步骤 ${step.name} 失败，继续执行`);
                }
            }
        }
        return results;
    }
    async executeStep(step) {
        // 这里应该根据步骤类型调用相应的执行器
        // 为了简化，这里只是模拟执行
        this.log(`模拟执行步骤: ${step.name}`);
        // 模拟执行时间
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { stepName: step.name, completed: true };
    }
    pause() {
        this.isPaused = true;
        this.log('迁移已暂停');
        this.emit('migration:paused');
    }
    resume() {
        this.isPaused = false;
        this.log('迁移已恢复');
        this.emit('migration:resumed');
    }
    setupEventListeners() {
        if (!this.context)
            return;
        this.context.on('phase:change', (data) => {
            this.emit('phase:change', data);
        });
        this.context.on('progress:update', (progress) => {
            this.emit('progress:update', progress);
        });
        this.context.on('error:add', (data) => {
            this.emit('error:add', data);
        });
    }
    generateSummary(analysis, plan, results) {
        const totalSteps = results.length;
        const completedSteps = results.filter(r => r.success).length;
        const successRate = totalSteps > 0 ? completedSteps / totalSteps : 0;
        return {
            totalSteps,
            completedSteps,
            successRate,
            duration: this.context.stats.duration || 0,
            filesModified: this.context.stats.filesModified,
            errorsFixed: this.context.stats.errorsFixed,
            aiCalls: this.context.stats.aiCalls,
            overallSuccess: successRate === 1 && this.context.issues.filter(i => i.type === 'error').length === 0
        };
    }
    log(message) {
        if (this.options.verbose) {
            console.log(`[MigrationOrchestrator] ${message}`);
        }
    }
    logError(message, error) {
        console.error(`[MigrationOrchestrator] ${message}`, error?.message || error);
    }
}
exports.MigrationOrchestrator = MigrationOrchestrator;
//# sourceMappingURL=MigrationOrchestrator.js.map