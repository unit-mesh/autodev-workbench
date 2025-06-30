/**
 * 智谱AI (GLM) 服务实现
 */
import { AIService } from './AIService';
import { AIServiceConfig } from '../types';
export declare class GLMAIService extends AIService {
    private apiKey;
    private baseURL;
    protected enabled: boolean;
    constructor(config?: AIServiceConfig);
    protected checkAvailability(): boolean;
    protected performAICall(prompt: string, options: any): Promise<string>;
    private makeRequest;
    getStats(): any;
}
//# sourceMappingURL=GLMAIService.d.ts.map