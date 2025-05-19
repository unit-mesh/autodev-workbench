import { ToolLike } from "../_typing.js";
import { z } from "zod";
import { Gitlab } from '@gitbeaker/rest';

export const installGitlabMrCommentTool: ToolLike = (installer) => {
    installer(
        "gitlab-mr-comment",
        "Manage GitLab merge request comments",
        {
            project_id: z.string().describe("GitLab project ID"),
            mr_iid: z.number().describe("Merge request IID"),
            action: z.enum(['create', 'edit', 'delete', 'list', 'reply']).describe("Action to perform"),
            comment_id: z.number().optional().describe("Comment ID (required for edit/delete/reply)"),
            discussion_id: z.string().optional().describe("Discussion ID (required for reply)"),
            note: z.string().optional().describe("Comment content"),
            position: z.object({
                base_sha: z.string(),
                start_sha: z.string(),
                head_sha: z.string(),
                old_path: z.string(),
                new_path: z.string(),
                position_type: z.enum(['text', 'image']),
                old_line: z.number().optional(),
                new_line: z.number()
            }).optional().describe("Position for inline comment"),
            token: z.string().describe("GitLab personal access token"),
            host: z.string().optional().describe("GitLab host URL (default: https://gitlab.com)"),
        },
        async (args, extra) => {
            const gitlab = new Gitlab({
                token: args.token,
                host: args.host || 'https://gitlab.com'
            });

            try {
                switch (args.action) {
                    case 'create': {
                        if (!args.note) throw new Error('note is required');
                        const options: any = { note: args.note };
                        if (args.position) options.position = args.position;
                        const comment = await gitlab.MergeRequestNotes.create(args.project_id, args.mr_iid, options);
                        return {
                            content: [{
                                type: "text",
                                text: JSON.stringify({
                                    id: comment.id,
                                    note: comment.body,
                                    created_at: comment.created_at
                                }, null, 2)
                            }]
                        };
                    }
                    case 'edit': {
                        if (!args.comment_id || !args.note) throw new Error('comment_id and note are required for edit');
                        const editedComment = await gitlab.MergeRequestNotes.edit(args.project_id, args.mr_iid, args.comment_id, { body: args.note });
                        return {
                            content: [{
                                type: "text",
                                text: JSON.stringify({
                                    id: editedComment.id,
                                    note: editedComment.body,
                                    updated_at: editedComment.updated_at
                                }, null, 2)
                            }]
                        };
                    }
                    case 'delete': {
                        if (!args.comment_id) throw new Error('comment_id is required for delete');
                        await gitlab.MergeRequestNotes.remove(args.project_id, args.mr_iid, args.comment_id);
                        return {
                            content: [{
                                type: "text",
                                text: 'Comment deleted successfully'
                            }]
                        };
                    }
                    case 'reply': {
                        if (!args.discussion_id || !args.note) throw new Error('discussion_id and note are required for reply');
                        // TODO: check if note is a number, suspicious
                        const reply = await gitlab.MergeRequestDiscussions.addNote(args.project_id, args.mr_iid, args.discussion_id as any, Number(args.note), "");
                        return {
                            content: [{
                                type: "text",
                                text: JSON.stringify({
                                    id: reply.id,
                                    note: reply.body,
                                    created_at: reply.created_at
                                }, null, 2)
                            }]
                        };
                    }
                    case 'list': {
                        const comments = await gitlab.MergeRequestNotes.all(args.project_id, args.mr_iid);
                        return {
                            content: [{
                                type: "text",
                                text: JSON.stringify((comments as any[]).map(comment => ({
                                    id: comment.id,
                                    note: comment.body,
                                    created_at: comment.created_at,
                                    updated_at: comment.updated_at,
                                    author: comment.author
                                })), null, 2)
                            }]
                        };
                    }
                    default:
                        throw new Error('Invalid action');
                }
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Failed to perform comment action'}`
                    }],
                    isError: true
                };
            }
        }
    );
}; 