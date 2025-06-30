"use strict";
/**
 * 上下文感知组件基类
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextAwareComponent = void 0;
const events_1 = require("events");
const chalk_1 = __importDefault(require("chalk"));
class ContextAwareComponent extends events_1.EventEmitter {
    constructor(name, context, options = {}) {
        super();
        this.isInitialized = false;
        this.eventSubscriptions = [];
        this.name = name;
        this.context = context;
        this.options = options;
        this.state = {
            status: 'idle',
            startTime: null,
            endTime: null,
            result: null,
            error: null
        };
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // 注册组件到上下文
            this.context.registerTool(this.name, this);
            // 设置事件监听
            this.setupEventListeners();
            // 执行组件特定的初始化
            await this.onInitialize();
            this.isInitialized = true;
            this.log('组件已初始化');
        }
        catch (error) {
            this.logError('组件初始化失败', error);
            throw error;
        }
    }
    async onInitialize() {
        // 子类可以重写此方法
    }
    setupEventListeners() {
        // 监听上下文事件
        const contextUpdatedHandler = (data) => {
            this.onContextUpdated(data);
        };
        this.context.on('context:updated', contextUpdatedHandler);
        this.eventSubscriptions.push(() => this.context.off('context:updated', contextUpdatedHandler));
        const migrationCompleteHandler = (data) => {
            this.onMigrationComplete(data);
        };
        this.context.on('migration:complete', migrationCompleteHandler);
        this.eventSubscriptions.push(() => this.context.off('migration:complete', migrationCompleteHandler));
        // 子类可以重写此方法来添加更多监听器
        this.onSetupEventListeners();
    }
    onSetupEventListeners() {
        // 子类可以重写此方法
    }
    onContextUpdated(data) {
        // 子类可以重写此方法来响应上下文更新
    }
    onMigrationComplete(data) {
        // 子类可以重写此方法来响应迁移完成
    }
    async execute() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        this.state.status = 'running';
        this.state.startTime = Date.now();
        this.state.error = null;
        try {
            this.log('开始执行');
            // 执行前置处理
            await this.beforeExecute();
            // 执行主要逻辑
            const result = await this.onExecute();
            // 执行后置处理
            await this.afterExecute(result);
            this.state.status = 'completed';
            this.state.result = result;
            this.state.endTime = Date.now();
            this.log(`执行完成，耗时 ${this.getDuration()}ms`);
            return result;
        }
        catch (error) {
            this.state.status = 'failed';
            this.state.error = error;
            this.state.endTime = Date.now();
            this.logError('执行失败', error);
            throw error;
        }
    }
    async beforeExecute() {
        // 子类可以重写此方法
    }
    async afterExecute(result) {
        // 子类可以重写此方法
    }
    async start() {
        return this.execute();
    }
    log(message) {
        if (this.options.verbose) {
            console.log(chalk_1.default.blue(`[${this.name}] ${message}`));
        }
    }
    logError(message, error) {
        console.error(chalk_1.default.red(`[${this.name}] ${message}`), error?.message || error);
        this.context.addError(error, this.name);
    }
    logWarning(message) {
        console.warn(chalk_1.default.yellow(`[${this.name}] ${message}`));
        this.context.addWarning(message, this.name);
    }
    logSuccess(message) {
        if (this.options.verbose) {
            console.log(chalk_1.default.green(`[${this.name}] ${message}`));
        }
    }
    getDuration() {
        if (!this.state.startTime)
            return 0;
        const endTime = this.state.endTime || Date.now();
        return endTime - this.state.startTime;
    }
    getStatus() {
        return {
            name: this.name,
            status: this.state.status,
            startTime: this.state.startTime,
            endTime: this.state.endTime,
            duration: this.getDuration(),
            result: this.state.result,
            error: this.state.error
        };
    }
    getContext() {
        return this.context;
    }
    addError(error, context) {
        this.context.addError(error, context || this.name);
        return this;
    }
    addWarning(warning, context) {
        this.context.addWarning(warning, context || this.name);
        return this;
    }
    updateFileStatus(filePath, status) {
        this.context.updateFileStatus(filePath, status);
        return this;
    }
    recordAICall(callInfo) {
        this.context.recordAICall(callInfo);
        return this;
    }
    cleanup() {
        // 取消所有事件订阅
        this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
        this.eventSubscriptions = [];
        // 执行组件特定的清理
        this.onCleanup();
        this.log('组件已清理');
    }
    onCleanup() {
        // 子类可以重写此方法
    }
    // 工具方法
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    isDryRun() {
        return this.options.dryRun === true;
    }
    isVerbose() {
        return this.options.verbose === true;
    }
    // 错误处理辅助方法
    handleError(error, context) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.addError(err, context);
        return err;
    }
    // 结果验证辅助方法
    validateResult(result, validator) {
        if (validator) {
            return validator(result);
        }
        return result !== null && result !== undefined;
    }
    // 进度报告辅助方法
    reportProgress(progress, message) {
        this.context.setProgress(progress);
        if (message && this.isVerbose()) {
            this.log(`进度 ${progress}%: ${message}`);
        }
    }
}
exports.ContextAwareComponent = ContextAwareComponent;
//# sourceMappingURL=ContextAwareComponent.js.map