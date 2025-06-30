/**
 * 上下文感知组件基类
 */
import { EventEmitter } from 'events';
import { IContextAwareComponent, IMigrationContext, ComponentOptions, ContextAwareComponentState } from '../types';
export declare abstract class ContextAwareComponent extends EventEmitter implements IContextAwareComponent {
    readonly name: string;
    readonly context: IMigrationContext;
    readonly options: ComponentOptions;
    isInitialized: boolean;
    state: ContextAwareComponentState;
    private eventSubscriptions;
    constructor(name: string, context: IMigrationContext, options?: ComponentOptions);
    initialize(): Promise<void>;
    protected onInitialize(): Promise<void>;
    private setupEventListeners;
    protected onSetupEventListeners(): void;
    protected onContextUpdated(data: any): void;
    protected onMigrationComplete(data: any): void;
    execute(): Promise<any>;
    protected beforeExecute(): Promise<void>;
    protected abstract onExecute(): Promise<any>;
    protected afterExecute(result: any): Promise<void>;
    start(): Promise<any>;
    protected log(message: string): void;
    protected logError(message: string, error: Error): void;
    protected logWarning(message: string): void;
    protected logSuccess(message: string): void;
    getDuration(): number;
    getStatus(): any;
    protected getContext(): IMigrationContext;
    protected addError(error: Error | string, context?: string): this;
    protected addWarning(warning: string, context?: string): this;
    protected updateFileStatus(filePath: string, status: 'analyzed' | 'modified' | 'failed'): this;
    protected recordAICall(callInfo: {
        success: boolean;
        tokens?: number;
    }): this;
    cleanup(): void;
    protected onCleanup(): void;
    protected delay(ms: number): Promise<void>;
    protected isDryRun(): boolean;
    protected isVerbose(): boolean;
    protected handleError(error: unknown, context?: string): Error;
    protected validateResult(result: any, validator?: (result: any) => boolean): boolean;
    protected reportProgress(progress: number, message?: string): void;
}
//# sourceMappingURL=ContextAwareComponent.d.ts.map