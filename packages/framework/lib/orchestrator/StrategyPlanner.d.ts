/**
 * 策略规划器
 */
import { ContextAwareComponent } from '../core/ContextAwareComponent';
import { IMigrationContext, ComponentOptions, ProjectAnalysis, MigrationPlan } from '../types';
export declare class StrategyPlanner extends ContextAwareComponent {
    private analysisRules;
    private migrationTemplates;
    constructor(context: IMigrationContext, options?: ComponentOptions);
    protected onInitialize(): Promise<void>;
    protected onExecute(): Promise<any>;
    private loadAnalysisRules;
    private loadMigrationTemplates;
    analyzeProject(projectPath: string): Promise<ProjectAnalysis>;
    generateMigrationPlan(analysis: ProjectAnalysis): Promise<MigrationPlan>;
    private scanProjectFiles;
    private detectFramework;
    private detectVersion;
    private detectBuildTool;
    private assessComplexity;
    private identifyRisks;
    private calculateConfidence;
    private determineMigrationType;
    private determineTargetVersion;
    private generateStepConfig;
    private estimateDuration;
    private generateGenericPlan;
}
//# sourceMappingURL=StrategyPlanner.d.ts.map