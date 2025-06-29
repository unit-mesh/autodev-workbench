"use strict";
/**
 * AI服务基类
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const events_1 = require("events");
const chalk_1 = __importDefault(require("chalk"));
const errors_1 = require("../types/errors");
class AIService extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.enabled = false;
        this.config = {
            provider: 'openai',
            model: 'gpt-4',
            maxTokens: 4000,
            temperature: 0.1,
            maxRetries: 3,
            timeout: 60000,
            verbose: false,
            ...config
        };
        this.stats = {
            calls: 0,
            success: 0,
            failed: 0,
            totalTokens: 0,
            successRate: 0
        };
        this.enabled = this.checkAvailability();
        if (this.config.verbose && this.enabled) {
            console.log(chalk_1.default.green(`✅ AI服务已启用 (${this.config.provider})`));
        }
    }
    isEnabled() {
        return this.enabled;
    }
    async callAI(prompt, options = {}) {
        if (!this.enabled) {
            throw new errors_1.AIServiceError('AI服务未启用或配置不正确');
        }
        const callOptions = {
            maxRetries: this.config.maxRetries || 3,
            ...options
        };
        // 确保 maxRetries 有效
        if (!callOptions.maxRetries || callOptions.maxRetries < 1) {
            callOptions.maxRetries = 3;
        }
        this.stats.calls++;
        this.emit('ai:call', { prompt: prompt.substring(0, 100), context: callOptions.context });
        let lastError = null;
        for (let attempt = 1; attempt <= callOptions.maxRetries; attempt++) {
            try {
                if (this.config.verbose && attempt > 1) {
                    console.log(chalk_1.default.yellow(`🔄 AI调用重试 ${attempt}/${callOptions.maxRetries}`));
                }
                const result = await this.performAICall(prompt, {
                    ...this.config,
                    ...callOptions,
                    attempt
                });
                this.stats.success++;
                this.updateSuccessRate();
                // 估算token数量（简化实现）
                const estimatedTokens = Math.ceil((prompt.length + result.length) / 4);
                this.stats.totalTokens += estimatedTokens;
                this.emit('ai:success', {
                    prompt: prompt.substring(0, 100),
                    result: result.substring(0, 100),
                    tokens: estimatedTokens,
                    attempt
                });
                if (this.config.verbose) {
                    console.log(chalk_1.default.green(`✅ AI调用成功 (尝试 ${attempt}/${callOptions.maxRetries})`));
                }
                return result;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (this.config.verbose) {
                    console.log(chalk_1.default.red(`❌ AI调用失败 (尝试 ${attempt}/${callOptions.maxRetries}): ${lastError.message}`));
                }
                // 如果不是最后一次尝试，等待一段时间再重试
                if (attempt < callOptions.maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 指数退避，最大10秒
                    await this.delay(delay);
                }
            }
        }
        this.stats.failed++;
        this.updateSuccessRate();
        const finalError = new errors_1.AIServiceError(`AI调用失败，已重试 ${callOptions.maxRetries} 次: ${lastError?.message}`, callOptions.context?.agent);
        this.emit('ai:error', {
            prompt: prompt.substring(0, 100),
            error: finalError,
            attempts: callOptions.maxRetries
        });
        throw finalError;
    }
    updateSuccessRate() {
        this.stats.successRate = this.stats.calls > 0 ? this.stats.success / this.stats.calls : 0;
    }
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.successRate
        };
    }
    resetStats() {
        this.stats = {
            calls: 0,
            success: 0,
            failed: 0,
            totalTokens: 0,
            successRate: 0
        };
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    log(message) {
        if (this.config.verbose) {
            console.log(chalk_1.default.blue(`[AIService] ${message}`));
        }
    }
    logError(message, error) {
        console.error(chalk_1.default.red(`[AIService] ${message}`), error?.message || error);
    }
    // 提示词处理辅助方法
    truncatePrompt(prompt, maxLength = 8000) {
        if (prompt.length <= maxLength) {
            return prompt;
        }
        const truncated = prompt.substring(0, maxLength - 100);
        return truncated + '\n\n[... 内容已截断 ...]';
    }
    sanitizePrompt(prompt) {
        // 移除敏感信息（如API密钥等）
        return prompt
            .replace(/api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9-_]+/gi, 'api_key="***"')
            .replace(/token["\s]*[:=]["\s]*[a-zA-Z0-9-_]+/gi, 'token="***"')
            .replace(/password["\s]*[:=]["\s]*[^\s"]+/gi, 'password="***"');
    }
    // 响应处理辅助方法
    validateResponse(response) {
        return typeof response === 'string' && response.trim().length > 0;
    }
    parseJSONResponse(response) {
        try {
            // 尝试提取JSON部分
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                response.match(/\{[\s\S]*\}/) ||
                response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            // 如果没有找到JSON块，尝试直接解析
            return JSON.parse(response);
        }
        catch (error) {
            throw new errors_1.AIServiceError(`AI响应JSON解析失败: ${error instanceof Error ? error.message : error}`);
        }
    }
    // 上下文管理
    buildContext(context = {}) {
        const contextParts = [];
        if (context.taskType) {
            contextParts.push(`任务类型: ${context.taskType}`);
        }
        if (context.phase) {
            contextParts.push(`阶段: ${context.phase}`);
        }
        if (context.fileName) {
            contextParts.push(`文件: ${context.fileName}`);
        }
        if (context.attemptNumber) {
            contextParts.push(`尝试次数: ${context.attemptNumber}`);
        }
        return contextParts.length > 0 ? `\n上下文信息:\n${contextParts.join('\n')}\n` : '';
    }
    // 错误恢复
    shouldRetry(error, attempt, maxRetries) {
        // 网络错误或临时错误应该重试
        const retryableErrors = [
            'ECONNRESET',
            'ENOTFOUND',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'rate_limit_exceeded',
            'server_error'
        ];
        const isRetryable = retryableErrors.some(code => error.message.toLowerCase().includes(code.toLowerCase()));
        return isRetryable && attempt < maxRetries;
    }
    // 资源清理
    cleanup() {
        this.removeAllListeners();
        this.resetStats();
        this.log('AI服务已清理');
    }
}
exports.AIService = AIService;
//# sourceMappingURL=AIService.js.map