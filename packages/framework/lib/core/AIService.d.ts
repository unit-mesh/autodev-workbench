/**
 * AI服务基类
 */
import { EventEmitter } from 'events';
import { IAIService, AIServiceConfig, AICallOptions, AIStats, AICallContext } from '../types';
export declare abstract class AIService extends EventEmitter implements IAIService {
    protected readonly config: AIServiceConfig;
    protected stats: AIStats;
    protected enabled: boolean;
    constructor(config?: AIServiceConfig);
    protected abstract checkAvailability(): boolean;
    isEnabled(): boolean;
    callAI(prompt: string, options?: AICallOptions): Promise<string>;
    protected abstract performAICall(prompt: string, options: any): Promise<string>;
    private updateSuccessRate;
    getStats(): AIStats;
    resetStats(): void;
    protected delay(ms: number): Promise<void>;
    protected log(message: string): void;
    protected logError(message: string, error?: Error): void;
    protected truncatePrompt(prompt: string, maxLength?: number): string;
    protected sanitizePrompt(prompt: string): string;
    protected validateResponse(response: string): boolean;
    protected parseJSONResponse(response: string): any;
    protected buildContext(context?: AICallContext): string;
    protected shouldRetry(error: Error, attempt: number, maxRetries: number): boolean;
    cleanup(): void;
}
//# sourceMappingURL=AIService.d.ts.map