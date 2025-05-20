import path from "path";
import fs from "fs";

import { ILanguageServiceProvider } from "../../base/common/languages/languageService";
import { inferLanguage } from "../../base/common/languages/languages";
import { StructurerProviderManager } from "../../code-context/StructurerProviderManager";
import { InstantiationService } from "../../base/common/instantiation/instantiationService";
import { CodeFile } from "../../codemodel/CodeElement";
import { CodeAnalysisResult, CodeBlock } from "../CodeAnalysisResult";
import { FileSystemScanner } from "../FileSystemScanner";
import { CodeCollector } from "../CodeCollector";
import { InterfaceAnalyzer } from "./InterfaceAnalyzer";
import { ClassHierarchyAnalyzer } from "./ClassHierarchyAnalyzer";
import { ICodeAnalyzer } from "./ICodeAnalyzer";
import { CodeDocument, MarkdownAnalyser } from "../../document/MarkdownAnalyser";
import { AppConfig } from "../../types/AppConfig";
import { HttpApiCodeAnalyser } from "./HttpApiCodeAnalyser";
import { ApiResource } from "@autodev/worker-core";
import { SymbolAnalyser } from "./SymbolAnalyser";
import { CodeAnalysisReporter } from "./CodeAnalysisReporter";

export class CodeAnalyzer {
	private serviceProvider: ILanguageServiceProvider;
	private structurerManager: StructurerProviderManager;
	private fileScanner: FileSystemScanner;
	private codeCollector: CodeCollector;
	private analyzers: ICodeAnalyzer[];
	private markdownAnalyser: MarkdownAnalyser;
	private config: AppConfig;
	private httpApiAnalyser: HttpApiCodeAnalyser;
	private symbolAnalyser: SymbolAnalyser;
	private reporter: CodeAnalysisReporter;

	constructor(instantiationService: InstantiationService, config?: Partial<AppConfig>) {
		this.serviceProvider = instantiationService.get(ILanguageServiceProvider);
		this.structurerManager = StructurerProviderManager.getInstance();
		this.fileScanner = new FileSystemScanner();
		this.codeCollector = new CodeCollector(config.dirPath);
		this.markdownAnalyser = new MarkdownAnalyser();
		this.httpApiAnalyser = new HttpApiCodeAnalyser();
		this.symbolAnalyser = new SymbolAnalyser(this.serviceProvider);

		this.analyzers = [
			new InterfaceAnalyzer(),
			new ClassHierarchyAnalyzer(),
		];

		this.config = config as AppConfig;
		this.reporter = new CodeAnalysisReporter(this.fileScanner, this.config);
	}

	public updateConfig(config: AppConfig): void {
		this.config = config;
	}

	private filesInDir: string[] = [];
	private markdownFilesInDir: string[] = [];

	/**
	 * Initialize and parse files in the directory
	 * @param fileFilter Optional function to filter files by name
	 * @returns Array of parsed CodeFile objects
	 */
	public async initializeFiles(fileFilter?: (fileName: string) => boolean): Promise<CodeFile[]> {
		await this.serviceProvider.ready();
		const allFiles = await this.fileScanner.scanDirectory(this.config.dirPath);

		this.filesInDir = [];
		this.markdownFilesInDir = [];

		for (const file of allFiles) {
			if (fileFilter && !fileFilter(file)) {
				continue;
			}

			if (path.extname(file).toLowerCase() === '.md') {
				this.markdownFilesInDir.push(file);
			} else {
				this.filesInDir.push(file);
			}
		}

		return await this.parseCodeStructures(this.filesInDir);
	}

	public async analyzeDirectory(): Promise<CodeAnalysisResult> {
		const [interfaceAnalysis, extensionAnalysis] = await Promise.all([
			this.analyzers[0].analyze(this.codeCollector),
			this.analyzers[1].analyze(this.codeCollector)
		]);

		const markdownAnalysisResult = await this.analyzeMarkdownFiles(this.markdownFilesInDir);
		const symbolAnalysisResult = await this.symbolAnalyser.analyze(this.codeCollector);

		return {
			interfaceAnalysis,
			extensionAnalysis,
			markdownAnalysis: markdownAnalysisResult,
			symbolAnalysis: symbolAnalysisResult
		};
	}

	async parseCodeStructures(files: string[]): Promise<CodeFile[]> {
		const supportedFiles = await this.getSupportedFiles(files);
		this.codeCollector.setAllFiles(supportedFiles)
		return await this.parseFiles(supportedFiles);
	}

