import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import fetch from 'node-fetch';

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

class CommandLineParser {
	public parse(): { dirPath: string; upload: boolean; apiUrl?: string } {
		const args = process.argv.slice(2);
		let dirPath = process.cwd(); // Default to current directory
		let upload = false;
		let apiUrl = 'http://localhost:3000/api/context';

		for (let i = 0; i < args.length; i++) {
			if (args[i] === '--path' || args[i] === '-p') {
				if (i + 1 < args.length) {
					dirPath = args[i + 1];
					// Convert to absolute path
					if (!path.isAbsolute(dirPath)) {
						dirPath = path.resolve(process.cwd(), dirPath);
					}
					i++; // Skip next argument
				}
			} else if (args[i] === '--upload' || args[i] === '-u') {
				upload = true;
			} else if (args[i] === '--api-url') {
				if (i + 1 < args.length) {
					apiUrl = args[i + 1];
					i++; // Skip next argument
				}
			}
		}

		return { dirPath, upload, apiUrl };
	}
}

class UserInputHandler {
	public async getDirectoryPath(): Promise<{ dirPath: string; upload: boolean; apiUrl: string }> {
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
				name: 'apiUrl',
				message: '请输入API地址:',
				default: 'http://localhost:3000/api/context',
				when: (answers) => answers.upload
			}
		]);

		const dirPath = path.isAbsolute(answers.dirPath)
			? answers.dirPath
			: path.resolve(process.cwd(), answers.dirPath);

		return {
			dirPath,
			upload: answers.upload,
			apiUrl: answers.apiUrl
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

	private async uploadResult(result: CodeAnalysisResult, apiUrl: string, targetDir: string): Promise<void> {
		try {
			const textResult = await this.codeAnalyzer.convertToList(result, targetDir);

			const debugFilePath = path.join(process.cwd(), 'debug_analysis_result.json');
			fs.writeFileSync(debugFilePath, JSON.stringify(textResult, null, 2));

			const response = await fetch(apiUrl, {
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

	public async run(dirPath?: string): Promise<void> {
		await this.codeAnalyzer.initialize();

		let targetDir: string;
		let shouldUpload = false;
		let apiUrl = 'http://localhost:3000/api/context';

		if (dirPath) {
			targetDir = dirPath;
		} else {
			const args = this.commandLineParser.parse();
			if (args.dirPath !== process.cwd()) {
				targetDir = args.dirPath;
				shouldUpload = args.upload;
				apiUrl = args.apiUrl || apiUrl;
			} else {
				const input = await this.userInputHandler.getDirectoryPath();
				targetDir = input.dirPath;
				shouldUpload = input.upload;
				apiUrl = input.apiUrl;
			}
		}

		console.log(`正在扫描目录: ${targetDir}`);
		let result: CodeAnalysisResult = await this.codeAnalyzer.analyzeDirectory(targetDir);
		const outputFilePath = path.join(process.cwd(), 'analysis_result.json');
		fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));

		if (shouldUpload) {
			console.log(`正在上传分析结果到 ${apiUrl}`);
			await this.uploadResult(result, apiUrl, targetDir);
		}

		console.log(`分析结果已保存到 ${outputFilePath}`);
		await this.codeAnalyzer.generateLearningMaterials(result, "materials");
	}
}

const app = new InterfaceAnalyzerApp();

if (require.main === module) {
	app.run().catch(err => console.error("错误:", err));
} else {
	module.exports = { main: app.run.bind(app) };
}
