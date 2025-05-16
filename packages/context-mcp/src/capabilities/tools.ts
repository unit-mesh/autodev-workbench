import { ToolLike } from "./tools/_typing.js";
import { installAddTool } from "./tools/add.js";

import { installGithubPrListTool } from "./tools/github-pr-list.js";
import { installGithubPrCreateTool } from "./tools/github-pr-create.js";

export const tools: ToolLike[] = [
    installAddTool,
    installGithubPrCreateTool,
    installGithubPrListTool,
];  
