## 0.7.1 (2025-06-19)

This was a version bump only, there were no code changes.

## 0.7.0 (2025-06-19)

### 🚀 Features

- add caching and performance optimizations for project context analysis ([4445620](https://github.com/unit-mesh/autodev-workbench/commit/4445620))
- integrate ProjectDetector for enhanced project information collection ([75d89d3](https://github.com/unit-mesh/autodev-workbench/commit/75d89d3))
- implement GlobalProcessManager and process management tools for enhanced process handling ([dea114a](https://github.com/unit-mesh/autodev-workbench/commit/dea114a))
- add kill process tool for terminating processes by terminal ID ([ed444a2](https://github.com/unit-mesh/autodev-workbench/commit/ed444a2))
- optimize FeatureRequestPlaybook with Augment Agent design principles ([29f9c5f](https://github.com/unit-mesh/autodev-workbench/commit/29f9c5f))
- migrate AIAgent from PromptBuilder to IssueAnalysisPlaybook ([#105](https://github.com/unit-mesh/autodev-workbench/issues/105))
- update test-feature-request.js for automated feature request implementation ([c144a32](https://github.com/unit-mesh/autodev-workbench/commit/c144a32))
- improve FeatureRequestPlaybook for automated code modification ([82e35ad](https://github.com/unit-mesh/autodev-workbench/commit/82e35ad))
- enhance test-feature-request.js for improved automated feature analysis and PR generation ([24a6211](https://github.com/unit-mesh/autodev-workbench/commit/24a6211))
- enhance README.md with Cascade core optimization and planning capabilities ([4dbb2d9](https://github.com/unit-mesh/autodev-workbench/commit/4dbb2d9))
- update README.md to enhance tool descriptions and planning capabilities ([55cddb3](https://github.com/unit-mesh/autodev-workbench/commit/55cddb3))
- enhance README.md with updated tool capabilities and task management features ([d3b801f](https://github.com/unit-mesh/autodev-workbench/commit/d3b801f))
- add HTML entity decoding to str-replace-editor and write-file tools ([43c31e1](https://github.com/unit-mesh/autodev-workbench/commit/43c31e1))
- init basic code for datastcuture ([1cfcdde](https://github.com/unit-mesh/autodev-workbench/commit/1cfcdde))
- **playbook:** improve feature request implementation process ([c94fd82](https://github.com/unit-mesh/autodev-workbench/commit/c94fd82))

### 🩹 Fixes

- fix tets ([4cab1a0](https://github.com/unit-mesh/autodev-workbench/commit/4cab1a0))
- improve keyword generation logic to focus on conceptual terms ([#105](https://github.com/unit-mesh/autodev-workbench/issues/105))
- update test-feature-request.js to accept issue ID like quick-test-agent ([#105](https://github.com/unit-mesh/autodev-workbench/issues/105))
- **github:** improve issueNumber parameter alias ([3a6c611](https://github.com/unit-mesh/autodev-workbench/commit/3a6c611))

### ❤️ Thank You

- Fengda Huang @phodal
- Phodal Huang @phodal

## 0.6.3 (2025-06-15)

### 🚀 Features

- integrate LLMLogger for enhanced logging in analysis tools ([49d063c](https://github.com/unit-mesh/autodev-workbench/commit/49d063c))
- integrate ProjectContextAnalyzer into system prompt for round 1 ([c6b88d7](https://github.com/unit-mesh/autodev-workbench/commit/c6b88d7))
- **github-analysis:** enhance GitHub issue analysis tool with project context and analysis scope options ([70df41e](https://github.com/unit-mesh/autodev-workbench/commit/70df41e))
- **index, tools:** add fetch content with summary tool export ([f6558ac](https://github.com/unit-mesh/autodev-workbench/commit/f6558ac))
- **project-memory:** implement conversation summary saving to markdown ([dee2386](https://github.com/unit-mesh/autodev-workbench/commit/dee2386))
- **project-memory:** categorize memories and improve formatting ([418d20d](https://github.com/unit-mesh/autodev-workbench/commit/418d20d))
- **remote-agent:** enable Enhanced Intelligence Tools ([64cb4bb](https://github.com/unit-mesh/autodev-workbench/commit/64cb4bb))
- **remote-agent:** add GitHub URL transformation for raw content ([fad80c3](https://github.com/unit-mesh/autodev-workbench/commit/fad80c3))
- **web-fetch-content:** add HTML content detection and improve URL fetching logic ([8332398](https://github.com/unit-mesh/autodev-workbench/commit/8332398))

### 🩹 Fixes

- fix tests ([93b8be4](https://github.com/unit-mesh/autodev-workbench/commit/93b8be4))
- **index:** reintroduce extractTitle export from markdown-utils ([1845735](https://github.com/unit-mesh/autodev-workbench/commit/1845735))
- **llm-logger:** update log file path and ensure log directory exists ([2e596bd](https://github.com/unit-mesh/autodev-workbench/commit/2e596bd))
- **markdown-utils:** update cheerio import to use the main package ([274e650](https://github.com/unit-mesh/autodev-workbench/commit/274e650))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.6.2 (2025-06-12)

### 🚀 Features

- add terminal command and str replace editor ([50bc69a](https://github.com/unit-mesh/autodev-workbench/commit/50bc69a))
- implement plan-driven architecture for GitHub Agent ([3e87801](https://github.com/unit-mesh/autodev-workbench/commit/3e87801))
- add GitHub Agent tool design specifications ([c52a982](https://github.com/unit-mesh/autodev-workbench/commit/c52a982))
- enhance PromptBuilder with adaptive strategies and context-aware prompting ([8bf1ffc](https://github.com/unit-mesh/autodev-workbench/commit/8bf1ffc))
- enhance PlanDrivenAgent with optional configuration parameters and improved planning capabilities ([fd58ca9](https://github.com/unit-mesh/autodev-workbench/commit/fd58ca9))
- **codebase-scanner:** enhance file scanning and project structure retrieval ([7a6a839](https://github.com/unit-mesh/autodev-workbench/commit/7a6a839))
- **codebase-scanner, insight-generator, project-info-analyzer:** add codebase scanning and insight generation features ([92c4b98](https://github.com/unit-mesh/autodev-workbench/commit/92c4b98))
- **llm:** implement services for analysis report, code relevance, and keyword extraction ([258f815](https://github.com/unit-mesh/autodev-workbench/commit/258f815))
- **tests:** add Jest setup and integration tests for ProjectContextAnalyzer ([4e9cd53](https://github.com/unit-mesh/autodev-workbench/commit/4e9cd53))
- **tool-executor:** add parallel execution, performance monitoring, and intelligent caching ([b04f063](https://github.com/unit-mesh/autodev-workbench/commit/b04f063))

### 🩹 Fixes

- **remote-agent:** fix typo in function name ([0bb1e80](https://github.com/unit-mesh/autodev-workbench/commit/0bb1e80))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.6.1 (2025-06-11)

This was a version bump only, there were no code changes.

## 0.6.0 (2025-06-11)

### 🚀 Features

- **LLMAnalysisStrategy:** enhance advanced filtering with fallback strategy and informative comments ([e93c5ff](https://github.com/unit-mesh/autodev-worker/commit/e93c5ff))
- **agent:** add function calling capabilities ([8b72501](https://github.com/unit-mesh/autodev-worker/commit/8b72501))
- **agent:** add function calling capabilities ([a81e026](https://github.com/unit-mesh/autodev-worker/commit/a81e026))
- **agent:** implement label-triggered analysis workflow for GitHub issues ([ff6f0f9](https://github.com/unit-mesh/autodev-worker/commit/ff6f0f9))
- **agent:** enhance issue analysis by fetching and analyzing URL content from issue body ([9c5bbee](https://github.com/unit-mesh/autodev-worker/commit/9c5bbee))
- **remote-agent:** enhance tool chaining for comprehensive analysis ([01d9ca0](https://github.com/unit-mesh/autodev-worker/commit/01d9ca0))
- **remote-agent:** support markdown-wrapped function calls ([86d2307](https://github.com/unit-mesh/autodev-worker/commit/86d2307))
- **remote-agent:** disable file search and rename tools export ([0ae9fba](https://github.com/unit-mesh/autodev-worker/commit/0ae9fba))
- **remote-agent:** disable file search and rename tools export ([41b6607](https://github.com/unit-mesh/autodev-worker/commit/41b6607))
- **remote-agent:** enhance GitHub issue analysis tool description and guidelines ([372bbfd](https://github.com/unit-mesh/autodev-worker/commit/372bbfd))
- **remote-agent:** add auto-upload option for GitHub issue analysis results ([5867c2a](https://github.com/unit-mesh/autodev-worker/commit/5867c2a))
- **remote-agent:** refactor comment generation for GitHub analysis results ([670ba86](https://github.com/unit-mesh/autodev-worker/commit/670ba86))
- **remote-agent:** simplify context analysis tool and add centralized exports ([f092e91](https://github.com/unit-mesh/autodev-worker/commit/f092e91))
- **remote-agent:** add WebSearch tool with multi-engine support and error handling ([eabd383](https://github.com/unit-mesh/autodev-worker/commit/eabd383))
- **quick-test-agent:** add quick test script for agent functionality validation ([8ced431](https://github.com/unit-mesh/autodev-worker/commit/8ced431))
- **rip-grep:** implement output truncation for results exceeding character limit ([8255638](https://github.com/unit-mesh/autodev-worker/commit/8255638))
- **terminal:** enhance terminal command execution security - Add command whitelist, dangerous chars check, symlink check, env filtering, and improved process management ([1de04e5](https://github.com/unit-mesh/autodev-worker/commit/1de04e5))

### 🩹 Fixes

- improve GitHub agent LLM analysis strategy for documentation issues ([#98](https://github.com/unit-mesh/autodev-worker/issues/98))
- **remote-agent:** exclude GitHub analyze issue tool from tool imports ([ccafd84](https://github.com/unit-mesh/autodev-worker/commit/ccafd84))
- **remote-agent:** exclude GitHub analyze issue tool from tool imports ([5e92ad3](https://github.com/unit-mesh/autodev-worker/commit/5e92ad3))
- **remote-agent:** improve console logging ([8682b6b](https://github.com/unit-mesh/autodev-worker/commit/8682b6b))
- **tools/terminal-run-command:** robust process management, cross-platform test compatibility, and eliminate kill ESRCH error\n\n- Allow absolute path for whitelisted commands (e.g., node)\n- Remove dangerous chars that block valid node -e code\n- Use childProcess.kill and event cleanup to avoid kill ESRCH\n- Make tests fully cross-platform and stable\n- All security and functional tests pass ([83a4dfe](https://github.com/unit-mesh/autodev-worker/commit/83a4dfe))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.5.2 (2025-06-11)

### 🚀 Features

- **terminal:** enhance terminal command execution security - Add command whitelist, dangerous chars check, symlink check, env filtering, and improved process management ([1de04e5](https://github.com/unit-mesh/autodev-worker/commit/1de04e5))

### 🩹 Fixes

- **tools/terminal-run-command:** robust process management, cross-platform test compatibility, and eliminate kill ESRCH error\n\n- Allow absolute path for whitelisted commands (e.g., node)\n- Remove dangerous chars that block valid node -e code\n- Use childProcess.kill and event cleanup to avoid kill ESRCH\n- Make tests fully cross-platform and stable\n- All security and functional tests pass ([83a4dfe](https://github.com/unit-mesh/autodev-worker/commit/83a4dfe))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.5.1 (2025-06-11)

### 🚀 Features

- **LLMAnalysisStrategy:** enhance advanced filtering with fallback strategy and informative comments ([e93c5ff](https://github.com/unit-mesh/autodev-worker/commit/e93c5ff))
- **agent:** add function calling capabilities ([8b72501](https://github.com/unit-mesh/autodev-worker/commit/8b72501))
- **agent:** add function calling capabilities ([a81e026](https://github.com/unit-mesh/autodev-worker/commit/a81e026))
- **agent:** implement label-triggered analysis workflow for GitHub issues ([ff6f0f9](https://github.com/unit-mesh/autodev-worker/commit/ff6f0f9))
- **agent:** enhance issue analysis by fetching and analyzing URL content from issue body ([9c5bbee](https://github.com/unit-mesh/autodev-worker/commit/9c5bbee))
- **remote-agent:** enhance tool chaining for comprehensive analysis ([01d9ca0](https://github.com/unit-mesh/autodev-worker/commit/01d9ca0))
- **remote-agent:** support markdown-wrapped function calls ([86d2307](https://github.com/unit-mesh/autodev-worker/commit/86d2307))
- **remote-agent:** disable file search and rename tools export ([0ae9fba](https://github.com/unit-mesh/autodev-worker/commit/0ae9fba))
- **remote-agent:** disable file search and rename tools export ([41b6607](https://github.com/unit-mesh/autodev-worker/commit/41b6607))
- **remote-agent:** enhance GitHub issue analysis tool description and guidelines ([372bbfd](https://github.com/unit-mesh/autodev-worker/commit/372bbfd))
- **remote-agent:** add auto-upload option for GitHub issue analysis results ([5867c2a](https://github.com/unit-mesh/autodev-worker/commit/5867c2a))
- **remote-agent:** refactor comment generation for GitHub analysis results ([670ba86](https://github.com/unit-mesh/autodev-worker/commit/670ba86))
- **remote-agent:** simplify context analysis tool and add centralized exports ([f092e91](https://github.com/unit-mesh/autodev-worker/commit/f092e91))
- **remote-agent:** add WebSearch tool with multi-engine support and error handling ([eabd383](https://github.com/unit-mesh/autodev-worker/commit/eabd383))
- **quick-test-agent:** add quick test script for agent functionality validation ([8ced431](https://github.com/unit-mesh/autodev-worker/commit/8ced431))
- **rip-grep:** implement output truncation for results exceeding character limit ([8255638](https://github.com/unit-mesh/autodev-worker/commit/8255638))

### 🩹 Fixes

- improve GitHub agent LLM analysis strategy for documentation issues ([#98](https://github.com/unit-mesh/autodev-worker/issues/98))
- **remote-agent:** exclude GitHub analyze issue tool from tool imports ([ccafd84](https://github.com/unit-mesh/autodev-worker/commit/ccafd84))
- **remote-agent:** exclude GitHub analyze issue tool from tool imports ([5e92ad3](https://github.com/unit-mesh/autodev-worker/commit/5e92ad3))
- **remote-agent:** improve console logging ([8682b6b](https://github.com/unit-mesh/autodev-worker/commit/8682b6b))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.5.0 (2025-06-09)

### 🚀 Features

- add TypeScript configuration for remote-agent-action ([4d786d2](https://github.com/unit-mesh/autodev-worker/commit/4d786d2))
- add remote-agent-action package for automated issue analysis ([1c37f25](https://github.com/unit-mesh/autodev-worker/commit/1c37f25))
- add reopened event trigger for easier testing ([456290b](https://github.com/unit-mesh/autodev-worker/commit/456290b))
- add reopened event trigger and fix build issues ([dd346e0](https://github.com/unit-mesh/autodev-worker/commit/dd346e0))
- add remote-agent and remote-agent-action to CI/CD pipeline ([c5dd5b6](https://github.com/unit-mesh/autodev-worker/commit/c5dd5b6))
- replace fixed comment templates with LLM-generated content ([5172897](https://github.com/unit-mesh/autodev-worker/commit/5172897))

### 🩹 Fixes

- resolve pnpm installation issue in GitHub Actions workflow ([ab1c6c6](https://github.com/unit-mesh/autodev-worker/commit/ab1c6c6))
- build workspace dependencies in correct order ([5513a3d](https://github.com/unit-mesh/autodev-worker/commit/5513a3d))
- use pnpm filter build order matching ci-cd.yml ([c6f3b32](https://github.com/unit-mesh/autodev-worker/commit/c6f3b32))
- resolve runtime dependency issues for remote-agent-action ([15823ed](https://github.com/unit-mesh/autodev-worker/commit/15823ed))
- add LLM API key inputs to GitHub Action ([9ee2811](https://github.com/unit-mesh/autodev-worker/commit/9ee2811))
- refactor IssueAnalyzer to directly use remote-agent logic ([e69ec9f](https://github.com/unit-mesh/autodev-worker/commit/e69ec9f))
- use actual agent analysis text in GitHub comments ([9f9ec22](https://github.com/unit-mesh/autodev-worker/commit/9f9ec22))
- use actual remote-agent modules instead of reimplementing analysis ([96c2320](https://github.com/unit-mesh/autodev-worker/commit/96c2320))
- bump version to 0.1.2 in package.json ([c4f2dad](https://github.com/unit-mesh/autodev-worker/commit/c4f2dad))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.4.3 (2025-06-09)

This was a version bump only, there were no code changes.

## 0.4.2 (2025-06-09)

### 🚀 Features

- add TypeScript configuration for remote-agent-action ([4d786d2](https://github.com/unit-mesh/autodev-worker/commit/4d786d2))
- add remote-agent-action package for automated issue analysis ([1c37f25](https://github.com/unit-mesh/autodev-worker/commit/1c37f25))
- add reopened event trigger for easier testing ([456290b](https://github.com/unit-mesh/autodev-worker/commit/456290b))
- add reopened event trigger and fix build issues ([dd346e0](https://github.com/unit-mesh/autodev-worker/commit/dd346e0))
- add remote-agent and remote-agent-action to CI/CD pipeline ([c5dd5b6](https://github.com/unit-mesh/autodev-worker/commit/c5dd5b6))
- replace fixed comment templates with LLM-generated content ([5172897](https://github.com/unit-mesh/autodev-worker/commit/5172897))

### 🩹 Fixes

- resolve pnpm installation issue in GitHub Actions workflow ([ab1c6c6](https://github.com/unit-mesh/autodev-worker/commit/ab1c6c6))
- build workspace dependencies in correct order ([5513a3d](https://github.com/unit-mesh/autodev-worker/commit/5513a3d))
- use pnpm filter build order matching ci-cd.yml ([c6f3b32](https://github.com/unit-mesh/autodev-worker/commit/c6f3b32))
- resolve runtime dependency issues for remote-agent-action ([15823ed](https://github.com/unit-mesh/autodev-worker/commit/15823ed))
- add LLM API key inputs to GitHub Action ([9ee2811](https://github.com/unit-mesh/autodev-worker/commit/9ee2811))
- refactor IssueAnalyzer to directly use remote-agent logic ([e69ec9f](https://github.com/unit-mesh/autodev-worker/commit/e69ec9f))
- use actual agent analysis text in GitHub comments ([9f9ec22](https://github.com/unit-mesh/autodev-worker/commit/9f9ec22))
- use actual remote-agent modules instead of reimplementing analysis ([96c2320](https://github.com/unit-mesh/autodev-worker/commit/96c2320))
- bump version to 0.1.2 in package.json ([c4f2dad](https://github.com/unit-mesh/autodev-worker/commit/c4f2dad))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.4.1 (2025-06-08)

### 🚀 Features

- **agent:** add dotenv config for environment variables ([7bbeecf](https://github.com/unit-mesh/autodev-worker/commit/7bbeecf))
- **agent:** add dotenv config for environment variables ([09ec5f1](https://github.com/unit-mesh/autodev-worker/commit/09ec5f1))
- **agent:** enhance AI agent with tool chaining support ([5418d0a](https://github.com/unit-mesh/autodev-worker/commit/5418d0a))
- **analysis:** integrate SymbolAnalyser with rule-based strategy ([75fe694](https://github.com/unit-mesh/autodev-worker/commit/75fe694))
- **context-worker:** add multi-format build support ([8cb98f5](https://github.com/unit-mesh/autodev-worker/commit/8cb98f5))
- **remote-agent:** add autonomous AI Agent with CLI ([#123](https://github.com/unit-mesh/autodev-worker/issues/123))
- **remote-agent:** add JSON fallback parsing and improve function call format ([9f67dc2](https://github.com/unit-mesh/autodev-worker/commit/9f67dc2))
- **remote-agent:** add issue creation and reorganize tools ([391c140](https://github.com/unit-mesh/autodev-worker/commit/391c140))
- **llm:** add file priority-based analysis optimization ([0b4414b](https://github.com/unit-mesh/autodev-worker/commit/0b4414b))
- **llm:** add file priority-based analysis optimization ([ae0670e](https://github.com/unit-mesh/autodev-worker/commit/ae0670e))
- **platform:** add multi-platform abstraction layer ([255607a](https://github.com/unit-mesh/autodev-worker/commit/255607a))
- **tests:** add comprehensive test suite for GitHub Agent functionality ([a20b17e](https://github.com/unit-mesh/autodev-worker/commit/a20b17e))
- **tools:** implement new MCP tool system with registry ([6e8bf78](https://github.com/unit-mesh/autodev-worker/commit/6e8bf78))
- **tools:** expand toolset with file system, terminal, code analysis, and planning tools ([a456028](https://github.com/unit-mesh/autodev-worker/commit/a456028))

### 🩹 Fixes

- **remote-agent:** fix syntax error in fs-delete-file tool ([dbcba3e](https://github.com/unit-mesh/autodev-worker/commit/dbcba3e))
- **llm-provider:** correct provider priority order and update model configurations ([fadbf01](https://github.com/unit-mesh/autodev-worker/commit/fadbf01))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.4.0 (2025-06-07)

### 🚀 Features

- **ai-hub:** refactor agent categorization with config objects ([86e420e](https://github.com/unit-mesh/autodev-worker/commit/86e420e))
- **ai-tools:** replace code preview with react-live ([94a6d00](https://github.com/unit-mesh/autodev-worker/commit/94a6d00))
- **ai-tools:** improve code preview and error handling ([cc08242](https://github.com/unit-mesh/autodev-worker/commit/cc08242))
- **ai-tools:** enhance code playground with UI components ([641e1ad](https://github.com/unit-mesh/autodev-worker/commit/641e1ad))
- **ai-tools:** redesign golden-path layout with resizable panels ([29a1a56](https://github.com/unit-mesh/autodev-worker/commit/29a1a56))
- **ai-tools:** extract ProjectConfigForm component ([fa9006a](https://github.com/unit-mesh/autodev-worker/commit/fa9006a))
- **ai-tools:** add download dialog for golden-path config ([db3e51f](https://github.com/unit-mesh/autodev-worker/commit/db3e51f))
- **ai-tools:** update prompt to match ProjectConfigSchema ([865de4b](https://github.com/unit-mesh/autodev-worker/commit/865de4b))
- **ai-tools:** add asset data hook and refactor component ([87e0f97](https://github.com/unit-mesh/autodev-worker/commit/87e0f97))
- **analysis:** refactor ContextAnalyzer with design patterns ([c8194c5](https://github.com/unit-mesh/autodev-worker/commit/c8194c5))
- **analysis:** add FallbackAnalysisService for rule-based analysis ([398a592](https://github.com/unit-mesh/autodev-worker/commit/398a592))
- **api:** enhance error responses in golden-path ([dd7a4f1](https://github.com/unit-mesh/autodev-worker/commit/dd7a4f1))
- **backend-generator:** add project parser and config tsconfig ([49eb04a](https://github.com/unit-mesh/autodev-worker/commit/49eb04a))
- **backend-generator:** read version from package.json ([f3555a2](https://github.com/unit-mesh/autodev-worker/commit/f3555a2))
- **cli:** add 'add' command for remote config generation ([827f77b](https://github.com/unit-mesh/autodev-worker/commit/827f77b))
- **cockpit:** redesign AI SDLC House architecture page ([f830d95](https://github.com/unit-mesh/autodev-worker/commit/f830d95))
- **code-analysis:** extract code block renderer to component ([08acc2a](https://github.com/unit-mesh/autodev-worker/commit/08acc2a))
- **components:** standardize component file naming ([f1b5731](https://github.com/unit-mesh/autodev-worker/commit/f1b5731))
- **context-analyzer:** integrate worker-core for enhanced regex search functionality ([fa007c8](https://github.com/unit-mesh/autodev-worker/commit/fa007c8))
- **context-analyzer:** add LLM-powered code relevance analysis ([6cdad26](https://github.com/unit-mesh/autodev-worker/commit/6cdad26))
- **frontend:** add tabbed interface and keyboard shortcuts ([684f2ae](https://github.com/unit-mesh/autodev-worker/commit/684f2ae))
- **remote-agent:** add GitHub Smart Search tool for intelligent code search and analysis ([4972983](https://github.com/unit-mesh/autodev-worker/commit/4972983))
- **remote-agent:** add issue analysis report generation ([07c31e7](https://github.com/unit-mesh/autodev-worker/commit/07c31e7))
- **remote-agent:** add structured analysis plan service ([05553ae](https://github.com/unit-mesh/autodev-worker/commit/05553ae))
- **remote-agent:** add CLI tool for GitHub issue analysis ([74ad3aa](https://github.com/unit-mesh/autodev-worker/commit/74ad3aa))
- **remote-agent:** add config loading and analysis optimizations ([f32aea4](https://github.com/unit-mesh/autodev-worker/commit/f32aea4))
- **remote-agent:** implement file candidate scoring for LLM analysis ([b4f4686](https://github.com/unit-mesh/autodev-worker/commit/b4f4686))
- **remote-agent:** add URL content fetching tool ([1b84443](https://github.com/unit-mesh/autodev-worker/commit/1b84443))
- **remote-agent:** add URL content fetching to issue analysis ([8c55a6f](https://github.com/unit-mesh/autodev-worker/commit/8c55a6f))
- **remote-agent:** implement file scanning for relevant code analysis ([e9efcb3](https://github.com/unit-mesh/autodev-worker/commit/e9efcb3))
- **remote-agent:** add multi-provider LLM support ([0aabcf6](https://github.com/unit-mesh/autodev-worker/commit/0aabcf6))
- **remote-agent:** add enhanced UI and performance monitoring ([99ccfae](https://github.com/unit-mesh/autodev-worker/commit/99ccfae))
- **remote-agent): implement GitHub Agent MCP server with issue analysis and code contextfeat(remote-agent:** add GitHub MCP server package ([3726028](https://github.com/unit-mesh/autodev-worker/commit/3726028))
- **github-service:** add methods for adding and retrieving comments on GitHub issues ([818e00b](https://github.com/unit-mesh/autodev-worker/commit/818e00b))
- **golden-path:** extract ProjectBasicInfo into separate component ([fcf7c87](https://github.com/unit-mesh/autodev-worker/commit/fcf7c87))
- **golden-path:** replace ProjectBasicInfo with GeneratedBackendProject ([d1bd8d5](https://github.com/unit-mesh/autodev-worker/commit/d1bd8d5))
- **golden-path:** add config management API and UI ([ff6488d](https://github.com/unit-mesh/autodev-worker/commit/ff6488d))
- **golden-path:** add CLI command display and copy functionality for saved configurations ([d6c0854](https://github.com/unit-mesh/autodev-worker/commit/d6c0854))
- **golden-path:** refactor project generation into modular components ([a1f1c93](https://github.com/unit-mesh/autodev-worker/commit/a1f1c93))
- **issue-analyzer:** add script for analyzing GitHub issues with AI-powered keyword extraction and code context analysis ([a20abef](https://github.com/unit-mesh/autodev-worker/commit/a20abef))
- **layout:** add resizable panels to AI frontend generator ([06b3478](https://github.com/unit-mesh/autodev-worker/commit/06b3478))
- **llm-service:** integrate LLM for intelligent keyword extraction and issue type detection ([31f1ef3](https://github.com/unit-mesh/autodev-worker/commit/31f1ef3))
- **logging:** add structured logging system with verbose controls ([877a4cc](https://github.com/unit-mesh/autodev-worker/commit/877a4cc))
- **navigation:** update route paths and names ([172f5d8](https://github.com/unit-mesh/autodev-worker/commit/172f5d8))
- **page:** refactor MCP servers config generation into a function ([4786df5](https://github.com/unit-mesh/autodev-worker/commit/4786df5))
- **page:** add AI-friendly SDLC house page with structured layers and activities ([117e6e9](https://github.com/unit-mesh/autodev-worker/commit/117e6e9))
- **performance:** add performance monitoring and logging utilities ([d6bce8a](https://github.com/unit-mesh/autodev-worker/commit/d6bce8a))
- **prisma:** add GoldenPathConfig table ([d267b9d](https://github.com/unit-mesh/autodev-worker/commit/d267b9d))
- **project-structure:** enhance project structure generation for multiple languages and frameworks ([280d1b7](https://github.com/unit-mesh/autodev-worker/commit/280d1b7))
- **testing:** add vitest setup and mindmap node tests ([c6854df](https://github.com/unit-mesh/autodev-worker/commit/c6854df))
- **ui:** redesign AI tools interface ([c55b4ae](https://github.com/unit-mesh/autodev-worker/commit/c55b4ae))
- **vector-db:** add vector database API and integration ([786623e](https://github.com/unit-mesh/autodev-worker/commit/786623e))
- **web:** add copy button for MCP config ([bc54d7d](https://github.com/unit-mesh/autodev-worker/commit/bc54d7d))
- **web:** remove CLI tools download section ([8b00abf](https://github.com/unit-mesh/autodev-worker/commit/8b00abf))
- **web:** simplify AI SDLC architecture layer names ([bdc389d](https://github.com/unit-mesh/autodev-worker/commit/bdc389d))
- **web:** replace API data fetching with mock data for knowledge bases ([05cadb4](https://github.com/unit-mesh/autodev-worker/commit/05cadb4))
- **web:** add curl install script for project generation ([7d69395](https://github.com/unit-mesh/autodev-worker/commit/7d69395))

### 🩹 Fixes

- remove duplicate import of ToolLike in github-upload-analysis.ts ([89c5b81](https://github.com/unit-mesh/autodev-worker/commit/89c5b81))
- **api:** improve error handling in golden path endpoint ([cfd80b2](https://github.com/unit-mesh/autodev-worker/commit/cfd80b2))
- **api:** 修复异步参数解析问题 ([01f1ede](https://github.com/unit-mesh/autodev-worker/commit/01f1ede))
- **remote-agent:** improve error handling and formatting ([8cdc510](https://github.com/unit-mesh/autodev-worker/commit/8cdc510))
- **remote-agent:** disable response compression ([1c5d370](https://github.com/unit-mesh/autodev-worker/commit/1c5d370))
- **llm-service:** handle empty content in URL prompts ([cbaf99c](https://github.com/unit-mesh/autodev-worker/commit/cbaf99c))
- **package:** update version and enhance description for clarity ([2bf7817](https://github.com/unit-mesh/autodev-worker/commit/2bf7817))
- **project-config:** fix scroll container layout ([7c62ccb](https://github.com/unit-mesh/autodev-worker/commit/7c62ccb))
- **route:** await params in GET function to correctly parse id ([0685638](https://github.com/unit-mesh/autodev-worker/commit/0685638))
- **ui:** adjust container padding in page layout ([c8c959a](https://github.com/unit-mesh/autodev-worker/commit/c8c959a))
- **web:** add missing copyCode dependency to useEffect ([9f0d853](https://github.com/unit-mesh/autodev-worker/commit/9f0d853))

### 🔥 Performance

- **frontend:** optimize copyCode with useCallback ([b6befea](https://github.com/unit-mesh/autodev-worker/commit/b6befea))

### ❤️ Thank You

- CGQAQ
- Phodal Huang @phodal

## 0.1.2 (2025-06-07)

### 🚀 Features

- **ai-hub:** refactor agent categorization with config objects ([86e420e](https://github.com/unit-mesh/autodev-worker/commit/86e420e))
- **ai-tools:** replace code preview with react-live ([94a6d00](https://github.com/unit-mesh/autodev-worker/commit/94a6d00))
- **ai-tools:** improve code preview and error handling ([cc08242](https://github.com/unit-mesh/autodev-worker/commit/cc08242))
- **ai-tools:** enhance code playground with UI components ([641e1ad](https://github.com/unit-mesh/autodev-worker/commit/641e1ad))
- **ai-tools:** redesign golden-path layout with resizable panels ([29a1a56](https://github.com/unit-mesh/autodev-worker/commit/29a1a56))
- **ai-tools:** extract ProjectConfigForm component ([fa9006a](https://github.com/unit-mesh/autodev-worker/commit/fa9006a))
- **ai-tools:** add download dialog for golden-path config ([db3e51f](https://github.com/unit-mesh/autodev-worker/commit/db3e51f))
- **ai-tools:** update prompt to match ProjectConfigSchema ([865de4b](https://github.com/unit-mesh/autodev-worker/commit/865de4b))
- **ai-tools:** add asset data hook and refactor component ([87e0f97](https://github.com/unit-mesh/autodev-worker/commit/87e0f97))
- **analysis:** refactor ContextAnalyzer with design patterns ([c8194c5](https://github.com/unit-mesh/autodev-worker/commit/c8194c5))
- **analysis:** add FallbackAnalysisService for rule-based analysis ([398a592](https://github.com/unit-mesh/autodev-worker/commit/398a592))
- **api:** enhance error responses in golden-path ([dd7a4f1](https://github.com/unit-mesh/autodev-worker/commit/dd7a4f1))
- **backend-generator:** add project parser and config tsconfig ([49eb04a](https://github.com/unit-mesh/autodev-worker/commit/49eb04a))
- **backend-generator:** read version from package.json ([f3555a2](https://github.com/unit-mesh/autodev-worker/commit/f3555a2))
- **cli:** add 'add' command for remote config generation ([827f77b](https://github.com/unit-mesh/autodev-worker/commit/827f77b))
- **cockpit:** redesign AI SDLC House architecture page ([f830d95](https://github.com/unit-mesh/autodev-worker/commit/f830d95))
- **code-analysis:** extract code block renderer to component ([08acc2a](https://github.com/unit-mesh/autodev-worker/commit/08acc2a))
- **components:** standardize component file naming ([f1b5731](https://github.com/unit-mesh/autodev-worker/commit/f1b5731))
- **context-analyzer:** integrate worker-core for enhanced regex search functionality ([fa007c8](https://github.com/unit-mesh/autodev-worker/commit/fa007c8))
- **context-analyzer:** add LLM-powered code relevance analysis ([6cdad26](https://github.com/unit-mesh/autodev-worker/commit/6cdad26))
- **frontend:** add tabbed interface and keyboard shortcuts ([684f2ae](https://github.com/unit-mesh/autodev-worker/commit/684f2ae))
- **remote-agent:** add GitHub Smart Search tool for intelligent code search and analysis ([4972983](https://github.com/unit-mesh/autodev-worker/commit/4972983))
- **remote-agent:** add issue analysis report generation ([07c31e7](https://github.com/unit-mesh/autodev-worker/commit/07c31e7))
- **remote-agent:** add structured analysis plan service ([05553ae](https://github.com/unit-mesh/autodev-worker/commit/05553ae))
- **remote-agent:** add CLI tool for GitHub issue analysis ([74ad3aa](https://github.com/unit-mesh/autodev-worker/commit/74ad3aa))
- **remote-agent:** add config loading and analysis optimizations ([f32aea4](https://github.com/unit-mesh/autodev-worker/commit/f32aea4))
- **remote-agent:** implement file candidate scoring for LLM analysis ([b4f4686](https://github.com/unit-mesh/autodev-worker/commit/b4f4686))
- **remote-agent:** add URL content fetching tool ([1b84443](https://github.com/unit-mesh/autodev-worker/commit/1b84443))
- **remote-agent:** add URL content fetching to issue analysis ([8c55a6f](https://github.com/unit-mesh/autodev-worker/commit/8c55a6f))
- **remote-agent:** implement file scanning for relevant code analysis ([e9efcb3](https://github.com/unit-mesh/autodev-worker/commit/e9efcb3))
- **remote-agent:** add multi-provider LLM support ([0aabcf6](https://github.com/unit-mesh/autodev-worker/commit/0aabcf6))
- **remote-agent:** add enhanced UI and performance monitoring ([99ccfae](https://github.com/unit-mesh/autodev-worker/commit/99ccfae))
- **remote-agent): implement GitHub Agent MCP server with issue analysis and code contextfeat(remote-agent:** add GitHub MCP server package ([3726028](https://github.com/unit-mesh/autodev-worker/commit/3726028))
- **github-service:** add methods for adding and retrieving comments on GitHub issues ([818e00b](https://github.com/unit-mesh/autodev-worker/commit/818e00b))
- **golden-path:** extract ProjectBasicInfo into separate component ([fcf7c87](https://github.com/unit-mesh/autodev-worker/commit/fcf7c87))
- **golden-path:** replace ProjectBasicInfo with GeneratedBackendProject ([d1bd8d5](https://github.com/unit-mesh/autodev-worker/commit/d1bd8d5))
- **golden-path:** add config management API and UI ([ff6488d](https://github.com/unit-mesh/autodev-worker/commit/ff6488d))
- **golden-path:** add CLI command display and copy functionality for saved configurations ([d6c0854](https://github.com/unit-mesh/autodev-worker/commit/d6c0854))
- **golden-path:** refactor project generation into modular components ([a1f1c93](https://github.com/unit-mesh/autodev-worker/commit/a1f1c93))
- **issue-analyzer:** add script for analyzing GitHub issues with AI-powered keyword extraction and code context analysis ([a20abef](https://github.com/unit-mesh/autodev-worker/commit/a20abef))
- **layout:** add resizable panels to AI frontend generator ([06b3478](https://github.com/unit-mesh/autodev-worker/commit/06b3478))
- **llm-service:** integrate LLM for intelligent keyword extraction and issue type detection ([31f1ef3](https://github.com/unit-mesh/autodev-worker/commit/31f1ef3))
- **logging:** add structured logging system with verbose controls ([877a4cc](https://github.com/unit-mesh/autodev-worker/commit/877a4cc))
- **navigation:** update route paths and names ([172f5d8](https://github.com/unit-mesh/autodev-worker/commit/172f5d8))
- **page:** refactor MCP servers config generation into a function ([4786df5](https://github.com/unit-mesh/autodev-worker/commit/4786df5))
- **page:** add AI-friendly SDLC house page with structured layers and activities ([117e6e9](https://github.com/unit-mesh/autodev-worker/commit/117e6e9))
- **performance:** add performance monitoring and logging utilities ([d6bce8a](https://github.com/unit-mesh/autodev-worker/commit/d6bce8a))
- **prisma:** add GoldenPathConfig table ([d267b9d](https://github.com/unit-mesh/autodev-worker/commit/d267b9d))
- **project-structure:** enhance project structure generation for multiple languages and frameworks ([280d1b7](https://github.com/unit-mesh/autodev-worker/commit/280d1b7))
- **testing:** add vitest setup and mindmap node tests ([c6854df](https://github.com/unit-mesh/autodev-worker/commit/c6854df))
- **ui:** redesign AI tools interface ([c55b4ae](https://github.com/unit-mesh/autodev-worker/commit/c55b4ae))
- **vector-db:** add vector database API and integration ([786623e](https://github.com/unit-mesh/autodev-worker/commit/786623e))
- **web:** add copy button for MCP config ([bc54d7d](https://github.com/unit-mesh/autodev-worker/commit/bc54d7d))
- **web:** remove CLI tools download section ([8b00abf](https://github.com/unit-mesh/autodev-worker/commit/8b00abf))
- **web:** simplify AI SDLC architecture layer names ([bdc389d](https://github.com/unit-mesh/autodev-worker/commit/bdc389d))
- **web:** replace API data fetching with mock data for knowledge bases ([05cadb4](https://github.com/unit-mesh/autodev-worker/commit/05cadb4))
- **web:** add curl install script for project generation ([7d69395](https://github.com/unit-mesh/autodev-worker/commit/7d69395))

### 🩹 Fixes

- remove duplicate import of ToolLike in github-upload-analysis.ts ([89c5b81](https://github.com/unit-mesh/autodev-worker/commit/89c5b81))
- **api:** improve error handling in golden path endpoint ([cfd80b2](https://github.com/unit-mesh/autodev-worker/commit/cfd80b2))
- **api:** 修复异步参数解析问题 ([01f1ede](https://github.com/unit-mesh/autodev-worker/commit/01f1ede))
- **remote-agent:** improve error handling and formatting ([8cdc510](https://github.com/unit-mesh/autodev-worker/commit/8cdc510))
- **remote-agent:** disable response compression ([1c5d370](https://github.com/unit-mesh/autodev-worker/commit/1c5d370))
- **llm-service:** handle empty content in URL prompts ([cbaf99c](https://github.com/unit-mesh/autodev-worker/commit/cbaf99c))
- **package:** update version and enhance description for clarity ([2bf7817](https://github.com/unit-mesh/autodev-worker/commit/2bf7817))
- **project-config:** fix scroll container layout ([7c62ccb](https://github.com/unit-mesh/autodev-worker/commit/7c62ccb))
- **route:** await params in GET function to correctly parse id ([0685638](https://github.com/unit-mesh/autodev-worker/commit/0685638))
- **ui:** adjust container padding in page layout ([c8c959a](https://github.com/unit-mesh/autodev-worker/commit/c8c959a))
- **web:** add missing copyCode dependency to useEffect ([9f0d853](https://github.com/unit-mesh/autodev-worker/commit/9f0d853))

### 🔥 Performance

- **frontend:** optimize copyCode with useCallback ([b6befea](https://github.com/unit-mesh/autodev-worker/commit/b6befea))

### ❤️ Thank You

- CGQAQ
- Phodal Huang @phodal

## 0.3.3 (2025-05-23)

### 🚀 Features

- **context:** parse response JSON before stringifying ([24a2540](https://github.com/unit-mesh/autodev-worker/commit/24a2540))
- **logging:** add request logger for API interactions ([af81962](https://github.com/unit-mesh/autodev-worker/commit/af81962))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.3.2 (2025-05-23)

### 🚀 Features

- **project-context:** enhance keywords input handling ([8381fc3](https://github.com/unit-mesh/autodev-worker/commit/8381fc3))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.3.1 (2025-05-23)

### 🚀 Features

- **ai-assistant:** remove unused FileDown icon ([f54776e](https://github.com/unit-mesh/autodev-worker/commit/f54776e))
- **ai-assistant-panel:** update button labels for coding assistant with IDE options ([98f4140](https://github.com/unit-mesh/autodev-worker/commit/98f4140))
- **ai-panel:** add vscode deep link and disable buttons ([1c6b3b6](https://github.com/unit-mesh/autodev-worker/commit/1c6b3b6))
- **asset-recommendation:** enhance selection logic for APIs, code snippets, and guidelines ([1886a95](https://github.com/unit-mesh/autodev-worker/commit/1886a95))
- **chat:** extract conversation logic to custom hook ([e271b26](https://github.com/unit-mesh/autodev-worker/commit/e271b26))
- **chat:** extract requirement edit dialog to component ([8988bbb](https://github.com/unit-mesh/autodev-worker/commit/8988bbb))
- **chat:** extract requirement card actions to custom hook ([e8790c2](https://github.com/unit-mesh/autodev-worker/commit/e8790c2))
- **get-project-context:** enhance keyword processing and update description for better clarity ([6be3c83](https://github.com/unit-mesh/autodev-worker/commit/6be3c83))
- **page:** rename onSaveAsDraft to onGenerateAiPrompt and remove draft badge ([a16cdee](https://github.com/unit-mesh/autodev-worker/commit/a16cdee))
- **requirements:** handle keyword extraction in useEffect ([65712a6](https://github.com/unit-mesh/autodev-worker/commit/65712a6))
- **ui:** improve dialog layout and scrolling ([11079c5](https://github.com/unit-mesh/autodev-worker/commit/11079c5))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.3.0 (2025-05-22)

### 🚀 Features

- **InterfaceAnalyzerApp:** simplify symbol analysis result for improved clarity ([356b329](https://github.com/unit-mesh/autodev-worker/commit/356b329))
- **InterfaceAnalyzerApp:** enhance symbol filtering with SymbolKind constants for better readability ([58d582b](https://github.com/unit-mesh/autodev-worker/commit/58d582b))
- **InterfaceAnalyzerApp:** enhance summary structure for class and function symbols with detailed attributes ([b305d9c](https://github.com/unit-mesh/autodev-worker/commit/b305d9c))
- **ProjectDetail:** add symbol search functionality with loading state and display ([abef286](https://github.com/unit-mesh/autodev-worker/commit/abef286))
- **ProjectDetail:** add symbol analyses selection to route and handle potential null length ([f2a7cd6](https://github.com/unit-mesh/autodev-worker/commit/f2a7cd6))
- **SymbolExtractor:** refactor symbol range creation to utilize tree-sitter nodes for improved accuracy ([ca2fe1c](https://github.com/unit-mesh/autodev-worker/commit/ca2fe1c))
- **api:** add supplyType to ApiResource ([9cbd4be](https://github.com/unit-mesh/autodev-worker/commit/9cbd4be))
- **api:** update requirements analysis endpoint path ([24d8bf0](https://github.com/unit-mesh/autodev-worker/commit/24d8bf0))
- **api:** update requirements analysis endpoint path ([1a33e36](https://github.com/unit-mesh/autodev-worker/commit/1a33e36))
- **api:** update semantic code action endpoint ([cd31429](https://github.com/unit-mesh/autodev-worker/commit/cd31429))
- **api:** add keyword filtering to API queries and enhance data fetching ([57a774d](https://github.com/unit-mesh/autodev-worker/commit/57a774d))
- **api:** enhance requirement analysis with example answers and retry functionality ([934858b](https://github.com/unit-mesh/autodev-worker/commit/934858b))
- **api:** enhance requirement analysis with example answers and retry functionality ([db5bf3c](https://github.com/unit-mesh/autodev-worker/commit/db5bf3c))
- **api-analyzers:** update analysis methods to include workspace path for improved context ([484846a](https://github.com/unit-mesh/autodev-worker/commit/484846a))
- **api-resource-list:** enhance API resource display with HTTP and RPC separation ([c1a2800](https://github.com/unit-mesh/autodev-worker/commit/c1a2800))
- **api-resource-list:** implement tabbed interface for HTTP and RPC API display ([66ca702](https://github.com/unit-mesh/autodev-worker/commit/66ca702))
- **api-resource-list:** sort HTTP prefix keys and API URLs for improved organization ([eca495b](https://github.com/unit-mesh/autodev-worker/commit/eca495b))
- **asset-recommendation:** integrate guidelines and update standards mapping ([c94550b](https://github.com/unit-mesh/autodev-worker/commit/c94550b))
- **asset-recommendation:** replace auto-selection with manual controls ([1b6f741](https://github.com/unit-mesh/autodev-worker/commit/1b6f741))
- **asset-recommendation:** add user input parameter to asset recommendation generation ([379b696](https://github.com/unit-mesh/autodev-worker/commit/379b696))
- **auth:** add authentication to chat page ([27c429d](https://github.com/unit-mesh/autodev-worker/commit/27c429d))
- **chat:** implement chat functionality for requirement generation assistant ([a3e7d1d](https://github.com/unit-mesh/autodev-worker/commit/a3e7d1d))
- **chat:** fetch APIs from database ([f06cf0e](https://github.com/unit-mesh/autodev-worker/commit/f06cf0e))
- **chat:** extract asset recommendation to component ([f29c1b0](https://github.com/unit-mesh/autodev-worker/commit/f29c1b0))
- **chat:** enhance asset recommendation UI and loading states ([61cd1c5](https://github.com/unit-mesh/autodev-worker/commit/61cd1c5))
- **chat:** improve asset recommendation UI and API ([29d4fc4](https://github.com/unit-mesh/autodev-worker/commit/29d4fc4))
- **chat:** extract requirement card to separate component ([916b27a](https://github.com/unit-mesh/autodev-worker/commit/916b27a))
- **chat:** implement multi-stage requirement analysis with intent recognition, clarifying questions, and asset recommendations ([5b2a6a8](https://github.com/unit-mesh/autodev-worker/commit/5b2a6a8))
- **chat:** auto-select fetched assets and improve code snippets UI ([7cd2b28](https://github.com/unit-mesh/autodev-worker/commit/7cd2b28))
- **chat:** add collapsible sidebar with context tabs ([16f9186](https://github.com/unit-mesh/autodev-worker/commit/16f9186))
- **chat:** extract requirement info panel to component ([567ba4f](https://github.com/unit-mesh/autodev-worker/commit/567ba4f))
- **ci:** enhance CI pipeline with additional build steps for Worker Core and ProtobufWorker ([4e507a4](https://github.com/unit-mesh/autodev-worker/commit/4e507a4))
- **cli:** add options for analysis type selection and handling ([1f7d44c](https://github.com/unit-mesh/autodev-worker/commit/1f7d44c))
- **cockpit:** extract project glossary to separate component ([9c4660c](https://github.com/unit-mesh/autodev-worker/commit/9c4660c))
- **code:** replace CodeSnippet with CodeAnalysis type ([450dd21](https://github.com/unit-mesh/autodev-worker/commit/450dd21))
- **concept-dictionary:** implement AI optimization dialog and fetch logic ([8c938a9](https://github.com/unit-mesh/autodev-worker/commit/8c938a9))
- **concept-merge:** add selection and merging functionality for concept duplicates and suggestions ([8b1759d](https://github.com/unit-mesh/autodev-worker/commit/8b1759d))
- **concept-merge:** enhance merging functionality with group selection and improved query handling ([8bd6189](https://github.com/unit-mesh/autodev-worker/commit/8bd6189))
- **concept-merge:** refactor merging logic and clean up unused functions in ConceptDictionaryTab ([1e25cdd](https://github.com/unit-mesh/autodev-worker/commit/1e25cdd))
- **concept-merge:** add single and batch delete functionality for concept dictionary entries ([49a7064](https://github.com/unit-mesh/autodev-worker/commit/49a7064))
- **concepts:** add AI concept analysis feature ([ea1c664](https://github.com/unit-mesh/autodev-worker/commit/ea1c664))
- **concepts:** add related terms support ([9904398](https://github.com/unit-mesh/autodev-worker/commit/9904398))
- **context-mcp:** add stubs for project-related tools ([4cfb4f4](https://github.com/unit-mesh/autodev-worker/commit/4cfb4f4))
- **context-mcp:** add preset support and organize tools ([cf65ad2](https://github.com/unit-mesh/autodev-worker/commit/cf65ad2))
- **context-mcp:** add keywords param to get-project-context ([d542641](https://github.com/unit-mesh/autodev-worker/commit/d542641))
- **context-mcp:** implement get-project-context tool ([257663d](https://github.com/unit-mesh/autodev-worker/commit/257663d))
- **knowledge-graph:** integrate react-graph-vis for dynamic graph visualization and update data fetching logic ([be35098](https://github.com/unit-mesh/autodev-worker/commit/be35098))
- **knowledge-hub:** restructure glossary panel layout ([633ca07](https://github.com/unit-mesh/autodev-worker/commit/633ca07))
- **knowledge-hub:** add Vibe Coding and Problem Diagnosis tabs with functionality ([7c44cb7](https://github.com/unit-mesh/autodev-worker/commit/7c44cb7))
- **mcp:** add aggregate context API endpoint ([8caf036](https://github.com/unit-mesh/autodev-worker/commit/8caf036))
- **merge:** update merge API to support multiple concept groups and new request structure ([c748b35](https://github.com/unit-mesh/autodev-worker/commit/c748b35))
- **navigation:** remove search button from TopNavigation component ([b9e0d4f](https://github.com/unit-mesh/autodev-worker/commit/b9e0d4f))
- **page:** integrate MarkdownCodeBlock for improved JSON parsing from LLM responses ([25e268b](https://github.com/unit-mesh/autodev-worker/commit/25e268b))
- **project-detail:** add API resources fetching and display in project resources ([4cb2c1c](https://github.com/unit-mesh/autodev-worker/commit/4cb2c1c))
- **project-detail:** add API resources fetching and display in project resources ([aa93879](https://github.com/unit-mesh/autodev-worker/commit/aa93879))
- **project-resources:** enhance API resource display with detailed package, class, and method information ([eca5a05](https://github.com/unit-mesh/autodev-worker/commit/eca5a05))
- **project-resources:** refactor API resources display into separate component ([69734d9](https://github.com/unit-mesh/autodev-worker/commit/69734d9))
- **project-resources:** integrate ConceptDictionaryTab for improved dictionary display ([c15cada](https://github.com/unit-mesh/autodev-worker/commit/c15cada))
- **projects:** extract symbol analysis into separate component ([7ba755b](https://github.com/unit-mesh/autodev-worker/commit/7ba755b))
- **proto-api-resource-generator:** update HTTP method determination to include RPC prefixes ([90499a8](https://github.com/unit-mesh/autodev-worker/commit/90499a8))
- **readme:** update analysis options and examples in documentation ([7975168](https://github.com/unit-mesh/autodev-worker/commit/7975168))
- **requirement-card:** add copy as JSON and AI Prompt buttons ([041eb29](https://github.com/unit-mesh/autodev-worker/commit/041eb29))
- **route:** implement search functionality for symbol analysis results with query parameters ([9a53a20](https://github.com/unit-mesh/autodev-worker/commit/9a53a20))
- **route:** refactor jieba integration to use direct import and simplify initialization ([6d6a0b1](https://github.com/unit-mesh/autodev-worker/commit/6d6a0b1))
- **route:** clean up comments and improve error logging in route handlers ([c101f54](https://github.com/unit-mesh/autodev-worker/commit/c101f54))
- **route:** clean up comments and improve error logging in route handlers ([fcede98](https://github.com/unit-mesh/autodev-worker/commit/fcede98))
- **schema:** add SymbolAnalysis model and update Account model ([3686ea3](https://github.com/unit-mesh/autodev-worker/commit/3686ea3))
- **symbol:** add symbol analysis support ([00b3dc4](https://github.com/unit-mesh/autodev-worker/commit/00b3dc4))
- **symbol:** improve symbol analysis data handling ([43fc195](https://github.com/unit-mesh/autodev-worker/commit/43fc195))
- **symbol-analysis:** enhance symbol selection and analysis features ([f52d430](https://github.com/unit-mesh/autodev-worker/commit/f52d430))
- **symbol-analysis:** add identified concepts tracking ([3f434de](https://github.com/unit-mesh/autodev-worker/commit/3f434de))
- **symbol-analysis:** enhance symbol details display with hover card and table layout ([b3d7a3e](https://github.com/unit-mesh/autodev-worker/commit/b3d7a3e))
- **symbols:** add AI analysis for code symbols ([9d6277d](https://github.com/unit-mesh/autodev-worker/commit/9d6277d))
- **theme:** add theme provider support ([2c727c8](https://github.com/unit-mesh/autodev-worker/commit/2c727c8))
- **types:** add ApiResource type definition ([89a8cb1](https://github.com/unit-mesh/autodev-worker/commit/89a8cb1))

### 🩹 Fixes

- resolve missing changes in empty commit diff scenario ([2091795](https://github.com/unit-mesh/autodev-worker/commit/2091795))
- **analyzer:** hardcode output filenames ([33b4202](https://github.com/unit-mesh/autodev-worker/commit/33b4202))
- **api:** improve JSON parsing robustness in LLM response handling ([4ba6f0a](https://github.com/unit-mesh/autodev-worker/commit/4ba6f0a))
- **api:** filter JSON blocks from Markdown response ([051559c](https://github.com/unit-mesh/autodev-worker/commit/051559c))
- **asset-recommendation:** correct API endpoint for fetching guidelines ([bf4de75](https://github.com/unit-mesh/autodev-worker/commit/bf4de75))
- **asset-recommendation:** remove unnecessary filtering of API resources, code snippets, and guidelines ([cde2828](https://github.com/unit-mesh/autodev-worker/commit/cde2828))
- **asset-recommendation:** store full objects instead of filtering ([6f6c900](https://github.com/unit-mesh/autodev-worker/commit/6f6c900))
- **asset-recommendation:** store full objects instead of filtering ([29b67cf](https://github.com/unit-mesh/autodev-worker/commit/29b67cf))
- **context-mcp:** commandline works now ([d1d8c80](https://github.com/unit-mesh/autodev-worker/commit/d1d8c80))
- **eslint:** remove unused imports ([00fdd69](https://github.com/unit-mesh/autodev-worker/commit/00fdd69))
- **nx:** remove unused nxCloudId configuration ([a4ec942](https://github.com/unit-mesh/autodev-worker/commit/a4ec942))
- **server:** await MCP instance connection to ensure readiness ([4275de5](https://github.com/unit-mesh/autodev-worker/commit/4275de5))
- **types:** update type imports for better type safety in page.tsx ([50bb604](https://github.com/unit-mesh/autodev-worker/commit/50bb604))
- **ui:** disable draft save and task generation buttons ([7fb790c](https://github.com/unit-mesh/autodev-worker/commit/7fb790c))
- **ui:** disable draft save and task generation buttons ([34d61b5](https://github.com/unit-mesh/autodev-worker/commit/34d61b5))
- **web:** build ([27c4b58](https://github.com/unit-mesh/autodev-worker/commit/27c4b58))

### ❤️ Thank You

- CGQAQ
- Phodal Huang @phodal

## 0.2.2 (2025-05-19)

### 🚀 Features

- add common posix tools ([2d84a9d](https://github.com/unit-mesh/autodev-worker/commit/2d84a9d))
- **api:** add TypeScriptNextjsAnalyser for Next.js API route analysis ([99cb40a](https://github.com/unit-mesh/autodev-worker/commit/99cb40a))
- **api:** enhance TypeScriptNextjsAnalyser to support function declaration exports ([9e4bcdd](https://github.com/unit-mesh/autodev-worker/commit/9e4bcdd))
- **api:** enhance Python structurer to support top-level function identification and avoid duplicates ([1e29118](https://github.com/unit-mesh/autodev-worker/commit/1e29118))
- **api:** update FastApiAnalyser to support Python language identification ([610d123](https://github.com/unit-mesh/autodev-worker/commit/610d123))
- **api:** remove FastAPI route query from PythonProfile ([cef7de7](https://github.com/unit-mesh/autodev-worker/commit/cef7de7))
- **c:** add symbol extractor queries for TypeScript definitions ([c31781a](https://github.com/unit-mesh/autodev-worker/commit/c31781a))
- **ci:** add context-worker build and test steps to CI pipeline ([c26f7d3](https://github.com/unit-mesh/autodev-worker/commit/c26f7d3))
- **cpp:** add symbol extractor queries for C++ definitions ([970744e](https://github.com/unit-mesh/autodev-worker/commit/970744e))
- **csharp:** add symbol extractor queries for C# definitions and improve language loading ([10633f6](https://github.com/unit-mesh/autodev-worker/commit/10633f6))
- **go:** add symbol extractor queries for Go definitions and improve comment extraction ([d5c8b81](https://github.com/unit-mesh/autodev-worker/commit/d5c8b81))
- **javascript:** add JavaScript language support ([979d507](https://github.com/unit-mesh/autodev-worker/commit/979d507))
- **kotlin:** add symbol extraction tests for classes and functions in Kotlin ([c39e81a](https://github.com/unit-mesh/autodev-worker/commit/c39e81a))
- **languages:** add PHP language support and update language profiles ([6435d5c](https://github.com/unit-mesh/autodev-worker/commit/6435d5c))
- **languages:** add C language support ([32c83af](https://github.com/unit-mesh/autodev-worker/commit/32c83af))
- **php:** add syntax highlighting scopes and definitions for PHP language ([bbbaa54](https://github.com/unit-mesh/autodev-worker/commit/bbbaa54))
- **php:** add symbol extractor queries for PHP definitions ([ca8a6d1](https://github.com/unit-mesh/autodev-worker/commit/ca8a6d1))
- **php:** improve parameter handling and clean up code structure ([488a7d9](https://github.com/unit-mesh/autodev-worker/commit/488a7d9))
- **profiles:** add symbol extractor queries for multiple languages ([f81223f](https://github.com/unit-mesh/autodev-worker/commit/f81223f))
- **python:** add FastAPI route analyzer ([9347a91](https://github.com/unit-mesh/autodev-worker/commit/9347a91))
- **python:** add symbol extraction for classes, methods, and functions in Python ([f31cb43](https://github.com/unit-mesh/autodev-worker/commit/f31cb43))
- **rust:** add symbol extractor queries for Rust definitions ([e066cfa](https://github.com/unit-mesh/autodev-worker/commit/e066cfa))
- **rust:** add symbol extractor queries for Rust definitions ([64f5ea8](https://github.com/unit-mesh/autodev-worker/commit/64f5ea8))
- **rust:** add queryString method and clean up code formatting ([3b76f08](https://github.com/unit-mesh/autodev-worker/commit/3b76f08))
- **rust:** enable extraction of structs, traits, and functions in Rust symbols test ([777f707](https://github.com/unit-mesh/autodev-worker/commit/777f707))
- **symbol-analysis:** add symbol analyzer and C++ support ([5040d26](https://github.com/unit-mesh/autodev-worker/commit/5040d26))
- **tools:** add multiple POSIX tools to enhance system capabilities ([50f67d3](https://github.com/unit-mesh/autodev-worker/commit/50f67d3))
- **ts:** refactor SymbolExtractor to utilize LanguageProfile and simplify query execution ([fd659a0](https://github.com/unit-mesh/autodev-worker/commit/fd659a0))

### 🩹 Fixes

- improve logging messages and handle empty results in analysis ([cc7076b](https://github.com/unit-mesh/autodev-worker/commit/cc7076b))
- remove redundant file extension from CppProfile ([115c0fe](https://github.com/unit-mesh/autodev-worker/commit/115c0fe))
- refactor ProjectsList component for improved readability and structure ([77c4080](https://github.com/unit-mesh/autodev-worker/commit/77c4080))
- rename JVMRestApiAnalyser to SpringRestApiAnalyser and update references ([099d72f](https://github.com/unit-mesh/autodev-worker/commit/099d72f))
- **tests:** rename method references to functions in GolangProfileSymbolExtractor tests ([d78db6c](https://github.com/unit-mesh/autodev-worker/commit/d78db6c))
- **tests:** update typedefs filter to use 'definition.type' in CProfileSymbolExtractor tests ([38d31bd](https://github.com/unit-mesh/autodev-worker/commit/38d31bd))
- **typescript:** prevent duplicate imports and extends/implements ([bfb11db](https://github.com/unit-mesh/autodev-worker/commit/bfb11db))

### ❤️ Thank You

- CGQAQ
- Phodal Huang @phodal

## 0.2.1 (2025-05-18)

### 🚀 Features

- **api:** add TypeScriptNextjsAnalyser for Next.js API route analysis ([5ae80df](https://github.com/unit-mesh/autodev-worker/commit/5ae80df))
- **api:** enhance TypeScriptNextjsAnalyser to support function declaration exports ([35707db](https://github.com/unit-mesh/autodev-worker/commit/35707db))
- **api:** enhance Python structurer to support top-level function identification and avoid duplicates ([559fddf](https://github.com/unit-mesh/autodev-worker/commit/559fddf))
- **python:** add FastAPI route analyzer ([b8c3003](https://github.com/unit-mesh/autodev-worker/commit/b8c3003))

### 🩹 Fixes

- improve logging messages and handle empty results in analysis ([cc7076b](https://github.com/unit-mesh/autodev-worker/commit/cc7076b))
- remove redundant file extension from CppProfile ([115c0fe](https://github.com/unit-mesh/autodev-worker/commit/115c0fe))
- refactor ProjectsList component for improved readability and structure ([77c4080](https://github.com/unit-mesh/autodev-worker/commit/77c4080))
- rename JVMRestApiAnalyser to SpringRestApiAnalyser and update references ([6903e7c](https://github.com/unit-mesh/autodev-worker/commit/6903e7c))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.2.0 (2025-05-18)

### 🚀 Features

- **api:** add TypeScriptNextjsAnalyser for Next.js API route analysis ([5ae80df](https://github.com/unit-mesh/autodev-worker/commit/5ae80df))
- **api:** enhance TypeScriptNextjsAnalyser to support function declaration exports ([35707db](https://github.com/unit-mesh/autodev-worker/commit/35707db))
- **api:** enhance Python structurer to support top-level function identification and avoid duplicates ([559fddf](https://github.com/unit-mesh/autodev-worker/commit/559fddf))
- **python:** add FastAPI route analyzer ([b8c3003](https://github.com/unit-mesh/autodev-worker/commit/b8c3003))

### 🩹 Fixes

- improve logging messages and handle empty results in analysis ([cc7076b](https://github.com/unit-mesh/autodev-worker/commit/cc7076b))
- remove redundant file extension from CppProfile ([115c0fe](https://github.com/unit-mesh/autodev-worker/commit/115c0fe))
- refactor ProjectsList component for improved readability and structure ([77c4080](https://github.com/unit-mesh/autodev-worker/commit/77c4080))
- rename JVMRestApiAnalyser to SpringRestApiAnalyser and update references ([6903e7c](https://github.com/unit-mesh/autodev-worker/commit/6903e7c))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.2.0-3 (2025-05-16)

### 🩹 Fixes

- update path for tree-sitter WASM files in production ([9124ee5](https://github.com/unit-mesh/autodev-worker/commit/9124ee5))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.2.0-2 (2025-05-16)

### 🩹 Fixes

- update path for tree-sitter WASM files in production ([5dc43aa](https://github.com/unit-mesh/autodev-worker/commit/5dc43aa))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.2.0-1 (2025-05-16)

### 🩹 Fixes

- update path resolution for tree-sitter WASM files in production ([51079cc](https://github.com/unit-mesh/autodev-worker/commit/51079cc))

### ❤️ Thank You

- Phodal Huang @phodal

## 0.2.0-0 (2025-05-16)

This was a version bump only, there were no code changes.

## 0.1.0 (2025-05-16)

### 🚀 Features

- add isPublic field to projects for public visibility control ([9eacef7](https://github.com/unit-mesh/autodev-worker/commit/9eacef7))

### 🩹 Fixes

- **ci:** correct base ref for release workflow ([55c5cc8](https://github.com/unit-mesh/autodev-worker/commit/55c5cc8))

### ❤️ Thank You

- CGQAQ
- Phodal Huang @phodal

## 0.0.23 (2025-05-16)

### 🚀 Features

- add isPublic field to projects for public visibility control ([9eacef7](https://github.com/unit-mesh/autodev-worker/commit/9eacef7))

### 🩹 Fixes

- **ci:** correct base ref for release workflow ([55c5cc8](https://github.com/unit-mesh/autodev-worker/commit/55c5cc8))

### ❤️ Thank You

- CGQAQ
- Phodal Huang @phodal

## 0.0.22 (2025-05-16)

### 🩹 Fixes

- add back prepublishOnly ([52ab5bf](https://github.com/unit-mesh/autodev-workbench/commit/52ab5bf))

### ❤️ Thank You

- CGQAQ

## 0.0.21 (2025-05-16)

### 🚀 Features

- add ci cd config ([ad99e79](https://github.com/unit-mesh/autodev-workbench/commit/ad99e79))
- update layout and dependencies for improved UI and functionality ([d6c9fe1](https://github.com/unit-mesh/autodev-workbench/commit/d6c9fe1))
- implement expandable sections in SideNavigation and update TopNavigation item name ([ca9c4c5](https://github.com/unit-mesh/autodev-workbench/commit/ca9c4c5))
- implement interactive sections in Home component and update SideNavigation label ([afd06bf](https://github.com/unit-mesh/autodev-workbench/commit/afd06bf))
- redesign Home component layout with new sections and content for enhanced user experience ([4d31bf7](https://github.com/unit-mesh/autodev-workbench/commit/4d31bf7))
- 添加技术文档中心组件，支持生成项目文档和文档规范，展示现有文档 ([4444167](https://github.com/unit-mesh/autodev-workbench/commit/4444167))
- 添加首字母头像组件，优化规则卡片展示，使用首字母替代图片 ([307527b](https://github.com/unit-mesh/autodev-workbench/commit/307527b))
- 添加代理页面，包含搜索、筛选功能及首字母头像组件 ([fff06a9](https://github.com/unit-mesh/autodev-workbench/commit/fff06a9))
- 添加 Radix UI 相关依赖，支持标签和插槽功能 ([08f8f6b](https://github.com/unit-mesh/autodev-workbench/commit/08f8f6b))
- 添加编码规范页面，支持搜索和筛选功能，包含多种语言的编码规范 ([0162672](https://github.com/unit-mesh/autodev-workbench/commit/0162672))
- add select component and badge UI, implement framework page with API and component listings ([fd3bd9f](https://github.com/unit-mesh/autodev-workbench/commit/fd3bd9f))
- 添加平台上下文页面，支持搜索和分类筛选功能，展示各平台的AI能力与集成信息 ([8ce00c2](https://github.com/unit-mesh/autodev-workbench/commit/8ce00c2))
- 更新平台页面，重构内容结构，增强平台上下文和编码规范的展示 ([bf2b649](https://github.com/unit-mesh/autodev-workbench/commit/bf2b649))
- 更新用户触点和中间层内容，增强AI治理与度量模块的展示 ([d52ece3](https://github.com/unit-mesh/autodev-workbench/commit/d52ece3))
- update button and card components with new styles and variants; add tailwind configuration ([ff0e58a](https://github.com/unit-mesh/autodev-workbench/commit/ff0e58a))
- enhance SPARE framework page with new card components and improved layout; update styles and interactions ([9722588](https://github.com/unit-mesh/autodev-workbench/commit/9722588))
- refactor SPARE framework page to remove state management for pillar expansion; enhance layout and styling ([b57e858](https://github.com/unit-mesh/autodev-workbench/commit/b57e858))
- add link to insights page in metrics section; update side navigation for improved access to SPARE indicators analysis ([6596c78](https://github.com/unit-mesh/autodev-workbench/commit/6596c78))
- update SideNavigation items for clarity; add new Textarea component with styling ([44e05cc](https://github.com/unit-mesh/autodev-workbench/commit/44e05cc))
- update SideNavigation item name for consistency; remove commented code in page.tsx ([79a8d34](https://github.com/unit-mesh/autodev-workbench/commit/79a8d34))
- add service catalog link to SideNavigation for improved access ([d9f1500](https://github.com/unit-mesh/autodev-workbench/commit/d9f1500))
- refactor InputProps type definition and clean up unused imports in page.tsx ([e2528f4](https://github.com/unit-mesh/autodev-workbench/commit/e2528f4))
- rename "编码规范中心" to "规范中心" for consistency in page.tsx and SideNavigation ([1e4c9eb](https://github.com/unit-mesh/autodev-workbench/commit/1e4c9eb))
- update layout to grid for better responsiveness; add links to AutoDev plugin and documentation in IDE configuration section ([04b71bf](https://github.com/unit-mesh/autodev-workbench/commit/04b71bf))
- remove FAQ link from SideNavigation and update package.json with swagger-ui-react dependencies ([669eab5](https://github.com/unit-mesh/autodev-workbench/commit/669eab5))
- add brand styling to TopNavigation and define brand class in globals.css ([9d90bf3](https://github.com/unit-mesh/autodev-workbench/commit/9d90bf3))
- create VectorDBPage component with search and filter functionality for knowledge bases ([28397d6](https://github.com/unit-mesh/autodev-workbench/commit/28397d6))
- update CI/CD workflows to use pnpm and Node.js 20, improve build and deployment steps ([6b8e666](https://github.com/unit-mesh/autodev-workbench/commit/6b8e666))
- add core enums and interfaces for concept and knowledge asset models ([4dad6aa](https://github.com/unit-mesh/autodev-workbench/commit/4dad6aa))
- implement concept linking MVP with code extraction and validation features ([d8eaee8](https://github.com/unit-mesh/autodev-workbench/commit/d8eaee8))
- add custom hooks for mobile detection and toast notifications ([f801a7b](https://github.com/unit-mesh/autodev-workbench/commit/f801a7b))
- add next-themes and sonner dependencies to package.json ([05bb60f](https://github.com/unit-mesh/autodev-workbench/commit/05bb60f))
- add various code structure and utility types for language processing #1 ([#1](https://github.com/unit-mesh/autodev-workbench/issues/1))
- integrate language service provider and enhance input handling ([9bd58a7](https://github.com/unit-mesh/autodev-workbench/commit/9bd58a7))
- add rollup-plugin-copy for asset management and update main.ts for language service instantiation ([949aa98](https://github.com/unit-mesh/autodev-workbench/commit/949aa98))
- refactor language service and tree sitter loader for improved path handling and support checks ([089c841](https://github.com/unit-mesh/autodev-workbench/commit/089c841))
- update output paths to use 'dist' directory and refactor main function for language service readiness ([1091080](https://github.com/unit-mesh/autodev-workbench/commit/1091080))
- enable TypeScript declaration generation and update output settings for type files ([af6c5ce](https://github.com/unit-mesh/autodev-workbench/commit/af6c5ce))
- add Vitest for testing and update TypeScript configuration for test files ([b9f3782](https://github.com/unit-mesh/autodev-workbench/commit/b9f3782))
- enhance language service with structurer providers and update rollup configuration ([39883a9](https://github.com/unit-mesh/autodev-workbench/commit/39883a9))
- implement directory scanning and language detection for file processing ([24e0cc7](https://github.com/unit-mesh/autodev-workbench/commit/24e0cc7))
- add command line argument parsing for directory path and enhance interface processing ([9b000ec](https://github.com/unit-mesh/autodev-workbench/commit/9b000ec))
- add @modelcontextprotocol/sdk dependency to enhance functionality ([7f3f98e](https://github.com/unit-mesh/autodev-workbench/commit/7f3f98e))
- add architecture diagram and update README to include visual representation ([923c43d](https://github.com/unit-mesh/autodev-workbench/commit/923c43d))
- add detailed overview and getting started section to README ([e774fd9](https://github.com/unit-mesh/autodev-workbench/commit/e774fd9))
- add English architecture diagram to documentation ([4ceed5b](https://github.com/unit-mesh/autodev-workbench/commit/4ceed5b))
- add user input prompt for directory path scanning ([6b02075](https://github.com/unit-mesh/autodev-workbench/commit/6b02075))
- implement CodeAnalyzer for directory scanning and interface extraction ([c8cdca7](https://github.com/unit-mesh/autodev-workbench/commit/c8cdca7))
- enhance CodeAnalyzer to collect and display interface implementation relationships ([cb39e96](https://github.com/unit-mesh/autodev-workbench/commit/cb39e96))
- rename autodev-work to autodev-context-worker in package.json ([70a6c1d](https://github.com/unit-mesh/autodev-workbench/commit/70a6c1d))
- enhance CodeAnalyzer with class merging and structure creation methods ([fe84848](https://github.com/unit-mesh/autodev-workbench/commit/fe84848))
- enhance TypeScriptProfile and TypeScriptStructurer to support class inheritance and interface implementation ([09a5383](https://github.com/unit-mesh/autodev-workbench/commit/09a5383))
- enhance CodeAnalyzer to support class inheritance analysis and display ([95e33df](https://github.com/unit-mesh/autodev-workbench/commit/95e33df))
- enhance CodeAnalyzer to include position information in interface and class analysis results ([75825e0](https://github.com/unit-mesh/autodev-workbench/commit/75825e0))
- enhance CodeAnalyzer to improve class hierarchy analysis with detailed child information and position tracking ([187f89c](https://github.com/unit-mesh/autodev-workbench/commit/187f89c))
- save analysis results to a JSON file instead of logging to console ([a33f099](https://github.com/unit-mesh/autodev-workbench/commit/a33f099))
- add functionality to generate learning materials from code analysis results ([2419a59](https://github.com/unit-mesh/autodev-workbench/commit/2419a59))
- refactor CodeAnalyzer to use inferLanguage for file type detection and remove unused methods ([9e2d4c0](https://github.com/unit-mesh/autodev-workbench/commit/9e2d4c0))
- add CodeAnalysisResult interface with detailed position information for interfaces and classes ([4cac280](https://github.com/unit-mesh/autodev-workbench/commit/4cac280))
- restructure project by moving CodeAnalyzer and FileSystemScanner to separate files and updating import paths ([92f93e5](https://github.com/unit-mesh/autodev-workbench/commit/92f93e5))
- implement CodeAnalyzer and ICodeAnalyzer interfaces for code analysis and learning material generation ([484f044](https://github.com/unit-mesh/autodev-workbench/commit/484f044))
- add StreamingMarkdownCodeBlock and MarkdownCodeBlock classes for parsing and representing code blocks in Markdown ([45c2ae8](https://github.com/unit-mesh/autodev-workbench/commit/45c2ae8))
- add MarkdownAnalyser class for parsing Markdown files and extracting code blocks ([b395c33](https://github.com/unit-mesh/autodev-workbench/commit/b395c33))
- enhance CodeAnalyzer to support Markdown file analysis and extract code blocks ([1ef097e](https://github.com/unit-mesh/autodev-workbench/commit/1ef097e))
- enhance analyzeMarkdownFiles to generate structured output for extracted code blocks ([97bd07f](https://github.com/unit-mesh/autodev-workbench/commit/97bd07f))
- update package version to 0.0.4 and change main entry point to dist/autodev-context-worker.js ([7370067](https://github.com/unit-mesh/autodev-workbench/commit/7370067))
- remove unused dependencies from package.json ([bfc41ad](https://github.com/unit-mesh/autodev-workbench/commit/bfc41ad))
- add shebang to output file for node execution ([efc1842](https://github.com/unit-mesh/autodev-workbench/commit/efc1842))
- add shebang to output file for node execution ([7165ae7](https://github.com/unit-mesh/autodev-workbench/commit/7165ae7))
- remove code block file generation and update README with usage instructions ([3bb32dc](https://github.com/unit-mesh/autodev-workbench/commit/3bb32dc))
- enhance code parsing with language inference and improve context extraction ([7f15b86](https://github.com/unit-mesh/autodev-workbench/commit/7f15b86))
- update README to reflect project name change from AutoDev Work to AutoDev Context ([4fc3238](https://github.com/unit-mesh/autodev-workbench/commit/4fc3238))
- update .gitignore to include .vercel and specify package manager in package.json ([7b0fdac](https://github.com/unit-mesh/autodev-workbench/commit/7b0fdac))
- remove deployment badge from README ([fde24c4](https://github.com/unit-mesh/autodev-workbench/commit/fde24c4))
- add GET and POST endpoints for concept validation and knowledge base retrieval ([481c6cd](https://github.com/unit-mesh/autodev-workbench/commit/481c6cd))
- update code analysis result type and comment out output configuration in next.config.ts ([87edfe0](https://github.com/unit-mesh/autodev-workbench/commit/87edfe0))
- enhance command line parser to support upload option and API URL configuration; add POST endpoint for storing code analysis results ([cb5eb0d](https://github.com/unit-mesh/autodev-workbench/commit/cb5eb0d))
- replace Prisma adapter with Vercel Postgres client for code analysis result storage ([894e8b7](https://github.com/unit-mesh/autodev-workbench/commit/894e8b7))
- implement text conversion for code analysis results and update database schema ([d11b8fc](https://github.com/unit-mesh/autodev-workbench/commit/d11b8fc))
- improve error handling and logging in code analysis result upload; validate input data ([55f056b](https://github.com/unit-mesh/autodev-workbench/commit/55f056b))
- update convertToList method to return an array of analysis results; enhance data validation in route handler ([10e418d](https://github.com/unit-mesh/autodev-workbench/commit/10e418d))
- refactor markdown analysis to process code blocks individually; add context data fetching in component ([cd7253f](https://github.com/unit-mesh/autodev-workbench/commit/cd7253f))
- enhance code analysis result processing; add async handling and debug output for analysis results ([ad7130e](https://github.com/unit-mesh/autodev-workbench/commit/ad7130e))
- add state management for context data in page component ([b68b977](https://github.com/unit-mesh/autodev-workbench/commit/b68b977))
- add syntax highlighting for code blocks; integrate react-syntax-highlighter ([b27330b](https://github.com/unit-mesh/autodev-workbench/commit/b27330b))
- add TypeScript definitions for react-syntax-highlighter ([2f122d8](https://github.com/unit-mesh/autodev-workbench/commit/2f122d8))
- refactor context section layout and improve loading state handling ([a8cc9d4](https://github.com/unit-mesh/autodev-workbench/commit/a8cc9d4))
- simplify Concept component; remove unused state and integrate CodebaseContext and ConceptLinking ([99e9698](https://github.com/unit-mesh/autodev-workbench/commit/99e9698))
- add LLM provider and reply functionality; refactor TopNavigation and dropdown styles ([f0e9db2](https://github.com/unit-mesh/autodev-workbench/commit/f0e9db2))
- add DeekSeek model to model selector; remove GPT-4o-mini ([64ccbc7](https://github.com/unit-mesh/autodev-workbench/commit/64ccbc7))
- refactor components to use functional components and add data-slot attributes ([81f2d9b](https://github.com/unit-mesh/autodev-workbench/commit/81f2d9b))
- refactor CodebaseContext component layout and improve accessibility ([dc331fe](https://github.com/unit-mesh/autodev-workbench/commit/dc331fe))
- refactor CodebaseContext component layout and improve accessibility ([9e9ce54](https://github.com/unit-mesh/autodev-workbench/commit/9e9ce54))
- simplify object construction in CodeAnalyzer by reducing verbosity ([bbb8332](https://github.com/unit-mesh/autodev-workbench/commit/bbb8332))
- enhance convertToList and uploadResult methods to include target directory for relative paths ([09aa481](https://github.com/unit-mesh/autodev-workbench/commit/09aa481))
- add AI generation functionality for code analysis and enhance CodeAnalysis model ([38e2cdf](https://github.com/unit-mesh/autodev-workbench/commit/38e2cdf))
- implement single item AI generation and add MarkdownCodeBlock utility class ([6f8ace4](https://github.com/unit-mesh/autodev-workbench/commit/6f8ace4))
- update code analysis prompt to generate English output and improve clarity ([c1555ba](https://github.com/unit-mesh/autodev-workbench/commit/c1555ba))
- add Kotlin language support with profile and structurer provider ([8be79f4](https://github.com/unit-mesh/autodev-workbench/commit/8be79f4))
- refactor language profile imports and create LanguageProfileUtil class ([85f7b68](https://github.com/unit-mesh/autodev-workbench/commit/85f7b68))
- reorder imports in KotlinStructurerProvider for consistency ([c2cc74f](https://github.com/unit-mesh/autodev-workbench/commit/c2cc74f))
- enhance FileSystemScanner to respect ignore patterns and .gitignore files ([632374f](https://github.com/unit-mesh/autodev-workbench/commit/632374f))
- update KotlinProfile to use user_type for type identifiers ([2d8507b](https://github.com/unit-mesh/autodev-workbench/commit/2d8507b))
- make method body optional in KotlinProfile for improved flexibility ([73c0a60](https://github.com/unit-mesh/autodev-workbench/commit/73c0a60))
- remove optional function body from KotlinProfile for simplified structure ([f189e1e](https://github.com/unit-mesh/autodev-workbench/commit/f189e1e))
- enhance CodeAnalyzer to skip short code blocks and improve error handling in codebase context ([ce65ae2](https://github.com/unit-mesh/autodev-workbench/commit/ce65ae2))
- extend KotlinProfile to support constructor delegation and parameter handling ([da66e5e](https://github.com/unit-mesh/autodev-workbench/commit/da66e5e))
- enhance KotlinProfile and KotlinStructurerProvider to support interface structures and improve class handling ([6dcda81](https://github.com/unit-mesh/autodev-workbench/commit/6dcda81))
- bump version to 0.0.6 in package.json ([010632b](https://github.com/unit-mesh/autodev-workbench/commit/010632b))
- add PlantUMLPresenter tests and update dependencies in package.json ([21b3d02](https://github.com/unit-mesh/autodev-workbench/commit/21b3d02))
- add support for postgresqlExtensions and vector extension in schema.prisma ([2844b99](https://github.com/unit-mesh/autodev-workbench/commit/2844b99))
- refactor KotlinProfile to remove unused interface declaration handling ([c6c4923](https://github.com/unit-mesh/autodev-workbench/commit/c6c4923))
- enhance CodebaseContext with code viewing dialog and improved item display ([c30dd50](https://github.com/unit-mesh/autodev-workbench/commit/c30dd50))
- update CodebaseContext layout with improved item display and move View Code button to footer ([46c5c81](https://github.com/unit-mesh/autodev-workbench/commit/46c5c81))
- refactor CodebaseContext for improved layout and functionality, including enhanced code viewing options ([a77bb5d](https://github.com/unit-mesh/autodev-workbench/commit/a77bb5d))
- update ai-validator to use new reply utility and improve validation logic ([50199a3](https://github.com/unit-mesh/autodev-workbench/commit/50199a3))
- implement concept extraction API using nodejieba for enhanced concept analysis ([920a05f](https://github.com/unit-mesh/autodev-workbench/commit/920a05f))
- rename extractConcepts to englishExtractConcepts for clarity and update imports ([40a4371](https://github.com/unit-mesh/autodev-workbench/commit/40a4371))
- add .npmrc to enable building from source ([3cd6921](https://github.com/unit-mesh/autodev-workbench/commit/3cd6921))
- add preinstall script for nodejieba and update pnpm workspace dependencies ([86d837f](https://github.com/unit-mesh/autodev-workbench/commit/86d837f))
- implement embedding generation functions using OpenAI and GLM with caching ([1058c60](https://github.com/unit-mesh/autodev-workbench/commit/1058c60))
- add new dependencies for AI frontend generator and enhance chat functionality ([923f96e](https://github.com/unit-mesh/autodev-workbench/commit/923f96e))
- enhance code preview functionality to support HTML and adjust layout dimensions ([3b6d165](https://github.com/unit-mesh/autodev-workbench/commit/3b6d165))
- enhance coding standards management with new guidelines and editor modal ([ca70417](https://github.com/unit-mesh/autodev-workbench/commit/ca70417))
- initialize context-mcp project with basic structure and dependencies ([a22da93](https://github.com/unit-mesh/autodev-workbench/commit/a22da93))
- add migration script for default project and initial concept dictionary entries ([6d6c143](https://github.com/unit-mesh/autodev-workbench/commit/6d6c143))
- implement responsive layout with resizable panels for requirements workspace ([38812c6](https://github.com/unit-mesh/autodev-workbench/commit/38812c6))
- add manual document update and quality check functionality ([0880902](https://github.com/unit-mesh/autodev-workbench/commit/0880902))
- add guidelines fetching and display functionality to knowledge hub ([61d0005](https://github.com/unit-mesh/autodev-workbench/commit/61d0005))
- add guideline selection and tooltip functionality to knowledge hub ([519bff2](https://github.com/unit-mesh/autodev-workbench/commit/519bff2))
- add guideline selection and tooltip functionality to knowledge hub ([1154632](https://github.com/unit-mesh/autodev-workbench/commit/1154632))
- update Tailwind CSS configuration and styles for improved layout and theming ([2a49ab9](https://github.com/unit-mesh/autodev-workbench/commit/2a49ab9))
- enhance Rust profile structure query and integrate Rust structurer ([555ecf8](https://github.com/unit-mesh/autodev-workbench/commit/555ecf8))
- enhance Rust structuring logic to support parameter parsing and structure merging ([ff35d5e](https://github.com/unit-mesh/autodev-workbench/commit/ff35d5e))
- refactor Rust structurer to improve parameter handling and structure merging ([30ab8fa](https://github.com/unit-mesh/autodev-workbench/commit/30ab8fa))
- add C language profile and integrate with language service provider ([76f0982](https://github.com/unit-mesh/autodev-workbench/commit/76f0982))
- enhance C# profile structure and integrate CsharpStructurer ([4070483](https://github.com/unit-mesh/autodev-workbench/commit/4070483))
- rename CsharpProfile and CsharpStructurer to CSharpProfile and CSharpStructurer for consistency ([545e732](https://github.com/unit-mesh/autodev-workbench/commit/545e732))
- refactor main.ts to modularize CLI and analysis logic ([c90a9d3](https://github.com/unit-mesh/autodev-workbench/commit/c90a9d3))
- add C++ language profile with query definitions and structure handling ([64dd70d](https://github.com/unit-mesh/autodev-workbench/commit/64dd70d))
- update C++ profile to support struct specifications and enhance namespace handling ([e5518f1](https://github.com/unit-mesh/autodev-workbench/commit/e5518f1))
- add AstGrepTool and RipGrepTool implementations for enhanced file searching capabilities ([3330219](https://github.com/unit-mesh/autodev-workbench/commit/3330219))
- implement ListFileTool for directory listing and enhance AstGrepTool and RipGrepTool with usage and name methods ([d5f9fab](https://github.com/unit-mesh/autodev-workbench/commit/d5f9fab))
- add findRipgrepBinary function to locate ripgrep binary across platforms ([425d895](https://github.com/unit-mesh/autodev-workbench/commit/425d895))
- update arch.svg to enhance layout and add new elements for improved visualization ([b4557c5](https://github.com/unit-mesh/autodev-workbench/commit/b4557c5))
- enhance regexSearchFiles to include option for excluding node_modules and improve path formatting in output ([67dd787](https://github.com/unit-mesh/autodev-workbench/commit/67dd787))
- add support for locating rgPath in regexSearchFiles and update pnpm workspace to include vscode-ripgrep ([5bcf813](https://github.com/unit-mesh/autodev-workbench/commit/5bcf813))
- add backend rule examples, in cursor mdc format ([a018301](https://github.com/unit-mesh/autodev-workbench/commit/a018301))
- add backend rule examples, in cursor mdc format ([eae17b3](https://github.com/unit-mesh/autodev-workbench/commit/eae17b3))
- update project name from AutoDev Work to AutoDev Workbench in metadata and content ([c48cd4c](https://github.com/unit-mesh/autodev-workbench/commit/c48cd4c))
- enhance SideNavigation with collapsible sections and improved item organization ([f705978](https://github.com/unit-mesh/autodev-workbench/commit/f705978))
- enhance project generator with AI-driven project configuration and improved feature selection ([2c0fb0b](https://github.com/unit-mesh/autodev-workbench/commit/2c0fb0b))
- update AI project description input with Enter key functionality and improve layout ([9c5801c](https://github.com/unit-mesh/autodev-workbench/commit/9c5801c))
- update project template generation to return JSON configuration and improve UI elements ([00e5835](https://github.com/unit-mesh/autodev-workbench/commit/00e5835))
- enhance framework selection with legacy version support and update JSON generation prompt ([e51174d](https://github.com/unit-mesh/autodev-workbench/commit/e51174d))
- add AI requirement analysis feature and default requirement prompt ([4e9989d](https://github.com/unit-mesh/autodev-workbench/commit/4e9989d))
- refactor input handling by replacing Textarea with InputWithSend component for improved user experience ([77c0158](https://github.com/unit-mesh/autodev-workbench/commit/77c0158))
- add keyword analysis functionality to InputWithSend component ([e20be9b](https://github.com/unit-mesh/autodev-workbench/commit/e20be9b))
- improve user guidance and input handling in requirements workspace ([4aad57d](https://github.com/unit-mesh/autodev-workbench/commit/4aad57d))
- clean up keyword analysis logic by removing unnecessary comments and console logs ([b95eb17](https://github.com/unit-mesh/autodev-workbench/commit/b95eb17))
- add PlantUML and Mermaid rendering components for enhanced diagram support ([73e6bc2](https://github.com/unit-mesh/autodev-workbench/commit/73e6bc2))
- refactor MindNode and GenifyMarkdownRender for improved code clarity and consistency ([5bd613e](https://github.com/unit-mesh/autodev-workbench/commit/5bd613e))
- update input component styles and loading indicators for better user experience ([41e3516](https://github.com/unit-mesh/autodev-workbench/commit/41e3516))
- enhance markdown rendering with custom styles and components ([11c28e3](https://github.com/unit-mesh/autodev-workbench/commit/11c28e3))
- improve code formatting and structure in RequirementsWorkspace component ([ff017b3](https://github.com/unit-mesh/autodev-workbench/commit/ff017b3))
- enhance styling and structure in globals.css and requirements-workspace.tsx ([89bf325](https://github.com/unit-mesh/autodev-workbench/commit/89bf325))
- adjust markdown paragraph spacing and refine type definition in GenifyMarkdownRender ([97af48f](https://github.com/unit-mesh/autodev-workbench/commit/97af48f))
- enhance layout and interaction in RequirementsWorkspace component ([6c84f70](https://github.com/unit-mesh/autodev-workbench/commit/6c84f70))
- add keyword extraction functionality and display in KnowledgeHub ([c362304](https://github.com/unit-mesh/autodev-workbench/commit/c362304))
- implement concept validation API and enhance keyword matching in KnowledgeHub ([f5377fb](https://github.com/unit-mesh/autodev-workbench/commit/f5377fb))
- integrate AI concept validation and enhance keyword matching in KnowledgeHub ([d0eea73](https://github.com/unit-mesh/autodev-workbench/commit/d0eea73))
- update navigation item name from '首页' to '驾驶舱' in TopNavigation ([302fa62](https://github.com/unit-mesh/autodev-workbench/commit/302fa62))
- add RestApiAnalyser and its implementations for Java and Kotlin Spring Controllers ([885ad63](https://github.com/unit-mesh/autodev-workbench/commit/885ad63))
- initialize TypeScript project with basic configuration and structure #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- implement ProtoConverter and PackageHierarchy for API resource management #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- integrate AIAssistant into layout and update navigation for improved user interaction ([591cb21](https://github.com/unit-mesh/autodev-workbench/commit/591cb21))
- replace inline markdown rendering with GenifyMarkdownRender component for improved content display ([7706231](https://github.com/unit-mesh/autodev-workbench/commit/7706231))
- add ProtoAnalyser class for analyzing .proto files and exporting data structures ([d5a30b8](https://github.com/unit-mesh/autodev-workbench/commit/d5a30b8))
- enhance JavaStructurerProvider to capture method modifiers and prevent duplicate method entries ([7340608](https://github.com/unit-mesh/autodev-workbench/commit/7340608))
- update RestApiAnalyser and its subclasses to improve API resource extraction and analysis ([7f9fe7d](https://github.com/unit-mesh/autodev-workbench/commit/7f9fe7d))
- enhance Java analysis to support class and method annotations #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- prevent duplicate class annotations in JavaStructurerProvider #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- update RestApiAnalyser to return ApiResource[] and enhance annotation handling in JavaStructurerProvider #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- enhance Java annotation handling to prevent duplicates and improve structure #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- enhance Kotlin annotation handling for classes and methods #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- enhance AI assistant panel with new core operations and improved layout ([59f8be2](https://github.com/unit-mesh/autodev-workbench/commit/59f8be2))
- add ProtoApiResourceGenerator for generating API resources from proto data structures ([79dce09](https://github.com/unit-mesh/autodev-workbench/commit/79dce09))
- enhance InterfaceAnalyzerApp with API result uploads and refactor server URL handling #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- implement GET and POST endpoints for ApiResource management ([c732cd4](https://github.com/unit-mesh/autodev-workbench/commit/c732cd4))
- add code context and protobuf handling to run method in InterfaceAnalyzerApp #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- refactor context handling in InterfaceAnalyzerApp and update CLI options for context type #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- update vscode-ripgrep dependency and refactor scanProtoFiles to async ([9d965ee](https://github.com/unit-mesh/autodev-workbench/commit/9d965ee))
- add id generation for ApiResource entries and update insert query ([44fb0dc](https://github.com/unit-mesh/autodev-workbench/commit/44fb0dc))
- add API resources fetching and integrate into implicit knowledge generation ([6b2c2df](https://github.com/unit-mesh/autodev-workbench/commit/6b2c2df))
- implement file searching functionality with ripgrep and fzf integration ([24beba2](https://github.com/unit-mesh/autodev-workbench/commit/24beba2))
- add HttpApiAnalyser for API resource analysis and integrate with CodeAnalyzer #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- enhance HttpApiAnalyser with constructor logging and refactor analysers retrieval #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- refactor PlatformEngFlow component and update sidebar navigation state management ([64d9b30](https://github.com/unit-mesh/autodev-workbench/commit/64d9b30))
- enhance Home component with a call-to-action section and improve layout in knowledge hub ([f8373a1](https://github.com/unit-mesh/autodev-workbench/commit/f8373a1))
- update Home component to add project creation functionality and improve user interaction ([1e26186](https://github.com/unit-mesh/autodev-workbench/commit/1e26186))
- integrate authentication provider and add user authentication button in navigation ([7bc0618](https://github.com/unit-mesh/autodev-workbench/commit/7bc0618))
- remove unused profile and settings links from user authentication dropdown ([c9a3787](https://github.com/unit-mesh/autodev-workbench/commit/c9a3787))
- add User model and integrate default project creation on user sign-up #15 ([#15](https://github.com/unit-mesh/autodev-workbench/issues/15))
- add Account, Session, and VerificationRequest models to schema ([781931c](https://github.com/unit-mesh/autodev-workbench/commit/781931c))
- add secret configuration to auth and update env.example ([7ae1945](https://github.com/unit-mesh/autodev-workbench/commit/7ae1945))
- enhance project creation form with validation and structured state management ([0a168bb](https://github.com/unit-mesh/autodev-workbench/commit/0a168bb))
- add Account, Session, and VerificationToken models to schema align to https://authjs.dev/getting-started/adapters/prisma ([35f8f5b](https://github.com/unit-mesh/autodev-workbench/commit/35f8f5b))
- update CLI command in project creation success message to include project ID and code base path ([e3e53aa](https://github.com/unit-mesh/autodev-workbench/commit/e3e53aa))
- enhance project retrieval and user authentication UI with project listing and user profile options ([efa7b16](https://github.com/unit-mesh/autodev-workbench/commit/efa7b16))
- refactor project detail page to use Promise for params and centralize Prisma client initialization #32 ([#32](https://github.com/unit-mesh/autodev-workbench/issues/32))
- add project ID display and copy functionality to project cards; implement edit dialog for project details #32 ([#32](https://github.com/unit-mesh/autodev-workbench/issues/32))
- add project ID handling in API requests and CLI options ([c8f191c](https://github.com/unit-mesh/autodev-workbench/commit/c8f191c))
- update CLI command to use project ID and add copy functionality in project detail #32 ([#32](https://github.com/unit-mesh/autodev-workbench/issues/32))
- add guideline creation modal and integrate with project detail view ([7b9c547](https://github.com/unit-mesh/autodev-workbench/commit/7b9c547))
- fetch default project on user session and display login prompt if not authenticated ([4c2e00e](https://github.com/unit-mesh/autodev-workbench/commit/4c2e00e))
- update API endpoints and refactor CLI command display ([654d4da](https://github.com/unit-mesh/autodev-workbench/commit/654d4da))
- add publish-all ([3092882](https://github.com/unit-mesh/autodev-workbench/commit/3092882))
- **ci:** add pull request trigger for CI/CD workflow ([919e303](https://github.com/unit-mesh/autodev-workbench/commit/919e303))
- **code-analyzer:** enhance file initialization with optional filtering and return parsed files #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- **concepts:** add concept dictionary CRUD operations ([487427f](https://github.com/unit-mesh/autodev-workbench/commit/487427f))
- **context-mcp:** initialize context-mcp package with core setup ([9c96543](https://github.com/unit-mesh/autodev-workbench/commit/9c96543))
- **context-mcp:** add MCP client and server implementations ([af22c77](https://github.com/unit-mesh/autodev-workbench/commit/af22c77))
- **context-mcp:** refactor MCPServerImpl with new transports ([b7e4cd7](https://github.com/unit-mesh/autodev-workbench/commit/b7e4cd7))
- **context-mcp:** add configurable HTTP server options ([b44bc20](https://github.com/unit-mesh/autodev-workbench/commit/b44bc20))
- **context-mcp:** add stop and destroy methods to MCPServerImpl ([4d255e1](https://github.com/unit-mesh/autodev-workbench/commit/4d255e1))
- **context-mcp:** refactor MCPServerImpl initialization and lifecycle ([fff4099](https://github.com/unit-mesh/autodev-workbench/commit/fff4099))
- **context-mcp:** add modular capabilities system with prompts, tools, and resources ([ad89ae4](https://github.com/unit-mesh/autodev-workbench/commit/ad89ae4))
- **context-mcp:** add GitHub PR list tool for fetching PRs ([41877bf](https://github.com/unit-mesh/autodev-workbench/commit/41877bf))
- **context-mcp:** add GitHub PR comment tool for comment management ([82f813e](https://github.com/unit-mesh/autodev-workbench/commit/82f813e))
- **context-mcp:** add prompt for reviewing pull request changes ([7ff4ac8](https://github.com/unit-mesh/autodev-workbench/commit/7ff4ac8))
- **context-mcp:** add GitHub PR review prompt with detailed guidelines ([bb01a36](https://github.com/unit-mesh/autodev-workbench/commit/bb01a36))
- **context-mcp:** add GitLab merge request tools ([f89356f](https://github.com/unit-mesh/autodev-workbench/commit/f89356f))
- **context-mcp:** improve capability installation and server API ([61880db](https://github.com/unit-mesh/autodev-workbench/commit/61880db))
- **go-structurer:** enhance GoStructurerProvider with field extraction and structure initialization #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- **interface-analyzer:** update controller filter to use includes and add config logging and closed #24 ([#24](https://github.com/unit-mesh/autodev-workbench/issues/24))
- **knowledge-graph:** add interactive knowledge graph popup ([3f43cd4](https://github.com/unit-mesh/autodev-workbench/commit/3f43cd4))
- **tool:** add Tool interface with methods for name, description, and execution ([314df10](https://github.com/unit-mesh/autodev-workbench/commit/314df10))
- **web:** remove ConceptLinking component ([25bb80b](https://github.com/unit-mesh/autodev-workbench/commit/25bb80b))
- **web:** support cockpit chat stream ([878e2be](https://github.com/unit-mesh/autodev-workbench/commit/878e2be))
- **web:** add DevDocs UI ([41dbe06](https://github.com/unit-mesh/autodev-workbench/commit/41dbe06))

### 🩹 Fixes

- update branch name from main to master in CI/CD workflow ([379ed75](https://github.com/unit-mesh/autodev-workbench/commit/379ed75))
- ensure custom domain setup creates directory before adding CNAME ([f576ce1](https://github.com/unit-mesh/autodev-workbench/commit/f576ce1))
- 修复布局样式，调整背景颜色和侧边导航结构 ([bdfbdb3](https://github.com/unit-mesh/autodev-workbench/commit/bdfbdb3))
- change preinstall script to install script for nodejieba in package.json ([1ea7656](https://github.com/unit-mesh/autodev-workbench/commit/1ea7656))
- remove redundant install script for nodejieba in package.json ([9adb240](https://github.com/unit-mesh/autodev-workbench/commit/9adb240))
- downgrade nodejieba version from 3.4.4 to 3.4.3 in package.json and pnpm-lock.yaml ([543a6eb](https://github.com/unit-mesh/autodev-workbench/commit/543a6eb))
- update concept extraction logic to use the correct variable in handleExtractConcepts function ([12b1dc0](https://github.com/unit-mesh/autodev-workbench/commit/12b1dc0))
- remove commented code and unnecessary comments in page.tsx ([539ece9](https://github.com/unit-mesh/autodev-workbench/commit/539ece9))
- remove unnecessary gradient classes from page layout ([4f26ac0](https://github.com/unit-mesh/autodev-workbench/commit/4f26ac0))
- update response handling in chat API and improve code generation logic ([61772c8](https://github.com/unit-mesh/autodev-workbench/commit/61772c8))
- simplify iframe handling in code preview and adjust layout dimensions ([dcb0fac](https://github.com/unit-mesh/autodev-workbench/commit/dcb0fac))
- update code block extraction to use the last code block for generation ([c0dd849](https://github.com/unit-mesh/autodev-workbench/commit/c0dd849))
- suppress TypeScript errors for Babel import in code transpiler ([a76d351](https://github.com/unit-mesh/autodev-workbench/commit/a76d351))
- update card title in concept linking to reflect correct terminology ([ab1b204](https://github.com/unit-mesh/autodev-workbench/commit/ab1b204))
- build now works ([19612ed](https://github.com/unit-mesh/autodev-workbench/commit/19612ed))
- improve layout by adding overflow handling to tabs component ([96e731a](https://github.com/unit-mesh/autodev-workbench/commit/96e731a))
- adjust layout by removing fixed width from AI assistant panel ([f348e0f](https://github.com/unit-mesh/autodev-workbench/commit/f348e0f))
- improve padding and layout consistency across AI assistant and knowledge hub components ([6434d30](https://github.com/unit-mesh/autodev-workbench/commit/6434d30))
- adjust padding in TopNavigation component for improved layout ([3aa18ae](https://github.com/unit-mesh/autodev-workbench/commit/3aa18ae))
- type error in requirement-cockpit ([c24f222](https://github.com/unit-mesh/autodev-workbench/commit/c24f222))
- restore document content ([34097d5](https://github.com/unit-mesh/autodev-workbench/commit/34097d5))
- Fix conversationId value ([fbee263](https://github.com/unit-mesh/autodev-workbench/commit/fbee263))
- Add missing dependencies ([49c0e8f](https://github.com/unit-mesh/autodev-workbench/commit/49c0e8f))
- Add line breaks and end ([65389eb](https://github.com/unit-mesh/autodev-workbench/commit/65389eb))
- use PrismaClient instead @vercel/postgres client in guideline route ([3828a6d](https://github.com/unit-mesh/autodev-workbench/commit/3828a6d))
- use PrismaClient instead @vercel/postgres client in guideline route ([b8200a0](https://github.com/unit-mesh/autodev-workbench/commit/b8200a0))
- update moduleResolution to 'node' and clean up tsconfig.json includes ([83b22e8](https://github.com/unit-mesh/autodev-workbench/commit/83b22e8))
- vitest config ([7fb474d](https://github.com/unit-mesh/autodev-workbench/commit/7fb474d))
- update API endpoint for context data fetching ([815cf9a](https://github.com/unit-mesh/autodev-workbench/commit/815cf9a))
- add error handling for file reading and parsing in analysis process ([4267924](https://github.com/unit-mesh/autodev-workbench/commit/4267924))
- type error ([7ab0441](https://github.com/unit-mesh/autodev-workbench/commit/7ab0441))
- update comment format in migration_lock.toml ([51b7814](https://github.com/unit-mesh/autodev-workbench/commit/51b7814))
- remove unused Link import in UserAuthButton component ([713fbac](https://github.com/unit-mesh/autodev-workbench/commit/713fbac))
- **ci:** remove wildcard branch trigger from pull request configuration ([95537ba](https://github.com/unit-mesh/autodev-workbench/commit/95537ba))
- **web:** update eventStream type for response body ([fd7fb29](https://github.com/unit-mesh/autodev-workbench/commit/fd7fb29))

### ❤️ Thank You

- abel @whatled
- CGQAQ
- Fengda Huang @phodal
- JayClock @JayClock
- Phodal Huang @phodal
- zhenxgs2018 @zhengxs2018
- zjh7890
