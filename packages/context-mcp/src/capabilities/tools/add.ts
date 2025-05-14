import { ToolLike } from "./_typing.js";

import { z } from "zod";

export const installAddTool: ToolLike = (installer) => {
    installer("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
        content: [{ type: "text", text: String(a + b) }],
    }));
};
