import * as path from "path";
import { listFiles } from "@autodev/worker-core";

export class CodebaseScanner {
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
