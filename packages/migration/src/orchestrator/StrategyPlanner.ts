/**
 * 策略规划器
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { ContextAwareComponent } from '../core/ContextAwareComponent';
import {
  IMigrationContext,
  ComponentOptions,
  ProjectAnalysis,
  MigrationPlan,
  MigrationRisk,
  MigrationStep
} from '../types';

export class StrategyPlanner extends ContextAwareComponent {
  private analysisRules: Map<string, any> = new Map();
  private migrationTemplates: Map<string, any> = new Map();

  constructor(context: IMigrationContext, options: ComponentOptions = {}) {
    super('StrategyPlanner', context, options);
  }

  protected async onInitialize(): Promise<void> {
    this.loadAnalysisRules();
    this.loadMigrationTemplates();
  }

  protected async onExecute(): Promise<any> {
    return {
      analysisRules: this.analysisRules.size,
      migrationTemplates: this.migrationTemplates.size
    };
  }

  private loadAnalysisRules(): void {
    // 加载项目分析规则
    this.analysisRules.set('package.json', {
      detect: (content: string) => {
        const pkg = JSON.parse(content);
        return {
          framework: this.detectFramework(pkg.dependencies || {}),
          version: this.detectVersion(pkg.dependencies || {}),
          buildTool: this.detectBuildTool(pkg)
        };
      }
    });
    
    this.analysisRules.set('file-patterns', {
      detect: (files: string[]) => {
        const patterns = {
          vue: files.some(f => f.endsWith('.vue')),
          react: files.some(f => f.includes('jsx') || f.includes('tsx')),
          angular: files.some(f => f.includes('component.ts')),
          node: files.some(f => f === 'server.js' || f === 'app.js')
        };
        return patterns;
      }
    });
  }

  private loadMigrationTemplates(): void {
    // Vue 2 to Vue 3 模板
    this.migrationTemplates.set('vue2-to-vue3', {
      name: 'Vue 2 to Vue 3',
      steps: [
        { name: 'dependency-upgrade', order: 1, required: true },
        { name: 'code-migration', order: 2, required: true },
        { name: 'ai-repair', order: 3, required: false },
        { name: 'build-validation', order: 4, required: true }
      ],
      tools: ['gogocode', 'eslint', 'webpack'],
      aiPrompts: 'vue-migration-prompts'
    });
    
    // React 16 to React 18 模板
    this.migrationTemplates.set('react16-to-react18', {
      name: 'React 16 to React 18',
      steps: [
        { name: 'dependency-upgrade', order: 1, required: true },
        { name: 'concurrent-features', order: 2, required: false },
        { name: 'strict-mode-fixes', order: 3, required: true },
        { name: 'build-validation', order: 4, required: true }
      ],
      tools: ['react-codemod', 'eslint'],
      aiPrompts: 'react-migration-prompts'
    });
  }

  public async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    this.log('开始分析项目结构...');
    
    const analysis: ProjectAnalysis = {
      projectPath,
      framework: null,
      version: null,
      buildTool: null,
      complexity: 'medium',
      files: [],
      dependencies: {},
      risks: [],
      confidence: 0
    };
    
    try {
      // 分析package.json
      const packagePath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packagePath)) {
        const packageContent = await fs.readFile(packagePath, 'utf8');
        const packageAnalysis = this.analysisRules.get('package.json')!.detect(packageContent);
        Object.assign(analysis, packageAnalysis);
        analysis.dependencies = JSON.parse(packageContent).dependencies || {};
      }
      
      // 分析文件结构
      const files = await this.scanProjectFiles(projectPath);
      analysis.files = files;
      
      const filePatterns = this.analysisRules.get('file-patterns')!.detect(files);
      if (!analysis.framework) {
        analysis.framework = Object.keys(filePatterns).find(key => filePatterns[key]) || null;
      }
      
      // 评估复杂度
      analysis.complexity = this.assessComplexity(analysis);
      
      // 识别风险
      analysis.risks = this.identifyRisks(analysis);
      
      // 计算置信度
      analysis.confidence = this.calculateConfidence(analysis);
      
      this.log(`项目分析完成: ${analysis.framework} ${analysis.version}`);
      return analysis;
      
    } catch (error) {
      this.logError('项目分析失败', error as Error);
      throw error;
    }
  }

  public async generateMigrationPlan(analysis: ProjectAnalysis): Promise<MigrationPlan> {
    this.log('生成迁移计划...');
    
    const migrationKey = this.determineMigrationType(analysis);
    const template = this.migrationTemplates.get(migrationKey);
    
    if (!template) {
      // 生成通用迁移计划
      return this.generateGenericPlan(analysis);
    }
    
    const plan: MigrationPlan = {
      name: template.name,
      source: {
        framework: analysis.framework || 'unknown',
        version: analysis.version || 'unknown'
      },
      target: this.determineTargetVersion(analysis),
      steps: template.steps.map((step: any) => ({
        ...step,
        enabled: true,
        config: this.generateStepConfig(step, analysis)
      })),
      tools: template.tools,
      estimatedDuration: this.estimateDuration(analysis, template),
      risks: analysis.risks
    };
    
    this.log(`迁移计划生成完成: ${plan.steps.length} 个步骤`);
    return plan;
  }

  private async scanProjectFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    const scan = async (dir: string, relativePath: string = '') => {
      const items = await fs.readdir(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;
        
        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await scan(fullPath, relPath);
        } else {
          files.push(relPath);
        }
      }
    };
    
    await scan(projectPath);
    return files;
  }

  private detectFramework(dependencies: Record<string, string>): string | null {
    if (dependencies.vue) return 'vue';
    if (dependencies.react) return 'react';
    if (dependencies['@angular/core']) return 'angular';
    if (dependencies.express) return 'node';
    return null;
  }

  private detectVersion(dependencies: Record<string, string>): string | null {
    if (dependencies.vue) {
      return dependencies.vue.startsWith('^2') ? '2.x' : '3.x';
    }
    if (dependencies.react) {
      const version = dependencies.react.replace(/[^\d.]/g, '');
      return version.startsWith('16') ? '16.x' : '18.x';
    }
    return null;
  }

  private detectBuildTool(pkg: any): string | null {
    if (pkg.devDependencies?.webpack) return 'webpack';
    if (pkg.devDependencies?.vite) return 'vite';
    if (pkg.devDependencies?.rollup) return 'rollup';
    return null;
  }

  private assessComplexity(analysis: ProjectAnalysis): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // 文件数量
    if (analysis.files.length > 100) score += 2;
    else if (analysis.files.length > 50) score += 1;
    
    // 依赖数量
    const depCount = Object.keys(analysis.dependencies).length;
    if (depCount > 50) score += 2;
    else if (depCount > 20) score += 1;
    
    // 特殊文件
    if (analysis.files.some(f => f.includes('webpack'))) score += 1;
    if (analysis.files.some(f => f.includes('babel'))) score += 1;
    
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private identifyRisks(analysis: ProjectAnalysis): MigrationRisk[] {
    const risks: MigrationRisk[] = [];
    
    // 检查已知的问题依赖
    const problematicDeps = ['vue-template-compiler', 'babel-core'];
    for (const dep of problematicDeps) {
      if (analysis.dependencies[dep]) {
        risks.push({
          type: 'dependency',
          severity: 'medium',
          description: `依赖 ${dep} 可能需要特殊处理`
        });
      }
    }
    
    // 检查复杂度
    if (analysis.complexity === 'high') {
      risks.push({
        type: 'complexity',
        severity: 'high',
        description: '项目复杂度较高，迁移可能需要更多时间'
      });
    }
    
    return risks;
  }

  private calculateConfidence(analysis: ProjectAnalysis): number {
    let confidence = 0.5; // 基础置信度
    
    // 框架识别成功
    if (analysis.framework) confidence += 0.2;
    
    // 版本识别成功
    if (analysis.version) confidence += 0.2;
    
    // 有package.json
    if (Object.keys(analysis.dependencies).length > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private determineMigrationType(analysis: ProjectAnalysis): string {
    if (analysis.framework === 'vue' && analysis.version === '2.x') {
      return 'vue2-to-vue3';
    }
    if (analysis.framework === 'react' && analysis.version === '16.x') {
      return 'react16-to-react18';
    }
    return 'custom';
  }

  private determineTargetVersion(analysis: ProjectAnalysis): any {
    const targetMap: Record<string, any> = {
      'vue': { framework: 'vue', version: '3.x' },
      'react': { framework: 'react', version: '18.x' },
      'angular': { framework: 'angular', version: '15.x' }
    };
    
    return targetMap[analysis.framework || ''] || { 
      framework: analysis.framework || 'unknown', 
      version: 'latest' 
    };
  }

  private generateStepConfig(step: any, analysis: ProjectAnalysis): Record<string, any> {
    const configs: Record<string, any> = {
      'dependency-upgrade': {
        preserveVersions: analysis.complexity === 'high',
        autoInstall: true
      },
      'code-migration': {
        parallel: analysis.files.length < 100,
        backupFiles: true
      },
      'ai-repair': {
        enabled: analysis.complexity !== 'low',
        maxAttempts: analysis.complexity === 'high' ? 5 : 3
      }
    };
    
    return configs[step.name] || {};
  }

  private estimateDuration(analysis: ProjectAnalysis, template: any): number {
    const baseTime = template.steps.length * 5; // 每步骤5分钟基础时间
    const complexityMultiplier = {
      'low': 1,
      'medium': 1.5,
      'high': 2.5
    };
    
    return Math.round(baseTime * complexityMultiplier[analysis.complexity]);
  }

  private generateGenericPlan(analysis: ProjectAnalysis): MigrationPlan {
    const steps: MigrationStep[] = [
      {
        name: 'analysis',
        description: '项目分析',
        order: 1,
        required: true
      },
      {
        name: 'preparation',
        description: '迁移准备',
        order: 2,
        required: true
      },
      {
        name: 'migration',
        description: '执行迁移',
        order: 3,
        required: true
      },
      {
        name: 'validation',
        description: '验证结果',
        order: 4,
        required: true
      }
    ];

    return {
      name: 'Generic Migration Plan',
      source: {
        framework: analysis.framework || 'unknown',
        version: analysis.version || 'unknown'
      },
      target: {
        framework: analysis.framework || 'unknown',
        version: 'latest'
      },
      steps,
      tools: [],
      estimatedDuration: 30,
      risks: analysis.risks
    };
  }
}
