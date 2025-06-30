/**
 * 分析代理 - 负责项目分析和问题识别
 */
import { BaseAIAgent } from './BaseAIAgent';
import { IMigrationContext, ComponentOptions, IAIService, IToolExecutor } from '../types';
export declare class AnalysisAgent extends BaseAIAgent {
    constructor(context: IMigrationContext, aiService: IAIService, toolExecutor: IToolExecutor, options?: ComponentOptions);
    protected loadPromptTemplates(): void;
    protected onExecute(): Promise<any>;
    private gatherProjectInfo;
    private performAIAnalysis;
    private analyzeDependencies;
    private analyzeKeyFiles;
    private identifyKeyFiles;
    analyzeSpecificFile(filePath: string): Promise<any>;
    generateMigrationReport(): Promise<any>;
    private generateRecommendations;
    private generateNextSteps;
}
//# sourceMappingURL=AnalysisAgent.d.ts.map