import { ToolLike } from "../_typing.js";
import { z } from "zod";
import { Gitlab } from '@gitbeaker/rest';

export const installGitlabMrUpdateTool: ToolLike = (installer) => {
    installer(
        "gitlab-mr-update",
        "Update an existing GitLab merge request",
        {
            project_id: z.string().describe("GitLab project ID"),
            mr_iid: z.number().describe("Merge request IID"),
            title: z.string().optional().describe("New MR title"),
            description: z.string().optional().describe("New MR description"),
            assignee_ids: z.array(z.number()).optional().describe("List of assignee user IDs"),
            reviewer_ids: z.array(z.number()).optional().describe("List of reviewer user IDs"),
            labels: z.array(z.string()).optional().describe("List of labels to apply"),
            state_event: z.enum(['close', 'reopen']).optional().describe("State event to perform"),
            token: z.string().describe("GitLab personal access token"),
            host: z.string().optional().describe("GitLab host URL (default: https://gitlab.com)"),
        },
        async (args, extra) => {
            const gitlab = new Gitlab({
                token: args.token,
                host: args.host || 'https://gitlab.com'
            });

            try {
                const mr = await gitlab.MergeRequests.edit(
                    args.project_id,
                    args.mr_iid,
                    {
                        title: args.title,
                        description: args.description,
                        assigneeIds: args.assignee_ids,
                        reviewerIds: args.reviewer_ids,
                        labels: args.labels?.join(','),
                        stateEvent: args.state_event
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
                            updated_at: mr.updated_at
                        }, null, 2)
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Failed to update merge request'}`
                    }],
                    isError: true
                };
            }
        }
    );
}; 