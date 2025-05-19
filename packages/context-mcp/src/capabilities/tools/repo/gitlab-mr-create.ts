import { ToolLike } from "../_typing.js";
import { z } from "zod";
import { Gitlab } from '@gitbeaker/rest';

export const installGitlabMrCreateTool: ToolLike = (installer) => {
    installer(
        "gitlab-mr-create",
        "Create a new GitLab merge request",
        {
            project_id: z.string().describe("GitLab project ID"),
            source_branch: z.string().describe("Source branch name"),
            target_branch: z.string().describe("Target branch name"),
            title: z.string().describe("MR title"),
            description: z.string().describe("MR description"),
            assignee_ids: z.array(z.number()).optional().describe("List of assignee user IDs"),
            reviewer_ids: z.array(z.number()).optional().describe("List of reviewer user IDs"),
            labels: z.array(z.string()).optional().describe("List of labels to apply"),
            token: z.string().describe("GitLab personal access token"),
            host: z.string().optional().describe("GitLab host URL (default: https://gitlab.com)"),
        },
        async (args, extra) => {
            const gitlab = new Gitlab({
                token: args.token,
                host: args.host || 'https://gitlab.com'
            });

            try {
                const mr = await gitlab.MergeRequests.create(
                    args.project_id,
                    args.source_branch,
                    args.target_branch,
                    args.title,
                    {
                        description: args.description,
                        assigneeIds: args.assignee_ids,
                        reviewerIds: args.reviewer_ids,
                        labels: args.labels?.join(',')
                    }
                );

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            id: mr.id,
                            iid: mr.iid,
                            title: mr.title,
                            web_url: mr.web_url,
                            state: mr.state,
                            created_at: mr.created_at,
                            updated_at: mr.updated_at
                        }, null, 2)
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Failed to create merge request'}`
                    }],
                    isError: true
                };
            }
        }
    );
}; 