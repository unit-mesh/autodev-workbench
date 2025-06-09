'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var core = require('@actions/core');
var rest = require('@octokit/rest');
var githubAgent = require('@autodev/github-agent');
var express = require('express');
var webhooks = require('@octokit/webhooks');
var github = require('@actions/github');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var core__namespace = /*#__PURE__*/_interopNamespaceDefault(core);
var github__namespace = /*#__PURE__*/_interopNamespaceDefault(github);

class IssueAnalyzer {
    constructor(context) {
        this.context = context;
        // Initialize services using the same pattern as analyze-issue.js
        this.githubService = new githubAgent.GitHubService(context.config.githubToken);
        this.contextAnalyzer = new githubAgent.ContextAnalyzer(context.workspacePath);
        this.reportGenerator = new githubAgent.AnalysisReportGenerator(context.config.githubToken);
        this.llmService = new githubAgent.LLMService();
        // Default label configuration
        this.labelConfig = {
            bugLabel: 'bug',
            featureLabel: 'enhancement',
            documentationLabel: 'documentation',
            enhancementLabel: 'enhancement',
            questionLabel: 'question',
            analysisCompleteLabel: 'analysis-complete'
        };
    }
    /**
     * Analyze an issue using the same logic as analyze-issue.js
     */
    async analyzeIssue(options = {}) {
        const startTime = Date.now();
        try {
            console.log(`🔍 Starting analysis for issue #${this.context.issueNumber} in ${this.context.owner}/${this.context.repo}`);
            // Step 1: Get the issue (same as analyze-issue.js line 327)
            const issue = await this.githubService.getIssue(this.context.owner, this.context.repo, this.context.issueNumber);
            console.log(`📋 Issue: "${issue.title}"`);
            // Step 2: Fetch URL content if enabled (same as analyze-issue.js line 360)
            let urlContent = [];
            if (options.includeCodeSearch !== false && issue.body) {
                try {
                    urlContent = await githubAgent.fetchUrlsFromIssue(issue.body, 10000);
                    console.log(`🔗 Fetched content from ${urlContent.length} URLs`);
                }
                catch (error) {
                    console.warn('URL fetching failed:', error);
                }
            }
            // Step 3: Enhance issue with URL content (same as analyze-issue.js line 384)
            const enhancedIssue = {
                ...issue,
                urlContent: urlContent
            };
            // Step 4: Perform the analysis (same as analyze-issue.js line 391)
            const analysisResult = await this.contextAnalyzer.analyzeIssue(enhancedIssue);
            // Step 5: Generate comprehensive report (same as analyze-issue.js line 408)
            const { report } = await this.reportGenerator.generateAndUploadReport(this.context.owner, this.context.repo, this.context.issueNumber, analysisResult, {
                uploadToGitHub: false, // We'll handle comment separately
                language: 'en',
                includeFileContent: options.includeCodeSearch !== false,
                maxFiles: 10
            });
            // Use the generated report as our analysis result
            const result = {
                success: true,
                analysisResult: {
                    text: report, // This is the detailed analysis text
                    analysisResult: analysisResult,
                    executionTime: Date.now() - startTime
                },
                executionTime: Date.now() - startTime
            };
            // Generate labels based on the analysis
            const recommendedLabels = this.extractLabelsFromAnalysis(report);
            result.labelsAdded = recommendedLabels;
            console.log(`✅ Analysis completed in ${result.executionTime}ms`);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ Analysis failed:', errorMessage);
            return {
                success: false,
                error: errorMessage,
                executionTime: Date.now() - startTime
            };
        }
    }
    /**
     * Extract labels from analysis text using simple pattern matching
     */
    extractLabelsFromAnalysis(analysisText) {
        const labels = [];
        // Convert to lowercase for pattern matching
        const text = analysisText.toLowerCase();
        // Pattern matching for different types of issues
        if (text.includes('bug') || text.includes('error') || text.includes('issue') || text.includes('problem')) {
            labels.push(this.labelConfig.bugLabel || 'bug');
        }
        if (text.includes('enhancement') || text.includes('feature') || text.includes('improve')) {
            labels.push(this.labelConfig.enhancementLabel || 'enhancement');
        }
        if (text.includes('documentation') || text.includes('docs') || text.includes('readme')) {
            labels.push(this.labelConfig.documentationLabel || 'documentation');
        }
        if (text.includes('question') || text.includes('help') || text.includes('how to')) {
            labels.push(this.labelConfig.questionLabel || 'question');
        }
        // Complexity assessment
        if (text.includes('complex') || text.includes('difficult') || text.includes('challenging')) {
            labels.push('complex');
        }
        // Always add analysis complete label
        if (this.labelConfig.analysisCompleteLabel) {
            labels.push(this.labelConfig.analysisCompleteLabel);
        }
        // Remove duplicates
        return [...new Set(labels)];
    }
    /**
     * Generate comment text for the issue using LLM (similar to agent.ts approach)
     */
    async generateComment(analysisResult) {
        if (!analysisResult || !analysisResult.analysisResult) {
            return `## 🤖 Automated Issue Analysis

Analysis completed successfully. Please check the analysis results for detailed information.

---
*This analysis was generated automatically by AutoDev GitHub Agent*`;
        }
        // Try to generate enhanced comment using LLM
        try {
            if (this.llmService.isAvailable()) {
                const comment = await this.generateEnhancedComment(analysisResult);
                return comment;
            }
            else {
                console.log('LLM service not available, using enhanced formatting');
                return this.generateEnhancedFormattedComment(analysisResult);
            }
        }
        catch (error) {
            console.warn('Failed to generate enhanced comment, falling back to basic format:', error);
            // Fallback to using the report text directly
            return `## 🤖 Automated Issue Analysis

${analysisResult.text || 'Analysis completed successfully.'}

**Analysis completed in:** ${analysisResult.executionTime || 'N/A'}ms

---
*This analysis was generated automatically by AutoDev GitHub Agent*`;
        }
    }
    /**
     * Generate enhanced comment using LLM
     */
    async generateEnhancedComment(analysisResult) {
        const issue = analysisResult.analysisResult?.issue;
        const analysis = analysisResult.analysisResult;
        if (!issue || !analysis) {
            throw new Error('Missing issue or analysis data for LLM comment generation');
        }
        try {
            // Create a mock issue for the LLM service
            const mockIssue = {
                ...issue,
                number: this.context.issueNumber,
                state: 'open',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                html_url: `https://github.com/${this.context.owner}/${this.context.repo}/issues/${this.context.issueNumber}`,
                labels: issue.labels || []
            };
            // Use the existing LLM service to generate analysis report
            const llmReport = await this.llmService.generateAnalysisReport(mockIssue, analysis);
            // Format the LLM report as a GitHub comment
            const comment = this.formatLLMReportAsComment(llmReport, analysisResult);
            return comment;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn('LLM service failed:', errorMessage);
            throw new Error(`LLM comment generation failed: ${errorMessage}`);
        }
    }
    /**
     * Generate enhanced formatted comment without LLM
     */
    generateEnhancedFormattedComment(analysisResult) {
        const analysis = analysisResult.analysisResult;
        const sections = [];
        // Header
        sections.push('## 🤖 Automated Issue Analysis');
        sections.push('');
        // Summary
        if (analysis?.summary) {
            sections.push('### 📋 Summary');
            sections.push(analysis.summary);
            sections.push('');
        }
        // Files analyzed
        if (analysis?.relatedCode?.files && analysis.relatedCode.files.length > 0) {
            sections.push('### 📁 Relevant Files');
            const topFiles = analysis.relatedCode.files.slice(0, 5);
            topFiles.forEach((file) => {
                sections.push(`- \`${file.path}\``);
            });
            if (analysis.relatedCode.files.length > 5) {
                sections.push(`- ... and ${analysis.relatedCode.files.length - 5} more files`);
            }
            sections.push('');
        }
        // Suggestions
        if (analysis?.suggestions && analysis.suggestions.length > 0) {
            sections.push('### 💡 Recommendations');
            analysis.suggestions.forEach((suggestion, index) => {
                const desc = suggestion.description || suggestion;
                sections.push(`${index + 1}. ${desc}`);
            });
            sections.push('');
        }
        // Original report content if available
        if (analysisResult.text) {
            sections.push('### 📊 Detailed Analysis');
            sections.push(analysisResult.text);
            sections.push('');
        }
        // Execution info
        if (analysisResult.executionTime) {
            sections.push(`**Analysis completed in:** ${analysisResult.executionTime}ms`);
            sections.push('');
        }
        // Footer
        sections.push('---');
        sections.push('*This analysis was generated automatically by [AutoDev GitHub Agent](https://github.com/unit-mesh/autodev-worker)*');
        return sections.join('\n');
    }
    /**
     * Format LLM analysis report as a GitHub comment
     */
    formatLLMReportAsComment(llmReport, analysisResult) {
        const sections = [];
        // Header
        sections.push('## 🤖 Automated Issue Analysis');
        sections.push('');
        // Summary
        if (llmReport.summary) {
            sections.push('### 📋 Summary');
            sections.push(llmReport.summary);
            sections.push('');
        }
        // Current Issues
        if (llmReport.current_issues && llmReport.current_issues.length > 0) {
            sections.push('### 🔍 Issues Identified');
            llmReport.current_issues.forEach((issue) => {
                sections.push(`- ${issue}`);
            });
            sections.push('');
        }
        // Recommendations
        if (llmReport.recommendations && llmReport.recommendations.length > 0) {
            sections.push('### 💡 Recommendations');
            llmReport.recommendations.forEach((rec, index) => {
                sections.push(`${index + 1}. ${rec}`);
            });
            sections.push('');
        }
        // Detailed Plan
        if (llmReport.detailed_plan && llmReport.detailed_plan.steps && llmReport.detailed_plan.steps.length > 0) {
            sections.push('### 📝 Implementation Plan');
            llmReport.detailed_plan.steps.forEach((step, index) => {
                sections.push(`#### ${index + 1}. ${step.title}`);
                if (step.description) {
                    sections.push(step.description);
                }
                if (step.files_to_modify && step.files_to_modify.length > 0) {
                    sections.push(`**Files to modify:** ${step.files_to_modify.join(', ')}`);
                }
                if (step.changes_needed && step.changes_needed.length > 0) {
                    sections.push('**Changes needed:**');
                    step.changes_needed.forEach((change) => {
                        sections.push(`- ${change}`);
                    });
                }
                sections.push('');
            });
        }
        // Execution info
        if (analysisResult.executionTime) {
            sections.push(`**Analysis completed in:** ${analysisResult.executionTime}ms`);
            sections.push('');
        }
        // Footer
        sections.push('---');
        sections.push('*This analysis was generated automatically by [AutoDev GitHub Agent](https://github.com/unit-mesh/autodev-worker)*');
        return sections.join('\n');
    }
    /**
     * Update label configuration
     */
    setLabelConfig(config) {
        this.labelConfig = { ...this.labelConfig, ...config };
    }
}

