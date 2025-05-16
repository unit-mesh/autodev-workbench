# MCP Tools

This is a collection of tools that can be used to extend the capabilities of the MCP server.

## GitHub PR Tools

### PR Operations
- `github-pr-create`: Create a new pull request
- `github-pr-update`: Update an existing pull request (title, description, assignees, reviewers)
- `github-pr-merge`: Merge a pull request
- `github-pr-close`: Close a pull request
- `github-pr-reopen`: Reopen a closed pull request

### PR Comments
- `github-pr-comment`: Manage PR comments
  - Add new comments
  - Reply to existing comments
  - Edit comments
  - Delete comments
  - Add emoji reactions
  - View all comments

### PR Review
- `review-pr-github`: Generate a comprehensive code review as a GitHub comment
  - Markdown formatted review
  - Code block syntax highlighting
  - Task lists for actionable items
  - Emoji reactions for different types of feedback
  - Line references
  - User mentions
  - Collapsible sections for long reviews

## GitLab MR Tools

### MR Operations
- `gitlab-mr-create`: Create a new merge request
  - Set title, description
  - Assign reviewers and assignees
  - Add labels
  - Configure source and target branches

- `gitlab-mr-update`: Update an existing merge request
  - Modify title and description
  - Update assignees and reviewers
  - Change labels
  - Close or reopen MR

- `gitlab-mr-list`: List merge requests with filtering options
  - Filter by state (opened, closed, merged)
  - Filter by author, assignee, or reviewer
  - Filter by labels
  - Search in title and description
  - Filter by creation/update dates
  - Sort and pagination support

### MR Comments
- `gitlab-mr-comment`: Manage MR comments
  - Add new comments
  - Create inline comments
  - Reply to existing comments
  - Edit comments
  - Delete comments
  - List all comments

## Usage

Each tool can be used independently and supports various parameters for customization. See individual tool documentation for detailed usage instructions.

Note: GitLab tools require a personal access token with appropriate permissions.

