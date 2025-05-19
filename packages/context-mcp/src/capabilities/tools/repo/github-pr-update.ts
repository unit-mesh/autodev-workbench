import { ToolLike } from "./_typing.js";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

export const installGithubPrUpdateTool: ToolLike = (installer) => {
    installer(
        "github-pr-update",
        {
            owner: z.string().describe("Repository owner"),
            repo: z.string().describe("Repository name"),
            pull_number: z.number().describe("PR number"),
            title: z.string().optional().describe("New PR title"),
            body: z.string().optional().describe("New PR description"),
            assignees: z.array(z.string()).optional().describe("List of usernames to assign to the PR"),
            reviewers: z.array(z.string()).optional().describe("List of usernames to request review from"),
            state: z.enum(["open", "closed"]).optional().describe("PR state"),
            base: z.string().optional().describe("The branch you want the changes pulled into"),
        },
        async ({ owner, repo, pull_number, title, body, assignees, reviewers, state, base }) => {
            const octokit = new Octokit({
                auth: process.env.GITHUB_TOKEN,
            });

            // Update PR details
            const updateParams: any = {
                owner,
                repo,
                pull_number,
            };

            if (title) updateParams.title = title;
            if (body) updateParams.body = body;
            if (state) updateParams.state = state;
            if (base) updateParams.base = base;

            const { data: pr } = await octokit.pulls.update(updateParams);

            // Update assignees if provided
            if (assignees) {
                await octokit.issues.addAssignees({
                    owner,
                    repo,
                    issue_number: pull_number,
                    assignees,
                });
            }

            // Update reviewers if provided
            if (reviewers) {
                await octokit.pulls.requestReviewers({
                    owner,
                    repo,
                    pull_number,
                    reviewers,
                });
            }

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
                                updated_at: pr.updated_at,
                                assignees: pr.assignees?.map(a => a.login),
                                requested_reviewers: pr.requested_reviewers?.map(r => r.login),
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