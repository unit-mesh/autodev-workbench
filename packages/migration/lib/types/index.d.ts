/**
 * 通用AI辅助迁移框架 - 核心类型定义
 */
import { EventEmitter } from 'events';
export interface ProjectInfo {
    path: string;
    name: string;
    type?: string;
    framework?: string;
    version?: string;
    dependencies?: Record<string, string>;
    detectedFramework?: string;
    confidence?: number;
    files?: string[];
}
export interface MigrationConfig {
    mode?: 'auto' | 'interactive' | 'preview';
    source?: FrameworkInfo;
    target?: FrameworkInfo;
    sourceToTargetMode?: boolean;
    sourcePath?: string;
    targetPath?: string;
    workingPath?: string;
    aiProvider?: string;
    aiApiKey?: string;
    dryRun?: boolean;
    verbose?: boolean;
    maxRetries?: number;
    [key: string]: any;
}
export interface FrameworkInfo {
    framework: string;
    version: string;
    patterns?: string[];
    dependencies?: string[];
}
export interface MigrationPhase {
    current: string | null;
    completed: string[];
    failed: string[];
    skipped: string[];
    results: Record<string, any>;
}
export interface MigrationStats {
    startTime: number;
    endTime?: number;
    duration?: number;
    totalSteps: number;
    completedSteps: number;
    successRate: number;
    filesAnalyzed: number;
    filesModified: number;
    errorsFixed: number;
    aiCalls: number;
    performance: Record<string, any>;
}
export interface MigrationIssue {
    type: 'error' | 'warning';
    message: string;
    context?: string;
    timestamp: Date;
    severity?: 'low' | 'medium' | 'high' | 'critical';
}
export interface AIServiceConfig {
    provider?: string;
    model?: string;
    apiKey?: string;
    baseURL?: string;
    maxTokens?: number;
    temperature?: number;
    maxRetries?: number;
    timeout?: number;
    verbose?: boolean;
    [key: string]: any;
}
export interface AICallContext {
    taskType?: string;
    attemptNumber?: number;
    phase?: string;
    fileName?: string;
    agent?: string;
    [key: string]: any;
}
export interface AICallOptions {
    maxRetries?: number;
    context?: AICallContext;
    [key: string]: any;
}
export interface AIStats {
    calls: number;
    success: number;
    failed: number;
    totalTokens: number;
    successRate: number;
}
export interface ToolDefinition {
    name: string;
    category?: string;
    description: string;
    parameters: ToolParameterSchema;
    validator?: (params: any) => ToolValidationResult;
    executor?: (params: any, context?: any) => Promise<any>;
}
export interface ToolParameterSchema {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
}
export interface ToolParameter {
    type: string;
    description: string;
    required?: boolean;
    default?: any;
    enum?: any[];
}
export interface ToolValidationResult {
    valid: boolean;
    error?: string;
}
export interface ToolResult {
    success: boolean;
    result?: any;
    error?: string;
    metadata?: Record<string, any>;
}
export interface ToolCall {
    name: string;
    parameters: Record<string, any>;
}
export interface ProjectAnalysis {
    projectPath: string;
    framework: string | null;
    version: string | null;
    buildTool: string | null;
    complexity: 'low' | 'medium' | 'high';
    files: string[];
    dependencies: Record<string, string>;
    risks: MigrationRisk[];
    confidence: number;
}
export interface MigrationRisk {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact?: string;
    mitigation?: string;
}
export interface MigrationStep {
    name: string;
    description?: string;
    order: number;
    required: boolean;
    enabled?: boolean;
    agent?: string;
    config?: Record<string, any>;
    dependencies?: string[];
}
export interface MigrationPlan {
    name: string;
    description?: string;
    source: FrameworkInfo;
    target: FrameworkInfo;
    steps: MigrationStep[];
    tools: string[];
    estimatedDuration: number;
    risks: MigrationRisk[];
    metadata?: Record<string, any>;
}
export interface MigrationStrategy {
    name: string;
    priority: number;
    requirements: string[];
    plan: MigrationPlan;
    confidence: number;
}
export interface StepResult {
    step: string;
    success: boolean;
    result?: any;
    error?: string;
    duration?: number;
    metadata?: Record<string, any>;
}
export interface MigrationResult {
    success: boolean;
    analysis: ProjectAnalysis;
    plan: MigrationPlan;
    results: StepResult[];
    context: any;
    summary: MigrationSummary;
    timestamp: string;
}
export interface MigrationSummary {
    totalSteps: number;
    completedSteps: number;
    successRate: number;
    duration: number;
    filesModified: number;
    errorsFixed: number;
    aiCalls: number;
    overallSuccess: boolean;
}
export interface ContextAwareComponentState {
    status: 'idle' | 'running' | 'completed' | 'failed';
    startTime: number | null;
    endTime: number | null;
    result: any;
    error: any;
}
export interface ComponentOptions {
    contextId?: string;
    verbose?: boolean;
    dryRun?: boolean;
    [key: string]: any;
}
export interface PhaseChangeEvent {
    phase: string;
    data?: any;
}
export interface ProgressUpdateEvent {
    progress: number;
    step?: string;
    message?: string;
}
export interface ErrorEvent {
    error: Error | string;
    context?: string;
}
export interface ResultEvent {
    step: string;
    result: any;
}
export interface MigrationPreset {
    name: string;
    description: string;
    source: FrameworkInfo;
    target: FrameworkInfo;
    steps: MigrationStep[];
    tools: string[];
    aiPrompts?: string;
    config?: Record<string, any>;
}
export interface AgentDefinition {
    name: string;
    description: string;
    capabilities: string[];
    aiRequired: boolean;
    tools: string[];
    config?: Record<string, any>;
}
export interface MigrationPlugin {
    name: string;
    version: string;
    description?: string;
    initialize(context: any): Promise<void>;
    registerTools?(registry: any): void;
    registerAgents?(registry: any): void;
    cleanup?(): Promise<void>;
}
export interface PluginContext {
    framework: any;
    config: MigrationConfig;
    logger: any;
    [key: string]: any;
}
export interface IMigrationContext extends EventEmitter {
    projectPath: string;
    config: MigrationConfig;
    project: ProjectInfo;
    phases: MigrationPhase;
    stats: MigrationStats;
    issues: MigrationIssue[];
    setPhase(phase: string, data?: any): void;
    setProgress(progress: number): void;
    addError(error: Error | string, context?: string): void;
    addWarning(warning: string, context?: string): void;
    recordResult(step: string, result: any): void;
    getSummary(): any;
    setProjectInfo(info: Partial<ProjectInfo>): void;
    registerTool(name: string, tool: any): void;
    updateFileStatus(filePath: string, status: 'analyzed' | 'modified' | 'failed'): void;
    recordAICall(callInfo: {
        success: boolean;
        tokens?: number;
    }): void;
    startMigration(): void;
    completeMigration(): void;
    failMigration(error: Error): void;
}
export interface IContextAwareComponent {
    name: string;
    context: IMigrationContext;
    options: ComponentOptions;
    isInitialized: boolean;
    state: ContextAwareComponentState;
    initialize(): Promise<void>;
    execute(): Promise<any>;
    cleanup?(): void;
}
export interface IAIService {
    isEnabled(): boolean;
    callAI(prompt: string, options?: AICallOptions): Promise<string>;
    getStats(): AIStats;
}
export interface IToolExecutor extends IContextAwareComponent {
    registerTool(tool: ToolDefinition): void;
    executeTool(toolName: string, params: any): Promise<ToolResult>;
    getAvailableTools(): ToolDefinition[];
}
export interface IMigrationOrchestrator extends EventEmitter {
    initialize(projectPath: string, config?: MigrationConfig): Promise<IMigrationContext>;
    execute(customPlan?: MigrationPlan): Promise<MigrationResult>;
    pause(): void;
    resume(): void;
}
export * from './events';
export * from './errors';
//# sourceMappingURL=index.d.ts.map