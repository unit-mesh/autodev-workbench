import * as fs from "fs/promises";
import * as path from "path";
import {
  ArchitectureAnalysis,
  DependenciesAnalysis,
  GitAnalysis,
  ProjectInfo,
  WorkflowAnalysis,
  WorkflowFile
} from "./context-analyzer.type";
import { CodebaseScanner } from "./codebase-scanner";
import { InsightGenerator } from "./insight-generator";
import { ProjectInfoAnalyzer } from "./project-info-analyzer";

export interface AnalysisResult {
  analysis: {
    workspace_path: string;
    resolved_path: string;
    analysis_scope: string;
    timestamp: string;
  };
  project_info: ProjectInfo;
  workflow_analysis?: WorkflowAnalysis;
  architecture_analysis?: ArchitectureAnalysis;
  git_info?: GitAnalysis;
  dependencies_summary?: DependenciesAnalysis;
  insights: string[];
  recommendations: string[];
  health_score?: number;
}

export class ProjectContextAnalyzer {
  private static readonly config = {
    commonDirs: ['src', 'lib', 'components', 'services', 'controllers', 'models', 'views', 'api', 'packages']
  };

  private cache = new Map<string, any>();
  private codebaseScanner: CodebaseScanner;
  private insightGenerator: InsightGenerator;
  private projectInfoAnalyzer: ProjectInfoAnalyzer;

  constructor() {
    this.codebaseScanner = new CodebaseScanner();
    this.insightGenerator = new InsightGenerator();
    this.projectInfoAnalyzer = new ProjectInfoAnalyzer();
  }

