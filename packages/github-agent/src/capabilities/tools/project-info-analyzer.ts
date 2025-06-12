import * as fs from "fs/promises";
import * as path from "path";
import { ProjectInfo, ProjectFile, DependenciesAnalysis, WorkflowFile } from "./context-analyzer.type";

export interface ProjectConfig {
	projectFiles: string[];
	workflowFiles: string[];
}

export class ProjectInfoAnalyzer {
	private static readonly DEFAULT_CONFIG: ProjectConfig = {
		projectFiles: [
			'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml',
			'README.md', 'README.rst', 'LICENSE', 'CHANGELOG.md'
		],
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
		]
	};

	private config: ProjectConfig;

	constructor(config?: Partial<ProjectConfig>) {
		this.config = { ...ProjectInfoAnalyzer.DEFAULT_CONFIG, ...config };
	}

	async analyzeProjectInfo(workspacePath: string): Promise<ProjectInfo> {
		const foundFiles: ProjectFile[] = [];
		let projectType = 'unknown';
		let projectName = path.basename(workspacePath);
		let projectVersion = 'unknown';
		let projectDescription = '';

		for (const file of this.config.projectFiles) {
			try {
				const filePath = path.join(workspacePath, file);
				const stats = await fs.stat(filePath);

				foundFiles.push({
					name: file,
					size: stats.size,
					modified: stats.mtime.toISOString()
				});

				// 分析项目类型和信息
				const projectInfo = await this.extractProjectTypeInfo(filePath, file);
				if (projectInfo.type !== 'unknown') {
					projectType = projectInfo.type;
					projectName = projectInfo.name || projectName;
					projectVersion = projectInfo.version || projectVersion;
					projectDescription = projectInfo.description || projectDescription;
				}
			} catch (error) {
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

	async analyzeDependencies(workspacePath: string): Promise<DependenciesAnalysis> {
		// 尝试分析不同类型的依赖文件
		const dependencyAnalyzers = [
			() => this.analyzeNodeJSDependencies(workspacePath),
			() => this.analyzePythonDependencies(workspacePath),
			() => this.analyzeRustDependencies(workspacePath),
			() => this.analyzeGoDependencies(workspacePath),
			() => this.analyzeJavaDependencies(workspacePath)
		];

		for (const analyzer of dependencyAnalyzers) {
			try {
				const result = await analyzer();
				if (result.has_dependencies) {
					return result;
				}
			} catch (error) {
				continue;
			}
		}

		return { has_dependencies: false, error: 'No supported dependency files found' };
	}

	async extractNpmScripts(workspacePath: string): Promise<string[]> {
		try {
			const packageJsonPath = path.join(workspacePath, 'package.json');
			const content = await fs.readFile(packageJsonPath, 'utf8');
			const packageJson = JSON.parse(content);
			return Object.keys(packageJson.scripts || {});
		} catch (error) {
			return [];
		}
	}

	getWorkflowType(filename: string): string {
		const workflows = {
			'github': 'GitHub Actions',
			'gitlab': 'GitLab CI',
			'Jenkins': 'Jenkins',
			'azure': 'Azure Pipelines',
			'bitbucket': 'Bitbucket Pipelines',
			'Docker': 'Docker',
			'Makefile': 'Make'
		};

		for (const [key, value] of Object.entries(workflows)) {
			if (filename.includes(key) || filename === key) {
				return value;
			}
		}

		return 'Unknown';
	}

	calculateAutomationScore(workflows: WorkflowFile[], scripts: string[]): number {
		let score = 0;
		score += workflows.length * 20;
		score += scripts.length * 5;
		return Math.min(score, 100);
	}

	private async extractProjectTypeInfo(filePath: string, fileName: string): Promise<{
		type: string;
		name?: string;
		version?: string;
		description?: string;
	}> {
		try {
			switch (fileName) {
				case 'package.json':
					return await this.parsePackageJson(filePath);
				case 'requirements.txt':
				case 'setup.py':
					return { type: 'Python' };
				case 'Cargo.toml':
					return await this.parseCargoToml(filePath);
				case 'go.mod':
					return await this.parseGoMod(filePath);
				case 'pom.xml':
					return { type: 'Java/Maven' };
				default:
					return { type: 'unknown' };
			}
		} catch (error) {
			return { type: 'unknown' };
		}
	}

	private async parsePackageJson(filePath: string): Promise<{
		type: string;
		name?: string;
		version?: string;
		description?: string;
	}> {
		const content = await fs.readFile(filePath, 'utf8');
		const packageJson = JSON.parse(content);

		return {
			type: 'Node.js/JavaScript',
			name: packageJson.name,
			version: packageJson.version,
			description: packageJson.description
		};
	}

	private async parseCargoToml(filePath: string): Promise<{
		type: string;
		name?: string;
		version?: string;
		description?: string;
	}> {
		const content = await fs.readFile(filePath, 'utf8');

		// 简单的 TOML 解析 - 仅提取基本信息
		const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
		const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
		const descriptionMatch = content.match(/description\s*=\s*"([^"]+)"/);

		return {
			type: 'Rust',
			name: nameMatch?.[1],
			version: versionMatch?.[1],
			description: descriptionMatch?.[1]
		};
	}

	private async parseGoMod(filePath: string): Promise<{
		type: string;
		name?: string;
		version?: string;
		description?: string;
	}> {
		const content = await fs.readFile(filePath, 'utf8');

		// 提取模块名
		const moduleMatch = content.match(/module\s+(.+)/);

		return {
			type: 'Go',
			name: moduleMatch?.[1]
		};
	}

	private async analyzeNodeJSDependencies(workspacePath: string): Promise<DependenciesAnalysis> {
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
	}

	private async analyzePythonDependencies(workspacePath: string): Promise<DependenciesAnalysis> {
		const requirementsPath = path.join(workspacePath, 'requirements.txt');

		try {
			const content = await fs.readFile(requirementsPath, 'utf8');
			const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

			return {
				has_dependencies: true,
				production_deps: lines.length,
				dev_deps: 0,
				peer_deps: 0,
				total_deps: lines.length
			};
		} catch (error) {
			// 尝试查找 setup.py
			const setupPath = path.join(workspacePath, 'setup.py');
			await fs.access(setupPath);

			return {
				has_dependencies: true,
				production_deps: 0, // 无法简单解析 setup.py
				dev_deps: 0,
				peer_deps: 0,
				total_deps: 0
			};
		}
	}

	private async analyzeRustDependencies(workspacePath: string): Promise<DependenciesAnalysis> {
		const cargoPath = path.join(workspacePath, 'Cargo.toml');
		const content = await fs.readFile(cargoPath, 'utf8');

		// 简单统计依赖数量
		const dependenciesSection = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/)?.[1] || '';
		const devDependenciesSection = content.match(/\[dev-dependencies\]([\s\S]*?)(\[|$)/)?.[1] || '';

		const prodDeps = (dependenciesSection.match(/^\s*\w+\s*=/gm) || []).length;
		const devDeps = (devDependenciesSection.match(/^\s*\w+\s*=/gm) || []).length;

		return {
			has_dependencies: true,
			production_deps: prodDeps,
			dev_deps: devDeps,
			peer_deps: 0,
			total_deps: prodDeps + devDeps
		};
	}

	private async analyzeGoDependencies(workspacePath: string): Promise<DependenciesAnalysis> {
		const goModPath = path.join(workspacePath, 'go.mod');
		const content = await fs.readFile(goModPath, 'utf8');

		// 统计 require 块中的依赖
		const requireMatch = content.match(/require\s*\(([\s\S]*?)\)/);
		const singleRequires = content.match(/require\s+[^\s(]+/g) || [];

		let deps = singleRequires.length;
		if (requireMatch) {
			const requireBlock = requireMatch[1];
			deps += (requireBlock.match(/^\s*[^\s]+/gm) || []).length;
		}

		return {
			has_dependencies: true,
			production_deps: deps,
			dev_deps: 0,
			peer_deps: 0,
			total_deps: deps
		};
	}

	private async analyzeJavaDependencies(workspacePath: string): Promise<DependenciesAnalysis> {
		const pomPath = path.join(workspacePath, 'pom.xml');
		const content = await fs.readFile(pomPath, 'utf8');

		// 简单统计 <dependency> 标签数量
		const dependencyMatches = content.match(/<dependency>/g) || [];

		return {
			has_dependencies: true,
			production_deps: dependencyMatches.length,
			dev_deps: 0, // Maven 中测试依赖需要更复杂的解析
			peer_deps: 0,
			total_deps: dependencyMatches.length
		};
	}
}
