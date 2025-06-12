/**
 * Cleanup utilities for managing temporary files and logs
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CleanupOptions {
  maxAge?: number; // in milliseconds
  maxSize?: number; // in bytes
  keepCount?: number; // number of files to keep
  dryRun?: boolean;
}

export class CleanupManager {
  /**
   * Clean up old log files
   */
  static async cleanupLogs(
    logDirectory: string = process.cwd(),
    options: CleanupOptions = {}
  ): Promise<void> {
    const {
      maxAge = 7 * 24 * 60 * 60 * 1000, // 7 days
      maxSize = 100 * 1024 * 1024, // 100MB
      keepCount = 10,
      dryRun = false
    } = options;

    try {
      const files = await fs.promises.readdir(logDirectory);
      const logFiles = files.filter(file => 
        file.endsWith('.log') || 
        file.includes('analysis-') ||
        file.includes('llm-service')
      );

      const fileStats = await Promise.all(
        logFiles.map(async (file) => {
          const filePath = path.join(logDirectory, file);
          const stats = await fs.promises.stat(filePath);
          return { file, filePath, stats };
        })
      );

      // Sort by modification time (newest first)
      fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      const now = Date.now();
      const filesToDelete: string[] = [];

      // Check age and size criteria
      for (const { file, filePath, stats } of fileStats) {
        const age = now - stats.mtime.getTime();
        
        if (age > maxAge || stats.size > maxSize) {
          filesToDelete.push(filePath);
        }
      }

      // Keep only the specified number of newest files
      if (fileStats.length > keepCount) {
        const excessFiles = fileStats.slice(keepCount);
        for (const { filePath } of excessFiles) {
          if (!filesToDelete.includes(filePath)) {
            filesToDelete.push(filePath);
          }
        }
      }

      // Delete files
      if (filesToDelete.length > 0) {
        console.log(`🧹 Cleaning up ${filesToDelete.length} log files...`);
        
        for (const filePath of filesToDelete) {
          if (dryRun) {
            console.log(`Would delete: ${filePath}`);
          } else {
            try {
              await fs.promises.unlink(filePath);
              console.log(`Deleted: ${path.basename(filePath)}`);
            } catch (error) {
              console.warn(`Failed to delete ${filePath}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup logs:', error);
    }
  }

  /**
   * Clean up temporary analysis files
   */
  static async cleanupTempFiles(
    directory: string = process.cwd(),
    options: CleanupOptions = {}
  ): Promise<void> {
    const {
      maxAge = 24 * 60 * 60 * 1000, // 1 day
      dryRun = false
    } = options;

    try {
      const files = await fs.promises.readdir(directory);
      const tempFiles = files.filter(file => 
        file.endsWith('.json') && (
          file.includes('analysis_result') ||
          file.includes('symbol_analysis') ||
          file.includes('interface_analysis')
        )
      );

      const now = Date.now();
      const filesToDelete: string[] = [];

      for (const file of tempFiles) {
        const filePath = path.join(directory, file);
        try {
          const stats = await fs.promises.stat(filePath);
          const age = now - stats.mtime.getTime();
          
          if (age > maxAge) {
            filesToDelete.push(filePath);
          }
        } catch (error) {
          // File might not exist anymore
          continue;
        }
      }

      if (filesToDelete.length > 0) {
        console.log(`🧹 Cleaning up ${filesToDelete.length} temporary files...`);
        
        for (const filePath of filesToDelete) {
          if (dryRun) {
            console.log(`Would delete: ${filePath}`);
          } else {
            try {
              await fs.promises.unlink(filePath);
              console.log(`Deleted: ${path.basename(filePath)}`);
            } catch (error) {
              console.warn(`Failed to delete ${filePath}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Clean up materials directory
   */
  static async cleanupMaterials(
    materialsDir: string,
    options: CleanupOptions = {}
  ): Promise<void> {
    const { dryRun = false } = options;

    try {
      if (!await fs.promises.access(materialsDir).then(() => true).catch(() => false)) {
        return;
      }

      const items = await fs.promises.readdir(materialsDir, { withFileTypes: true });
      let deletedCount = 0;

      for (const item of items) {
        const itemPath = path.join(materialsDir, item.name);
        
        if (dryRun) {
          console.log(`Would delete: ${itemPath}`);
          deletedCount++;
        } else {
          try {
            if (item.isDirectory()) {
              await fs.promises.rmdir(itemPath, { recursive: true });
            } else {
              await fs.promises.unlink(itemPath);
            }
            deletedCount++;
          } catch (error) {
            console.warn(`Failed to delete ${itemPath}:`, error);
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} items from materials directory`);
      }
    } catch (error) {
      console.warn('Failed to cleanup materials:', error);
    }
  }

  /**
   * Get directory size
   */
  static async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath);
        } else {
          const stats = await fs.promises.stat(itemPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }

    return totalSize;
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Run comprehensive cleanup
   */
  static async runCleanup(options: CleanupOptions & { 
    logDir?: string;
    materialsDir?: string;
  } = {}): Promise<void> {
    const {
      logDir = process.cwd(),
      materialsDir = path.join(process.cwd(), 'materials'),
      dryRun = false
    } = options;

    console.log('🧹 Starting cleanup process...');
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be deleted');
    }

    // Get initial sizes
    const initialLogSize = await this.getDirectorySize(logDir);
    const initialMaterialsSize = await this.getDirectorySize(materialsDir);

    console.log(`📊 Initial sizes:`);
    console.log(`   Logs: ${this.formatBytes(initialLogSize)}`);
    console.log(`   Materials: ${this.formatBytes(initialMaterialsSize)}`);

    // Run cleanup
    await this.cleanupLogs(logDir, options);
    await this.cleanupTempFiles(logDir, options);
    await this.cleanupMaterials(materialsDir, options);

    // Get final sizes
    if (!dryRun) {
      const finalLogSize = await this.getDirectorySize(logDir);
      const finalMaterialsSize = await this.getDirectorySize(materialsDir);
      const savedSpace = (initialLogSize + initialMaterialsSize) - (finalLogSize + finalMaterialsSize);

      console.log(`📊 Final sizes:`);
      console.log(`   Logs: ${this.formatBytes(finalLogSize)}`);
      console.log(`   Materials: ${this.formatBytes(finalMaterialsSize)}`);
      console.log(`💾 Space saved: ${this.formatBytes(savedSpace)}`);
    }

    console.log('✅ Cleanup completed');
  }
}
