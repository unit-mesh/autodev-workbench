/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private activeTimers: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    const startTime = performance.now();
    this.activeTimers.set(name, startTime);
    
    this.metrics.set(name, {
      name,
      startTime,
      memoryUsage: process.memoryUsage(),
      metadata
    });
  }

  /**
   * End timing an operation
   */
  end(name: string): PerformanceMetrics | null {
    const endTime = performance.now();
    const startTime = this.activeTimers.get(name);
    
    if (!startTime) {
      console.warn(`No timer found for: ${name}`);
      return null;
    }

    const duration = endTime - startTime;
    const metric = this.metrics.get(name);
    
    if (metric) {
      metric.endTime = endTime;
      metric.duration = duration;
      
      // Log if operation took longer than 1 second
      if (duration > 1000) {
        console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
      }
    }

    this.activeTimers.delete(name);
    return metric || null;
  }

  /**
   * Time a function execution
   */
  async time<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(name);
    }
  }

  /**
   * Time a synchronous function execution
   */
  timeSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      return result;
    } finally {
      this.end(name);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalOperations: number;
    completedOperations: number;
    activeOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetrics | null;
  } {
    const allMetrics = this.getMetrics();
    const completedMetrics = allMetrics.filter(m => m.duration !== undefined);
    
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0;
    
    const slowestOperation = completedMetrics.reduce((slowest, current) => {
      if (!slowest || (current.duration || 0) > (slowest.duration || 0)) {
        return current;
      }
      return slowest;
    }, null as PerformanceMetrics | null);

    return {
      totalOperations: allMetrics.length,
      completedOperations: completedMetrics.length,
      activeOperations: this.activeTimers.size,
      averageDuration,
      slowestOperation
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const summary = this.getSummary();
    
    console.log('\n📊 Performance Summary:');
    console.log(`   Total operations: ${summary.totalOperations}`);
    console.log(`   Completed: ${summary.completedOperations}`);
    console.log(`   Active: ${summary.activeOperations}`);
    console.log(`   Average duration: ${summary.averageDuration.toFixed(2)}ms`);
    
    if (summary.slowestOperation) {
      console.log(`   Slowest operation: ${summary.slowestOperation.name} (${summary.slowestOperation.duration?.toFixed(2)}ms)`);
    }

    // Show memory usage
    const memUsage = process.memoryUsage();
    console.log(`   Memory usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      summary: this.getSummary(),
      metrics: this.getMetrics(),
      memoryUsage: process.memoryUsage()
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Decorator for timing method execution
 */
export function timed(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const timerName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.time(timerName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  private static snapshots: Array<{ timestamp: number; usage: NodeJS.MemoryUsage; label?: string }> = [];

  static snapshot(label?: string): void {
    this.snapshots.push({
      timestamp: Date.now(),
      usage: process.memoryUsage(),
      label
    });
  }

  static getSnapshots() {
    return this.snapshots;
  }

  static logMemoryUsage(label?: string): void {
    const usage = process.memoryUsage();
    const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
    
    console.log(`🧠 Memory Usage${label ? ` (${label})` : ''}:`);
    console.log(`   Heap Used: ${mb(usage.heapUsed)}MB`);
    console.log(`   Heap Total: ${mb(usage.heapTotal)}MB`);
    console.log(`   External: ${mb(usage.external)}MB`);
    console.log(`   RSS: ${mb(usage.rss)}MB`);
  }

  static clear(): void {
    this.snapshots = [];
  }
}
