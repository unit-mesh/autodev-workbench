/**
 * 事件类型定义
 */

export interface MigrationEvents {
  // 阶段事件
  'phase:start': (phase: string) => void;
  'phase:complete': (phase: string, result: any) => void;
  'phase:failed': (phase: string, error: Error) => void;
  'phase:change': (data: { phase: string; data?: any }) => void;
  
  // 进度事件
  'progress:update': (progress: number) => void;
  'progress:step': (step: string, progress: number) => void;
  
  // 错误事件
  'error:add': (data: { error: Error | string; context?: string }) => void;
  'warning:add': (data: { warning: string; context?: string }) => void;
  
  // 结果事件
  'result:record': (data: { step: string; result: any }) => void;
  
  // 上下文事件
  'context:updated': (data: { type: string; [key: string]: any }) => void;
  
  // 迁移生命周期事件
  'migration:start': () => void;
  'migration:complete': (result: any) => void;
  'migration:failed': (error: Error) => void;
  'migration:paused': () => void;
  'migration:resumed': () => void;
  
  // AI事件
  'ai:call': (data: { prompt: string; context?: any }) => void;
  'ai:success': (data: { prompt: string; result: string }) => void;
  'ai:error': (data: { prompt: string; error: Error }) => void;
  
  // 工具事件
  'tool:executed': (data: { toolName: string; params: any; result: any }) => void;
  'tool:error': (data: { toolName: string; params: any; error: Error }) => void;
  
  // 文件事件
  'file:read': (filePath: string) => void;
  'file:write': (filePath: string) => void;
  'file:modified': (filePath: string) => void;
  'file:backup': (filePath: string, backupPath: string) => void;
}

export type MigrationEventName = keyof MigrationEvents;
export type MigrationEventHandler<T extends MigrationEventName> = MigrationEvents[T];
