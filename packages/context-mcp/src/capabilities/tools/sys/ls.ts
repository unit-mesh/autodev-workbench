import { ToolLike } from "../_typing";
import { z } from "zod";
import { readdir } from "fs/promises";
import { join } from "path";

export const installLsTool: ToolLike = (installer) => {
    installer("ls", "List files and directories", {
        path: z.string().describe("Path to list"),
    }, async ({ path }) => {
        try {
            const entries = await readdir(path, { withFileTypes: true });
            const items = entries.map(entry => ({
                name: entry.name,
                type: entry.isDirectory() ? "directory" : "file"
            }));

            return {
                content: [
                    {
                        type: "text",
                        text: items.map(item => 
                            `${item.type === "directory" ? "📁" : "📄"} ${item.name}`
                        ).join("\n")
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error listing directory: ${error.message}`
                    }
                ]
            };
        }
    });
};