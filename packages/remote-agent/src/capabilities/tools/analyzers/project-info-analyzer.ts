import * as fs from "fs";
import * as path from "path";
import { ProjectInfo, ProjectFile, DependenciesAnalysis, WorkflowFile } from "./context-analyzer.type";

export interface ProjectConfig {
	projectFiles: string[];
	workflowFiles: string[];
	lockFiles: string[];
	configFiles: string[];
}

export class ProjectInfoAnalyzer {
	private static readonly DEFAULT_CONFIG: ProjectConfig = {
		projectFiles: [
			'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml',
			'README.md', 'README.rst', 'LICENSE', 'CHANGELOG.md', 'setup.py',
			'pyproject.toml', 'composer.json', 'Gemfile', 'build.gradle',
			'CMakeLists.txt', 'tsconfig.json'
		],
		workflowFiles: [
			'.github/workflows',
			'.gitlab-ci.yml',
			'Jenkinsfile',
			'azure-pipelines.yml',
			'bitbucket-pipelines.yml',
			'Dockerfile',
			'docker-compose.yml',
			'docker-compose.yaml',
			'Makefile',
			'.travis.yml',
			'circle.yml',
			'appveyor.yml'
		],
		lockFiles: [
			'package-lock.json',
			'yarn.lock',
			'pnpm-lock.yaml',
			'poetry.lock',
			'Cargo.lock',
			'go.sum',
			'composer.lock',
			'Gemfile.lock',
			'Pipfile.lock'
		],
		configFiles: [
			'.gitignore',
			'.env',
			'.env.example',
			'.editorconfig',
			'.eslintrc.js',
			'.eslintrc.json',
			'.prettierrc',
			'jest.config.js',
			'vite.config.js',
			'webpack.config.js',
			'rollup.config.js'
		]
	};

	private config: ProjectConfig;
	private fileCache: Map<string, string> = new Map();

	constructor(config?: Partial<ProjectConfig>) {
		this.config = { 
			...ProjectInfoAnalyzer.DEFAULT_CONFIG, 
			...config,
			projectFiles: [...ProjectInfoAnalyzer.DEFAULT_CONFIG.projectFiles, ...(config?.projectFiles || [])],
			workflowFiles: [...ProjectInfoAnalyzer.DEFAULT_CONFIG.workflowFiles, ...(config?.workflowFiles || [])],
			lockFiles: [...ProjectInfoAnalyzer.DEFAULT_CONFIG.lockFiles, ...(config?.lockFiles || [])],
			configFiles: [...ProjectInfoAnalyzer.DEFAULT_CONFIG.configFiles, ...(config?.configFiles || [])]
		};
	}

	analyzeProjectInfo(workspacePath: string): ProjectInfo {
		const foundFiles: ProjectFile[] = [];
		let projectType = 'unknown';
		let projectName = path.basename(workspacePath);
		let projectVersion = 'unknown';
		let projectDescription = '';

		// 批量检查所有文件类型
		const allFiles = [
			...this.config.projectFiles,
			...this.config.lockFiles,
			...this.config.configFiles
		];

		for (const file of allFiles) {
			try {
				const filePath = path.join(workspacePath, file);
				const stats = fs.statSync(filePath);

				foundFiles.push({
					name: file,
					size: stats.size,
					modified: stats.mtime.toISOString()
				});

				// 仅对项目文件分析类型信息
				if (this.config.projectFiles.includes(file)) {
					const projectInfo = this.extractProjectTypeInfo(filePath, file);
					if (projectInfo.type !== 'unknown') {
						projectType = projectInfo.type;
						projectName = projectInfo.name || projectName;
						projectVersion = projectInfo.version || projectVersion;
						projectDescription = projectInfo.description || projectDescription;
					}
				}
			} catch (error) {
				// 文件不存在，继续下一个
				continue;
			}
		}

		// 分析工作流文件
		const workflowFiles = this.analyzeWorkflowFiles(workspacePath);

		return {
			name: projectName,
			type: projectType,
			version: projectVersion,
			description: projectDescription,
			project_files: foundFiles,
			workflow_files: workflowFiles,
			has_readme: foundFiles.some(f => f.name.toLowerCase().includes('readme')),
			has_license: foundFiles.some(f => f.name.toLowerCase().includes('license')),
			has_changelog: foundFiles.some(f => f.name.toLowerCase().includes('changelog')),
			has_lock_files: foundFiles.some(f => this.config.lockFiles.includes(f.name)),
			has_config_files: foundFiles.some(f => this.config.configFiles.includes(f.name)),
			has_dockerfile: foundFiles.some(f => f.name.toLowerCase().includes('dockerfile')),
			has_ci_cd: workflowFiles.length > 0
		};
	}

