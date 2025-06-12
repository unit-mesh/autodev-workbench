import * as fs from "fs/promises";
import * as path from "path";
import { CodebaseAnalysis, FileInfo } from "./context-analyzer.type";
import { Stats } from "node:fs";
import { listFiles } from "@autodev/worker-core";

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
		const [filePaths] = await listFiles(workspacePath, true, 10000);
		const fileOnlyPaths = filePaths.filter(filePath => !filePath.endsWith('/'));

		for (const filePath of fileOnlyPaths) {
			try {
				const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(workspacePath, filePath);
				const stats = await fs.stat(absolutePath);

				if (stats.isFile()) {
					const relativePath = path.relative(workspacePath, absolutePath);
					const fileName = path.basename(filePath);

					if (this.shouldExcludeFile(relativePath)) {
						continue;
					}

					this.processFile(fileName, relativePath, stats, fileStats, allFiles);
				}
			} catch (error) {
				// Skip files that can't be accessed
				console.warn(`Warning: Cannot access file ${filePath}: ${error}`);
				continue;
			}
		}

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

	private shouldExcludeFile(relativePath: string): boolean {
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
		const [allPaths] = await listFiles(workspacePath, true, 5000);

		const structure: any = {};

		for (const itemPath of allPaths) {
			const relativePath = path.isAbsolute(itemPath) ? path.relative(workspacePath, itemPath) : itemPath;
			const pathParts = relativePath.split(path.sep);

			// Respect maxDepth
			if (pathParts.length > maxDepth + 1) {
				continue;
			}

			let current = structure;

			for (let i = 0; i < pathParts.length; i++) {
				const part = pathParts[i];
				if (!part) continue;

				if (i === pathParts.length - 1) {
					if (itemPath.endsWith('/') || allPaths.some(p => p.startsWith(itemPath + '/'))) {
						current[part] = current[part] || {};
					} else {
						current[part] = 'file';
					}
				} else {
					current[part] = current[part] || {};
					current = current[part];
				}
			}
		}

		return structure;
	}
}
