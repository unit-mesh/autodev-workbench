import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readdir, stat } from "fs/promises";
import { join } from "path";

export const installFindTool: ToolLike = (installer) => {
    installer("find", "Search for files and directories", {
        path: z.string().describe("Starting directory to search"),
        name: z.string().optional().describe("Pattern to match against file names"),
        type: z.enum(['file', 'directory']).optional().describe("Type of entry to find"),
        maxDepth: z.number().optional().describe("Maximum directory depth to search"),
        minSize: z.number().optional().describe("Minimum file size in bytes"),
        maxSize: z.number().optional().describe("Maximum file size in bytes"),
        newer: z.string().optional().describe("Find files newer than this file"),
    }, async ({ path, name, type, maxDepth, minSize, maxSize, newer }) => {
        try {
            const results: string[] = [];
            let newerTime: number | undefined;

            if (newer) {
                const stats = await stat(newer);
                newerTime = stats.mtimeMs;
            }

            async function searchDirectory(dirPath: string, depth: number = 0) {
                if (maxDepth !== undefined && depth > maxDepth) {
                    return;
                }

                const entries = await readdir(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = join(dirPath, entry.name);
                    
                    // Check name pattern
                    if (name && !entry.name.includes(name)) {
                        continue;
                    }

                    // Check type
                    if (type && (
                        (type === 'file' && !entry.isFile()) ||
                        (type === 'directory' && !entry.isDirectory())
                    )) {
                        continue;
                    }

                    // Check size for files
                    if (entry.isFile() && (minSize !== undefined || maxSize !== undefined)) {
                        const stats = await stat(fullPath);
                        if (minSize !== undefined && stats.size < minSize) continue;
                        if (maxSize !== undefined && stats.size > maxSize) continue;
                    }

                    // Check modification time
                    if (newerTime !== undefined) {
                        const stats = await stat(fullPath);
                        if (stats.mtimeMs <= newerTime) continue;
                    }

                    results.push(fullPath);

                    if (entry.isDirectory()) {
                        await searchDirectory(fullPath, depth + 1);
                    }
                }
            }

            await searchDirectory(path);

            return {
                content: [
                    {
                        type: "text",
                        text: results.length > 0 
                            ? results.join('\n')
                            : "No matches found"
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error searching files: ${error.message}`
                    }
                ]
            };
        }
    });
}; 