import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readFile } from "fs/promises";
import { readdir } from "fs/promises";
import { join } from "path";

export const installGrepTool: ToolLike = (installer) => {
    installer("grep", "Search for patterns in files", {
        pattern: z.string().describe("Pattern to search for"),
        path: z.string().describe("Path to search in"),
        recursive: z.boolean().optional().describe("Search directories recursively"),
        ignoreCase: z.boolean().optional().describe("Ignore case distinctions"),
        lineNumber: z.boolean().optional().describe("Prefix each line with line number"),
        invertMatch: z.boolean().optional().describe("Select non-matching lines"),
        wordMatch: z.boolean().optional().describe("Match whole words only"),
    }, async ({ pattern, path, recursive, ignoreCase, lineNumber, invertMatch, wordMatch }) => {
        try {
            const regex = new RegExp(
                wordMatch ? `\\b${pattern}\\b` : pattern,
                ignoreCase ? 'i' : ''
            );

            const results: string[] = [];
            
            async function searchFile(filePath: string) {
                const content = await readFile(filePath, 'utf-8');
                const lines = content.split('\n');
                
                lines.forEach((line, i) => {
                    const matches = regex.test(line);
                    if (matches !== invertMatch) {
                        const prefix = lineNumber ? `${i + 1}:` : '';
                        results.push(`${filePath}:${prefix}${line}`);
                    }
                });
            }

            async function searchDirectory(dirPath: string) {
                const entries = await readdir(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = join(dirPath, entry.name);
                    
                    if (entry.isDirectory() && recursive) {
                        await searchDirectory(fullPath);
                    } else if (entry.isFile()) {
                        await searchFile(fullPath);
                    }
                }
            }

            const stats = await readdir(path, { withFileTypes: true });
            if (stats.length === 1 && stats[0].isFile()) {
                await searchFile(path);
            } else {
                await searchDirectory(path);
            }

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