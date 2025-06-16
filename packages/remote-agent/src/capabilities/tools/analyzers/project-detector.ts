import * as fs from "fs/promises";
import * as path from "path";

export interface ProjectDetectionResult {
	language: string;
	type: string;
	confidence: number;
}

export interface ProjectConfig {
	name: string;
	version?: string;
	description?: string;
	language: string;
	project_type: string;
	confidence: number;
	main_dependencies?: string[];
	dev_dependencies_count?: number;
	scripts?: string[];
	engines?: any;
	build_tools: string[];
	dependencies_count?: number;
	virtual_env?: string;
	module_name?: string;
	go_version?: string;
	edition?: string;
	project_files?: string[];
	solution_files?: string[];
	gemspec_files?: string[];
}

/**
 * 项目类型检测器 - 支持多种编程语言
 */
export class ProjectDetector {
	private static readonly DETECTION_RULES = [
		// TypeScript 优先级更高，放在前面
		{ files: ["tsconfig.json"], language: "typescript", type: "typescript", confidence: 0.9 },
		
		// JavaScript/Node.js
		{ files: ["package.json"], language: "javascript", type: "nodejs", confidence: 0.9 },
		{ files: ["yarn.lock"], language: "javascript", type: "nodejs", confidence: 0.7 },
		{ files: ["pnpm-lock.yaml"], language: "javascript", type: "nodejs", confidence: 0.7 },
		
		// Python
		{ files: ["requirements.txt"], language: "python", type: "python", confidence: 0.8 },
		{ files: ["pyproject.toml"], language: "python", type: "python", confidence: 0.9 },
		{ files: ["setup.py"], language: "python", type: "python", confidence: 0.8 },
		{ files: ["Pipfile"], language: "python", type: "python", confidence: 0.8 },
		{ files: ["poetry.lock"], language: "python", type: "python", confidence: 0.8 },
		
		// Java
		{ files: ["pom.xml"], language: "java", type: "maven", confidence: 0.9 },
		{ files: ["build.gradle", "build.gradle.kts"], language: "java", type: "gradle", confidence: 0.9 },
		{ files: ["gradlew"], language: "java", type: "gradle", confidence: 0.8 },
		
		// Go
		{ files: ["go.mod"], language: "go", type: "go_module", confidence: 0.9 },
		{ files: ["go.sum"], language: "go", type: "go_module", confidence: 0.7 },
		
		// Rust
		{ files: ["Cargo.toml"], language: "rust", type: "cargo", confidence: 0.9 },
		{ files: ["Cargo.lock"], language: "rust", type: "cargo", confidence: 0.7 },
		
		// C/C++
		{ files: ["CMakeLists.txt"], language: "cpp", type: "cmake", confidence: 0.8 },
		{ files: ["Makefile"], language: "c", type: "makefile", confidence: 0.6 },
		{ files: ["configure.ac"], language: "c", type: "autotools", confidence: 0.7 },
		
		// C#/.NET
		{ files: ["*.csproj", "*.sln"], language: "csharp", type: "dotnet", confidence: 0.9 },
		{ files: ["project.json"], language: "csharp", type: "dotnet", confidence: 0.7 },
		
		// PHP
		{ files: ["composer.json"], language: "php", type: "composer", confidence: 0.9 },
		
		// Ruby
		{ files: ["Gemfile"], language: "ruby", type: "bundler", confidence: 0.9 },
		{ files: ["*.gemspec"], language: "ruby", type: "gem", confidence: 0.8 },
		
		// Swift
		{ files: ["Package.swift"], language: "swift", type: "swift_package", confidence: 0.9 },
		{ files: ["*.xcodeproj"], language: "swift", type: "xcode", confidence: 0.8 },
		
		// Kotlin
		{ files: ["build.gradle.kts"], language: "kotlin", type: "gradle", confidence: 0.8 },
		
		// Scala
		{ files: ["build.sbt"], language: "scala", type: "sbt", confidence: 0.9 },
	];

