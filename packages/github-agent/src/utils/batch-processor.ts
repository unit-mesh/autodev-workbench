/**
 * Batch processing utility for handling large datasets efficiently
 * Prevents memory overflow and improves performance
 */

export interface BatchOptions {
  batchSize?: number;
  concurrency?: number;
  delayBetweenBatches?: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, item: any) => void;
}

export class BatchProcessor {
  /**
   * Process items in batches with controlled concurrency
   */
  static async processBatches<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchOptions = {}
  ): Promise<R[]> {
    const {
      batchSize = 10,
      concurrency = 3,
      delayBetweenBatches = 0,
      onProgress,
      onError
    } = options;

    const results: R[] = [];
    let processed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Process batch with limited concurrency
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await processor(item);
          processed++;
          onProgress?.(processed, items.length);
          return result;
        } catch (error) {
          onError?.(error as Error, item);
          processed++;
          onProgress?.(processed, items.length);
          return null;
        }
      });

      // Limit concurrency within batch
      const batchResults = await this.limitConcurrency(batchPromises, concurrency);
      results.push(...batchResults.filter(r => r !== null) as R[]);

      // Delay between batches if specified
      if (delayBetweenBatches > 0 && i + batchSize < items.length) {
        await this.delay(delayBetweenBatches);
      }
    }

    return results;
  }

  /**
   * Process items with controlled concurrency
   */
  static async limitConcurrency<T>(
    promises: Promise<T>[],
    concurrency: number
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += concurrency) {
      const batch = promises.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Process items in chunks for memory efficiency
   */
  static async processChunks<T, R>(
    items: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    chunkSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
      
      // Allow garbage collection between chunks
      if (global.gc) {
        global.gc();
      }
    }
    
    return results;
  }

  /**
   * Utility delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Memory-efficient array processing utilities
 */
export class MemoryEfficientProcessor {
  /**
   * Process large arrays without loading everything into memory
   */
  static async* processStream<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): AsyncGenerator<R[], void, unknown> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(processor));
      yield results;
    }
  }

  /**
   * Filter large arrays efficiently
   */
  static async filterLarge<T>(
    items: T[],
    predicate: (item: T) => Promise<boolean>,
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const predicateResults = await Promise.all(batch.map(predicate));
      
      batch.forEach((item, index) => {
        if (predicateResults[index]) {
          results.push(item);
        }
      });
    }
    
    return results;
  }

  /**
   * Map large arrays efficiently
   */
  static async mapLarge<T, R>(
    items: T[],
    mapper: (item: T) => Promise<R>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(mapper));
      results.push(...batchResults);
    }
    
    return results;
  }
}
