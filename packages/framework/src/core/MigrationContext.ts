/**
 * 迁移上下文管理器
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs-extra';
import {
  IMigrationContext,
  MigrationConfig,
  ProjectInfo,
  MigrationPhase,
  MigrationStats,
  MigrationIssue,
  MigrationEvents
} from '../types';
import { ContextError } from '../types/errors';

export class MigrationContext extends EventEmitter implements IMigrationContext {
  public readonly projectPath: string;
  public readonly config: MigrationConfig;
  public readonly createdAt: Date;

  public project: ProjectInfo;
  public phases: MigrationPhase;
  public stats: MigrationStats;
  public issues: MigrationIssue[] = [];
  public tools: Map<string, any> = new Map();

  constructor(projectPath: string, config: MigrationConfig = {}) {
    super();
    
    this.projectPath = path.resolve(projectPath);
    this.config = config;
    this.createdAt = new Date();
    
    this.initializeContext();
    this.setupEventListeners();
  }

  private initializeContext(): void {
    // 项目信息
    this.project = {
      path: this.projectPath,
      name: path.basename(this.projectPath),
      type: null,
      framework: null,
      version: null,
      dependencies: {},
      detectedFramework: null,
      confidence: 0
    };

    // 迁移阶段状态
    this.phases = {
      current: null,
      completed: [],
      failed: [],
      skipped: [],
      results: {}
    };

    // 统计信息
    this.stats = {
      startTime: Date.now(),
      endTime: undefined,
      duration: undefined,
      totalSteps: 0,
      completedSteps: 0,
      successRate: 0,
      filesAnalyzed: 0,
      filesModified: 0,
      errorsFixed: 0,
      aiCalls: 0,
      performance: {}
    };
  }

  private setupEventListeners(): void {
    this.on('phase:start', (phase: string) => {
      this.phases.current = phase;
      this.emit('context:updated', { type: 'phase:start', phase });
    });

    this.on('phase:complete', (phase: string, result: any) => {
      this.phases.completed.push(phase);
      this.phases.results[phase] = result;
      this.phases.current = null;
      this.stats.completedSteps++;
      this.updateSuccessRate();
      this.emit('context:updated', { type: 'phase:complete', phase, result });
    });

    this.on('phase:failed', (phase: string, error: Error) => {
      this.phases.failed.push(phase);
      this.addError(error, phase);
      this.phases.current = null;
      this.emit('context:updated', { type: 'phase:failed', phase, error });
    });
  }

  public setPhase(phase: string, data?: any): void {
    this.emit('phase:start', phase);
  }

  public completePhase(phase: string, result?: any): void {
    this.emit('phase:complete', phase, result);
  }

  public failPhase(phase: string, error: Error): void {
    this.emit('phase:failed', phase, error);
  }

  public setProgress(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    this.emit('progress:update', clampedProgress);
  }

  public addError(error: Error | string, context?: string): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const issue: MigrationIssue = {
      type: 'error',
      message: errorObj.message,
      context,
      timestamp: new Date(),
      severity: 'medium'
    };
    
    this.issues.push(issue);
    this.emit('error:add', { error: errorObj, context });
  }

  public addWarning(warning: string, context?: string): void {
    const issue: MigrationIssue = {
      type: 'warning',
      message: warning,
      context,
      timestamp: new Date(),
      severity: 'low'
    };
    
    this.issues.push(issue);
    this.emit('warning:add', { warning, context });
  }

  public recordResult(step: string, result: any): void {
    this.phases.results[step] = result;
    this.emit('result:record', { step, result });
  }

  public setProjectInfo(info: Partial<ProjectInfo>): void {
    this.project = { ...this.project, ...info };
    this.emit('context:updated', { type: 'project:updated', project: this.project });
  }

  public registerTool(name: string, tool: any): void {
    this.tools.set(name, tool);
    this.emit('context:updated', { type: 'tool:registered', name, tool });
  }

  public getTool(name: string): any {
    return this.tools.get(name);
  }

  public updateFileStatus(filePath: string, status: 'analyzed' | 'modified' | 'failed'): void {
    switch (status) {
      case 'analyzed':
        this.stats.filesAnalyzed++;
        break;
      case 'modified':
        this.stats.filesModified++;
        break;
    }
    
    this.emit('context:updated', { type: 'file:status', filePath, status });
  }

  public recordAICall(callInfo: { success: boolean; tokens?: number }): void {
    this.stats.aiCalls++;
    if (callInfo.tokens) {
      this.stats.performance.totalTokens = (this.stats.performance.totalTokens || 0) + callInfo.tokens;
    }
    
    this.emit('context:updated', { type: 'ai:call', ...callInfo });
  }

  public startMigration(): void {
    this.stats.startTime = Date.now();
    this.emit('migration:start');
  }

  public completeMigration(): void {
    this.stats.endTime = Date.now();
    this.stats.duration = this.stats.endTime - this.stats.startTime;
    this.updateSuccessRate();
    this.emit('migration:complete', this.getSummary());
  }

  public failMigration(error: Error): void {
    this.stats.endTime = Date.now();
    this.stats.duration = this.stats.endTime - this.stats.startTime;
    this.addError(error, 'migration');
    this.emit('migration:failed', error);
  }

  private updateSuccessRate(): void {
    if (this.stats.totalSteps > 0) {
      this.stats.successRate = this.stats.completedSteps / this.stats.totalSteps;
    }
  }

  public getSummary(): any {
    return {
      project: this.project,
      phases: {
        current: this.phases.current,
        completed: this.phases.completed.length,
        failed: this.phases.failed.length,
        total: this.stats.totalSteps
      },
      stats: this.stats,
      issues: {
        errors: this.issues.filter(i => i.type === 'error').length,
        warnings: this.issues.filter(i => i.type === 'warning').length,
        total: this.issues.length
      },
      success: this.phases.failed.length === 0 && this.stats.completedSteps > 0
    };
  }

  public getStatusSummary(): any {
    return {
      phase: this.phases.current,
      progress: this.stats.successRate * 100,
      completedPhases: this.phases.completed.length,
      totalPhases: this.stats.totalSteps,
      hasErrors: this.issues.some(i => i.type === 'error'),
      duration: this.stats.duration
    };
  }

  public async saveToFile(filePath?: string): Promise<string> {
    const outputPath = filePath || path.join(this.projectPath, 'migration-context.json');
    
    const contextData = {
      projectPath: this.projectPath,
      config: this.config,
      project: this.project,
      phases: this.phases,
      stats: this.stats,
      issues: this.issues,
      createdAt: this.createdAt,
      savedAt: new Date()
    };
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJson(outputPath, contextData, { spaces: 2 });
    
    return outputPath;
  }

  public static async loadFromFile(filePath: string): Promise<MigrationContext> {
    if (!await fs.pathExists(filePath)) {
      throw new ContextError(`上下文文件不存在: ${filePath}`);
    }
    
    const contextData = await fs.readJson(filePath);
    const context = new MigrationContext(contextData.projectPath, contextData.config);
    
    // 恢复状态
    Object.assign(context.project, contextData.project);
    Object.assign(context.phases, contextData.phases);
    Object.assign(context.stats, contextData.stats);
    context.issues = contextData.issues || [];
    
    return context;
  }

  // 类型安全的事件方法
  public emit<K extends keyof MigrationEvents>(event: K, ...args: Parameters<MigrationEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  public on<K extends keyof MigrationEvents>(event: K, listener: MigrationEvents[K]): this {
    return super.on(event, listener);
  }

  public once<K extends keyof MigrationEvents>(event: K, listener: MigrationEvents[K]): this {
    return super.once(event, listener);
  }

  public off<K extends keyof MigrationEvents>(event: K, listener: MigrationEvents[K]): this {
    return super.off(event, listener);
  }
}