	private static readonly LANGUAGE_SPECIFIC_FILES: Record<string, string[]> = {
		javascript: ["package.json", "yarn.lock", "package-lock.json", "pnpm-lock.yaml", ".nvmrc"],
		typescript: ["tsconfig.json", "tslint.json", ".eslintrc.js", ".eslintrc.json"],
		python: ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile", "poetry.lock", "tox.ini", ".python-version"],
		java: ["pom.xml", "build.gradle", "build.gradle.kts", "gradlew", "gradlew.bat", "settings.gradle"],
		go: ["go.mod", "go.sum", "go.work", "go.work.sum"],
		rust: ["Cargo.toml", "Cargo.lock", "rust-toolchain", "rust-toolchain.toml"],
		cpp: ["CMakeLists.txt", "conanfile.txt", "conanfile.py", "vcpkg.json"],
		c: ["Makefile", "configure.ac", "configure.in", "CMakeLists.txt"],
		csharp: ["*.csproj", "*.sln", "project.json", "packages.config", "Directory.Build.props"],
		php: ["composer.json", "composer.lock", ".php-version"],
		ruby: ["Gemfile", "Gemfile.lock", "*.gemspec", ".ruby-version", "Rakefile"],
		swift: ["Package.swift", "*.xcodeproj", "*.xcworkspace", "Podfile"],
		kotlin: ["build.gradle.kts", "settings.gradle.kts"],
		scala: ["build.sbt", "project/build.properties"],
	};

	private static readonly FILE_EXTENSION_MAP: Record<string, { language: string; type: string }> = {
		'.js': { language: 'javascript', type: 'javascript' },
		'.ts': { language: 'typescript', type: 'typescript' },
		'.py': { language: 'python', type: 'python' },
		'.java': { language: 'java', type: 'java' },
		'.go': { language: 'go', type: 'go' },
		'.rs': { language: 'rust', type: 'rust' },
		'.cpp': { language: 'cpp', type: 'cpp' },
		'.c': { language: 'c', type: 'c' },
		'.cs': { language: 'csharp', type: 'csharp' },
		'.php': { language: 'php', type: 'php' },
		'.rb': { language: 'ruby', type: 'ruby' },
		'.swift': { language: 'swift', type: 'swift' },
		'.kt': { language: 'kotlin', type: 'kotlin' },
		'.scala': { language: 'scala', type: 'scala' },
	};

	/**
	 * 检测项目类型和主要编程语言
	 */
	async detectProjectType(workspacePath: string): Promise<ProjectDetectionResult> {
		// 首先尝试基于配置文件检测
		for (const rule of ProjectDetector.DETECTION_RULES) {
			for (const filePattern of rule.files) {
				try {
					if (filePattern.includes("*")) {
						// 处理通配符模式
						const entries = await fs.readdir(workspacePath);
						const pattern = filePattern.replace("*", "");
						const found = entries.some(entry => entry.includes(pattern));
						if (found) {
							return {
								language: rule.language,
								type: rule.type,
								confidence: rule.confidence
							};
						}
					} else {
						// 直接文件检查
						const filePath = path.join(workspacePath, filePattern);
						const exists = await fs.access(filePath).then(() => true).catch(() => false);
						if (exists) {
							return {
								language: rule.language,
								type: rule.type,
								confidence: rule.confidence
							};
						}
					}
				} catch (error) {
					continue;
				}
			}
		}

		// 如果没有找到明确的项目类型，尝试通过文件扩展名推断
		return await this.detectByFileExtensions(workspacePath);
	}

	/**
	 * 通过文件扩展名检测主要编程语言
	 */
	private async detectByFileExtensions(workspacePath: string): Promise<ProjectDetectionResult> {
		try {
			const entries = await fs.readdir(workspacePath);
			const extensionCounts: Record<string, number> = {};
			
			for (const entry of entries.slice(0, 50)) { // 限制检查文件数量
				const ext = path.extname(entry).toLowerCase();
				if (ext) {
					extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
				}
			}

			// 找到最常见的扩展名
			const mostCommonExt = Object.entries(extensionCounts)
				.sort(([,a], [,b]) => b - a)[0];

			if (mostCommonExt && ProjectDetector.FILE_EXTENSION_MAP[mostCommonExt[0]]) {
				const info = ProjectDetector.FILE_EXTENSION_MAP[mostCommonExt[0]];
				return {
					language: info.language,
					type: info.type,
					confidence: 0.5 // 基于文件扩展名的置信度较低
				};
			}
		} catch (error) {
			// 忽略错误
		}

		return {
			language: "unknown",
			type: "generic",
			confidence: 0.1
		};
	}

