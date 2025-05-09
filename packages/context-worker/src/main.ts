import { InstantiationService, providerContainer } from "./base/common/instantiation/instantiationService";
import { ILanguageServiceProvider, LanguageServiceProvider } from "./base/common/languages/languageService";
import { IStructurerProvider } from "./ProviderTypes";
import { JavaStructurerProvider } from "./code-context/java/JavaStructurerProvider";
import { TypeScriptStructurer } from "./code-context/typescript/TypeScriptStructurer";
import { GoStructurerProvider } from "./code-context/go/GoStructurerProvider";
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { CodeAnalyzer } from "./CodeAnalyzer";

class CommandLineParser {
	public parse(): { dirPath: string } {
		const args = process.argv.slice(2);
		let dirPath = process.cwd(); // Default to current directory

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
			}
		}

		return { dirPath };
	}
}

class UserInputHandler {
	public async getDirectoryPath(): Promise<{ dirPath: string }> {
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
			}
		]);

		const dirPath = path.isAbsolute(answers.dirPath)
			? answers.dirPath
			: path.resolve(process.cwd(), answers.dirPath);

		return { dirPath };
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
		providerContainer.bind(IStructurerProvider).to(TypeScriptStructurer);
		providerContainer.bind(IStructurerProvider).to(GoStructurerProvider);

		this.codeAnalyzer = new CodeAnalyzer(this.instantiationService);
		this.commandLineParser = new CommandLineParser();
		this.userInputHandler = new UserInputHandler();
	}

	public async run(dirPath?: string): Promise<void> {
		await this.codeAnalyzer.initialize();

		let targetDir: string;
		if (dirPath) {
			targetDir = dirPath;
		} else {
			const args = this.commandLineParser.parse();
			if (args.dirPath !== process.cwd()) {
				targetDir = args.dirPath;
			} else {
				const input = await this.userInputHandler.getDirectoryPath();
				targetDir = input.dirPath;
			}
		}

		console.log(`正在扫描目录: ${targetDir}`);
		let result = await this.codeAnalyzer.analyzeDirectory(targetDir);
		const outputFilePath = path.join(targetDir, 'analysis_result.json');
		fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));

		await this.codeAnalyzer.generateLearningMaterials(result, "materials");
	}
}

const app = new InterfaceAnalyzerApp();

if (require.main === module) {
	app.run().catch(err => console.error("错误:", err));
} else {
	module.exports = { main: app.run.bind(app) };
}
