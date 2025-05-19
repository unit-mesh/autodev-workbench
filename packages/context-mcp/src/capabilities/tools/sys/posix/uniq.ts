import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readFile } from "fs/promises";

export const installUniqTool: ToolLike = (installer) => {
    installer("uniq", "Report or filter out repeated lines", {
        path: z.string().describe("Path to the file to process"),
        count: z.boolean().optional().describe("Prefix lines by number of occurrences"),
        repeated: z.boolean().optional().describe("Only print duplicate lines"),
        unique: z.boolean().optional().describe("Only print unique lines"),
        ignoreCase: z.boolean().optional().describe("Ignore case when comparing"),
        skipFields: z.number().optional().describe("Skip N fields before comparing"),
        skipChars: z.number().optional().describe("Skip N characters before comparing"),
    }, async ({ path, count, repeated, unique, ignoreCase, skipFields, skipChars }) => {
        try {
            const content = await readFile(path, 'utf-8');
            const lines = content.split('\n').filter(Boolean);

            // Process lines based on options
            const processedLines = lines.map(line => {
                let compareLine = line;
                
                // Handle field skipping
                if (skipFields !== undefined) {
                    const fields = line.split(/\s+/);
                    compareLine = fields.slice(skipFields).join(' ');
                }
                
                // Handle character skipping
                if (skipChars !== undefined) {
                    compareLine = compareLine.slice(skipChars);
                }
                
                // Handle case-insensitive comparison
                if (ignoreCase) {
                    compareLine = compareLine.toLowerCase();
                }
                
                return { original: line, compare: compareLine };
            });

            // Count occurrences
            const counts = new Map<string, number>();
            processedLines.forEach(({ compare }) => {
                counts.set(compare, (counts.get(compare) || 0) + 1);
            });

            // Filter and format output
            const output = processedLines
                .filter(({ compare }, index, self) => {
                    const count = counts.get(compare)!;
                    if (repeated) return count > 1;
                    if (unique) return count === 1;
                    return index === self.findIndex(l => l.compare === compare);
                })
                .map(({ original, compare }) => {
                    if (count) {
                        return `${counts.get(compare)} ${original}`;
                    }
                    return original;
                });

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
                        text: `Error processing file: ${error.message}`
                    }
                ]
            };
        }
    });
}; 