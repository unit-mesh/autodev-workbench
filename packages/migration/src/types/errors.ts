/**
 * 错误类型定义
 */

export class MigrationError extends Error {
  public readonly code: string;
  public readonly context?: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    code: string = 'MIGRATION_ERROR',
    context?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'MigrationError';
    this.code = code;
    this.context = context;
    this.severity = severity;
  }
}

export class ProjectAnalysisError extends MigrationError {
  constructor(message: string, context?: string) {
    super(message, 'PROJECT_ANALYSIS_ERROR', context, 'high');
    this.name = 'ProjectAnalysisError';
  }
}

export class AIServiceError extends MigrationError {
  constructor(message: string, context?: string) {
    super(message, 'AI_SERVICE_ERROR', context, 'medium');
    this.name = 'AIServiceError';
  }
}

export class ToolExecutionError extends MigrationError {
  public readonly toolName: string;

  constructor(message: string, toolName: string, context?: string) {
    super(message, 'TOOL_EXECUTION_ERROR', context, 'medium');
    this.name = 'ToolExecutionError';
    this.toolName = toolName;
  }
}

export class ConfigurationError extends MigrationError {
  constructor(message: string, context?: string) {
    super(message, 'CONFIGURATION_ERROR', context, 'high');
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends MigrationError {
  constructor(message: string, context?: string) {
    super(message, 'VALIDATION_ERROR', context, 'medium');
    this.name = 'ValidationError';
  }
}

export class ContextError extends MigrationError {
  constructor(message: string, context?: string) {
    super(message, 'CONTEXT_ERROR', context, 'high');
    this.name = 'ContextError';
  }
}
