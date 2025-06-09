import express from 'express';
import { Webhooks } from '@octokit/webhooks';
export { CodeContext, GitHubAgentImplementation, GitHubConfig, GitHubIssue, IssueAnalysisResult } from '@autodev/github-agent';

interface ActionConfig {
    githubToken: string;
    workspacePath?: string;
    webhookSecret?: string;
    autoComment?: boolean;
    autoLabel?: boolean;
    analysisDepth?: 'shallow' | 'medium' | 'deep';
    triggerEvents?: string[];
    excludeLabels?: string[];
    includeLabels?: string[];
}
interface WebhookPayload {
    action: string;
    issue?: {
        id: number;
        number: number;
        title: string;
        body: string | null;
        state: 'open' | 'closed';
        user: {
            login: string;
            id: number;
        } | null;
        labels: Array<{
            id: number;
            name: string;
            color: string;
            description: string | null;
        }>;
        assignees: Array<{
            login: string;
            id: number;
        }>;
        created_at: string;
        updated_at: string;
        html_url: string;
    };
    repository: {
        id: number;
        name: string;
        full_name: string;
        owner: {
            login: string;
            id: number;
        };
        default_branch: string;
        clone_url: string;
        html_url: string;
    };
    sender: {
        login: string;
        id: number;
    };
}
interface AnalysisOptions {
    depth?: 'shallow' | 'medium' | 'deep';
    includeCodeSearch?: boolean;
    includeSymbolAnalysis?: boolean;
    maxFiles?: number;
    timeout?: number;
}
interface ActionResult {
    success: boolean;
    analysisResult?: any;
    commentAdded?: boolean;
    labelsAdded?: string[];
    error?: string;
    executionTime?: number;
}
interface LabelConfig {
    bugLabel?: string;
    featureLabel?: string;
    documentationLabel?: string;
    enhancementLabel?: string;
    questionLabel?: string;
    analysisCompleteLabel?: string;
}
interface ActionContext {
    owner: string;
    repo: string;
    issueNumber: number;
    eventType: string;
    action: string;
    workspacePath: string;
    config: ActionConfig;
}
interface WebhookHandlerOptions {
    secret?: string;
    path?: string;
    port?: number;
    onIssueOpened?: (payload: WebhookPayload) => Promise<void>;
    onIssueEdited?: (payload: WebhookPayload) => Promise<void>;
    onIssueLabeled?: (payload: WebhookPayload) => Promise<void>;
    onIssueAssigned?: (payload: WebhookPayload) => Promise<void>;
}
interface AnalysisReport {
    issueNumber: number;
    repository: string;
    analysisTimestamp: string;
    summary: string;
    codeReferences: Array<{
        file: string;
        line?: number;
        relevance: number;
        description: string;
    }>;
    suggestions: Array<{
        type: 'fix' | 'enhancement' | 'investigation';
        priority: 'low' | 'medium' | 'high';
        description: string;
        location?: string;
    }>;
    relatedIssues?: Array<{
        number: number;
        title: string;
        similarity: number;
    }>;
    estimatedComplexity?: 'low' | 'medium' | 'high';
    recommendedLabels?: string[];
}

interface ProcessIssueOptions {
    owner: string;
    repo: string;
    issueNumber: number;
    action?: string;
    depth?: 'shallow' | 'medium' | 'deep';
    autoComment?: boolean;
    autoLabel?: boolean;
}
declare class GitHubActionService {
    private octokit;
    private config;
    constructor(config?: Partial<ActionConfig>);
    /**
     * Load configuration from GitHub Actions inputs or environment
     */
    private loadConfig;
    /**
     * Get input value (works in both GitHub Actions and standalone mode)
     */
    private getInput;
    /**
     * Get boolean input value
     */
    private getBooleanInput;
    /**
     * Process an issue with simplified options
     */
    processIssue(options: ProcessIssueOptions): Promise<ActionResult>;
    /**
     * Process an issue with full context
     */
    processIssueWithContext(context: ActionContext): Promise<ActionResult>;
    /**
     * Validate that the issue exists and is accessible
     */
    private validateIssue;
    /**
     * Add analysis comment to the issue
     */
    private addAnalysisComment;
    /**
     * Add labels to the issue
     */
    private addLabelsToIssue;
    /**
     * Set GitHub Actions outputs
     */
    private setOutputs;
    /**
     * Set error output for GitHub Actions
     */
    private setErrorOutput;
    /**
     * Get current configuration
     */
    getConfig(): ActionConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<ActionConfig>): void;
}

