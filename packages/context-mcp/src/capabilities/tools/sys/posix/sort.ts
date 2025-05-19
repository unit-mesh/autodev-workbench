import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readFile } from "fs/promises";

export const installSortTool: ToolLike = (installer) => {
    installer("sort", "Sort text files", {
        path: z.string().describe("Path to the file to sort"),
        reverse: z.boolean().optional().describe("Sort in reverse order"),
        unique: z.boolean().optional().describe("Remove duplicate lines"),
        numeric: z.boolean().optional().describe("Sort numerically"),
        ignoreCase: z.boolean().optional().describe("Ignore case when sorting"),
        field: z.number().optional().describe("Sort by field number (1-based)"),
        separator: z.string().optional().describe("Field separator character"),
    }, async ({ path, reverse, unique, numeric, ignoreCase, field, separator }) => {
        try {
            const content = await readFile(path, 'utf-8');
            let lines = content.split('\n').filter(Boolean);

            // Remove duplicates if requested
            if (unique) {
                lines = [...new Set(lines)];
            }

            // Sort the lines
            lines.sort((a, b) => {
                let aVal = a;
                let bVal = b;

                // Handle field-based sorting
                if (field !== undefined) {
                    const sep = separator || /\s+/;
                    const aFields = a.split(sep);
                    const bFields = b.split(sep);
                    aVal = aFields[field - 1] || '';
                    bVal = bFields[field - 1] || '';
                }

                // Handle case-insensitive sorting
                if (ignoreCase) {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                // Handle numeric sorting
                if (numeric) {
                    const aNum = parseFloat(aVal);
                    const bNum = parseFloat(bVal);
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return aNum - bNum;
                    }
                }

                // Default string comparison
                return aVal.localeCompare(bVal);
            });

            // Reverse if requested
            if (reverse) {
                lines.reverse();
            }

            return {
                content: [
                    {
                        type: "text",
                        text: lines.join('\n')
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error sorting file: ${error.message}`
                    }
                ]
            };
        }
    });
}; 