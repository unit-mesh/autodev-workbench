import { ToolLike } from "../_typing";
import { z } from "zod";
import { ProjectContextAnalyzer } from "./analyzers/project-context-analyzer";
import * as fs from "fs/promises";
import * as path from "path";
import { generateText, CoreMessage } from "ai";
import { CodebaseScanner } from "./analyzers/codebase-scanner";
import { configureLLMProvider } from "../../services/llm";
import { LLMLogger } from "../../services/llm/llm-logger";
import { ProjectDetector } from "./analyzers/project-detector";

// 添加缓存和性能优化
const analysisCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
const ANALYSIS_TIMEOUT = 10000; // 10秒超时
const MAX_FILES_TO_SCAN = 50; // 限制扫描文件数量

export const installAnalysisBasicContextTool: ToolLike = (installer) => {
	installer("analyze-basic-context", "Analyze project basic context, structure, and provide intelligent insights for planning. Requires a valid directory path to analyze.", {
		workspace_path: z.string().optional().describe("Path to analyze (defaults to current directory). Must be a valid, accessible directory."),
		use_cache: z.boolean().optional().default(true).describe("Whether to use cached results if available"),
		quick_mode: z.boolean().optional().default(false).describe("Use quick analysis mode for faster results"),
	}, async ({ workspace_path, use_cache = true, quick_mode = false }: { 
		workspace_path?: string; 
		use_cache?: boolean;
		quick_mode?: boolean;
	}) => {
		try {
			const workspacePath = workspace_path || process.env.WORKSPACE_PATH || process.cwd();
			
			// 验证目录
			try {
				const stats = await fs.stat(workspacePath);
				if (!stats.isDirectory()) {
					return {
						content: [
							{
								type: "text",
								text: `Error: The path "${workspacePath}" is not a directory. Please provide a valid directory path.`
							}
						]
					};
				}
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Error: Cannot access directory "${workspacePath}". Please verify the path exists and is accessible. Details: ${error.message}`
						}
					]
				};
			}

			// 检查缓存
			const cacheKey = `${workspacePath}-${quick_mode}`;
			if (use_cache && analysisCache.has(cacheKey)) {
				const cached = analysisCache.get(cacheKey)!;
				if (Date.now() - cached.timestamp < cached.ttl) {
					console.log('🚀 Using cached analysis result');
					return cached.result;
				} else {
					analysisCache.delete(cacheKey);
				}
			}

			// 设置超时控制
			const analysisPromise = quick_mode ? 
				performQuickAnalysis(workspacePath) : 
				performFullAnalysis(workspacePath);

			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT);
			});

			const result = await Promise.race([analysisPromise, timeoutPromise]);

			// 缓存结果
			if (use_cache) {
				analysisCache.set(cacheKey, {
					result,
					timestamp: Date.now(),
					ttl: CACHE_TTL
				});
			}

			return result;

		} catch (error: any) {
			console.error('Error in analysis:', error);
			
			// 超时或其他错误时，返回基础分析
			if (error.message === 'Analysis timeout') {
				console.warn('Analysis timeout, falling back to basic structure analysis');
				return await performBasicStructureAnalysis(workspace_path || process.cwd());
			}
			
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
};

/**
 * 快速分析模式 - 只分析基本结构，不调用 LLM
 */
async function performQuickAnalysis(workspacePath: string) {
	console.log('🔧 Using quick analysis mode');
	const analyzer = new ProjectContextAnalyzer();
	const result = await analyzer.analyze(workspacePath, "basic");

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify({
					...result,
					analysis_mode: "quick",
					note: "Quick analysis mode - limited LLM usage for faster results"
				}, null, 2)
			}
		]
	};
}

/**
 * 完整分析模式 - 包含 LLM 分析
 */
async function performFullAnalysis(workspacePath: string) {
	const llmConfig = configureLLMProvider();
	if (llmConfig) {
		console.log('🧠 Using LLM analysis strategy');
		return await performAIAnalysis(workspacePath, llmConfig);
	} else {
		console.warn("No LLM provider available. Falling back to code-based analysis.");
		return await performQuickAnalysis(workspacePath);
	}
}

/**
 * 基础结构分析 - 最简单的回退方案
 */
async function performBasicStructureAnalysis(workspacePath: string) {
	try {
		const projectInfo = await collectBasicProjectInfo(workspacePath);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						analysis_mode: "basic_structure",
						project_info: projectInfo,
						note: "Basic structure analysis only - reduced scope due to performance constraints"
					}, null, 2)
				}
			]
		};
	} catch (error: any) {
		return {
			content: [
				{
					type: "text",
					text: `Error in basic analysis: ${error.message}`
				}
			]
		};
	}
}

/**
 * 收集基础项目信息 - 使用 ProjectDetector 的优化版本
 */
async function collectBasicProjectInfo(workspacePath: string): Promise<any> {
	const detector = new ProjectDetector();
	
	// 检测项目类型和语言
	const projectDetection = await detector.detectProjectType(workspacePath);
	
	// 读取项目配置
	const projectConfig = await detector.readProjectConfig(workspacePath, projectDetection);

	// 检查通用关键文件
	const universalFiles = [
		"README.md", "README.rst", "README.txt",
		"LICENSE", "LICENSE.txt", "LICENSE.md",
		".gitignore", ".git",
		"Dockerfile", "docker-compose.yml",
		"Makefile", "CMakeLists.txt"
	];

	// 添加语言特定的关键文件
	const languageSpecificFiles = detector.getLanguageSpecificFiles(projectDetection.language);
	const allKeyFiles = [...universalFiles, ...languageSpecificFiles];

	const keyFiles: Record<string, any> = {};
	await Promise.all(allKeyFiles.map(async (file) => {
		try {
			const filePath = path.join(workspacePath, file);
			const exists = await fs.access(filePath).then(() => true).catch(() => false);
			if (exists) {
				const stats = await fs.stat(filePath);
				keyFiles[file] = {
					exists: true,
					size: stats.size,
					is_directory: stats.isDirectory()
				};
			} else {
				keyFiles[file] = { exists: false };
			}
		} catch (error) {
			keyFiles[file] = { exists: false };
		}
	}));

	// 简化的目录结构 - 只扫描第一层
	const topLevelDirs = await getTopLevelDirectories(workspacePath);

	return {
		...projectConfig,
		key_files: keyFiles,
		top_level_dirs: topLevelDirs
	};
}

/**
 * 获取顶层目录 - 性能优化版本
 */
async function getTopLevelDirectories(dirPath: string): Promise<string[]> {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });
		return entries
			.filter(entry => 
				entry.isDirectory() && 
				!entry.name.startsWith('.') &&
				entry.name !== 'node_modules' &&
				entry.name !== 'dist' &&
				entry.name !== 'build'
			)
			.map(entry => entry.name)
			.slice(0, 20); // 限制返回数量
	} catch (error) {
		return [];
	}
}

/**
 * Perform AI-powered project analysis using LLM
 */
async function performAIAnalysis(workspacePath: string, llmConfig: any) {
	try {
		const projectStructure = await collectProjectStructure(workspacePath);

		const prompt = buildAnalysisPrompt(projectStructure);
		const analysisResult = await getAIAnalysis(prompt, llmConfig);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(analysisResult, null, 2)
				}
			]
		};
	} catch (error: any) {
		console.error("AI analysis error:", error);
		// Fallback to code analysis if AI analysis fails
		console.warn("AI analysis failed. Falling back to code-based analysis.");
		const analyzer = new ProjectContextAnalyzer();
		const result = await analyzer.analyze(workspacePath);

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2)
				}
			]
		};
	}
}

/**
 * Collect basic project structure information
 */
async function collectProjectStructure(workspacePath: string): Promise<any> {
	// Scan for common project files
	const codebaseScanner = new CodebaseScanner();
	const projectInfo: any = {};

	// Get project name from directory or package.json
	try {
		const packageJsonPath = path.join(workspacePath, "package.json");
		const packageJsonExists = await fs.access(packageJsonPath).then(() => true).catch(() => false);

		if (packageJsonExists) {
			const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
			projectInfo.name = packageJson.name || path.basename(workspacePath);
			projectInfo.version = packageJson.version || "unknown";
			projectInfo.description = packageJson.description || "";
			projectInfo.dependencies = packageJson.dependencies || {};
			projectInfo.devDependencies = packageJson.devDependencies || {};
		} else {
			projectInfo.name = path.basename(workspacePath);
		}
	} catch (error) {
		projectInfo.name = path.basename(workspacePath);
	}

	// Check for common project files
	const commonFiles = ["README.md", "LICENSE", "CHANGELOG.md", ".gitignore", "package.json", "tsconfig.json"];
	projectInfo.files = {};

	for (const file of commonFiles) {
		try {
			const filePath = path.join(workspacePath, file);
			const exists = await fs.access(filePath).then(() => true).catch(() => false);
			if (exists) {
				const stats = await fs.stat(filePath);
				projectInfo.files[file] = {
					exists,
					size: stats.size,
					modified: stats.mtime.toISOString()
				};
			} else {
				projectInfo.files[file] = { exists };
			}
		} catch (error) {
			projectInfo.files[file] = { exists: false };
		}
	}

	// Get directory structure (limited depth)
	projectInfo.structure = await getDirectoryStructure(workspacePath, 2);

	return projectInfo;
}

/**
 * Get directory structure with limited depth
 */
async function getDirectoryStructure(dirPath: string, depth: number): Promise<any> {
	if (depth <= 0) return null;

	const result: Record<string, any> = {};
	const entries = await fs.readdir(dirPath, { withFileTypes: true });

	// Skip node_modules and hidden directories
	const filteredEntries = entries.filter(entry =>
		!entry.name.startsWith('.') &&
		entry.name !== 'node_modules' &&
		entry.name !== 'dist' &&
		entry.name !== 'build'
	);

	for (const entry of filteredEntries) {
		if (entry.isDirectory()) {
			if (depth > 1) {
				result[entry.name + '/'] = await getDirectoryStructure(path.join(dirPath, entry.name), depth - 1);
			} else {
				result[entry.name + '/'] = "...";
			}
		} else {
			result[entry.name] = null;
		}
	}

	return result;
}

/**
 * Build a prompt for the LLM to analyze the project
 */
function buildAnalysisPrompt(projectStructure: any): string {
	return `
You are an expert software architect and code analyst. Analyze the following project structure and provide insights:

Project Structure: ${JSON.stringify(projectStructure, null, 2)}

Generate a detailed analysis of this project including:
1. Project type and tech stack identification
2. Architecture patterns detected
3. Project structure assessment
4. Dependencies analysis
5. Insights about project quality
6. Recommendations for improvements

Format your response EXACTLY as a valid JSON object that matches this TypeScript interface:
\`\`\`typescript
interface AnalysisResult {
  project_info: {
    // base on project structure
  };
  workflow_analysis?: {
    // like CI/CD platforms, build systems, etc.
  };
  architecture_analysis?: {
    patterns: {
      monorepo: boolean;
      microservices: boolean;
      mvc: boolean;
      component_based: boolean;
      layered: boolean;
    };
    directory_structure: string[];
    complexity_score: number;
  };
  dependencies_summary?: {
    //... (dependencies analysis fields)
  };
  insights: string[];
  recommendations: string[];
  health_score?: number;
}
\`\`\`

Provide ONLY the JSON object without any other text.
`;
}

/**
 * Use LLM to analyze the project and get structured insights
 */
async function getAIAnalysis(prompt: string, llmConfig: any): Promise<any> {
	try {
		const messages: CoreMessage[] = [
			{
				role: "system",
				content: "You are an expert code and project architecture analyzer. Base on following information, give next steps analysis ideas and suggestions."
			},
			{
				role: "user",
				content: prompt
			}
		];
		const { text } = await generateText({
			model: llmConfig.openai(llmConfig.fullModel),
			messages: messages,
			temperature: 0.3,
			maxTokens: 4000
		});

		new LLMLogger(installAnalysisBasicContextTool.name + ".log").log("Summary WebContent", {
			request: messages,
			response: text,
		});
		try {
			return JSON.parse(text);
		} catch (parseError) {
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				return JSON.parse(jsonMatch[0]);
			} else {
				throw new Error("Could not extract valid JSON from LLM response");
			}
		}
	} catch (error: any) {
		console.error("Error calling LLM API:", error.message);
		throw error;
	}
}
