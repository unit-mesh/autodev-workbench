import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import {
  ArchitectureAnalysis,
  CodebaseAnalysis,
  DependenciesAnalysis,
  FileInfo,
  GitAnalysis,
  ProjectFile,
  ProjectInfo,
  WorkflowAnalysis,
  WorkflowFile
} from "./context-analyzer.type";

interface AnalysisResult {
  analysis: {
    workspace_path: string;
    resolved_path: string;
    analysis_scope: string;
    timestamp: string;
  };
  project_info: ProjectInfo;
  codebase_analysis: CodebaseAnalysis;
  workflow_analysis?: WorkflowAnalysis;
  architecture_analysis?: ArchitectureAnalysis;
  git_info?: GitAnalysis;
  dependencies_summary?: DependenciesAnalysis;
  insights: string[];
  recommendations: string[];
}

// 配置
const config = {
  excludeDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__', '.next', '.nuxt'],
  codeExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h'],
  workflowFiles: [
    '.github/workflows',
    '.gitlab-ci.yml',
    'Jenkinsfile',
    'azure-pipelines.yml',
    'bitbucket-pipelines.yml',
    'Dockerfile',
    'docker-compose.yml',
    'Makefile',
    'package.json'
  ],
  commonDirs: ['src', 'lib', 'components', 'services', 'controllers', 'models', 'views', 'api', 'packages']
};

// 缓存
const cache = new Map<string, any>();

