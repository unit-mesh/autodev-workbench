/**
 * 验证代理 - 负责验证迁移结果
 */
import { BaseAIAgent } from './BaseAIAgent';
import { IMigrationContext, ComponentOptions, IAIService, IToolExecutor } from '../types';
export declare class ValidationAgent extends BaseAIAgent {
    constructor(context: IMigrationContext, aiService: IAIService, toolExecutor: IToolExecutor, options?: ComponentOptions);
    protected loadPromptTemplates(): void;
    protected onExecute(): Promise<any>;
    private getFilesToValidate;
    private validateFiles;
    private validateSingleFile;
    private performSyntaxCheck;
    private mergeValidationResults;
    private validateBuild;
    private validateTests;
    private generateValidationSummary;
    private calculateOverallScore;
    validateSpecificFile(filePath: string): Promise<any>;
}
//# sourceMappingURL=ValidationAgent.d.ts.map