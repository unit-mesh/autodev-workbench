import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readFile } from "fs/promises";

export const installPasteTool: ToolLike = (installer) => {
    installer("paste", "Merge lines of files", {
        paths: z.array(z.string()).describe("Paths to the files to merge"),
        delimiter: z.string().optional().describe("Use DELIM instead of TAB for field delimiter"),
        serial: z.boolean().optional().describe("Paste one file at a time instead of in parallel"),
    }, async ({ paths, delimiter, serial }) => {
        try {
            const sep = delimiter || '\t';
            const fileContents = await Promise.all(
                paths.map(path => readFile(path, 'utf-8'))
            );

            const lines: string[][] = fileContents.map(content => 
                content.split('\n').filter(Boolean)
            );

            const maxLines = Math.max(...lines.map(l => l.length));
            const output: string[] = [];

            if (serial) {
                // Process one file at a time
                for (let i = 0; i < maxLines; i++) {
                    const lineParts: string[] = [];
                    for (const fileLines of lines) {
                        lineParts.push(fileLines[i] || '');
                    }
                    output.push(lineParts.join(sep));
                }
            } else {
                // Process all files in parallel
                for (let i = 0; i < maxLines; i++) {
                    const lineParts = lines.map(fileLines => fileLines[i] || '');
                    output.push(lineParts.join(sep));
                }
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
                        text: `Error merging files: ${error.message}`
                    }
                ]
            };
        }
    });
}; 