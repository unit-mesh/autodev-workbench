import { ToolLike } from "../_typing.js";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import type { RestEndpointMethodTypes } from "@octokit/rest";

type CommentResponse = RestEndpointMethodTypes["issues"]["createComment"]["response"]["data"];
type ReactionResponse = RestEndpointMethodTypes["reactions"]["createForIssueComment"]["response"]["data"];

export const installGithubPrCommentTool: ToolLike = (installer) => {
    installer(
        "github-pr-comment",
        "GitHub PR comment operations",
        {
            action: z.enum(["create", "list", "edit", "delete", "add_reaction"]).describe("Action to perform"),
            owner: z.string().describe("Repository owner"),
            repo: z.string().describe("Repository name"),
            pull_number: z.number().describe("PR number"),
            body: z.string().optional().describe("Comment content"),
            comment_id: z.number().optional().describe("Comment ID to operate on"),
            commit_id: z.string().optional().describe("Commit ID to comment on"),
            path: z.string().optional().describe("File path to comment on"),
            position: z.number().optional().describe("Line position in the file"),
            line: z.number().optional().describe("Line number in the file"),
            reaction: z.enum(["+1", "-1", "laugh", "confused", "heart", "hooray", "rocket", "eyes"]).optional().describe("Reaction to add"),
        },
        async (args) => {
            const { action, owner, repo, pull_number, body, comment_id, commit_id, path, position, line, reaction } = args;
            const octokit = new Octokit({
                auth: process.env.GITHUB_TOKEN,
            });

            let response: any;

            switch (action) {
                case "list":
                    // List all comments on a PR
                    const listResponse = await octokit.issues.listComments({
                        owner,
                        repo,
                        issue_number: pull_number,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(
                                    listResponse.data.map(comment => ({
                                        id: comment.id,
                                        body: comment.body,
                                        user: comment.user?.login,
                                        created_at: comment.created_at,
                                        updated_at: comment.updated_at,
                                        html_url: comment.html_url,
                                    })),
                                    null,
                                    2
                                ),
                            },
                        ],
                    };

                case "edit":
                    if (!comment_id || !body) {
                        throw new Error("Comment ID and body are required for editing");
                    }
                    response = await octokit.issues.updateComment({
                        owner,
                        repo,
                        comment_id,
                        body,
                    });
                    break;

                case "delete":
                    if (!comment_id) {
                        throw new Error("Comment ID is required for deletion");
                    }
                    await octokit.issues.deleteComment({
                        owner,
                        repo,
                        comment_id,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({ message: "Comment deleted successfully" }),
                            },
                        ],
                    };

                case "add_reaction":
                    if (!comment_id || !reaction) {
                        throw new Error("Comment ID and reaction are required for adding reactions");
                    }
                    response = await octokit.reactions.createForIssueComment({
                        owner,
                        repo,
                        comment_id,
                        content: reaction,
                    });
                    break;

                case "create":
                default:
                    // Reply to an existing comment
                    if (comment_id) {
                        response = await octokit.issues.createComment({
                            owner,
                            repo,
                            issue_number: pull_number,
                            body: body!,
                            in_reply_to: comment_id,
                        });
                    }
                    // Comment on a specific commit
                    else if (commit_id) {
                        response = await octokit.repos.createCommitComment({
                            owner,
                            repo,
                            commit_sha: commit_id,
                            body: body!,
                        });
                    }
                    // Comment on a specific file and line
                    else if (path && (position !== undefined || line !== undefined)) {
                        response = await octokit.pulls.createReview({
                            owner,
                            repo,
                            pull_number,
                            body: body!,
                            commit_id: commit_id,
                            path,
                            position,
                            line,
                        });
                    }
                    // Regular PR comment
                    else {
                        response = await octokit.issues.createComment({
                            owner,
                            repo,
                            issue_number: pull_number,
                            body: body!,
                        });
                    }
            }

            if (response) {
                const responseData = response.data as CommentResponse | ReactionResponse;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    id: responseData.id,
                                    body: 'body' in responseData ? responseData.body : undefined,
                                    user: responseData.user?.login,
                                    created_at: 'created_at' in responseData ? responseData.created_at : undefined,
                                    updated_at: 'updated_at' in responseData ? responseData.updated_at : undefined,
                                    html_url: 'html_url' in responseData ? responseData.html_url : undefined,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ message: "Operation completed successfully" }),
                    },
                ],
            };
        }
    );
}; 