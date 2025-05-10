import { promisify } from "util";
import fs from "fs";
import path from "path";

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

/**
 * Default patterns to ignore
 */
const DEFAULT_IGNORE_PATTERNS = [
	// Dependencies
	'node_modules',
	'vendor',
	'bower_components',
	'jspm_packages',

	// Build outputs
	'dist',
	'build',
	'out',
	'.next',
	'target',
	'coverage',

	// Gradle
	'.gradle',
	'gradle',
	'gradlew',
	'gradlew.bat',
	'gradle.properties',
	'gradle-wrapper.properties',
	'gradle-wrapper.jar',

	// Cache directories
	'.cache',
	'.parcel-cache',
	'.turbo',
	'.yarn',

	// IDE and editor files
	'.idea',
	'.vscode',
	'*.swp',
	'*.swo',
	'.DS_Store',

	// Logs
	'*.log',
	'logs',

	// Environment files
	'.env*',
	'.env.local',
	'.env.*.local',

	// Package manager files
	'package-lock.json',
	'yarn.lock',
	'pnpm-lock.yaml',

	// Test coverage
	'.nyc_output',

	// Temporary files
	'tmp',
	'temp',
	'*.tmp',

	// System files
	'Thumbs.db'
];

/**
 * Handles file system operations for scanning directories and files
 */
export class FileSystemScanner {
	private ignorePatterns: string[] = [...DEFAULT_IGNORE_PATTERNS];
	private gitignoreCache = new Map<string, string[]>();

	/**
	 * Scans a directory and returns all file paths, respecting ignore patterns and .gitignore files
	 */
	public async scanDirectory(dirPath: string, baseDir: string = dirPath): Promise<string[]> {
		// Check if this directory should be ignored
		const relativePath = path.relative(baseDir, dirPath);
		if (this.shouldIgnorePath(relativePath)) {
			return [];
		}

		// Parse .gitignore if it exists in this directory
		await this.parseGitignoreIfExists(dirPath, baseDir);

		const entries = await readdir(dirPath, { withFileTypes: true });
		const files = await Promise.all(entries.map(async (entry) => {
			const fullPath = path.join(dirPath, entry.name);
			const relPath = path.relative(baseDir, fullPath);

			// Skip if this path should be ignored
			if (this.shouldIgnorePath(relPath) || this.isIgnoredByGitignore(relPath, baseDir)) {
				return [];
			}

			if (entry.isDirectory()) {
				return this.scanDirectory(fullPath, baseDir);
			} else {
				// For binary files or files that are too large, we might want to skip them
				try {
					const fileStat = await stat(fullPath);
					// Skip large files (e.g., larger than 1MB)
					if (fileStat.size > 1024 * 1024) {
						return [];
					}

					return [fullPath];
				} catch (error) {
					return [];
				}
			}
		}));

		return files.flat();
	}

	/**
	 * Checks if a file path matches any of the default ignore patterns
	 */
	private shouldIgnorePath(filePath: string): boolean {
		// Always ignore dot directories at root level
		if (/^\.[\w-]+/.test(path.basename(filePath))) {
			return true;
		}

		return this.ignorePatterns.some(pattern => {
			// Handle glob patterns
			if (pattern.includes('*')) {
				const regexPattern = pattern
					.replace(/\./g, '\\.')
					.replace(/\*/g, '.*');
				return new RegExp(`^${regexPattern}$`).test(path.basename(filePath));
			}

			// Exact match for directories or files
			return filePath.includes(`/${pattern}`) || filePath === pattern || path.basename(filePath) === pattern;
		});
	}

	/**
	 * Parses a .gitignore file if it exists in the current directory
	 */
	private async parseGitignoreIfExists(dirPath: string, baseDir: string): Promise<void> {
		const gitignorePath = path.join(dirPath, '.gitignore');

		// Skip if we've already parsed this .gitignore
		if (this.gitignoreCache.has(dirPath)) {
			return;
		}

		try {
			if (fs.existsSync(gitignorePath)) {
				const content = await readFile(gitignorePath, 'utf-8');
				const patterns = content
					.split('\n')
					.map(line => line.trim())
					.filter(line => line && !line.startsWith('#'));

				this.gitignoreCache.set(dirPath, patterns);
			} else {
				// Cache empty array to avoid checking again
				this.gitignoreCache.set(dirPath, []);
			}
		} catch (error) {
			// If there's an error, set empty array
			this.gitignoreCache.set(dirPath, []);
		}
	}

	/**
	 * Checks if a path is ignored by any .gitignore rule
	 */
	private isIgnoredByGitignore(filePath: string, baseDir: string): boolean {
		// Check all parent directories' .gitignore files
		let currentDir = path.dirname(path.join(baseDir, filePath));
		let isIgnored = false;

		while (currentDir.startsWith(baseDir)) {
			const patterns = this.gitignoreCache.get(currentDir);

			if (patterns) {
				// Simple implementation of gitignore pattern matching
				// A more complete implementation would use minimatch or similar
				const relPath = path.relative(currentDir, path.join(baseDir, filePath));

				isIgnored = patterns.some(pattern => {
					// Handle negation
					if (pattern.startsWith('!')) {
						return false;
					}

					// Handle directory-specific pattern
					if (pattern.endsWith('/')) {
						return relPath.startsWith(pattern);
					}

					// Handle glob patterns (simple implementation)
					if (pattern.includes('*')) {
						const regexPattern = pattern
							.replace(/\./g, '\\.')
							.replace(/\*/g, '.*');
						return new RegExp(`^${regexPattern}$`).test(relPath);
					}

					return relPath === pattern || relPath.startsWith(`${pattern}/`);
				});

				if (isIgnored) {
					break;
				}
			}

			// Move up to parent directory
			const parentDir = path.dirname(currentDir);
			if (parentDir === currentDir) {
				break;
			}
			currentDir = parentDir;
		}

		return isIgnored;
	}

	public async readFileContent(filePath: string): Promise<string> {
		return readFile(filePath, 'utf-8');
	}
}
