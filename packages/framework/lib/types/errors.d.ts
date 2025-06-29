/**
 * 错误类型定义
 */
export declare class MigrationError extends Error {
    readonly code: string;
    readonly context?: string;
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    constructor(message: string, code?: string, context?: string, severity?: 'low' | 'medium' | 'high' | 'critical');
}
export declare class ProjectAnalysisError extends MigrationError {
    constructor(message: string, context?: string);
}
export declare class AIServiceError extends MigrationError {
    constructor(message: string, context?: string);
}
export declare class ToolExecutionError extends MigrationError {
    readonly toolName: string;
    constructor(message: string, toolName: string, context?: string);
}
export declare class ConfigurationError extends MigrationError {
    constructor(message: string, context?: string);
}
export declare class ValidationError extends MigrationError {
    constructor(message: string, context?: string);
}
export declare class ContextError extends MigrationError {
    constructor(message: string, context?: string);
}
//# sourceMappingURL=errors.d.ts.map