import { ToolLike } from "../../_typing";
import { z } from "zod";
import { readFile } from "fs/promises";

export const installCatTool: ToolLike = (installer) => {
    installer("cat", "Display file contents", {
        path: z.string().describe("Path to the file to display"),
        number: z.boolean().optional().describe("Number all output lines"),
        squeeze: z.boolean().optional().describe("Squeeze multiple adjacent empty lines"),
    }, async ({ path, number, squeeze }) => {
        try {
            const content = await readFile(path, 'utf-8');
            let lines = content.split('\n');

            if (squeeze) {
                lines = lines.filter((line, i, arr) => 
                    line.trim() !== '' || (i > 0 && arr[i-1].trim() !== '')
                );
            }

            if (number) {
                lines = lines.map((line, i) => `${i + 1}\t${line}`);
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
                        text: `Error reading file: ${error.message}`
                    }
                ]
            };
        }
    });
}; 