	/**
	 * 获取语言特定的关键文件列表
	 */
	getLanguageSpecificFiles(language: string): string[] {
		return ProjectDetector.LANGUAGE_SPECIFIC_FILES[language] || [];
	}

	/**
	 * 读取项目配置信息
	 */
	async readProjectConfig(workspacePath: string, detection: ProjectDetectionResult): Promise<ProjectConfig> {
		const config: ProjectConfig = {
			name: path.basename(workspacePath),
			language: detection.language,
			project_type: detection.type,
			confidence: detection.confidence,
			build_tools: []
		};

		try {
			switch (detection.language) {
				case 'javascript':
				case 'typescript':
					await this.readNodeJsConfig(workspacePath, config);
					break;
				case 'python':
					await this.readPythonConfig(workspacePath, config);
					break;
				case 'java':
					await this.readJavaConfig(workspacePath, config);
					break;
				case 'go':
					await this.readGoConfig(workspacePath, config);
					break;
				case 'rust':
					await this.readRustConfig(workspacePath, config);
					break;
				case 'csharp':
					await this.readDotNetConfig(workspacePath, config);
					break;
				case 'php':
					await this.readPhpConfig(workspacePath, config);
					break;
				case 'ruby':
					await this.readRubyConfig(workspacePath, config);
					break;
				default:
					// 保持默认配置
					break;
			}
		} catch (error) {
			// 如果读取配置失败，保持默认配置
		}

		return config;
	}

	/**
	 * 读取 Node.js 项目配置
	 */
	private async readNodeJsConfig(workspacePath: string, config: ProjectConfig): Promise<void> {
		const packageJsonPath = path.join(workspacePath, "package.json");
		try {
			const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
			config.name = packageJson.name || path.basename(workspacePath);
			config.version = packageJson.version || "unknown";
			config.description = packageJson.description || "";
			config.main_dependencies = Object.keys(packageJson.dependencies || {}).slice(0, 10);
			config.dev_dependencies_count = Object.keys(packageJson.devDependencies || {}).length;
			config.scripts = Object.keys(packageJson.scripts || {});
			if (packageJson.engines) {
				config.engines = packageJson.engines;
			}
		} catch (error) {
			// 保持默认配置
		}
	}

	/**
	 * 读取 Python 项目配置
	 */
	private async readPythonConfig(workspacePath: string, config: ProjectConfig): Promise<void> {
		// 尝试读取 pyproject.toml
		try {
			const pyprojectPath = path.join(workspacePath, "pyproject.toml");
			const exists = await fs.access(pyprojectPath).then(() => true).catch(() => false);
			if (exists) {
				config.build_tools.push("pyproject.toml");
			}
		} catch (error) {}

		// 尝试读取 requirements.txt
		try {
			const reqPath = path.join(workspacePath, "requirements.txt");
			const content = await fs.readFile(reqPath, "utf-8");
			const deps = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
			config.dependencies_count = deps.length;
			config.main_dependencies = deps.slice(0, 10);
		} catch (error) {}

		// 检查虚拟环境
		const venvDirs = ['venv', '.venv', 'env', '.env'];
		for (const dir of venvDirs) {
			try {
				const venvPath = path.join(workspacePath, dir);
				const exists = await fs.access(venvPath).then(() => true).catch(() => false);
				if (exists) {
					config.virtual_env = dir;
					break;
				}
			} catch (error) {}
		}
	}

