/**
 * 迁移编排器 - 核心编排组件
 */
import { EventEmitter } from 'events';
import { IMigrationOrchestrator, IMigrationContext, MigrationConfig, MigrationPlan, MigrationResult } from '../types';
export declare class MigrationOrchestrator extends EventEmitter implements IMigrationOrchestrator {
    private options;
    private context;
    private planner;
    private isPaused;
    private currentStep;
    constructor(options?: any);
    initialize(projectPath: string, config?: MigrationConfig): Promise<IMigrationContext>;
    execute(customPlan?: MigrationPlan): Promise<MigrationResult>;
    private executeSteps;
    private executeStep;
    pause(): void;
    resume(): void;
    private setupEventListeners;
    private generateSummary;
    private log;
    private logError;
}
//# sourceMappingURL=MigrationOrchestrator.d.ts.map