declare class IssueAnalyzer {
    private githubService;
    private contextAnalyzer;
    private reportGenerator;
    private llmService;
    private context;
    private labelConfig;
    constructor(context: ActionContext);
    /**
     * Analyze an issue using the same logic as analyze-issue.js
     */
    analyzeIssue(options?: AnalysisOptions): Promise<ActionResult>;
    /**
     * Extract labels from analysis text using simple pattern matching
     */
    private extractLabelsFromAnalysis;
    /**
     * Generate comment text for the issue using LLM (similar to agent.ts approach)
     */
    generateComment(analysisResult: any): Promise<string>;
    /**
     * Generate enhanced comment using LLM
     */
    private generateEnhancedComment;
    /**
     * Generate enhanced formatted comment without LLM
     */
    private generateEnhancedFormattedComment;
    /**
     * Format LLM analysis report as a GitHub comment
     */
    private formatLLMReportAsComment;
    /**
     * Update label configuration
     */
    setLabelConfig(config: Partial<LabelConfig>): void;
}

declare class WebhookHandler {
    private app;
    private webhooks;
    private actionService;
    private options;
    constructor(actionService: GitHubActionService, options?: WebhookHandlerOptions);
    /**
     * Setup webhook event handlers
     */
    private setupWebhookHandlers;
    /**
     * Setup Express routes
     */
    private setupRoutes;
    /**
     * Handle issue events (opened, edited, etc.)
     */
    private handleIssueEvent;
    /**
     * Determine if an issue should be processed based on configuration
     */
    private shouldProcessIssue;
    /**
     * Get action configuration from environment or defaults
     */
    private getActionConfig;
    /**
     * Start the webhook server
     */
    start(): Promise<void>;
    /**
     * Get the Express app instance
     */
    getApp(): express.Application;
    /**
     * Get webhook instance for advanced configuration
     */
    getWebhooks(): Webhooks;
}

/**
 * AutoDev GitHub Agent Action
 *
 * Automated GitHub issue analysis using AI-powered code analysis.
 * This package provides both GitHub Actions integration and standalone webhook server capabilities.
 */

/**
 * Main entry point for GitHub Actions
 * This function is called when the action runs in a GitHub workflow
 */
declare function run(): Promise<void>;
/**
 * Create and start a webhook server for standalone operation
 */
declare function startWebhookServer(options?: {
    port?: number;
    webhookSecret?: string;
    githubToken?: string;
    workspacePath?: string;
}): Promise<WebhookHandler>;
/**
 * Analyze a specific issue (for manual/programmatic use)
 */
declare function analyzeIssue(options: {
    owner: string;
    repo: string;
    issueNumber: number;
    githubToken?: string;
    workspacePath?: string;
    depth?: 'shallow' | 'medium' | 'deep';
    autoComment?: boolean;
    autoLabel?: boolean;
}): Promise<ActionResult>;
/**
 * Utility function to validate configuration
 */
declare function validateConfig(): {
    valid: boolean;
    errors: string[];
};
/**
 * Get version information
 */
declare function getVersion(): string;
/**
 * Default export for convenience
 */
declare const _default: {
    run: typeof run;
    startWebhookServer: typeof startWebhookServer;
    analyzeIssue: typeof analyzeIssue;
    validateConfig: typeof validateConfig;
    getVersion: typeof getVersion;
    GitHubActionService: typeof GitHubActionService;
    WebhookHandler: typeof WebhookHandler;
};

export { GitHubActionService, IssueAnalyzer, WebhookHandler, analyzeIssue, _default as default, getVersion, run, startWebhookServer, validateConfig };
export type { ActionConfig, ActionContext, ActionResult, AnalysisOptions, AnalysisReport, LabelConfig, ProcessIssueOptions, WebhookHandlerOptions, WebhookPayload };