	/**
	 * 读取 Java 项目配置
	 */
	private async readJavaConfig(workspacePath: string, config: ProjectConfig): Promise<void> {
		// Maven 项目
		try {
			const pomPath = path.join(workspacePath, "pom.xml");
			const exists = await fs.access(pomPath).then(() => true).catch(() => false);
			if (exists) {
				config.build_tools.push("maven");
			}
		} catch (error) {}

		// Gradle 项目
		try {
			const gradlePaths = ["build.gradle", "build.gradle.kts"];
			for (const gradleFile of gradlePaths) {
				const gradlePath = path.join(workspacePath, gradleFile);
				const exists = await fs.access(gradlePath).then(() => true).catch(() => false);
				if (exists) {
					config.build_tools.push("gradle");
					break;
				}
			}
		} catch (error) {}
	}

	/**
	 * 读取 Go 项目配置
	 */
	private async readGoConfig(workspacePath: string, config: ProjectConfig): Promise<void> {
		try {
			const goModPath = path.join(workspacePath, "go.mod");
			const content = await fs.readFile(goModPath, "utf-8");
			const lines = content.split('\n');
			const moduleLine = lines.find(line => line.startsWith('module '));
			if (moduleLine) {
				config.module_name = moduleLine.replace('module ', '').trim();
				config.name = path.basename(config.module_name);
			}
			
			const goVersionLine = lines.find(line => line.startsWith('go '));
			if (goVersionLine) {
				config.go_version = goVersionLine.replace('go ', '').trim();
			}
		} catch (error) {
			// 保持默认配置
		}
	}

	/**
	 * 读取 Rust 项目配置
	 */
	private async readRustConfig(workspacePath: string, config: ProjectConfig): Promise<void> {
		try {
			const cargoPath = path.join(workspacePath, "Cargo.toml");
			const content = await fs.readFile(cargoPath, "utf-8");
			
			// 简单的 TOML 解析（只提取基本信息）
			const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
			const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
			const editionMatch = content.match(/edition\s*=\s*"([^"]+)"/);
			
			config.name = nameMatch ? nameMatch[1] : path.basename(workspacePath);
			config.version = versionMatch ? versionMatch[1] : "unknown";
			config.edition = editionMatch ? editionMatch[1] : "unknown";
		} catch (error) {
			// 保持默认配置
		}
	}

	/**
	 * 读取 .NET 项目配置
	 */
	private async readDotNetConfig(workspacePath: string, config: ProjectConfig): Promise<void> {
		try {
			const entries = await fs.readdir(workspacePath);
			const csprojFiles = entries.filter(entry => entry.endsWith('.csproj'));
			if (csprojFiles.length > 0) {
				config.project_files = csprojFiles;
				config.name = path.basename(csprojFiles[0], '.csproj');
			}
			
			const slnFiles = entries.filter(entry => entry.endsWith('.sln'));
			if (slnFiles.length > 0) {
				config.solution_files = slnFiles;
			}
		} catch (error) {}
	}

	/**
	 * 读取 PHP 项目配置
	 */
	private async readPhpConfig(workspacePath: string, config: ProjectConfig): Promise<void> {
		try {
			const composerPath = path.join(workspacePath, "composer.json");
			const composerJson = JSON.parse(await fs.readFile(composerPath, "utf-8"));
			config.name = composerJson.name || path.basename(workspacePath);
			config.version = composerJson.version || "unknown";
			config.description = composerJson.description || "";
			config.main_dependencies = Object.keys(composerJson.require || {}).slice(0, 10);
			config.dev_dependencies_count = Object.keys(composerJson["require-dev"] || {}).length;
		} catch (error) {
			// 保持默认配置
		}
	}

	/**
	 * 读取 Ruby 项目配置
	 */
	private async readRubyConfig(workspacePath: string, config: ProjectConfig): Promise<void> {
		try {
			const gemfilePath = path.join(workspacePath, "Gemfile");
			const exists = await fs.access(gemfilePath).then(() => true).catch(() => false);
			if (exists) {
				config.build_tools.push("bundler");
			}
		} catch (error) {}
		
		try {
			const entries = await fs.readdir(workspacePath);
			const gemspecFiles = entries.filter(entry => entry.endsWith('.gemspec'));
			if (gemspecFiles.length > 0) {
				config.gemspec_files = gemspecFiles;
			}
		} catch (error) {}
	}
} 