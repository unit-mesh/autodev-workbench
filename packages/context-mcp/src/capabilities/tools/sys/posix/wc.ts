import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readFile } from "fs/promises";

export const installWcTool: ToolLike = (installer) => {
    installer("wc", "Count lines, words, and characters in files", {
        path: z.string().describe("Path to the file to count"),
        lines: z.boolean().optional().describe("Count lines"),
        words: z.boolean().optional().describe("Count words"),
        chars: z.boolean().optional().describe("Count characters"),
        bytes: z.boolean().optional().describe("Count bytes"),
    }, async ({ path, lines, words, chars, bytes }) => {
        try {
            const content = await readFile(path, 'utf-8');
            const stats = {
                lines: content.split('\n').length,
                words: content.split(/\s+/).filter(Boolean).length,
                chars: content.length,
                bytes: Buffer.byteLength(content, 'utf-8')
            };

            // If no specific options are provided, show all counts
            const showAll = !lines && !words && !chars && !bytes;
            
            const counts = [];
            if (showAll || lines) counts.push(stats.lines);
            if (showAll || words) counts.push(stats.words);
            if (showAll || chars) counts.push(stats.chars);
            if (showAll || bytes) counts.push(stats.bytes);

            return {
                content: [
                    {
                        type: "text",
                        text: `${counts.join('\t')}\t${path}`
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error counting file: ${error.message}`
                    }
                ]
            };
        }
    });
}; 