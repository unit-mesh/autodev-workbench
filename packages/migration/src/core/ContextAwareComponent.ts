/**
 * 上下文感知组件基类
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';
import {
  IContextAwareComponent,
  IMigrationContext,
  ComponentOptions,
  ContextAwareComponentState
} from '../types';

export abstract class ContextAwareComponent extends EventEmitter implements IContextAwareComponent {
  public readonly name: string;
  public readonly context: IMigrationContext;
  public readonly options: ComponentOptions;
  public isInitialized: boolean = false;
  public state: ContextAwareComponentState;

  private eventSubscriptions: Array<() => void> = [];

  constructor(name: string, context: IMigrationContext, options: ComponentOptions = {}) {
    super();
    
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

  public async initialize(): Promise<void> {
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

    } catch (error) {
      this.logError('组件初始化失败', error as Error);
      throw error;
    }
  }

  protected async onInitialize(): Promise<void> {
    // 子类可以重写此方法
  }

  private setupEventListeners(): void {
    // 监听上下文事件
    const contextUpdatedHandler = (data: any) => {
      this.onContextUpdated(data);
    };
    this.context.on('context:updated', contextUpdatedHandler);
    this.eventSubscriptions.push(() => this.context.off('context:updated', contextUpdatedHandler));

    const migrationCompleteHandler = (data: any) => {
      this.onMigrationComplete(data);
    };
    this.context.on('migration:complete', migrationCompleteHandler);
    this.eventSubscriptions.push(() => this.context.off('migration:complete', migrationCompleteHandler));

    // 子类可以重写此方法来添加更多监听器
    this.onSetupEventListeners();
  }

  protected onSetupEventListeners(): void {
    // 子类可以重写此方法
  }

  protected onContextUpdated(data: any): void {
    // 子类可以重写此方法来响应上下文更新
  }

  protected onMigrationComplete(data: any): void {
    // 子类可以重写此方法来响应迁移完成
  }

  public async execute(): Promise<any> {
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

    } catch (error) {
      this.state.status = 'failed';
      this.state.error = error;
      this.state.endTime = Date.now();

      this.logError('执行失败', error as Error);
      throw error;
    }
  }

  protected async beforeExecute(): Promise<void> {
    // 子类可以重写此方法
  }

  protected abstract onExecute(): Promise<any>;

  protected async afterExecute(result: any): Promise<void> {
    // 子类可以重写此方法
  }

  public async start(): Promise<any> {
    return this.execute();
  }

  protected log(message: string): void {
    if (this.options.verbose) {
      console.log(chalk.blue(`[${this.name}] ${message}`));
    }
  }

  protected logError(message: string, error: Error): void {
    console.error(chalk.red(`[${this.name}] ${message}`), error?.message || error);
    this.context.addError(error, this.name);
  }

  protected logWarning(message: string): void {
    console.warn(chalk.yellow(`[${this.name}] ${message}`));
    this.context.addWarning(message, this.name);
  }

  protected logSuccess(message: string): void {
    if (this.options.verbose) {
      console.log(chalk.green(`[${this.name}] ${message}`));
    }
  }

  public getDuration(): number {
    if (!this.state.startTime) return 0;
    const endTime = this.state.endTime || Date.now();
    return endTime - this.state.startTime;
  }

  public getStatus(): any {
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

  protected getContext(): IMigrationContext {
    return this.context;
  }

  protected addError(error: Error | string, context?: string): this {
    this.context.addError(error, context || this.name);
    return this;
  }

  protected addWarning(warning: string, context?: string): this {
    this.context.addWarning(warning, context || this.name);
    return this;
  }

  protected updateFileStatus(filePath: string, status: 'analyzed' | 'modified' | 'failed'): this {
    this.context.updateFileStatus(filePath, status);
    return this;
  }

  protected recordAICall(callInfo: { success: boolean; tokens?: number }): this {
    this.context.recordAICall(callInfo);
    return this;
  }

  public cleanup(): void {
    // 取消所有事件订阅
    this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
    this.eventSubscriptions = [];

    // 执行组件特定的清理
    this.onCleanup();

    this.log('组件已清理');
  }

  protected onCleanup(): void {
    // 子类可以重写此方法
  }

  // 工具方法
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected isDryRun(): boolean {
    return this.options.dryRun === true;
  }

  protected isVerbose(): boolean {
    return this.options.verbose === true;
  }

  // 错误处理辅助方法
  protected handleError(error: unknown, context?: string): Error {
    const err = error instanceof Error ? error : new Error(String(error));
    this.addError(err, context);
    return err;
  }

  // 结果验证辅助方法
  protected validateResult(result: any, validator?: (result: any) => boolean): boolean {
    if (validator) {
      return validator(result);
    }
    return result !== null && result !== undefined;
  }

  // 进度报告辅助方法
  protected reportProgress(progress: number, message?: string): void {
    this.context.setProgress(progress);
    if (message && this.isVerbose()) {
      this.log(`进度 ${progress}%: ${message}`);
    }
  }
}
