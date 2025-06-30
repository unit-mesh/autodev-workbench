/**
 * 模拟AI服务 - 用于测试和演示
 */
import { AIService } from './AIService';
import { AIServiceConfig } from '../types';
export declare class MockAIService extends AIService {
    constructor(config?: AIServiceConfig);
    protected checkAvailability(): boolean;
    protected performAICall(prompt: string, options: any): Promise<string>;
    private generateMockResponse;
    getStats(): any;
}
//# sourceMappingURL=MockAIService.d.ts.map