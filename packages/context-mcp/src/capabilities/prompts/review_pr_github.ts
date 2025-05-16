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

export const installReviewPrGithubPrompt: PromptLike = (installer) => {
    installer(
        "review-pr-github",
        "Review a GitHub pull request and generate a markdown formatted comment",
        {
            title: z.string().describe("PR title"),
            description: z.string().describe("PR description"),
            files: z.string().describe("JSON string of changed files"),
            base_branch: z.string().describe("Base branch name"),
            head_branch: z.string().describe("Head branch name"),
            author: z.string().describe("PR author username"),
            pr_number: z.string().describe("PR number"),
            repo: z.string().describe("Repository name"),
            owner: z.string().describe("Repository owner"),
        },
        async (args, extra) => {
            const files = JSON.parse(args.files || "[]") as FileChange[];
            const title = args.title || "";
            const description = args.description || "";
            const base_branch = args.base_branch || "";
            const head_branch = args.head_branch || "";
            const author = args.author || "";
            const pr_number = args.pr_number;
            const repo = args.repo || "";
            const owner = args.owner || "";

            return {
                messages: [
                    {
                        role: "assistant",
                        content: {
                            type: "text",
                            text: `You are a senior software engineer performing a code review on GitHub. Your task is to:
1. Review the code changes thoroughly
2. Check for potential bugs, security issues, and performance problems
3. Ensure code follows best practices and maintainability standards
4. Look for opportunities to improve code quality
5. Provide constructive feedback
6. Suggest specific improvements when needed

Your review will be posted as a GitHub comment, so please:
1. Use proper markdown formatting
2. Use GitHub-specific features like:
   - Code blocks with language specification
   - Task lists
   - Emojis for different types of feedback
   - References to specific lines using \`#L<number>\`
   - Mentions using @username
3. Structure your review with clear sections
4. Use appropriate GitHub markdown elements for better readability

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
                            text: `Please review this GitHub Pull Request:

Title: ${title}
Author: @${author}
PR: #${pr_number}
Repository: ${owner}/${repo}
Base Branch: ${base_branch}
Head Branch: ${head_branch}

Description:
${description}

Changed Files:
${files.map((file: FileChange) => `
### File: \`${file.filename}\`
**Status:** ${file.status}
**Changes:** +${file.additions} -${file.deletions}

\`\`\`${getFileExtension(file.filename)}
${file.content}
\`\`\`
`).join('\n')}

Please provide a thorough code review focusing on:
1. Overall assessment of the changes
2. Specific issues or concerns
3. Suggestions for improvement
4. Security and performance considerations
5. Best practices and maintainability

Format your review as a GitHub comment with:
- Clear section headers using markdown
- Code blocks with proper language specification
- Task lists for actionable items
- Emojis for different types of feedback (e.g., 🐛 for bugs, 💡 for suggestions)
- References to specific lines when needed
- Proper mentions using @username
- Collapsible sections for long reviews using <details> tags

Make sure your review is:
- Clear and concise
- Actionable and specific
- Professional and constructive
- Well-formatted and easy to read
- Focused on both high-level and detailed aspects`,
                        },
                    },
                ],
            };
        }
    );
};

function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
        const ext = parts[parts.length - 1].toLowerCase();
        // Map common file extensions to language identifiers
        const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'jsx',
            'tsx': 'tsx',
            'py': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'rb': 'ruby',
            'php': 'php',
            'swift': 'swift',
            'kt': 'kotlin',
            'rs': 'rust',
            'sh': 'bash',
            'md': 'markdown',
            'json': 'json',
            'yaml': 'yaml',
            'yml': 'yaml',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'sql': 'sql',
        };
        return languageMap[ext] || ext;
    }
    return '';
} 