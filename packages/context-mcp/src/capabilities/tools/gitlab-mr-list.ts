import { ToolLike } from "./_typing.js";
import { z } from "zod";
import { Gitlab } from '@gitbeaker/rest';

export const installGitlabMrListTool: ToolLike = (installer) => {
    installer(
        "gitlab-mr-list",
        "List GitLab merge requests",
        {
            project_id: z.string().describe("GitLab project ID"),
            state: z.enum(['opened', 'closed', 'merged', 'locked']).optional().describe("MR state filter"),
            author_id: z.number().optional().describe("Filter by author ID"),
            assignee_id: z.number().optional().describe("Filter by assignee ID"),
            reviewer_id: z.number().optional().describe("Filter by reviewer ID"),
            labels: z.array(z.string()).optional().describe("Filter by labels"),
            search: z.string().optional().describe("Search in title and description"),
            created_after: z.string().optional().describe("Filter MRs created after date (ISO format)"),
            created_before: z.string().optional().describe("Filter MRs created before date (ISO format)"),
            updated_after: z.string().optional().describe("Filter MRs updated after date (ISO format)"),
            updated_before: z.string().optional().describe("Filter MRs updated before date (ISO format)"),
            sort: z.enum(['asc', 'desc']).optional().describe("Sort order (asc/desc)"),
            order_by: z.enum(['created_at', 'updated_at']).optional().describe("Order by field (created_at/updated_at)"),
            per_page: z.number().optional().describe("Number of results per page"),
            page: z.number().optional().describe("Page number"),
            token: z.string().describe("GitLab personal access token"),
            host: z.string().optional().describe("GitLab host URL (default: https://gitlab.com)"),
        },
        async (args, extra) => {
            const gitlab = new Gitlab({
                token: args.token,
                host: args.host || 'https://gitlab.com'
            });

            try {
                const mrs = await gitlab.MergeRequests.all({
                    projectId: args.project_id,
                    state: args.state,
                    authorId: args.author_id,
                    assigneeId: args.assignee_id,
                    reviewerId: args.reviewer_id,
                    labels: args.labels?.join(','),
                    search: args.search,
                    createdAfter: args.created_after,
                    createdBefore: args.created_before,
                    updatedAfter: args.updated_after,
                    updatedBefore: args.updated_before,
                    sort: args.sort,
                    orderBy: args.order_by,
                    perPage: args.per_page,
                    page: args.page
                });

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify((mrs as any[]).map((mr: any) => ({
                            id: mr.id,
                            iid: mr.iid,
                            title: mr.title,
                            description: mr.description,
                            state: mr.state,
                            web_url: mr.web_url,
                            created_at: mr.created_at,
                            updated_at: mr.updated_at,
                            merged_at: mr.merged_at,
                            closed_at: mr.closed_at,
                            author: mr.author,
                            assignees: mr.assignees,
                            reviewers: mr.reviewers,
                            labels: mr.labels,
                            source_branch: mr.source_branch,
                            target_branch: mr.target_branch,
                            merge_status: mr.merge_status,
                            merge_error: mr.merge_error,
                            has_conflicts: mr.has_conflicts,
                            blocking_discussions_resolved: mr.blocking_discussions_resolved
                        })), null, 2)
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Failed to list merge requests'}`
                    }],
                    isError: true
                };
            }
        }
    );
}; 