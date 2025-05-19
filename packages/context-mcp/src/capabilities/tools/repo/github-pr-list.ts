import { ToolLike } from "./_typing.js";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

export const installGithubPrListTool: ToolLike = (installer) => {
    installer(
        "github-pr-list",
        {
            owner: z.string().describe("Repository owner"),
            repo: z.string().describe("Repository name"),
            state: z.enum(["open", "closed", "all"]).optional().describe("PR state filter"),
            base: z.string().optional().describe("Filter PRs by base branch"),
        },
        async ({ owner, repo, state = "open", base }) => {
            const octokit = new Octokit({
                auth: process.env.GITHUB_TOKEN,
            });

            const { data: prs } = await octokit.pulls.list({
                owner,
                repo,
                state,
                base,
            });

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            prs.map((pr) => ({
                                number: pr.number,
                                title: pr.title,
                                state: pr.state,
                                user: pr.user?.login,
                                created_at: pr.created_at,
                                updated_at: pr.updated_at,
                            })),
                            null,
                            2
                        ),
                    },
                ],
            };
        }
    );
}; 