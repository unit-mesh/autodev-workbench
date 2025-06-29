/**
 * 迁移上下文管理器
 */
import { EventEmitter } from 'events';
import { IMigrationContext, MigrationConfig, ProjectInfo, MigrationPhase, MigrationStats, MigrationIssue, MigrationEvents } from '../types';
export declare class MigrationContext extends EventEmitter implements IMigrationContext {
    readonly projectPath: string;
    readonly config: MigrationConfig;
    readonly createdAt: Date;
    project: ProjectInfo;
    phases: MigrationPhase;
    stats: MigrationStats;
    issues: MigrationIssue[];
    tools: Map<string, any>;
    constructor(projectPath: string, config?: MigrationConfig);
    private initializeContext;
    private setupEventListeners;
    setPhase(phase: string, data?: any): void;
    completePhase(phase: string, result?: any): void;
    failPhase(phase: string, error: Error): void;
    setProgress(progress: number): void;
    addError(error: Error | string, context?: string): void;
    addWarning(warning: string, context?: string): void;
    recordResult(step: string, result: any): void;
    setProjectInfo(info: Partial<ProjectInfo>): void;
    registerTool(name: string, tool: any): void;
    getTool(name: string): any;
    updateFileStatus(filePath: string, status: 'analyzed' | 'modified' | 'failed'): void;
    recordAICall(callInfo: {
        success: boolean;
        tokens?: number;
    }): void;
    startMigration(): void;
    completeMigration(): void;
    failMigration(error: Error): void;
    private updateSuccessRate;
    getSummary(): any;
    getStatusSummary(): any;
    saveToFile(filePath?: string): Promise<string>;
    static loadFromFile(filePath: string): Promise<MigrationContext>;
    emit<K extends keyof MigrationEvents>(event: K, ...args: Parameters<MigrationEvents[K]>): boolean;
    on<K extends keyof MigrationEvents>(event: K, listener: MigrationEvents[K]): this;
    once<K extends keyof MigrationEvents>(event: K, listener: MigrationEvents[K]): this;
    off<K extends keyof MigrationEvents>(event: K, listener: MigrationEvents[K]): this;
}
//# sourceMappingURL=MigrationContext.d.ts.map