import { ToolLike } from "../../_typing";
import { z } from "zod";
import { writeFile, appendFile } from "fs/promises";

export const installTeeTool: ToolLike = (installer) => {
    installer("tee", "Read from stdin and write to stdout and files", {
        paths: z.array(z.string()).describe("Paths to the files to write to"),
        append: z.boolean().optional().describe("Append to the given files, do not overwrite"),
        ignoreInterrupts: z.boolean().optional().describe("Ignore interrupt signals"),
        input: z.string().describe("Input text to process"),
    }, async ({ paths, append, ignoreInterrupts, input }) => {
        try {
            // Write to all specified files
            const writePromises = paths.map(async (path) => {
                try {
                    if (append) {
                        await appendFile(path, input + '\n');
                    } else {
                        await writeFile(path, input + '\n');
                    }
                } catch (error: any) {
                    return `Error writing to ${path}: ${error.message}`;
                }
            });

            const results = await Promise.all(writePromises);
            const errors = results.filter(Boolean);

            return {
                content: [
                    {
                        type: "text",
                        text: errors.length > 0 
                            ? `Input written to stdout. Errors:\n${errors.join('\n')}`
                            : "Input written to stdout and all files successfully."
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error processing input: ${error.message}`
                    }
                ]
            };
        }
    });
}; 