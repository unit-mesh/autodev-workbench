import * as fs from "fs/promises";
import * as path from "path";
import { CodebaseAnalysis, FileInfo } from "./context-analyzer.type";
import { Stats } from "node:fs";

export interface ScanConfig {
  excludeDirs: string[];
  codeExtensions: string[];
  maxDepth?: number;
}

export class CodebaseScanner {
  private static readonly DEFAULT_CONFIG: ScanConfig = {
    excludeDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__', '.next', '.nuxt'],
    codeExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h']
  };

  private config: ScanConfig;

  constructor(config?: Partial<ScanConfig>) {
    this.config = { ...CodebaseScanner.DEFAULT_CONFIG, ...config };
  }

  async scanWorkspace(workspacePath: string, maxDepth: number = 2): Promise<CodebaseAnalysis> {
    const fileStats = {
      total_files: 0,
      total_size: 0,
      by_extension: {} as Record<string, { count: number; size: number }>,
      by_directory: {} as Record<string, { count: number; size: number }>,
      largest_files: [] as FileInfo[]
    };

    const allFiles: FileInfo[] = [];

    await this.scanDirectory(workspacePath, workspacePath, fileStats, allFiles, maxDepth);

    fileStats.largest_files = allFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    const codeFiles = allFiles.filter(f => this.config.codeExtensions.includes(f.extension));

    return {
      ...fileStats,
      code_files: codeFiles.length,
      code_ratio: fileStats.total_files > 0 ? Math.round((codeFiles.length / fileStats.total_files) * 100) : 0,
      average_file_size: fileStats.total_files > 0 ? Math.round(fileStats.total_size / fileStats.total_files) : 0,
      most_common_extensions: Object.entries(fileStats.by_extension)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
    };
  }

  private async scanDirectory(
    dirPath: string,
    workspacePath: string,
    fileStats: any,
    allFiles: FileInfo[],
    maxDepth: number,
    currentDepth: number = 0
  ): Promise<void> {
    if (currentDepth > maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath);

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const relativePath = path.relative(workspacePath, entryPath);

        if (this.shouldExclude(relativePath)) continue;

        const stats = await fs.stat(entryPath);

        if (stats.isDirectory()) {
          await this.scanDirectory(entryPath, workspacePath, fileStats, allFiles, maxDepth, currentDepth + 1);
        } else if (stats.isFile()) {
          this.processFile(entry, relativePath, stats, fileStats, allFiles);
        }
      }
    } catch (error) {
      console.warn(`Warning: Cannot scan directory ${dirPath}: ${error}`);
    }
  }

  private shouldExclude(relativePath: string): boolean {
    return this.config.excludeDirs.some(exclude => relativePath.includes(exclude));
  }

  private processFile(
    entry: string,
    relativePath: string,
    stats: Stats,
    fileStats: any,
    allFiles: FileInfo[]
  ): void {
    fileStats.total_files++;
    fileStats.total_size += stats.size;

    const ext = path.extname(entry).toLowerCase() || 'no-extension';
    if (!fileStats.by_extension[ext]) {
      fileStats.by_extension[ext] = { count: 0, size: 0 };
    }
    fileStats.by_extension[ext].count++;
    fileStats.by_extension[ext].size += stats.size;

    const dir = path.dirname(relativePath) || '.';
    if (!fileStats.by_directory[dir]) {
      fileStats.by_directory[dir] = { count: 0, size: 0 };
    }
    fileStats.by_directory[dir].count++;
    fileStats.by_directory[dir].size += stats.size;

    allFiles.push({
      path: relativePath,
      size: stats.size,
      extension: ext,
      modified: stats.mtime.toISOString()
    });
  }

  async getProjectStructure(workspacePath: string, maxDepth: number = 2): Promise<any> {
    const buildStructure = async (dirPath: string, currentDepth: number = 0): Promise<any> => {
      if (currentDepth > maxDepth) return null;

      try {
        const entries = await fs.readdir(dirPath);
        const result: any = {};

        for (const entry of entries) {
          if (entry.startsWith('.')) continue;

          const entryPath = path.join(dirPath, entry);
          const stats = await fs.stat(entryPath);

          if (stats.isDirectory()) {
            const subStructure = await buildStructure(entryPath, currentDepth + 1);
            if (subStructure) {
              result[entry] = subStructure;
            }
          } else {
            result[entry] = 'file';
          }
        }

        return result;
      } catch (error) {
        return null;
      }
    };

    return buildStructure(workspacePath);
  }

  getCodeFileCount(analysis: CodebaseAnalysis): number {
    return analysis.code_files;
  }

  getCodeRatio(analysis: CodebaseAnalysis): number {
    return analysis.code_ratio;
  }

  getLargestFiles(analysis: CodebaseAnalysis, count: number = 5): FileInfo[] {
    return analysis.largest_files.slice(0, count);
  }

  getMostCommonExtensions(analysis: CodebaseAnalysis, count: number = 5): Array<[string, { count: number; size: number }]> {
    return analysis.most_common_extensions.slice(0, count);
  }
}
