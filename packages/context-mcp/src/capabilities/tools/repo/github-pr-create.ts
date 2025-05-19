import { ToolLike } from "../_typing.js";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

export const installGithubPrCreateTool: ToolLike = (installer) => {
    installer(
        "github-pr-create",
        {
            owner: z.string().describe("Repository owner"),
            repo: z.string().describe("Repository name"),
            title: z.string().describe("PR title"),
            body: z.string().describe("PR description"),
            head: z.string().describe("The branch with your changes"),
            base: z.string().describe("The branch you want to merge into"),
            draft: z.boolean().optional().describe("Whether to create a draft PR"),
        },
        async ({ owner, repo, title, body, head, base, draft = false }) => {
            const octokit = new Octokit({
                auth: process.env.GITHUB_TOKEN,
            });

            const { data: pr } = await octokit.pulls.create({
                owner,
                repo,
                title,
                body,
                head,
                base,
                draft,
            });

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                number: pr.number,
                                title: pr.title,
                                state: pr.state,
                                html_url: pr.html_url,
                                created_at: pr.created_at,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        }
    );
}; 