export const installAnalysisBasiContextTool: ToolLike = (installer) => {
  installer("analyze-basic-context", "Analyze project basic context, structure, and provide intelligent insights for planning", {
    workspace_path: z.string().optional().describe("Path to analyze (defaults to current directory)"),
    analysis_scope: z.enum(["basic", "full"]).optional().describe("Analysis scope: basic (essential info only) or full (detailed analysis)")
  }, async ({
    workspace_path,
    analysis_scope = "basic"
  }: {
    workspace_path?: string;
    analysis_scope?: "basic" | "full";
  }) => {
    try {
      // Resolve workspace path
      const workspacePath = workspace_path || process.env.WORKSPACE_PATH || process.cwd();
      const resolvedWorkspace = path.resolve(workspacePath);

      // Set analysis parameters
      const isFullAnalysis = analysis_scope === "full";
      const maxDepth = isFullAnalysis ? 3 : 2;

      // 使用缓存
      const cacheKey = `${resolvedWorkspace}-${analysis_scope}`;
      if (cache.has(cacheKey)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cache.get(cacheKey), null, 2)
            }
          ]
        };
      }

      // 并行执行分析任务
      const [projectInfo, codebaseAnalysis] = await Promise.all([
        analyzeProjectInfo(resolvedWorkspace),
        analyzeCodebase(resolvedWorkspace, maxDepth)
      ]);

      const result: AnalysisResult = {
        analysis: {
          workspace_path: workspacePath,
          resolved_path: resolvedWorkspace,
          analysis_scope: analysis_scope,
          timestamp: new Date().toISOString()
        },
        project_info: projectInfo,
        codebase_analysis: codebaseAnalysis,
        insights: [],
        recommendations: []
      };

      // 全量分析时执行额外任务
      if (isFullAnalysis) {
        const [workflowAnalysis, architectureAnalysis, gitInfo, dependenciesSummary] = await Promise.all([
          analyzeWorkflow(resolvedWorkspace),
          analyzeArchitecture(resolvedWorkspace, true),
          analyzeGitRepository(resolvedWorkspace),
          analyzeDependenciesSummary(resolvedWorkspace)
        ]);

        result.workflow_analysis = workflowAnalysis;
        result.architecture_analysis = architectureAnalysis;
        result.git_info = gitInfo;
        result.dependencies_summary = dependenciesSummary;
      }

      // 生成洞察和建议
      result.insights = generateInsights(result);
      result.recommendations = generateContextRecommendations(result);

      // 缓存结果
      cache.set(cacheKey, result);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error('Error in analysis:', error);
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing context: ${error.message}`
          }
        ]
      };
    }
  });

  // 异步项目信息分析
  async function analyzeProjectInfo(workspacePath: string): Promise<ProjectInfo> {
    const projectFiles = [
      'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml',
      'README.md', 'README.rst', 'LICENSE', 'CHANGELOG.md'
    ];

    const foundFiles: ProjectFile[] = [];
    let projectType = 'unknown';
    let projectName = path.basename(workspacePath);
    let projectVersion = 'unknown';
    let projectDescription = '';

    for (const file of projectFiles) {
      try {
        const filePath = path.join(workspacePath, file);
        const stats = await fs.stat(filePath);

        foundFiles.push({
          name: file,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });

        if (file === 'package.json') {
          const content = await fs.readFile(filePath, 'utf8');
          const packageJson = JSON.parse(content);
          projectType = 'Node.js/JavaScript';
          projectName = packageJson.name || projectName;
          projectVersion = packageJson.version || projectVersion;
          projectDescription = packageJson.description || projectDescription;
        } else if (file === 'requirements.txt' || file === 'setup.py') {
          projectType = 'Python';
        } else if (file === 'Cargo.toml') {
          projectType = 'Rust';
        } else if (file === 'go.mod') {
          projectType = 'Go';
        } else if (file === 'pom.xml') {
          projectType = 'Java/Maven';
        }
      } catch (error) {
        // 文件不存在，继续下一个
        continue;
      }
    }

    return {
      name: projectName,
      type: projectType,
      version: projectVersion,
      description: projectDescription,
      project_files: foundFiles,
      has_readme: foundFiles.some(f => f.name.toLowerCase().includes('readme')),
      has_license: foundFiles.some(f => f.name.toLowerCase().includes('license')),
      has_changelog: foundFiles.some(f => f.name.toLowerCase().includes('changelog'))
    };
  }

  // 异步代码库分析
  async function analyzeCodebase(workspacePath: string, maxDepth: number): Promise<CodebaseAnalysis> {
    const fileStats: any = {
      total_files: 0,
      total_size: 0,
      by_extension: {},
      by_directory: {},
      largest_files: []
    };

    const allFiles: FileInfo[] = [];

    async function scanDirectory(dirPath: string, currentDepth: number = 0) {
      if (currentDepth > maxDepth) return;

      try {
        const entries = await fs.readdir(dirPath);

        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry);
          const relativePath = path.relative(workspacePath, entryPath);

          if (config.excludeDirs.some(exclude => relativePath.includes(exclude))) continue;

          const stats = await fs.stat(entryPath);

          if (stats.isDirectory()) {
            await scanDirectory(entryPath, currentDepth + 1);
          } else if (stats.isFile()) {
            fileStats.total_files++;
            fileStats.total_size += stats.size;

            const ext = path.extname(entry).toLowerCase() || 'no-extension';
            if (!fileStats.by_extension[ext]) {
              fileStats.by_extension[ext] = { count: 0, size: 0 };
            }
            fileStats.by_extension[ext].count++;
            fileStats.by_extension[ext].size += stats.size;

            const dir = path.dirname(relativePath) || '.';
            if (!fileStats.by_directory[dir]) {
              fileStats.by_directory[dir] = { count: 0, size: 0 };
            }
            fileStats.by_directory[dir].count++;
            fileStats.by_directory[dir].size += stats.size;

            allFiles.push({
              path: relativePath,
              size: stats.size,
              extension: ext,
              modified: stats.mtime.toISOString()
            });
          }
        }
      } catch (error) {
        console.warn(`Warning: Cannot scan directory ${dirPath}: ${error}`);
      }
    }

    await scanDirectory(workspacePath);

    fileStats.largest_files = allFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    const codeFiles = allFiles.filter(f => config.codeExtensions.includes(f.extension));

    return {
      ...fileStats,
      code_files: codeFiles.length,
      code_ratio: fileStats.total_files > 0 ? Math.round((codeFiles.length / fileStats.total_files) * 100) : 0,
      average_file_size: fileStats.total_files > 0 ? Math.round(fileStats.total_size / fileStats.total_files) : 0,
      most_common_extensions: Object.entries(fileStats.by_extension)
        .sort(([,a]: any, [,b]: any) => b.count - a.count)
        .slice(0, 10)
    };
  }

  // 异步工作流分析
  async function analyzeWorkflow(workspacePath: string): Promise<WorkflowAnalysis> {
    const foundWorkflows: WorkflowFile[] = [];
    const cicdPlatforms: string[] = [];

    for (const workflow of config.workflowFiles) {
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
            type: getWorkflowType(workflow),
            path: workflow,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });

          const type = getWorkflowType(workflow);
          if (type !== 'Unknown' && !cicdPlatforms.includes(type)) {
            cicdPlatforms.push(type);
          }
        }
      } catch (error) {
        // 文件不存在，继续下一个
        continue;
      }
    }

    let npmScripts: string[] = [];
    try {
      const packageJsonPath = path.join(workspacePath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      npmScripts = Object.keys(packageJson.scripts || {});
    } catch (error) {
      // package.json不存在或解析失败
    }

    return {
      cicd_platforms: cicdPlatforms,
      workflow_files: foundWorkflows,
      npm_scripts: npmScripts,
      has_docker: foundWorkflows.some(w => w.path.includes('Docker')),
      has_makefile: foundWorkflows.some(w => w.path === 'Makefile'),
      automation_score: calculateAutomationScore(foundWorkflows, npmScripts)
    };
  }

  // 异步架构分析
  async function analyzeArchitecture(workspacePath: string, includeStructure: boolean): Promise<ArchitectureAnalysis> {
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
    for (const dir of config.commonDirs) {
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
      complexity_score: calculateComplexityScore(foundDirs, architecturePatterns)
    };

    if (includeStructure) {
      result.detailed_structure = await getDetailedStructure(workspacePath, 2);
    }

    return result;
  }

  // 异步Git仓库分析
  async function analyzeGitRepository(workspacePath: string): Promise<GitAnalysis> {
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

  // 异步依赖分析
  async function analyzeDependenciesSummary(workspacePath: string): Promise<DependenciesAnalysis> {
    try {
      const packageJsonPath = path.join(workspacePath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      return {
        has_dependencies: true,
        production_deps: Object.keys(packageJson.dependencies || {}).length,
        dev_deps: Object.keys(packageJson.devDependencies || {}).length,
        peer_deps: Object.keys(packageJson.peerDependencies || {}).length,
        total_deps: Object.keys({
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
          ...packageJson.peerDependencies
        }).length
      };
    } catch (error) {
      return { has_dependencies: false, error: 'Could not parse package.json' };
    }
  }

  // 辅助函数
  function getWorkflowType(filename: string): string {
    if (filename.includes('github')) return 'GitHub Actions';
    if (filename.includes('gitlab')) return 'GitLab CI';
    if (filename.includes('Jenkins')) return 'Jenkins';
    if (filename.includes('azure')) return 'Azure Pipelines';
    if (filename.includes('bitbucket')) return 'Bitbucket Pipelines';
    if (filename.includes('Docker')) return 'Docker';
    if (filename === 'Makefile') return 'Make';
    return 'Unknown';
  }

  function calculateAutomationScore(workflows: WorkflowFile[], scripts: string[]): number {
    let score = 0;
    score += workflows.length * 20;
    score += scripts.length * 5;
    return Math.min(score, 100);
  }

  function calculateComplexityScore(dirs: string[], patterns: any): number {
    let score = dirs.length * 10;
    score += Object.values(patterns).filter(Boolean).length * 15;
    return Math.min(score, 100);
  }

  async function getDetailedStructure(workspacePath: string, maxDepth: number) {
    const structure: any = {};

    async function buildStructure(dirPath: string, currentDepth: number = 0): Promise<any> {
      if (currentDepth > maxDepth) return null;

      try {
        const entries = await fs.readdir(dirPath);
        const result: any = {};

        for (const entry of entries) {
          if (entry.startsWith('.')) continue;

          const entryPath = path.join(dirPath, entry);
          const stats = await fs.stat(entryPath);

          if (stats.isDirectory()) {
            const subStructure = await buildStructure(entryPath, currentDepth + 1);
            if (subStructure) {
              result[entry] = subStructure;
            }
          } else {
            result[entry] = 'file';
          }
        }

        return result;
      } catch (error) {
        return null;
      }
    }

    return buildStructure(workspacePath);
  }

  function generateInsights(result: AnalysisResult): string[] {
    const insights: string[] = [];

    if (result.project_info?.type !== 'unknown') {
      insights.push(`Project is identified as a ${result.project_info.type} project`);
    }

    if (result.codebase_analysis?.code_ratio > 70) {
      insights.push("High code-to-total-files ratio indicates a focused codebase");
    }

    if (result.workflow_analysis?.automation_score > 60) {
      insights.push("Good automation setup with CI/CD and build scripts");
    }

    if (result.architecture_analysis?.patterns.monorepo) {
      insights.push("Monorepo architecture detected - consider workspace management tools");
    }

    return insights;
  }

  function generateContextRecommendations(result: AnalysisResult): string[] {
    const recommendations: string[] = [];

    if (!result.project_info?.has_readme) {
      recommendations.push("Consider adding a README.md file for project documentation");
    }

    if (!result.project_info?.has_license) {
      recommendations.push("Consider adding a LICENSE file to clarify usage rights");
    }

    if (result.workflow_analysis?.automation_score < 30) {
      recommendations.push("Low automation score - consider adding CI/CD workflows and build scripts");
    }

    if (result.dependencies_summary?.total_deps > 100) {
      recommendations.push("Large number of dependencies - consider dependency audit and cleanup");
    }

    return recommendations;
  }
};
