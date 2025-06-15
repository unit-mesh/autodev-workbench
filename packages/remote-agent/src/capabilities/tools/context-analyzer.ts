import { ToolLike } from "../_typing";
import { z } from "zod";
import { ProjectContextAnalyzer } from "./analyzers/project-context-analyzer";
import * as fs from "fs/promises";
import * as path from "path";
import { generateText, CoreMessage } from "ai";
import { CodebaseScanner } from "./analyzers/codebase-scanner";
import { configureLLMProvider } from "../../services/llm";
import { LLMLogger } from "../../services/llm/llm-logger";

export const installAnalysisBasicContextTool: ToolLike = (installer) => {
	installer("analyze-basic-context", "Analyze project basic context, structure, and provide intelligent insights for planning. Requires a valid directory path to analyze.", {
		workspace_path: z.string().optional().describe("Path to analyze (defaults to current directory). Must be a valid, accessible directory."),
	}, async ({ workspace_path }: { workspace_path?: string; }) => {
		try {
			const workspacePath = workspace_path || process.env.WORKSPACE_PATH || process.cwd();
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

			const llmConfig = configureLLMProvider();
			if (llmConfig) {
				const newVar = await performAIAnalysis(workspacePath, llmConfig);
				return newVar as any;
			} else {
				console.warn("No LLM provider available. Falling back to code-based analysis.");
				const analyzer = new ProjectContextAnalyzer();
				const result = await analyzer.analyze(workspacePath);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(result)
						}
					]
				};
			}
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
};

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
