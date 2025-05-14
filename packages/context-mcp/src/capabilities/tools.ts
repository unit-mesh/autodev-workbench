import { ToolLike } from "./tools/_typing.js";
import { installAddTool } from "./tools/add.js";

export const tools: ToolLike[] = [
    installAddTool,
];
