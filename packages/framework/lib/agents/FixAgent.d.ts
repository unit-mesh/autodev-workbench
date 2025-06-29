/**
 * 修复代理 - 负责代码修复和迁移
 */
import { BaseAIAgent } from './BaseAIAgent';
import { IMigrationContext, ComponentOptions, IAIService, IToolExecutor } from '../types';
export declare class FixAgent extends BaseAIAgent {
    private fixedFiles;
    constructor(context: IMigrationContext, aiService: IAIService, toolExecutor: IToolExecutor, options?: ComponentOptions);
    protected loadPromptTemplates(): void;
    protected onExecute(): Promise<any>;
    private identifyFilesToFix;
    private batchFixFiles;
    private fixSingleFile;
    private shouldApplyFix;
    fixSpecificFile(filePath: string, errorMessage?: string): Promise<any>;
    applyBulkFixes(fixes: Array<{
        filePath: string;
        fixedCode: string;
    }>): Promise<any[]>;
    getFixedFiles(): string[];
    getFixStats(): any;
}
//# sourceMappingURL=FixAgent.d.ts.map