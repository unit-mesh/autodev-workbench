import { PromptLike } from "./_typing.js";
import { z } from "zod";

type FileChange = {
    filename: string;
    content: string;
    additions: number;
    deletions: number;
    status: "added" | "modified" | "removed";
};

const fileChangeSchema = z.object({
    filename: z.string(),
    content: z.string(),
    additions: z.number(),
    deletions: z.number(),
    status: z.enum(["added", "modified", "removed"]),
});

export const installReviewPrPrompt: PromptLike = (installer) => {
    installer(
        "review-pr",
        "Review a pull request's code changes",
        {
            title: z.string().describe("PR title"),
            description: z.string().describe("PR description"),
            files: z.string().describe("JSON string of changed files"),
            base_branch: z.string().describe("Base branch name"),
            head_branch: z.string().describe("Head branch name"),
            author: z.string().describe("PR author username"),
        },
        async (args, extra) => {
            const files = JSON.parse(args.files || "[]") as FileChange[];
            const title = args.title || "";
            const description = args.description || "";
            const base_branch = args.base_branch || "";
            const head_branch = args.head_branch || "";
            const author = args.author || "";

            return {
                messages: [
                    {
                        role: "assistant",
                        content: {
                            type: "text",
                            text: `You are a senior software engineer performing a code review. Your task is to:
1. Review the code changes thoroughly
2. Check for potential bugs, security issues, and performance problems
3. Ensure code follows best practices and maintainability standards
4. Look for opportunities to improve code quality
5. Provide constructive feedback
6. Suggest specific improvements when needed

Focus on:
- Code correctness and logic
- Error handling and edge cases
- Code style and consistency
- Documentation and comments
- Test coverage
- Security considerations
- Performance implications
- Maintainability and readability`,
                        },
                    },
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Please review this Pull Request:

Title: ${title}
Author: ${author}
Base Branch: ${base_branch}
Head Branch: ${head_branch}

Description:
${description}

Changed Files:
${files.map((file: FileChange) => `
File: ${file.filename}
Status: ${file.status}
Changes: +${file.additions} -${file.deletions}
Content:
\`\`\`
${file.content}
\`\`\`
`).join('\n')}

Please provide a thorough code review focusing on:
1. Overall assessment of the changes
2. Specific issues or concerns
3. Suggestions for improvement
4. Security and performance considerations
5. Best practices and maintainability

Format your review in a clear, structured way with specific examples and actionable feedback.`,
                        },
                    },
                ],
            };
        }
    );
}; 