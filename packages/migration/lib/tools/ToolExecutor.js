"use strict";
/**
 * 工具执行器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutor = void 0;
const ContextAwareComponent_1 = require("../core/ContextAwareComponent");
const ToolRegistry_1 = require("./ToolRegistry");
const errors_1 = require("../types/errors");
class ToolExecutor extends ContextAwareComponent_1.ContextAwareComponent {
    constructor(name, context, options = {}) {
        super(name, context, options);
        this.executionHistory = [];
        this.registry = new ToolRegistry_1.ToolRegistry();
    }
    async onInitialize() {
        this.log('工具执行器已初始化');
        this.log(`已注册 ${this.registry.getAllTools().length} 个工具`);
        if (this.isVerbose()) {
            this.logAvailableTools();
        }
    }
    async onExecute() {
        // 工具执行器的主要执行逻辑
        return {
            availableTools: this.registry.getAllTools().length,
            categories: this.registry.getCategories(),
            executionHistory: this.executionHistory.length
        };
    }
    registerTool(tool) {
        try {
            this.registry.registerTool(tool);
            this.log(`工具已注册: ${tool.name}`);
            this.emit('tool:registered', {
                toolName: tool.name,
                category: tool.category,
                description: tool.description
            });
        }
        catch (error) {
            this.logError(`工具注册失败: ${tool.name}`, error);
            throw error;
        }
    }
    async executeTool(toolName, params) {
        const startTime = Date.now();
        try {
            this.log(`执行工具: ${toolName}`);
            // 获取工具定义
            const tool = this.registry.getTool(toolName);
            if (!tool) {
                throw new errors_1.ToolExecutionError(`未找到工具: ${toolName}`, toolName);
            }
            // 验证参数
            const validation = tool.validator(params);
            if (!validation.valid) {
                throw new errors_1.ToolExecutionError(`工具参数验证失败: ${validation.error}`, toolName, `参数: ${JSON.stringify(params)}`);
            }
            // 执行工具
            let result;
            if (tool.executor) {
                // 使用工具自带的执行器
                result = await tool.executor(params, {
                    projectPath: this.context.projectPath,
                    dryRun: this.isDryRun(),
                    verbose: this.isVerbose()
                });
            }
            else {
                // 使用默认执行逻辑
                result = await this.executeDefaultTool(toolName, params);
            }
            const duration = Date.now() - startTime;
            const toolResult = {
                success: true,
                result,
                metadata: {
                    toolName,
                    duration,
                    timestamp: new Date(),
                    params: this.sanitizeParams(params)
                }
            };
            // 记录执行历史
            this.executionHistory.push({
                toolName,
                params: this.sanitizeParams(params),
                result: toolResult,
                timestamp: new Date(),
                duration
            });
            this.emit('tool:executed', { toolName, params, result: toolResult });
            this.log(`工具执行成功: ${toolName} (${duration}ms)`);
            return toolResult;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const toolError = error instanceof errors_1.ToolExecutionError
                ? error
                : new errors_1.ToolExecutionError(`工具执行失败: ${error instanceof Error ? error.message : error}`, toolName);
            const toolResult = {
                success: false,
                error: toolError.message,
                metadata: {
                    toolName,
                    duration,
                    timestamp: new Date(),
                    params: this.sanitizeParams(params),
                    errorCode: toolError.code
                }
            };
            // 记录执行历史
            this.executionHistory.push({
                toolName,
                params: this.sanitizeParams(params),
                result: toolResult,
                timestamp: new Date(),
                duration
            });
            this.emit('tool:error', { toolName, params, error: toolError });
            this.logError(`工具执行失败: ${toolName}`, toolError);
            throw toolError;
        }
    }
    async executeDefaultTool(toolName, params) {
        // 默认工具执行逻辑（如果工具没有自定义执行器）
        switch (toolName) {
            case 'echo':
                return { message: params.message || 'Hello from tool executor!' };
            case 'delay':
                await this.delay(params.duration || 1000);
                return { delayed: params.duration || 1000 };
            default:
                throw new errors_1.ToolExecutionError(`工具 ${toolName} 没有可用的执行器`, toolName);
        }
    }
    async executeToolChain(toolCalls) {
        const results = [];
        this.log(`执行工具链: ${toolCalls.length} 个工具`);
        for (let i = 0; i < toolCalls.length; i++) {
            const toolCall = toolCalls[i];
            try {
                this.reportProgress((i / toolCalls.length) * 100, `执行工具 ${i + 1}/${toolCalls.length}: ${toolCall.name}`);
                const result = await this.executeTool(toolCall.name, toolCall.parameters);
                results.push(result);
            }
            catch (error) {
                const errorResult = {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    metadata: {
                        toolName: toolCall.name,
                        chainIndex: i,
                        timestamp: new Date()
                    }
                };
                results.push(errorResult);
                // 根据配置决定是否继续执行
                if (this.options.stopOnError !== false) {
                    this.logError(`工具链执行中断于第 ${i + 1} 个工具`, error);
                    break;
                }
            }
        }
        this.reportProgress(100, '工具链执行完成');
        return results;
    }
    getAvailableTools() {
        return this.registry.getAllTools();
    }
    getToolsByCategory(category) {
        return this.registry.getToolsByCategory(category);
    }
    getToolsDescription() {
        return this.registry.getToolsDescription();
    }
    getToolsSchema() {
        return this.registry.getToolsSchema();
    }
    getRegistry() {
        return this.registry;
    }
    getExecutionHistory() {
        return this.executionHistory.map(entry => ({
            ...entry,
            params: this.sanitizeParams(entry.params)
        }));
    }
    clearExecutionHistory() {
        this.executionHistory = [];
        this.log('执行历史已清空');
    }
    getExecutionStats() {
        const total = this.executionHistory.length;
        const successful = this.executionHistory.filter(entry => entry.result.success).length;
        const failed = total - successful;
        const totalDuration = this.executionHistory.reduce((sum, entry) => sum + entry.duration, 0);
        const avgDuration = total > 0 ? totalDuration / total : 0;
        const toolUsage = this.executionHistory.reduce((acc, entry) => {
            acc[entry.toolName] = (acc[entry.toolName] || 0) + 1;
            return acc;
        }, {});
        return {
            total,
            successful,
            failed,
            successRate: total > 0 ? successful / total : 0,
            totalDuration,
            avgDuration,
            toolUsage
        };
    }
    logAvailableTools() {
        const categories = this.registry.getCategories();
        this.log('可用工具分类:');
        categories.forEach(category => {
            const tools = this.registry.getToolsByCategory(category);
            console.log(`  ${category}: ${tools.map(t => t.name).join(', ')}`);
        });
    }
    sanitizeParams(params) {
        // 移除敏感信息
        if (typeof params !== 'object' || params === null) {
            return params;
        }
        const sanitized = { ...params };
        // 移除可能的敏感字段
        const sensitiveFields = ['password', 'token', 'key', 'secret', 'apiKey'];
        sensitiveFields.forEach(field => {
            if (field in sanitized) {
                sanitized[field] = '***';
            }
        });
        return sanitized;
    }
    onCleanup() {
        this.clearExecutionHistory();
        this.registry.clear();
    }
    // 工具管理方法
    hasTool(name) {
        return this.registry.hasTool(name);
    }
    removeTool(name) {
        const removed = this.registry.removeTool(name);
        if (removed) {
            this.log(`工具已移除: ${name}`);
            this.emit('tool:removed', { toolName: name });
        }
        return removed;
    }
    // 批量工具操作
    registerTools(tools) {
        tools.forEach(tool => this.registerTool(tool));
    }
    async executeToolsParallel(toolCalls) {
        this.log(`并行执行 ${toolCalls.length} 个工具`);
        const promises = toolCalls.map(async (toolCall, index) => {
            try {
                return await this.executeTool(toolCall.name, toolCall.parameters);
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    metadata: {
                        toolName: toolCall.name,
                        index,
                        timestamp: new Date()
                    }
                };
            }
        });
        const results = await Promise.all(promises);
        this.log('并行工具执行完成');
        return results;
    }
}
exports.ToolExecutor = ToolExecutor;
//# sourceMappingURL=ToolExecutor.js.map