	analyzeDependencies(workspacePath: string): DependenciesAnalysis {
		// 按优先级顺序尝试分析不同类型的依赖文件
		const dependencyAnalyzers = [
			{ analyzer: () => this.analyzeNodeJSDependencies(workspacePath), priority: 1 },
			{ analyzer: () => this.analyzePythonDependencies(workspacePath), priority: 2 },
			{ analyzer: () => this.analyzeRustDependencies(workspacePath), priority: 3 },
			{ analyzer: () => this.analyzeGoDependencies(workspacePath), priority: 4 },
			{ analyzer: () => this.analyzeJavaDependencies(workspacePath), priority: 5 },
			{ analyzer: () => this.analyzePHPDependencies(workspacePath), priority: 6 },
			{ analyzer: () => this.analyzeRubyDependencies(workspacePath), priority: 7 }
		];

		// 首先找到所有可能的分析器
		const availableAnalyzers = [];
		for (const { analyzer, priority } of dependencyAnalyzers) {
			try {
				const result = analyzer();
				if (result.has_dependencies) {
					availableAnalyzers.push({ result, priority });
				}
			} catch (error) {
				continue;
			}
		}

		// 返回优先级最高的结果
		if (availableAnalyzers.length > 0) {
			availableAnalyzers.sort((a, b) => a.priority - b.priority);
			return availableAnalyzers[0].result;
		}

		return { has_dependencies: false, error: 'No supported dependency files found' };
	}

	extractNpmScripts(workspacePath: string): string[] {
		try {
			const packageJsonPath = path.join(workspacePath, 'package.json');
			const content = this.readFileSync(packageJsonPath);
			const packageJson = JSON.parse(content);
			return Object.keys(packageJson.scripts || {});
		} catch (error) {
			return [];
		}
	}

	analyzeWorkflowFiles(workspacePath: string): WorkflowFile[] {
		const workflowFiles: WorkflowFile[] = [];

		for (const workflowPath of this.config.workflowFiles) {
			try {
				const fullPath = path.join(workspacePath, workflowPath);
				
				if (workflowPath === '.github/workflows') {
					// 特殊处理 GitHub Actions 目录
					try {
						const files = fs.readdirSync(fullPath);
						for (const file of files) {
							if (file.endsWith('.yml') || file.endsWith('.yaml')) {
								const stats = fs.statSync(path.join(fullPath, file));
								workflowFiles.push({
									name: file,
									type: 'GitHub Actions',
									path: path.join('.github/workflows', file),
									size: stats.size,
									modified: stats.mtime.toISOString()
								});
							}
						}
					} catch (error) {
						continue;
					}
				} else {
					// 处理单个文件
					const stats = fs.statSync(fullPath);
					workflowFiles.push({
						name: path.basename(workflowPath),
						type: this.getWorkflowType(workflowPath),
						path: workflowPath,
						size: stats.size,
						modified: stats.mtime.toISOString()
					});
				}
			} catch (error) {
				continue;
			}
		}

		return workflowFiles;
	}