class GitHubActionService {
    constructor(config) {
        // Get configuration from GitHub Actions inputs or environment
        this.config = this.loadConfig(config);
        // Initialize Octokit with GitHub token
        this.octokit = new rest.Octokit({
            auth: this.config.githubToken
        });
        console.log('🔧 GitHub Action Service initialized');
        console.log(`📁 Workspace: ${this.config.workspacePath}`);
        console.log(`🤖 Auto Comment: ${this.config.autoComment}`);
        console.log(`🏷️ Auto Label: ${this.config.autoLabel}`);
    }
    /**
     * Load configuration from GitHub Actions inputs or environment
     */
    loadConfig(overrides) {
        const config = {
            githubToken: this.getInput('github-token') || process.env.GITHUB_TOKEN || '',
            workspacePath: this.getInput('workspace-path') || process.env.GITHUB_WORKSPACE || process.cwd(),
            webhookSecret: this.getInput('webhook-secret') || process.env.WEBHOOK_SECRET,
            autoComment: this.getBooleanInput('auto-comment') ?? true,
            autoLabel: this.getBooleanInput('auto-label') ?? true,
            analysisDepth: this.getInput('analysis-depth') || 'medium',
            triggerEvents: this.getInput('trigger-events')?.split(',') || ['opened', 'edited', 'reopened'],
            excludeLabels: this.getInput('exclude-labels')?.split(',').filter(Boolean) || [],
            includeLabels: this.getInput('include-labels')?.split(',').filter(Boolean) || [],
            ...overrides
        };
        if (!config.githubToken) {
            throw new Error('GitHub token is required. Set GITHUB_TOKEN environment variable or github-token input.');
        }
        // Set LLM API keys as environment variables for the underlying github-agent
        const openaiKey = this.getInput('openai-api-key') || process.env.OPENAI_API_KEY;
        const deepseekToken = this.getInput('deepseek-token') || process.env.DEEPSEEK_TOKEN;
        const glmToken = this.getInput('glm-token') || process.env.GLM_TOKEN;
        if (openaiKey) {
            process.env.OPENAI_API_KEY = openaiKey;
        }
        if (deepseekToken) {
            process.env.DEEPSEEK_TOKEN = deepseekToken;
        }
        if (glmToken) {
            process.env.GLM_TOKEN = glmToken;
        }
        return config;
    }
    /**
     * Get input value (works in both GitHub Actions and standalone mode)
     */
    getInput(name) {
        try {
            return core__namespace.getInput(name);
        }
        catch {
            // Fallback for standalone mode
            return process.env[name.toUpperCase().replace('-', '_')] || '';
        }
    }
    /**
     * Get boolean input value
     */
    getBooleanInput(name) {
        const value = this.getInput(name);
        if (!value)
            return undefined;
        return value.toLowerCase() === 'true';
    }
    /**
     * Process an issue with simplified options
     */
    async processIssue(options) {
        const context = {
            owner: options.owner,
            repo: options.repo,
            issueNumber: options.issueNumber,
            eventType: 'manual',
            action: options.action || 'analyze',
            workspacePath: this.config.workspacePath,
            config: {
                ...this.config,
                autoComment: options.autoComment ?? this.config.autoComment,
                autoLabel: options.autoLabel ?? this.config.autoLabel,
                analysisDepth: options.depth || this.config.analysisDepth
            }
        };
        return this.processIssueWithContext(context);
    }
    /**
     * Process an issue with full context
     */
    async processIssueWithContext(context) {
        try {
            console.log(`🔍 Processing issue #${context.issueNumber} in ${context.owner}/${context.repo}`);
            // Validate issue exists and is accessible
            await this.validateIssue(context);
            // Create issue analyzer
            const analyzer = new IssueAnalyzer(context);
            // Configure analysis options
            const analysisOptions = {
                depth: context.config.analysisDepth,
                includeCodeSearch: true,
                includeSymbolAnalysis: true,
                timeout: 120000
            };
            // Perform analysis
            const result = await analyzer.analyzeIssue(analysisOptions);
            if (!result.success) {
                throw new Error(result.error || 'Analysis failed');
            }
            // Add comment if configured and analysis was successful
            if (context.config.autoComment && result.analysisResult) {
                try {
                    await this.addAnalysisComment(context, result);
                    result.commentAdded = true;
                    console.log(`💬 Added analysis comment to issue #${context.issueNumber}`);
                }
                catch (error) {
                    console.warn('Failed to add comment:', error);
                    // Don't fail the entire process if comment fails
                }
            }
            // Add labels if configured
            if (context.config.autoLabel && result.labelsAdded && result.labelsAdded.length > 0) {
                try {
                    await this.addLabelsToIssue(context, result.labelsAdded);
                    console.log(`🏷️ Added labels to issue #${context.issueNumber}: ${result.labelsAdded.join(', ')}`);
                }
                catch (error) {
                    console.warn('Failed to add labels:', error);
                    // Don't fail the entire process if labeling fails
                }
            }
            // Set GitHub Actions outputs if running in Actions context
            this.setOutputs(result);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Failed to process issue #${context.issueNumber}:`, errorMessage);
            // Set error output for GitHub Actions
            this.setErrorOutput(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * Validate that the issue exists and is accessible
     */
    async validateIssue(context) {
        try {
            const { data: issue } = await this.octokit.issues.get({
                owner: context.owner,
                repo: context.repo,
                issue_number: context.issueNumber
            });
            console.log(`✅ Issue #${context.issueNumber} validated: "${issue.title}"`);
        }
        catch (error) {
            if (error instanceof Error && 'status' in error) {
                const status = error.status;
                if (status === 404) {
                    throw new Error(`Issue #${context.issueNumber} not found in ${context.owner}/${context.repo}`);
                }
                else if (status === 403) {
                    throw new Error(`Access denied to issue #${context.issueNumber} in ${context.owner}/${context.repo}`);
                }
            }
            throw new Error(`Failed to validate issue: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Add analysis comment to the issue
     */
    async addAnalysisComment(context, result) {
        if (!result.analysisResult) {
            throw new Error('No analysis result to comment');
        }
        // Create analyzer to generate LLM-powered comment
        const analyzer = new IssueAnalyzer(context);
        // Generate comment body using LLM
        const commentBody = await analyzer.generateComment(result);
        await this.octokit.issues.createComment({
            owner: context.owner,
            repo: context.repo,
            issue_number: context.issueNumber,
            body: commentBody
        });
    }
    /**
     * Add labels to the issue
     */
    async addLabelsToIssue(context, labels) {
        await this.octokit.issues.addLabels({
            owner: context.owner,
            repo: context.repo,
            issue_number: context.issueNumber,
            labels
        });
    }
    /**
     * Set GitHub Actions outputs
     */
    setOutputs(result) {
        try {
            core__namespace.setOutput('success', result.success.toString());
            core__namespace.setOutput('comment-added', (result.commentAdded || false).toString());
            if (result.labelsAdded) {
                core__namespace.setOutput('labels-added', result.labelsAdded.join(','));
            }
            if (result.executionTime) {
                core__namespace.setOutput('execution-time', result.executionTime.toString());
            }
            if (result.error) {
                core__namespace.setOutput('error', result.error);
            }
        }
        catch {
            // Ignore errors if not running in GitHub Actions context
        }
    }
    /**
     * Set error output for GitHub Actions
     */
    setErrorOutput(error) {
        try {
            core__namespace.setFailed(error);
            core__namespace.setOutput('success', 'false');
            core__namespace.setOutput('error', error);
        }
        catch {
            // Ignore errors if not running in GitHub Actions context
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
}

class WebhookHandler {
    constructor(actionService, options = {}) {
        this.actionService = actionService;
        this.options = {
            path: '/webhook',
            port: 3000,
            ...options
        };
        this.app = express();
        this.app.use(express.json());
        // Initialize webhooks with secret if provided
        this.webhooks = new webhooks.Webhooks({
            secret: this.options.secret || 'default-secret'
        });
        this.setupWebhookHandlers();
        this.setupRoutes();
    }
    /**
     * Setup webhook event handlers
     */
    setupWebhookHandlers() {
        // Handle issue opened events
        this.webhooks.on('issues.opened', async ({ payload }) => {
            console.log(`📝 Issue opened: #${payload.issue.number} in ${payload.repository.full_name}`);
            try {
                await this.handleIssueEvent(payload, 'opened');
                if (this.options.onIssueOpened) {
                    await this.options.onIssueOpened(payload);
                }
            }
            catch (error) {
                console.error('Error handling issue opened event:', error);
            }
        });
        // Handle issue edited events
        this.webhooks.on('issues.edited', async ({ payload }) => {
            console.log(`✏️ Issue edited: #${payload.issue.number} in ${payload.repository.full_name}`);
            try {
                await this.handleIssueEvent(payload, 'edited');
                if (this.options.onIssueEdited) {
                    await this.options.onIssueEdited(payload);
                }
            }
            catch (error) {
                console.error('Error handling issue edited event:', error);
            }
        });
        // Handle issue labeled events
        this.webhooks.on('issues.labeled', async ({ payload }) => {
            console.log(`🏷️ Issue labeled: #${payload.issue.number} in ${payload.repository.full_name}`);
            try {
                if (this.options.onIssueLabeled) {
                    await this.options.onIssueLabeled(payload);
                }
            }
            catch (error) {
                console.error('Error handling issue labeled event:', error);
            }
        });
        // Handle issue assigned events
        this.webhooks.on('issues.assigned', async ({ payload }) => {
            console.log(`👤 Issue assigned: #${payload.issue.number} in ${payload.repository.full_name}`);
            try {
                if (this.options.onIssueAssigned) {
                    await this.options.onIssueAssigned(payload);
                }
            }
            catch (error) {
                console.error('Error handling issue assigned event:', error);
            }
        });
        // Handle webhook errors
        this.webhooks.onError((error) => {
            console.error('Webhook error:', error);
        });
    }
    /**
     * Setup Express routes
     */
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'github-agent-action-webhook'
            });
        });
        // Webhook endpoint
        this.app.post(this.options.path, async (req, res) => {
            try {
                await this.webhooks.verifyAndReceive({
                    id: req.headers['x-github-delivery'],
                    name: req.headers['x-github-event'],
                    signature: req.headers['x-hub-signature-256'],
                    payload: JSON.stringify(req.body)
                });
                res.status(200).json({ message: 'Webhook processed successfully' });
            }
            catch (error) {
                console.error('Webhook processing error:', error);
                res.status(400).json({
                    error: 'Webhook processing failed',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Manual trigger endpoint for testing
        this.app.post('/trigger/:owner/:repo/:issueNumber', async (req, res) => {
            try {
                const { owner, repo, issueNumber } = req.params;
                const { action = 'manual', depth = 'medium' } = req.body;
                console.log(`🔧 Manual trigger for issue #${issueNumber} in ${owner}/${repo}`);
                const result = await this.actionService.processIssue({
                    owner,
                    repo,
                    issueNumber: parseInt(issueNumber),
                    action,
                    depth
                });
                res.json({
                    success: true,
                    result,
                    message: `Analysis completed for issue #${issueNumber}`
                });
            }
            catch (error) {
                console.error('Manual trigger error:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                service: 'github-agent-action',
                version: process.env.npm_package_version || '0.1.0',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                webhookPath: this.options.path,
                timestamp: new Date().toISOString()
            });
        });
    }
    /**
     * Handle issue events (opened, edited, etc.)
     */
    async handleIssueEvent(payload, eventType) {
        if (!payload.issue || !payload.repository) {
            console.warn('Invalid payload: missing issue or repository data');
            return;
        }
        // Check if we should process this issue
        if (!this.shouldProcessIssue(payload, eventType)) {
            console.log(`⏭️ Skipping issue #${payload.issue.number} - does not meet processing criteria`);
            return;
        }
        const context = {
            owner: payload.repository.owner.login,
            repo: payload.repository.name,
            issueNumber: payload.issue.number,
            eventType,
            action: payload.action,
            workspacePath: process.cwd(), // This could be configured
            config: this.getActionConfig()
        };
        try {
            console.log(`🚀 Processing issue #${context.issueNumber} in ${context.owner}/${context.repo}`);
            const result = await this.actionService.processIssueWithContext(context);
            if (result.success) {
                console.log(`✅ Successfully processed issue #${context.issueNumber}`);
                // Log analysis results
                if (result.analysisResult) {
                    console.log(`📊 Analysis completed in ${result.executionTime}ms`);
                }
                if (result.commentAdded) {
                    console.log(`💬 Comment added to issue #${context.issueNumber}`);
                }
                if (result.labelsAdded && result.labelsAdded.length > 0) {
                    console.log(`🏷️ Labels added: ${result.labelsAdded.join(', ')}`);
                }
            }
            else {
                console.error(`❌ Failed to process issue #${context.issueNumber}: ${result.error}`);
            }
        }
        catch (error) {
            console.error(`💥 Error processing issue #${context.issueNumber}:`, error);
        }
    }
    /**
     * Determine if an issue should be processed based on configuration
     */
    shouldProcessIssue(payload, eventType) {
        const config = this.getActionConfig();
        // Check if event type is in trigger events
        if (config.triggerEvents && !config.triggerEvents.includes(eventType)) {
            return false;
        }
        // Check exclude labels
        if (config.excludeLabels && payload.issue) {
            const issueLabels = payload.issue.labels.map(label => label.name);
            const hasExcludedLabel = config.excludeLabels.some(label => issueLabels.includes(label));
            if (hasExcludedLabel) {
                return false;
            }
        }
        // Check include labels (if specified, issue must have at least one)
        if (config.includeLabels && config.includeLabels.length > 0 && payload.issue) {
            const issueLabels = payload.issue.labels.map(label => label.name);
            const hasIncludedLabel = config.includeLabels.some(label => issueLabels.includes(label));
            if (!hasIncludedLabel) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get action configuration from environment or defaults
     */
    getActionConfig() {
        return {
            githubToken: process.env.GITHUB_TOKEN || '',
            workspacePath: process.env.WORKSPACE_PATH || process.cwd(),
            webhookSecret: process.env.WEBHOOK_SECRET,
            autoComment: process.env.AUTO_COMMENT === 'true',
            autoLabel: process.env.AUTO_LABEL === 'true',
            analysisDepth: process.env.ANALYSIS_DEPTH || 'medium',
            triggerEvents: process.env.TRIGGER_EVENTS?.split(',') || ['opened', 'edited', 'reopened'],
            excludeLabels: process.env.EXCLUDE_LABELS?.split(',') || [],
            includeLabels: process.env.INCLUDE_LABELS?.split(',') || []
        };
    }
    /**
     * Start the webhook server
     */
    async start() {
        const port = this.options.port || 3000;
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(`🚀 GitHub Agent Action webhook server started on port ${port}`);
                console.log(`📡 Webhook endpoint: http://localhost:${port}${this.options.path}`);
                console.log(`🏥 Health check: http://localhost:${port}/health`);
                console.log(`📊 Status: http://localhost:${port}/status`);
                resolve();
            });
        });
    }
    /**
     * Get the Express app instance
     */
    getApp() {
        return this.app;
    }
    /**
     * Get webhook instance for advanced configuration
     */
    getWebhooks() {
        return this.webhooks;
    }
}

/**
 * AutoDev GitHub Agent Action
 *
 * Automated GitHub issue analysis using AI-powered code analysis.
 * This package provides both GitHub Actions integration and standalone webhook server capabilities.
 */
// Core exports
/**
 * Main entry point for GitHub Actions
 * This function is called when the action runs in a GitHub workflow
 */
async function run() {
    try {
        console.log('🚀 Starting AutoDev GitHub Agent Action');
        // Initialize the action service
        const actionService = new GitHubActionService();
        // Get context from GitHub Actions
        const context = github__namespace.context;
        // Check if this is an issue event
        if (context.eventName === 'issues') {
            const payload = context.payload;
            if (!payload.issue) {
                throw new Error('No issue found in event payload');
            }
            console.log(`📝 Processing issue #${payload.issue.number}: ${payload.issue.title}`);
            // Process the issue
            const result = await actionService.processIssue({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issueNumber: payload.issue.number,
                action: payload.action
            });
            if (result.success) {
                console.log('✅ Issue analysis completed successfully');
                if (result.commentAdded) {
                    console.log('💬 Analysis comment added to issue');
                }
                if (result.labelsAdded && result.labelsAdded.length > 0) {
                    console.log(`🏷️ Labels added: ${result.labelsAdded.join(', ')}`);
                }
            }
            else {
                throw new Error(result.error || 'Issue analysis failed');
            }
        }
        else {
            console.log(`ℹ️ Event type '${context.eventName}' is not supported. Only 'issues' events are processed.`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Action failed:', errorMessage);
        core__namespace.setFailed(errorMessage);
    }
}
/**
 * Create and start a webhook server for standalone operation
 */
async function startWebhookServer(options = {}) {
    console.log('🌐 Starting GitHub Agent Action webhook server');
    // Initialize action service
    const actionService = new GitHubActionService({
        githubToken: options.githubToken || process.env.GITHUB_TOKEN,
        workspacePath: options.workspacePath || process.cwd(),
        webhookSecret: options.webhookSecret || process.env.WEBHOOK_SECRET
    });
    // Create webhook handler
    const webhookHandler = new WebhookHandler(actionService, {
        port: options.port || parseInt(process.env.PORT || '3000'),
        secret: options.webhookSecret || process.env.WEBHOOK_SECRET || 'default-secret',
        path: '/webhook'
    });
    // Start the server
    await webhookHandler.start();
    return webhookHandler;
}
/**
 * Analyze a specific issue (for manual/programmatic use)
 */
async function analyzeIssue(options) {
    console.log(`🔍 Analyzing issue #${options.issueNumber} in ${options.owner}/${options.repo}`);
    const actionService = new GitHubActionService({
        githubToken: options.githubToken || process.env.GITHUB_TOKEN,
        workspacePath: options.workspacePath || process.cwd()
    });
    return actionService.processIssue({
        owner: options.owner,
        repo: options.repo,
        issueNumber: options.issueNumber,
        depth: options.depth,
        autoComment: options.autoComment,
        autoLabel: options.autoLabel
    });
}
/**
 * Utility function to validate configuration
 */
function validateConfig() {
    const errors = [];
    // Check for required environment variables
    if (!process.env.GITHUB_TOKEN) {
        errors.push('GITHUB_TOKEN environment variable is required');
    }
    // Check for GitHub Actions context if running in Actions
    try {
        const context = github__namespace.context;
        if (context.eventName && !['issues', 'issue_comment'].includes(context.eventName)) {
            errors.push(`Event type '${context.eventName}' is not supported`);
        }
    }
    catch {
        // Not running in GitHub Actions context, which is fine for standalone mode
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Get version information
 */
function getVersion() {
    return process.env.npm_package_version || '0.1.0';
}
/**
 * Default export for convenience
 */
var index = {
    run,
    startWebhookServer,
    analyzeIssue,
    validateConfig,
    getVersion,
    GitHubActionService,
    WebhookHandler
};
// Auto-run if this is the main module and we're in GitHub Actions context
if (require.main === module) {
    // Check if we're in GitHub Actions context
    if (process.env.GITHUB_ACTIONS === 'true') {
        run().catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
    }
    else {
        // Standalone mode - start webhook server
        const port = parseInt(process.env.PORT || '3000');
        console.log(`🚀 Starting in standalone mode on port ${port}`);
        startWebhookServer({ port }).catch(error => {
            console.error('Failed to start webhook server:', error);
            process.exit(1);
        });
    }
}

exports.GitHubActionService = GitHubActionService;
exports.IssueAnalyzer = IssueAnalyzer;
exports.WebhookHandler = WebhookHandler;
exports.analyzeIssue = analyzeIssue;
exports.default = index;
exports.getVersion = getVersion;
exports.run = run;
exports.startWebhookServer = startWebhookServer;
exports.validateConfig = validateConfig;
//# sourceMappingURL=index.js.map
