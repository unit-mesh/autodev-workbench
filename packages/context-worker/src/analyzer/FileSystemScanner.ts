import { promisify } from "util";
import fs from "fs";
import path from "path";

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

/**
 * Handles file system operations for scanning directories and files
 */
export class FileSystemScanner {
	public async scanDirectory(dirPath: string): Promise<string[]> {
		const entries = await readdir(dirPath, { withFileTypes: true });
		const files = await Promise.all(entries.map(async (entry) => {
			const fullPath = path.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				return this.scanDirectory(fullPath);
			} else {
				return [fullPath];
			}
		}));

		return files.flat();
	}

	public async readFileContent(filePath: string): Promise<string> {
		return readFile(filePath, 'utf-8');
	}
}