	getWorkflowType(filename: string): string {
		const workflows = {
			'github': 'GitHub Actions',
			'gitlab': 'GitLab CI',
			'Jenkins': 'Jenkins',
			'azure': 'Azure Pipelines',
			'bitbucket': 'Bitbucket Pipelines',
			'Docker': 'Docker',
			'Makefile': 'Make',
			'travis': 'Travis CI',
			'circle': 'CircleCI',
			'appveyor': 'AppVeyor'
		};

		const lowerFilename = filename.toLowerCase();
		for (const [key, value] of Object.entries(workflows)) {
			if (lowerFilename.includes(key.toLowerCase()) || lowerFilename === key.toLowerCase()) {
				return value;
			}
		}

		return 'Unknown';
	}

	calculateAutomationScore(workflows: WorkflowFile[], scripts: string[]): number {
		let score = 0;
		score += workflows.length * 15; // 降低工作流权重
		score += scripts.length * 3; // 降低脚本权重
		
		// 根据工作流类型给予不同权重
		const workflowTypeWeights = {
			'GitHub Actions': 20,
			'GitLab CI': 18,
			'Jenkins': 15,
			'Docker': 10,
			'Make': 5
		};

		workflows.forEach(workflow => {
			const weight = workflowTypeWeights[workflow.type as keyof typeof workflowTypeWeights] || 5;
			score += weight;
		});

		return Math.min(score, 100);
	}

	private readFileSync(filePath: string): string {
		if (this.fileCache.has(filePath)) {
			return this.fileCache.get(filePath)!;
		}
		
		const content = fs.readFileSync(filePath, 'utf8');
		this.fileCache.set(filePath, content);
		return content;
	}

	private extractProjectTypeInfo(filePath: string, fileName: string): {
		type: string;
		name?: string;
		version?: string;
		description?: string;
	} {
		try {
			switch (fileName) {
				case 'package.json':
					return this.parsePackageJson(filePath);
				case 'requirements.txt':
				case 'setup.py':
					return { type: 'Python' };
				case 'pyproject.toml':
					return this.parsePyprojectToml(filePath);
				case 'Cargo.toml':
					return this.parseCargoToml(filePath);
				case 'go.mod':
					return this.parseGoMod(filePath);
				case 'pom.xml':
					return { type: 'Java/Maven' };
				case 'build.gradle':
					return { type: 'Java/Gradle' };
				case 'composer.json':
					return this.parseComposerJson(filePath);
				case 'Gemfile':
					return { type: 'Ruby' };
				case 'CMakeLists.txt':
					return { type: 'C/C++' };
				case 'tsconfig.json':
					return { type: 'TypeScript' };
				default:
					return { type: 'unknown' };
			}
		} catch (error) {
			return { type: 'unknown' };
		}
	}

	private parsePackageJson(filePath: string): {
		type: string;
		name?: string;
		version?: string;
		description?: string;
	} {
		const content = this.readFileSync(filePath);
		const packageJson = JSON.parse(content);

		// 判断是否为 TypeScript 项目
		const isTypeScript = packageJson.devDependencies?.typescript || 
		                    packageJson.dependencies?.typescript ||
		                    fs.existsSync(path.join(path.dirname(filePath), 'tsconfig.json'));

		return {
			type: isTypeScript ? 'TypeScript/Node.js' : 'Node.js/JavaScript',
			name: packageJson.name,
			version: packageJson.version,
			description: packageJson.description
		};
	}

	private parsePyprojectToml(filePath: string): {
		type: string;
		name?: string;
		version?: string;
		description?: string;
	} {
		const content = this.readFileSync(filePath);
		
		// 简单的 TOML 解析
		const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
		const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
		const descriptionMatch = content.match(/description\s*=\s*"([^"]+)"/);