	private async getSupportedFiles(files: string[]): Promise<{file: string, content: string, language: string}[]> {
		const silentExtensions = ['.svg', '.json', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.ttf', '.woff', '.woff2', '.eot', '.css', '.scss', '.less'];
		const supportedFiles: {file: string, content: string, language: string}[] = [];

		for (const file of files) {
			try {
				const language = this.codeCollector.inferLanguage(file);
				if (!language) {
					// 检查文件扩展名是否在忽略列表中
					const fileExt = path.extname(file).toLowerCase();
					if (!silentExtensions.includes(fileExt)) {
						console.warn(`${file} is not a supported language, skipping...`);
					}
					continue;
				}

				const structurer = this.structurerManager.getStructurer(language);
				if (!structurer) {
					console.warn(`No structurer found for language ${language}, skipping file ${file}`);
					continue;
				}

				const content = await this.fileScanner.readFileContent(file);
				supportedFiles.push({ file, content, language });
			} catch (error) {
				console.error(`检查文件 ${file} 支持性时出错:`, error);
			}
		}

		return supportedFiles;
	}

	private async parseFiles(supportedFiles: {file: string, content: string, language: string}[]): Promise<CodeFile[]> {
		const parsedFiles: CodeFile[] = [];

		for (const { file, content, language } of supportedFiles) {
			try {
				const structurer = this.structurerManager.getStructurer(language);
				await structurer.init(this.serviceProvider);
				const codeFile: CodeFile = await structurer.parseFile(content, file);

				this.codeCollector.addCodeFile(file, codeFile);
				parsedFiles.push(codeFile);
			} catch (error) {
				console.error(`解析文件 ${file} 时出错:`, error);
			}
		}

		return parsedFiles;
	}

	private async analyzeMarkdownFiles(markdownFiles: string[]): Promise<any> {
		const allCodeBlocks: any[] = [];

		for (const file of markdownFiles) {
			try {
				const content: string = await this.fileScanner.readFileContent(file);
				const codeDocuments: CodeDocument[] = await this.markdownAnalyser.parse(content);

				for (const doc of codeDocuments) {
					const codeLineCount = doc.code ? doc.code.split('\n').length : 0;
					if (codeLineCount <= 6) {
						continue;
					}

					// 计算代码块在文件中的精确位置
					let startRow = 0;
					let startColumn = 0;
					if (doc.startIndex !== undefined) {
						// 计算行号和列号
						const contentBeforeBlock = content.substring(0, doc.startIndex);
						const lines = contentBeforeBlock.split('\n');
						startRow = lines.length - 1;  // 因为行号从0开始
						// 计算最后一行的列位置
						startColumn = lines[lines.length - 1].length;
					}

					let endRow = 0;
					let endColumn = 0;
					if (doc.endIndex !== undefined) {
						// 计算到代码块结束位置的行号和列号
						const contentUpToBlock = content.substring(0, doc.endIndex);
						const lines = contentUpToBlock.split('\n');
						endRow = lines.length - 1;
						// 计算最后一行的列位置
						endColumn = lines[lines.length - 1].length;
					}

					// 确保使用原始代码，不做任何修改
					allCodeBlocks.push({
						filePath: file,
						title: doc.title,
						heading: doc.lastTitle,
						language: doc.language,
						internalLanguage: inferLanguage(`.${doc.language}`),
						code: doc.code,  // 保留原始代码
						position: {
							start: { row: startRow, column: startColumn },
							end: { row: endRow, column: endColumn }
						}
					});

					if (inferLanguage(`.${doc.language}`) && doc.code) {
						try {
							const structurer = this.structurerManager.getStructurer(inferLanguage(`.${doc.language}`));
							if (structurer) {
								await structurer.init(this.serviceProvider);
								const virtualFilePath = `${file}#${doc.title}.${doc.language}`;
								const codeFile: CodeFile = await structurer.parseFile(doc.code, virtualFilePath);
								this.codeCollector.addCodeFile(virtualFilePath, codeFile);
							}
						} catch (error) {
							console.warn(`无法分析 Markdown 文件 ${file} 中的代码块:`, error);
						}
					}
				}
			} catch (error) {
				console.error(`处理 Markdown 文件 ${file} 时出错:`, error);
			}
		}

		return {
			codeBlocks: allCodeBlocks,
			totalCount: allCodeBlocks.length
		};
	}

	public async generateLearningMaterials(result: CodeAnalysisResult, outputDir?: string): Promise<string[]> {
		return this.reporter.generateLearningMaterials(result, outputDir);
	}

	public async convertToList(result: CodeAnalysisResult, targetDir?: string): Promise<{
		path: string;
		content: string
	}[]> {
		return this.reporter.convertToList(result, targetDir);
	}

	/**
	 * 分析API
	 */
	analyzeApi(files: CodeFile[]): Promise<ApiResource[]> {
		return this.httpApiAnalyser.analyze(files);
	}
}