  async analyze(workspacePath: string, analysisScope: "basic" | "full" = "basic"): Promise<AnalysisResult> {
    const resolvedWorkspace = path.resolve(workspacePath);
    const isFullAnalysis = analysisScope === "full";

    const cacheKey = `${resolvedWorkspace}-${analysisScope}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const projectInfo = await this.projectInfoAnalyzer.analyzeProjectInfo(resolvedWorkspace);

    const result: AnalysisResult = {
      analysis: {
        workspace_path: workspacePath,
        resolved_path: resolvedWorkspace,
        analysis_scope: analysisScope,
        timestamp: new Date().toISOString()
      },
      project_info: projectInfo,
      insights: [],
      recommendations: []
    };

    if (isFullAnalysis) {
      const [workflowAnalysis, architectureAnalysis, gitInfo, dependenciesSummary] = await Promise.all([
        this.analyzeWorkflow(resolvedWorkspace),
        this.analyzeArchitecture(resolvedWorkspace, true),
        this.analyzeGitRepository(resolvedWorkspace),
        this.projectInfoAnalyzer.analyzeDependencies(resolvedWorkspace)
      ]);

      result.workflow_analysis = workflowAnalysis;
      result.architecture_analysis = architectureAnalysis;
      result.git_info = gitInfo;
      result.dependencies_summary = dependenciesSummary;
    }

    result.insights = this.insightGenerator.generateInsights(result);
    result.recommendations = this.insightGenerator.generateRecommendations(result);

    if (isFullAnalysis) {
      result.health_score = this.insightGenerator.getProjectHealthScore(result);
    }

    this.cache.set(cacheKey, result);
    return result;
  }

  async getDetailedInsights(workspacePath: string): Promise<{
    categorized_insights: Record<string, string[]>;
    actionable_recommendations: string[];
    priority_recommendations: {
      high: string[];
      medium: string[];
      low: string[];
    };
    health_score: number;
  }> {
    const result = await this.analyze(workspacePath, "full");

    return {
      categorized_insights: this.insightGenerator.generateCategorizedInsights(result),
      actionable_recommendations: this.insightGenerator.generateActionableRecommendations(result),
      priority_recommendations: {
        high: this.insightGenerator.generatePriorityRecommendations(result, 'high'),
        medium: this.insightGenerator.generatePriorityRecommendations(result, 'medium'),
        low: this.insightGenerator.generatePriorityRecommendations(result, 'low')
      },
      health_score: this.insightGenerator.getProjectHealthScore(result)
    };
  }

  private async analyzeWorkflow(workspacePath: string): Promise<WorkflowAnalysis> {
    const foundWorkflows: WorkflowFile[] = [];
    const cicdPlatforms: string[] = [];

    const workflowFiles = [
      '.github/workflows',
      '.gitlab-ci.yml',
      'Jenkinsfile',
      'azure-pipelines.yml',
      'bitbucket-pipelines.yml',
      'Dockerfile',
      'docker-compose.yml',
      'Makefile',
      'package.json'
    ];

    for (const workflow of workflowFiles) {
      try {
        const workflowPath = path.join(workspacePath, workflow);
        const stats = await fs.stat(workflowPath);

        if (stats.isDirectory()) {
          const files = await fs.readdir(workflowPath);
          const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
          if (yamlFiles.length > 0) {
            foundWorkflows.push({
              type: 'GitHub Actions',
              path: workflow,
              files: yamlFiles.length
            });
            cicdPlatforms.push('GitHub Actions');
          }
        } else {
          foundWorkflows.push({
            type: this.projectInfoAnalyzer.getWorkflowType(workflow),
            path: workflow,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });

          const type = this.projectInfoAnalyzer.getWorkflowType(workflow);
          if (type !== 'Unknown' && !cicdPlatforms.includes(type)) {
            cicdPlatforms.push(type);
          }
        }
      } catch (error) {
        continue;
      }
    }

    const npmScripts = await this.projectInfoAnalyzer.extractNpmScripts(workspacePath);

    return {
      cicd_platforms: cicdPlatforms,
      workflow_files: foundWorkflows,
      npm_scripts: npmScripts,
      has_docker: foundWorkflows.some(w => w.path.includes('Docker')),
      has_makefile: foundWorkflows.some(w => w.path === 'Makefile'),
      automation_score: this.projectInfoAnalyzer.calculateAutomationScore(foundWorkflows, npmScripts)
    };
  }

  private async analyzeArchitecture(workspacePath: string, includeStructure: boolean): Promise<ArchitectureAnalysis> {
    const architecturePatterns = {
      monorepo: false,
      microservices: false,
      mvc: false,
      component_based: false,
      layered: false
    };

    try {
      const packageJsonPath = path.join(workspacePath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      if (packageJson.workspaces || await fs.access(path.join(workspacePath, 'lerna.json')).then(() => true).catch(() => false)) {
        architecturePatterns.monorepo = true;
      }
    } catch (error) {
      // package.json不存在或解析失败
    }

    const foundDirs: string[] = [];
    for (const dir of ProjectContextAnalyzer.config.commonDirs) {
      try {
        await fs.access(path.join(workspacePath, dir));
        foundDirs.push(dir);
      } catch (error) {
        // 目录不存在
      }
    }

    if (foundDirs.includes('components')) {
      architecturePatterns.component_based = true;
    }
    if (foundDirs.includes('controllers') && foundDirs.includes('models') && foundDirs.includes('views')) {
      architecturePatterns.mvc = true;
    }
    if (foundDirs.includes('services') && foundDirs.includes('api')) {
      architecturePatterns.microservices = true;
    }
    if (foundDirs.length >= 3) {
      architecturePatterns.layered = true;
    }

    const result: ArchitectureAnalysis = {
      patterns: architecturePatterns,
      directory_structure: foundDirs,
      complexity_score: this.calculateComplexityScore(foundDirs, architecturePatterns)
    };

    if (includeStructure) {
      result.detailed_structure = await this.codebaseScanner.getProjectStructure(workspacePath, 2);
    }

    return result;
  }

  private async analyzeGitRepository(workspacePath: string): Promise<GitAnalysis> {
    const gitPath = path.join(workspacePath, '.git');

    try {
      await fs.access(gitPath);
      return {
        is_git_repo: true,
        has_gitignore: await fs.access(path.join(workspacePath, '.gitignore')).then(() => true).catch(() => false),
        has_git_hooks: await fs.access(path.join(gitPath, 'hooks')).then(() => true).catch(() => false),
        note: "Full Git analysis requires git command execution"
      };
    } catch (error) {
      return { is_git_repo: false };
    }
  }

  private calculateComplexityScore(dirs: string[], patterns: any): number {
    let score = dirs.length * 10;
    score += Object.values(patterns).filter(Boolean).length * 15;
    return Math.min(score, 100);
  }
}