		return {
			type: 'Python',
			name: nameMatch?.[1],
			version: versionMatch?.[1],
			description: descriptionMatch?.[1]
		};
	}

	private parseCargoToml(filePath: string): {
		type: string;
		name?: string;
		version?: string;
		description?: string;
	} {
		const content = this.readFileSync(filePath);

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

	private parseGoMod(filePath: string): {
		type: string;
		name?: string;
		version?: string;
		description?: string;
	} {
		const content = this.readFileSync(filePath);

		// 提取模块名和版本
		const moduleMatch = content.match(/module\s+(.+)/);
		const goVersionMatch = content.match(/go\s+(\d+\.\d+)/);

		return {
			type: 'Go',
			name: moduleMatch?.[1],
			version: goVersionMatch?.[1]
		};
	}

	private parseComposerJson(filePath: string): {
		type: string;
		name?: string;
		version?: string;
		description?: string;
	} {
		const content = this.readFileSync(filePath);
		const composerJson = JSON.parse(content);

		return {
			type: 'PHP',
			name: composerJson.name,
			version: composerJson.version,
			description: composerJson.description
		};
	}

	private analyzeNodeJSDependencies(workspacePath: string): DependenciesAnalysis {
		const packageJsonPath = path.join(workspacePath, 'package.json');
		const content = this.readFileSync(packageJsonPath);
		const packageJson = JSON.parse(content);

		const dependencies = packageJson.dependencies || {};
		const devDependencies = packageJson.devDependencies || {};
		const peerDependencies = packageJson.peerDependencies || {};
		const optionalDependencies = packageJson.optionalDependencies || {};

		return {
			has_dependencies: true,
			production_deps: Object.keys(dependencies).length,
			dev_deps: Object.keys(devDependencies).length,
			peer_deps: Object.keys(peerDependencies).length,
			optional_deps: Object.keys(optionalDependencies).length,
			total_deps: Object.keys({
				...dependencies,
				...devDependencies,
				...peerDependencies,
				...optionalDependencies
			}).length
		};
	}

	private analyzePythonDependencies(workspacePath: string): DependenciesAnalysis {
		// 优先检查 pyproject.toml
		const pyprojectPath = path.join(workspacePath, 'pyproject.toml');
		if (fs.existsSync(pyprojectPath)) {
			try {
				const content = this.readFileSync(pyprojectPath);
				const dependenciesMatch = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
				if (dependenciesMatch) {
					const deps = dependenciesMatch[1].split(',').filter(line => line.trim());
					return {
						has_dependencies: true,
						production_deps: deps.length,
						dev_deps: 0,
						peer_deps: 0,
						total_deps: deps.length
					};
				}
			} catch (error) {
				// 继续尝试其他文件
			}
		}

		// 检查 requirements.txt
		const requirementsPath = path.join(workspacePath, 'requirements.txt');
		if (fs.existsSync(requirementsPath)) {
			try {
				const content = this.readFileSync(requirementsPath);
				const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

				return {
					has_dependencies: true,
					production_deps: lines.length,
					dev_deps: 0,
					peer_deps: 0,
					total_deps: lines.length
				};
			} catch (error) {
				// 继续尝试其他文件
			}
		}

		// 检查 setup.py
		const setupPath = path.join(workspacePath, 'setup.py');
		if (fs.existsSync(setupPath)) {
			return {
				has_dependencies: true,
				production_deps: 0, // 无法简单解析 setup.py
				dev_deps: 0,
				peer_deps: 0,
				total_deps: 0
			};
		}

		throw new Error('No Python dependency files found');
	}

	private analyzeRustDependencies(workspacePath: string): DependenciesAnalysis {
		const cargoPath = path.join(workspacePath, 'Cargo.toml');
		const content = this.readFileSync(cargoPath);

		// 改进的 TOML 解析
		const dependenciesSection = content.match(/\[dependencies\]([\s\S]*?)(?=\[|$)/)?.[1] || '';
		const devDependenciesSection = content.match(/\[dev-dependencies\]([\s\S]*?)(?=\[|$)/)?.[1] || '';
		const buildDependenciesSection = content.match(/\[build-dependencies\]([\s\S]*?)(?=\[|$)/)?.[1] || '';

		const prodDeps = (dependenciesSection.match(/^\s*[\w-]+\s*=/gm) || []).length;
		const devDeps = (devDependenciesSection.match(/^\s*[\w-]+\s*=/gm) || []).length;
		const buildDeps = (buildDependenciesSection.match(/^\s*[\w-]+\s*=/gm) || []).length;

		return {
			has_dependencies: true,
			production_deps: prodDeps,
			dev_deps: devDeps,
			build_deps: buildDeps,
			peer_deps: 0,
			total_deps: prodDeps + devDeps + buildDeps
		};
	}

	private analyzeGoDependencies(workspacePath: string): DependenciesAnalysis {
		const goModPath = path.join(workspacePath, 'go.mod');
		const content = this.readFileSync(goModPath);

		// 改进的 go.mod 解析
		const requireMatch = content.match(/require\s*\(([\s\S]*?)\)/);
		const singleRequires = content.match(/require\s+[^\s(]+\s+v[\d.]+/g) || [];

		let deps = singleRequires.length;
		if (requireMatch) {
			const requireBlock = requireMatch[1];
			const blockDeps = requireBlock.split('\n')
				.filter(line => line.trim() && !line.trim().startsWith('//'))
				.filter(line => line.includes('v') || line.includes('master') || line.includes('main'));
			deps += blockDeps.length;
		}

		return {
			has_dependencies: true,
			production_deps: deps,
			dev_deps: 0,
			peer_deps: 0,
			total_deps: deps
		};
	}

	private analyzeJavaDependencies(workspacePath: string): DependenciesAnalysis {
		const pomPath = path.join(workspacePath, 'pom.xml');
		if (fs.existsSync(pomPath)) {
			const content = this.readFileSync(pomPath);
			const dependencyMatches = content.match(/<dependency>/g) || [];
			const testScopeDeps = content.match(/<scope>test<\/scope>/g) || [];

			return {
				has_dependencies: true,
				production_deps: dependencyMatches.length - testScopeDeps.length,
				dev_deps: testScopeDeps.length,
				peer_deps: 0,
				total_deps: dependencyMatches.length
			};
		}

		// 检查 Gradle
		const gradlePath = path.join(workspacePath, 'build.gradle');
		if (fs.existsSync(gradlePath)) {
			const content = this.readFileSync(gradlePath);
			const implementationDeps = content.match(/implementation\s+/g) || [];
			const testDeps = content.match(/testImplementation\s+/g) || [];

			return {
				has_dependencies: true,
				production_deps: implementationDeps.length,
				dev_deps: testDeps.length,
				peer_deps: 0,
				total_deps: implementationDeps.length + testDeps.length
			};
		}

		throw new Error('No Java dependency files found');
	}

	private analyzePHPDependencies(workspacePath: string): DependenciesAnalysis {
		const composerPath = path.join(workspacePath, 'composer.json');
		const content = this.readFileSync(composerPath);
		const composerJson = JSON.parse(content);

		const require = composerJson.require || {};
		const requireDev = composerJson['require-dev'] || {};

		// 排除 PHP 版本约束
		const prodDeps = Object.keys(require).filter(dep => dep !== 'php').length;
		const devDeps = Object.keys(requireDev).length;

		return {
			has_dependencies: true,
			production_deps: prodDeps,
			dev_deps: devDeps,
			peer_deps: 0,
			total_deps: prodDeps + devDeps
		};
	}

	private analyzeRubyDependencies(workspacePath: string): DependenciesAnalysis {
		const gemfilePath = path.join(workspacePath, 'Gemfile');
		const content = this.readFileSync(gemfilePath);

		const gemMatches = content.match(/gem\s+['"][^'"]+['"]/g) || [];
		const testGroupMatches = content.match(/group\s*:test[\s\S]*?end/g) || [];
		const devGroupMatches = content.match(/group\s*:development[\s\S]*?end/g) || [];

		// 简单统计，实际解析会更复杂
		const totalGems = gemMatches.length;
		const estimatedDevGems = testGroupMatches.length + devGroupMatches.length;

		return {
			has_dependencies: true,
			production_deps: Math.max(0, totalGems - estimatedDevGems),
			dev_deps: estimatedDevGems,
			peer_deps: 0,
			total_deps: totalGems
		};
	}
}
