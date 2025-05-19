import { ToolLike } from "./tools/_typing.js";
import { installAddTool } from "./tools/add.js";

import { installGithubPrListTool } from "./tools/repo/github-pr-list.js";
import { installGithubPrCreateTool } from "./tools/repo/github-pr-create.js";
import { installGitlabMrCreateTool } from "./tools/repo/gitlab-mr-create.js";
import { installGitlabMrListTool } from "./tools/repo/gitlab-mr-list.js";
import { installGitlabMrUpdateTool } from "./tools/repo/gitlab-mr-update.js";
import { installGitlabMrCommentTool } from "./tools/repo/gitlab-mr-comment.js";

import { installLsTool } from "./tools/sys/posix/ls.js";
import { installCatTool } from "./tools/sys/posix/cat.js";
import { installGrepTool } from "./tools/sys/posix/grep.js";
import { installHeadTool } from "./tools/sys/posix/head.js";
import { installTailTool } from "./tools/sys/posix/tail.js";
import { installTeeTool } from "./tools/sys/posix/tee.js";
import { installSortTool } from "./tools/sys/posix/sort.js";
import { installUniqTool } from "./tools/sys/posix/uniq.js";
import { installCutTool } from "./tools/sys/posix/cut.js";
import { installPasteTool } from "./tools/sys/posix/paste.js";
import { installDiffTool } from "./tools/sys/posix/diff.js";
import { installFreeTool } from "./tools/sys/posix/free.js";
import { installDfTool } from "./tools/sys/posix/df.js";
import { installFindTool } from "./tools/sys/posix/find.js";
import { installWcTool } from "./tools/sys/posix/wc.js";

import { installAstGrepTool } from "./tools/sys/ast_grep.js";
import { installRipGrepTool } from "./tools/sys/rip_grep.js";

export const tools: ToolLike[] = [
    installAddTool,

    // Repo Platform Tools
    installGithubPrCreateTool,
    installGithubPrListTool,
    installGitlabMrCreateTool,
    installGitlabMrListTool,
    installGitlabMrUpdateTool,
    installGitlabMrCommentTool,

    // POSIX tools
    installLsTool,
    installCatTool,
    installGrepTool,
    installHeadTool,
    installTailTool,
    installTeeTool,
    installSortTool,
    installUniqTool,
    installCutTool,
    installPasteTool,
    installDiffTool,
    installFreeTool,
    installDfTool,
    installFindTool,
    installWcTool,

    // Code search tools
    installAstGrepTool,
    installRipGrepTool,
];  
