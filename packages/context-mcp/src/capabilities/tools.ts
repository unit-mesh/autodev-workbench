import { ToolLike } from "./tools/_typing.js";
import { installAddTool } from "./tools/add.js";

import { installGithubPrListTool } from "./tools/repo/github-pr-list.js";
import { installGithubPrCreateTool } from "./tools/repo/github-pr-create.js";
import { installGitlabMrCreateTool } from "./tools/repo/gitlab-mr-create.js";
import { installGitlabMrListTool } from "./tools/repo/gitlab-mr-list.js";
import { installGitlabMrUpdateTool } from "./tools/repo/gitlab-mr-update.js";
import { installGitlabMrCommentTool } from "./tools/repo/gitlab-mr-comment.js";

import { installLsTool } from "./tools/sys/posix/ls.js";
import { installAstGrepTool } from "./tools/sys/ast_grep.js";
import { installRipGrepTool } from "./tools/sys/rip_grep.js";

export const tools: ToolLike[] = [
    installAddTool,
    installGithubPrCreateTool,
    installGithubPrListTool,
    installGitlabMrCreateTool,
    installGitlabMrListTool,
    installGitlabMrUpdateTool,
    installGitlabMrCommentTool,

    installLsTool,
    installAstGrepTool,
    installRipGrepTool,
];  
