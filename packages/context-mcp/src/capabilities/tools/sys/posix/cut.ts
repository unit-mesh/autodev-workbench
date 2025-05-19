import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readFile } from "fs/promises";

export const installCutTool: ToolLike = (installer) => {
    installer("cut", "Remove sections from each line of files", {
        path: z.string().describe("Path to the file to process"),
        fields: z.string().optional().describe("Select only these fields (e.g., '1,3-5')"),
        delimiter: z.string().optional().describe("Use DELIM instead of TAB for field delimiter"),
        characters: z.string().optional().describe("Select only these characters (e.g., '1-3,5')"),
        outputDelimiter: z.string().optional().describe("Use DELIM instead of TAB for output delimiter"),
        complement: z.boolean().optional().describe("Complement the set of selected fields/characters"),
    }, async ({ path, fields, delimiter, characters, outputDelimiter, complement }) => {
        try {
            const content = await readFile(path, 'utf-8');
            const lines = content.split('\n').filter(Boolean);
            const output: string[] = [];

            // Parse range specifications
            function parseRanges(rangeStr: string): number[] {
                const ranges: number[] = [];
                const parts = rangeStr.split(',');
                
                for (const part of parts) {
                    if (part.includes('-')) {
                        const [start, end] = part.split('-').map(Number);
                        for (let i = start; i <= end; i++) {
                            ranges.push(i);
                        }
                    } else {
                        ranges.push(Number(part));
                    }
                }
                
                return ranges.sort((a, b) => a - b);
            }

            // Process each line
            for (const line of lines) {
                let result: string;

                if (characters) {
                    // Character-based cutting
                    const chars = parseRanges(characters);
                    const selected = chars
                        .map(i => line[i - 1])
                        .filter(c => c !== undefined);
                    
                    if (complement) {
                        const allChars = line.split('');
                        result = allChars
                            .filter((_, i) => !chars.includes(i + 1))
                            .join('');
                    } else {
                        result = selected.join('');
                    }
                } else {
                    // Field-based cutting
                    const sep = delimiter || '\t';
                    const outSep = outputDelimiter || sep;
                    const fieldsList = parseRanges(fields || '1');
                    const lineFields = line.split(sep);
                    
                    if (complement) {
                        result = lineFields
                            .filter((_, i) => !fieldsList.includes(i + 1))
                            .join(outSep);
                    } else {
                        result = fieldsList
                            .map(i => lineFields[i - 1] || '')
                            .join(outSep);
                    }
                }

                output.push(result);
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
                        text: `Error processing file: ${error.message}`
                    }
                ]
            };
        }
    });
}; 