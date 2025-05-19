import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readFile } from "fs/promises";
import { diffLines } from "diff";

export const installDiffTool: ToolLike = (installer) => {
    installer("diff", "Compare files line by line", {
        file1: z.string().describe("Path to the first file"),
        file2: z.string().describe("Path to the second file"),
        ignoreCase: z.boolean().optional().describe("Ignore case differences"),
        ignoreWhitespace: z.boolean().optional().describe("Ignore changes in whitespace"),
        unified: z.number().optional().describe("Output NUM (default 3) lines of unified context"),
    }, async ({ file1, file2, ignoreCase, ignoreWhitespace, unified }) => {
        try {
            const [content1, content2] = await Promise.all([
                readFile(file1, 'utf-8'),
                readFile(file2, 'utf-8')
            ]);

            let text1 = content1;
            let text2 = content2;

            if (ignoreCase) {
                text1 = text1.toLowerCase();
                text2 = text2.toLowerCase();
            }

            if (ignoreWhitespace) {
                text1 = text1.replace(/\s+/g, ' ').trim();
                text2 = text2.replace(/\s+/g, ' ').trim();
            }

            const differences = diffLines(text1, text2);
            const contextLines = unified || 3;
            let output: string[] = [];
            let currentHunk: string[] = [];
            let lineCount = 0;

            for (const part of differences) {
                if (part.added || part.removed) {
                    if (currentHunk.length > 0) {
                        output.push(...currentHunk);
                        currentHunk = [];
                    }
                    const prefix = part.added ? '+' : '-';
                    const lines = part.value.split('\n').filter(Boolean);
                    output.push(...lines.map(line => `${prefix} ${line}`));
                } else {
                    const lines = part.value.split('\n').filter(Boolean);
                    if (lines.length <= contextLines * 2) {
                        currentHunk.push(...lines.map(line => `  ${line}`));
                    } else {
                        if (currentHunk.length > 0) {
                            output.push(...currentHunk);
                            currentHunk = [];
                        }
                        output.push(`@@ -${lineCount + 1},${lines.length} @@`);
                        output.push(...lines.slice(0, contextLines).map(line => `  ${line}`));
                        output.push('...');
                        output.push(...lines.slice(-contextLines).map(line => `  ${line}`));
                    }
                }
                lineCount += part.count || 0;
            }

            if (currentHunk.length > 0) {
                output.push(...currentHunk);
            }

            return {
                content: [
                    {
                        type: "text",
                        text: output.join('\n')
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error comparing files: ${error.message}`
                    }
                ]
            };
        }
    });
}; 