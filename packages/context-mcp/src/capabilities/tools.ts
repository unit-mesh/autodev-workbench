import { ToolLike } from "./tools/_typing.js";
import { installAddTool } from "./tools/add.js";

import { installGithubPrListTool } from "./tools/github-pr-list.js";
import { installGithubPrCreateTool } from "./tools/github-pr-create.js";
import { installGitlabMrCreateTool } from "./tools/gitlab-mr-create.js";
import { installGitlabMrListTool } from "./tools/gitlab-mr-list.js";
import { installGitlabMrUpdateTool } from "./tools/gitlab-mr-update.js";
import { installGitlabMrCommentTool } from "./tools/gitlab-mr-comment.js";

export const tools: ToolLike[] = [
    installAddTool,
    installGithubPrCreateTool,
    installGithubPrListTool,
    installGitlabMrCreateTool,
    installGitlabMrListTool,
    installGitlabMrUpdateTool,
    installGitlabMrCommentTool,
];  
