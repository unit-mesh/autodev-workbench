/**
 * AI代理基类
 */
import { ContextAwareComponent } from '../core/ContextAwareComponent';
import { IMigrationContext, ComponentOptions, IAIService, IToolExecutor, AICallOptions } from '../types';
export declare abstract class BaseAIAgent extends ContextAwareComponent {
    protected aiService: IAIService;
    protected toolExecutor: IToolExecutor;
    protected promptTemplates: Map<string, string>;
    constructor(name: string, context: IMigrationContext, aiService: IAIService, toolExecutor: IToolExecutor, options?: ComponentOptions);
    protected onInitialize(): Promise<void>;
    protected loadPromptTemplates(): void;
    protected analyzeWithAI(prompt: string, options?: AICallOptions): Promise<string>;
    protected executeToolsFromAI(toolCalls: any[]): Promise<any[]>;
    protected buildPrompt(templateName: string, variables: Record<string, any>): string;
    protected processWithRetry<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>;
    protected validateAIResponse(response: string, expectedFormat?: string): boolean;
    protected parseJSONResponse(response: string): any;
    protected sanitizePrompt(prompt: string): string;
    protected getContextInfo(): Record<string, any>;
    protected readProjectFile(filePath: string): Promise<string>;
    protected writeProjectFile(filePath: string, content: string, backup?: boolean): Promise<boolean>;
    protected listProjectFiles(pattern?: string): Promise<string[]>;
    protected runCommand(command: string, args?: string[]): Promise<string>;
    protected getAgentStats(): any;
    protected reportProgress(progress: number, message?: string): void;
    protected handleAIError(error: Error, context?: string): void;
    protected shouldFallbackToRules(error: Error): boolean;
}
//# sourceMappingURL=BaseAIAgent.d.ts.map