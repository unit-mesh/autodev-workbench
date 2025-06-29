"use strict";
/**
 * 错误类型定义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextError = exports.ValidationError = exports.ConfigurationError = exports.ToolExecutionError = exports.AIServiceError = exports.ProjectAnalysisError = exports.MigrationError = void 0;
class MigrationError extends Error {
    constructor(message, code = 'MIGRATION_ERROR', context, severity = 'medium') {
        super(message);
        this.name = 'MigrationError';
        this.code = code;
        this.context = context;
        this.severity = severity;
    }
}
exports.MigrationError = MigrationError;
class ProjectAnalysisError extends MigrationError {
    constructor(message, context) {
        super(message, 'PROJECT_ANALYSIS_ERROR', context, 'high');
        this.name = 'ProjectAnalysisError';
    }
}
exports.ProjectAnalysisError = ProjectAnalysisError;
class AIServiceError extends MigrationError {
    constructor(message, context) {
        super(message, 'AI_SERVICE_ERROR', context, 'medium');
        this.name = 'AIServiceError';
    }
}
exports.AIServiceError = AIServiceError;
class ToolExecutionError extends MigrationError {
    constructor(message, toolName, context) {
        super(message, 'TOOL_EXECUTION_ERROR', context, 'medium');
        this.name = 'ToolExecutionError';
        this.toolName = toolName;
    }
}
exports.ToolExecutionError = ToolExecutionError;
class ConfigurationError extends MigrationError {
    constructor(message, context) {
        super(message, 'CONFIGURATION_ERROR', context, 'high');
        this.name = 'ConfigurationError';
    }
}
exports.ConfigurationError = ConfigurationError;
class ValidationError extends MigrationError {
    constructor(message, context) {
        super(message, 'VALIDATION_ERROR', context, 'medium');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ContextError extends MigrationError {
    constructor(message, context) {
        super(message, 'CONTEXT_ERROR', context, 'high');
        this.name = 'ContextError';
    }
}
exports.ContextError = ContextError;
//# sourceMappingURL=errors.js.map