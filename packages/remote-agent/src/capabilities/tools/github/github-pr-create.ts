import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { ToolLike } from '../../_typing.js';

/**
 * Install GitHub PR Create Tool
 */
export const installGitHubPrCreateTool: ToolLike = (installer) => {
  installer(
    "github-pr-create",
    "Create a new pull request in a GitHub repository with custom title, description, source/target branches, and draft status",
    {
      title: z.string().describe('The title of the pull request'),
      body: z.string().describe('The body/description of the pull request'),
      head: z.string().describe('The name of the branch where your changes are implemented (e.g., "feature/issue-123")'),
      base: z.string().default('main').describe('The name of the branch you want the changes pulled into (default: "main")'),
      draft: z.boolean().default(false).describe('Whether to create the PR as a draft'),
      repository: z.string().optional().describe('Repository in format "owner/repo" (optional, will use current repo if not specified)')
    },
    async ({
      title,
      body,
      head,
      base = 'main',
      draft = false,
      repository
    }: {
      title: string;
      body: string;
      head: string;
      base?: string;
      draft?: boolean;
      repository?: string;
    }) => {

    try {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        throw new Error('GITHUB_TOKEN environment variable is required');
      }

      const octokit = new Octokit({
        auth: githubToken,
      });

      // Determine repository owner and name
      let owner: string;
      let repo: string;

      if (repository) {
        [owner, repo] = repository.split('/');
        if (!owner || !repo) {
          throw new Error('Repository must be in format "owner/repo"');
        }
      } else {
        // Try to get repository info from git remote
        const { execSync } = await import('child_process');
        try {
          const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
          const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
          if (match) {
            owner = match[1];
            repo = match[2];
          } else {
            throw new Error('Could not parse GitHub repository from git remote');
          }
        } catch (error) {
          throw new Error('Could not determine repository. Please specify repository parameter or ensure you are in a git repository with GitHub remote.');
        }
      }

      console.log(`Creating PR in ${owner}/${repo}: ${head} -> ${base}`);

      // Create the pull request
      const response = await octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
        draft
      });

      const pr = response.data;

      return {
        content: [
          {
            type: "text",
            text: `✅ Successfully created pull request #${pr.number}: ${pr.title}

📋 **PR Details:**
- **URL**: ${pr.html_url}
- **Repository**: ${owner}/${repo}
- **Branch Mapping**: ${head} → ${base}
- **Status**: ${draft ? 'Draft' : 'Ready for review'}
- **Created**: ${pr.created_at}
- **Author**: ${pr.user?.login}

🔗 **Direct Link**: ${pr.html_url}

The pull request has been successfully created and is now available for review. ${draft ? 'Since this is a draft PR, remember to mark it as ready for review when you\'re done making changes.' : 'The PR is ready for review and can be merged once approved.'}`
          }
        ]
      };

    } catch (error) {
      console.error('Error creating GitHub PR:', error);
      
      let errorMessage = 'Unknown error occurred';
      let errorDetails = {};

      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific GitHub API errors
        if ('status' in error) {
          const status = (error as any).status;
          switch (status) {
            case 401:
              errorMessage = 'Authentication failed. Please check your GITHUB_TOKEN.';
              break;
            case 403:
              errorMessage = 'Permission denied. The token may not have sufficient permissions.';
              break;
            case 404:
              errorMessage = 'Repository not found or not accessible.';
              break;
            case 422:
              errorMessage = 'Validation failed. Check branch names and repository access.';
              errorDetails = {
                common_issues: [
                  'Head branch does not exist',
                  'Base branch does not exist', 
                  'Pull request already exists for this branch',
                  'Invalid repository name'
                ]
              };
              break;
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to create GitHub pull request: ${errorMessage}

🔧 **Troubleshooting Steps:**
1. **Check GitHub Token**: Ensure GITHUB_TOKEN is set and has repo permissions
2. **Verify Branches**: Confirm both head (${head}) and base (${base}) branches exist
3. **Check Repository**: Verify repository access and permissions
4. **Existing PR**: Check if a PR already exists for this branch

${Object.keys(errorDetails).length > 0 ? `\n📋 **Additional Details:**\n${JSON.stringify(errorDetails, null, 2)}` : ''}

💡 **Common Issues:**
- Head branch does not exist in the repository
- Base branch does not exist in the repository
- Pull request already exists for this branch combination
- Insufficient permissions on the repository
- Invalid repository name format`
          }
        ]
      };
    }
  });
};
