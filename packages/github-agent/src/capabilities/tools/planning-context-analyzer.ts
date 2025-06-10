import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const installContextAnalysisTool: ToolLike = (installer) => {
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

      // Set analysis parameters based on scope
      const isFullAnalysis = analysis_scope === "full";
      const maxDepth = isFullAnalysis ? 3 : 2;
      const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__', '.next', '.nuxt'];

      const result: any = {
        analysis: {
          workspace_path: workspacePath,
          resolved_path: resolvedWorkspace,
          analysis_scope: analysis_scope,
          timestamp: new Date().toISOString()
        }
      };

      // Always include basic project info
      result.project_info = await analyzeProjectInfo(resolvedWorkspace);

      // Always include basic codebase analysis
      result.codebase_analysis = await analyzeCodebase(resolvedWorkspace, maxDepth, excludeDirs);

      // Include additional analysis for full scope
      if (isFullAnalysis) {
        result.workflow_analysis = await analyzeWorkflow(resolvedWorkspace);
        result.architecture_analysis = await analyzeArchitecture(resolvedWorkspace, true);
        result.git_info = await analyzeGitRepository(resolvedWorkspace);
        result.dependencies_summary = await analyzeDependenciesSummary(resolvedWorkspace);
      }

      // Generate insights and recommendations
      result.insights = generateInsights(result);
      result.recommendations = generateContextRecommendations(result);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
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

  // Helper function to analyze project information
  async function analyzeProjectInfo(workspacePath: string) {
    const projectFiles = [
      'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml',
      'README.md', 'README.rst', 'LICENSE', 'CHANGELOG.md'
    ];

    const foundFiles: any[] = [];
    let projectType = 'unknown';
    let projectName = path.basename(workspacePath);
    let projectVersion = 'unknown';
    let projectDescription = '';

    for (const file of projectFiles) {
      const filePath = path.join(workspacePath, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        foundFiles.push({
          name: file,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });

        // Extract project information
        if (file === 'package.json') {
          try {
            const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            projectType = 'Node.js/JavaScript';
            projectName = packageJson.name || projectName;
            projectVersion = packageJson.version || projectVersion;
            projectDescription = packageJson.description || projectDescription;
          } catch (error) {
            console.warn('Could not parse package.json');
          }
        } else if (file === 'requirements.txt' || file === 'setup.py') {
          projectType = 'Python';
        } else if (file === 'Cargo.toml') {
          projectType = 'Rust';
        } else if (file === 'go.mod') {
          projectType = 'Go';
        } else if (file === 'pom.xml') {
          projectType = 'Java/Maven';
        }
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

  // Helper function to analyze codebase
  async function analyzeCodebase(workspacePath: string, maxDepth: number, excludeDirs: string[]) {
    const fileStats: any = {
      total_files: 0,
      total_size: 0,
      by_extension: {},
      by_directory: {},
      largest_files: []
    };

    const allFiles: any[] = [];

    function scanDirectory(dirPath: string, currentDepth: number = 0) {
      if (currentDepth > maxDepth) return;

      try {
        const entries = fs.readdirSync(dirPath);
        
        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry);
          const relativePath = path.relative(workspacePath, entryPath);
          
          // Skip excluded directories
          if (excludeDirs.some(exclude => relativePath.includes(exclude))) continue;

          const stats = fs.statSync(entryPath);
          
          if (stats.isDirectory()) {
            scanDirectory(entryPath, currentDepth + 1);
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

    scanDirectory(workspacePath);

    // Find largest files
    fileStats.largest_files = allFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    // Calculate code vs non-code ratio
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h'];
    const codeFiles = allFiles.filter(f => codeExtensions.includes(f.extension));
    
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

  // Helper function to analyze workflow
  async function analyzeWorkflow(workspacePath: string) {
    const workflowFiles = [
      '.github/workflows',
      '.gitlab-ci.yml',
      'Jenkinsfile',
      'azure-pipelines.yml',
      'bitbucket-pipelines.yml',
      'Dockerfile',
      'docker-compose.yml',
      'Makefile',
      'package.json' // for npm scripts
    ];

    const foundWorkflows: any[] = [];
    const cicdPlatforms: string[] = [];

    for (const workflow of workflowFiles) {
      const workflowPath = path.join(workspacePath, workflow);
      
      if (fs.existsSync(workflowPath)) {
        const stats = fs.statSync(workflowPath);
        
        if (stats.isDirectory()) {
          // GitHub Actions
          try {
            const files = fs.readdirSync(workflowPath);
            const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
            if (yamlFiles.length > 0) {
              foundWorkflows.push({
                type: 'GitHub Actions',
                path: workflow,
                files: yamlFiles.length
              });
              cicdPlatforms.push('GitHub Actions');
            }
          } catch (error) {
            console.warn(`Could not read workflow directory: ${workflow}`);
          }
        } else {
          // Single workflow files
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
      }
    }

    // Check for npm scripts
    let npmScripts: string[] = [];
    const packageJsonPath = path.join(workspacePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        npmScripts = Object.keys(packageJson.scripts || {});
      } catch (error) {
        console.warn('Could not parse package.json for scripts');
      }
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

  // Helper function to analyze architecture
  async function analyzeArchitecture(workspacePath: string, includeStructure: boolean) {
    const architecturePatterns: any = {
      monorepo: false,
      microservices: false,
      mvc: false,
      component_based: false,
      layered: false
    };

    // Check for monorepo patterns
    const packageJsonPath = path.join(workspacePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.workspaces || fs.existsSync(path.join(workspacePath, 'lerna.json'))) {
          architecturePatterns.monorepo = true;
        }
      } catch (error) {
        console.warn('Could not analyze package.json for monorepo patterns');
      }
    }

    // Check for common directory patterns
    const commonDirs = ['src', 'lib', 'components', 'services', 'controllers', 'models', 'views', 'api', 'packages'];
    const foundDirs: string[] = [];

    for (const dir of commonDirs) {
      if (fs.existsSync(path.join(workspacePath, dir))) {
        foundDirs.push(dir);
      }
    }

    // Detect patterns based on directory structure
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

    const result: any = {
      patterns: architecturePatterns,
      directory_structure: foundDirs,
      complexity_score: calculateComplexityScore(foundDirs, architecturePatterns)
    };

    if (includeStructure) {
      result.detailed_structure = getDetailedStructure(workspacePath, 2);
    }

    return result;
  }

  // Helper function to analyze Git repository
  async function analyzeGitRepository(workspacePath: string) {
    const gitPath = path.join(workspacePath, '.git');
    
    if (!fs.existsSync(gitPath)) {
      return { is_git_repo: false };
    }

    // Basic Git info (would need git commands for full analysis)
    return {
      is_git_repo: true,
      has_gitignore: fs.existsSync(path.join(workspacePath, '.gitignore')),
      has_git_hooks: fs.existsSync(path.join(gitPath, 'hooks')),
      note: "Full Git analysis requires git command execution"
    };
  }

  // Helper function to analyze dependencies summary
  async function analyzeDependenciesSummary(workspacePath: string) {
    const packageJsonPath = path.join(workspacePath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return { has_dependencies: false };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
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

  // Helper functions
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

  function calculateAutomationScore(workflows: any[], scripts: string[]): number {
    let score = 0;
    score += workflows.length * 20; // 20 points per workflow file
    score += scripts.length * 5; // 5 points per npm script
    return Math.min(score, 100); // Cap at 100
  }

  function calculateComplexityScore(dirs: string[], patterns: any): number {
    let score = dirs.length * 10;
    score += Object.values(patterns).filter(Boolean).length * 15;
    return Math.min(score, 100);
  }

  function getDetailedStructure(workspacePath: string, maxDepth: number) {
    // Simplified structure analysis
    const structure: any = {};
    
    function buildStructure(dirPath: string, currentDepth: number = 0): any {
      if (currentDepth > maxDepth) return null;
      
      try {
        const entries = fs.readdirSync(dirPath);
        const result: any = {};
        
        for (const entry of entries) {
          if (entry.startsWith('.')) continue;
          
          const entryPath = path.join(dirPath, entry);
          const stats = fs.statSync(entryPath);
          
          if (stats.isDirectory()) {
            const subStructure = buildStructure(entryPath, currentDepth + 1);
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

  function generateInsights(result: any): string[] {
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

  function generateContextRecommendations(result: any): string[] {
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
