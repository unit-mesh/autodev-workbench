import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readFile } from "fs/promises";

export const installTailTool: ToolLike = (installer) => {
    installer("tail", "Display the end of files", {
        path: z.string().describe("Path to the file to display"),
        lines: z.number().default(10).describe("Number of lines to display"),
        bytes: z.number().optional().describe("Number of bytes to display"),
        follow: z.boolean().optional().describe("Follow file changes"),
        quiet: z.boolean().optional().describe("Never print headers"),
    }, async ({ path, lines, bytes, follow, quiet }) => {
        try {
            const content = await readFile(path, 'utf-8');
            let output: string;

            if (bytes !== undefined) {
                output = content.slice(-bytes);
            } else {
                const contentLines = content.split('\n');
                output = contentLines.slice(-lines).join('\n');
            }

            const header = quiet ? '' : `==> ${path} <==\n`;
            
            return {
                content: [
                    {
                        type: "text",
                        text: header + output
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error reading file: ${error.message}`
                    }
                ]
            };
        }
    });
}; 