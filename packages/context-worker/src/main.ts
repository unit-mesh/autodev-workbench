import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import { Command } from 'commander';

import { InstantiationService, providerContainer } from "./base/common/instantiation/instantiationService";
import { ILanguageServiceProvider, LanguageServiceProvider } from "./base/common/languages/languageService";
import { IStructurerProvider } from "./ProviderTypes";
import { JavaStructurerProvider } from "./code-context/java/JavaStructurerProvider";
import { TypeScriptStructurer } from "./code-context/typescript/TypeScriptStructurer";
import { GoStructurerProvider } from "./code-context/go/GoStructurerProvider";
import { KotlinStructurerProvider } from "./code-context/kotlin/KotlinStructurerProvider";
import { CodeAnalyzer } from "./analyzer/analyzers/CodeAnalyzer";
import { CodeAnalysisResult } from "./analyzer/CodeAnalysisResult";
import { PythonStructurer } from "./code-context/python/PythonStructurer";

interface AppConfig {
	dirPath: string;
	upload: boolean;
	serverUrl: string;
	outputDir: string;
}

class CommandLineParser {
	public parse(): AppConfig {
		const program = new Command();
		
		program
			.name('context-worker')
			.description('AutoDev Context Worker - Code analysis and context building tool')
			.version('1.0.0');
			
		program
			.option('-p, --path <dir>', 'Directory path to scan', process.cwd())
			.option('-u, --upload', 'Upload analysis results to server', false)
			.option('--server-url <url>', 'Server URL for uploading results', 'http://localhost:3000/api/context')
			.option('-o, --output-dir <dir>', 'Output directory for learning materials', 'materials');
			
		program.parse(process.argv);
		
		const options = program.opts();
		
		// 将路径转换为绝对路径
		let dirPath = options.path;
		if (!path.isAbsolute(dirPath)) {
			dirPath = path.resolve(process.cwd(), dirPath);
		}
		
		return {
			dirPath,
			upload: options.upload || false,
			serverUrl: options.serverUrl,
			outputDir: options.outputDir
		};
	}
}

class UserInputHandler {
	public async getAppConfig(): Promise<AppConfig> {
		const answers = await inquirer.prompt([
			{
				type: 'input',
				name: 'dirPath',
				message: '请输入要扫描的目录路径:',
				default: process.cwd(),
				validate: (input) => {
					const fullPath = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
					if (fs.existsSync(fullPath)) {
						return true;
					}
					return '请输入有效的目录路径';
				}
			},
			{
				type: 'confirm',
				name: 'upload',
				message: '是否要上传分析结果到服务器?',
				default: false
			},
			{
				type: 'input',
				name: 'serverUrl',
				message: '请输入服务器地址:',
				default: 'http://localhost:3000/api/context',
				when: (answers) => answers.upload
			},
			{
				type: 'input',
				name: 'outputDir',
				message: '请输入分析结果输出目录:',
				default: 'materials'
			}
		]);

		const dirPath = path.isAbsolute(answers.dirPath)
			? answers.dirPath
			: path.resolve(process.cwd(), answers.dirPath);

		return {
			dirPath,
			upload: answers.upload,
			serverUrl: answers.serverUrl || 'http://localhost:3000/api/context',
			outputDir: answers.outputDir
		};
	}
}

class InterfaceAnalyzerApp {
	private instantiationService: InstantiationService;
	private codeAnalyzer: CodeAnalyzer;
	private commandLineParser: CommandLineParser;
	private userInputHandler: UserInputHandler;

	constructor() {
		this.instantiationService = new InstantiationService();
		this.instantiationService.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider);

		providerContainer.bind(IStructurerProvider).to(JavaStructurerProvider);
		providerContainer.bind(IStructurerProvider).to(KotlinStructurerProvider);
		providerContainer.bind(IStructurerProvider).to(TypeScriptStructurer);
		providerContainer.bind(IStructurerProvider).to(GoStructurerProvider);
		providerContainer.bind(IStructurerProvider).to(PythonStructurer);

		this.codeAnalyzer = new CodeAnalyzer(this.instantiationService);
		this.commandLineParser = new CommandLineParser();
		this.userInputHandler = new UserInputHandler();
	}

	private async uploadResult(result: CodeAnalysisResult, serverUrl: string, targetDir: string): Promise<void> {
		try {
			const textResult = await this.codeAnalyzer.convertToList(result, targetDir);

			const debugFilePath = path.join(process.cwd(), 'debug_analysis_result.json');
			fs.writeFileSync(debugFilePath, JSON.stringify(textResult, null, 2));

			const response = await fetch(serverUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(textResult)
			});

			const data = await response.json();
			if (data.success) {
				console.log('分析结果上传成功!');
				console.log(`ID: ${data.id}`);
			} else {
				console.error('上传失败:', data);
			}
		} catch (error) {
			console.error('上传过程中发生错误:', error);
		}
	}

	public async run(options?: Partial<AppConfig>): Promise<void> {
		await this.codeAnalyzer.initialize();

		// 首先尝试从命令行参数获取配置
		const cmdConfig = this.commandLineParser.parse();
		
		// 如果提供了参数选项，覆盖命令行配置
		const mergedConfig: AppConfig = {
			...cmdConfig,
			...options,
		};

		// 检查是否需要交互式输入
		// 只有当命令行没有提供路径且没有通过参数指定路径时，才启用交互式输入
		let config = mergedConfig;
		if (cmdConfig.dirPath === process.cwd() && !options?.dirPath) {
			const userInput = await this.userInputHandler.getAppConfig();
			config = userInput;
		}

		console.log(`正在扫描目录: ${config.dirPath}`);
		const result: CodeAnalysisResult = await this.codeAnalyzer.analyzeDirectory(config.dirPath);
		const outputFilePath = path.join(process.cwd(), 'analysis_result.json');
		fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));

		if (config.upload) {
			console.log(`正在上传分析结果到 ${config.serverUrl}`);
			await this.uploadResult(result, config.serverUrl, config.dirPath);
		}

		console.log(`分析结果已保存到 ${outputFilePath}`);
		await this.codeAnalyzer.generateLearningMaterials(result, config.outputDir);
	}
}

const app = new InterfaceAnalyzerApp();

if (require.main === module) {
	app.run().catch(err => console.error("错误:", err));
} else {
	module.exports = { main: app.run.bind(app) };
}
