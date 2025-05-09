import path from "path";
import fs from "fs";

import { ILanguageServiceProvider } from "../../base/common/languages/languageService";
import { inferLanguage } from "../../base/common/languages/languages";
import { StructurerProviderManager } from "../../code-context/StructurerProviderManager";
import { InstantiationService } from "../../base/common/instantiation/instantiationService";
import { CodeFile } from "../../codemodel/CodeElement";
import { CodeAnalysisResult } from "../CodeAnalysisResult";
import { FileSystemScanner } from "../FileSystemScanner";
import { CodeCollector } from "../CodeCollector";
import { InterfaceAnalyzer } from "./InterfaceAnalyzer";
import { ClassHierarchyAnalyzer } from "./ClassHierarchyAnalyzer";
import { ICodeAnalyzer } from "./ICodeAnalyzer";
import { MarkdownAnalyser } from "../../document/MarkdownAnalyser";

export class CodeAnalyzer {
	private serviceProvider: ILanguageServiceProvider;
	private structurerManager: StructurerProviderManager;
	private fileScanner: FileSystemScanner;
	private codeCollector: CodeCollector;
	private analyzers: ICodeAnalyzer[];
	private markdownAnalyser: MarkdownAnalyser;

	constructor(instantiationService: InstantiationService) {
		this.serviceProvider = instantiationService.get(ILanguageServiceProvider);
		this.structurerManager = StructurerProviderManager.getInstance();
		this.fileScanner = new FileSystemScanner();
		this.codeCollector = new CodeCollector();
		this.markdownAnalyser = new MarkdownAnalyser();

		// 初始化各个分析器
		this.analyzers = [
			new InterfaceAnalyzer(),
			new ClassHierarchyAnalyzer()
		];
	}

	public async initialize(): Promise<void> {
		await this.serviceProvider.ready();
	}

	public async analyzeDirectory(dirPath: string): Promise<CodeAnalysisResult> {
		// 1. 收集目录中的所有文件
		const files = await this.fileScanner.scanDirectory(dirPath);

		// 2. 将文件分为 Markdown 文件和代码文件
		const markdownFiles: string[] = [];
		const codeFiles: string[] = [];

		for (const file of files) {
			if (path.extname(file).toLowerCase() === '.md') {
				markdownFiles.push(file);
			} else {
				codeFiles.push(file);
			}
		}

		// 3. 解析代码结构
		await this.collectCodeStructures(codeFiles);

		// 4. 使用各个分析器分析代码
		const [interfaceAnalysis, extensionAnalysis] = await Promise.all([
			this.analyzers[0].analyze(this.codeCollector),
			this.analyzers[1].analyze(this.codeCollector)
		]);

		// 5. 分析 Markdown 文件
		const markdownAnalysisResult = await this.analyzeMarkdownFiles(markdownFiles);

		console.log(markdownAnalysisResult)
		// 6. 组合分析结果
		return {
			interfaceAnalysis,
			extensionAnalysis,
			markdownAnalysis: markdownAnalysisResult
		};
	}

	private async collectCodeStructures(files: string[]): Promise<void> {
		for (const file of files) {
			try {
				const language = this.codeCollector.inferLanguage(file);
				if (!language) {
					console.warn(`${file} is not a supported language, skipping...`);
					continue;
				}

				const content = await this.fileScanner.readFileContent(file);
				const structurer = this.structurerManager.getStructurer(language);
				await structurer.init(this.serviceProvider);
				const codeFile: CodeFile = await structurer.parseFile(content, file);

				// 将代码结构添加到收集器中
				this.codeCollector.addCodeFile(file, codeFile);

			} catch (error) {
				console.error(`处理文件 ${file} 时出错:`, error);
			}
		}
	}

	/**
	 * 分析 Markdown 文件并提取代码块
	 */
	private async analyzeMarkdownFiles(markdownFiles: string[]): Promise<any> {
		const allCodeBlocks: any[] = [];

		for (const file of markdownFiles) {
			try {
				const content = await this.fileScanner.readFileContent(file);
				const codeDocuments = await this.markdownAnalyser.parse(content);

				// 处理每个提取出的代码块
				for (const doc of codeDocuments) {
					// 尝试从代码块语言推断编程语言
					const language = inferLanguage(`.${doc.language}`);

					// 保存提取的代码块信息
					allCodeBlocks.push({
						filePath: file,
						title: doc.title,
						heading: doc.lastTitle,
						language: doc.language,
						internalLanguage: language,
						code: doc.code,
						context: {
							before: doc.beforeString,
							after: doc.afterString
						}
					});

					// 如果是支持的编程语言，可以尝试进一步分析代码结构
					if (language && doc.code) {
						try {
							const structurer = this.structurerManager.getStructurer(language);
							if (structurer) {
								await structurer.init(this.serviceProvider);
								// 使用一个虚拟文件路径以避免冲突
								const virtualFilePath = `${file}#${doc.title}.${doc.language}`;
								const codeFile: CodeFile = await structurer.parseFile(doc.code, virtualFilePath);

								// 将代码结构添加到收集器中
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

	public async generateLearningMaterials(result: CodeAnalysisResult, outputDir: string): Promise<string[]> {
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const generatedFiles: string[] = [];
		for (const intf of result.interfaceAnalysis.interfaces) {
			if (intf.implementations.length === 0) continue; // 跳过没有实现的接口

			let content = '';
			content += `接口: ${intf.interfaceName}\n`;
			content += `文件: ${intf.interfaceFile}\n`;

			// 添加接口代码
			const interfaceCode = await this.readCodeSection(intf.interfaceFile, intf.position);
			content += "=== 接口定义 ===\n\n";
			content += interfaceCode;
			content += "\n\n";

			// 添加每个实现类的代码
			content += `=== 实现类 (${intf.implementations.length}) ===\n\n`;

			for (const impl of intf.implementations) {
				content += `实现类: ${impl.className}\n`;
				content += `文件: ${impl.classFile}\n\n`;

				if (impl.position) {
					const implCode = await this.readCodeSection(impl.classFile, impl.position);
					content += implCode;
					content += "\n\n";
				}
			}

			const fileName = this.sanitizeFileName(`${intf.interfaceName}_实现.txt`);
			const filePath = path.join(outputDir, fileName);
			await fs.promises.writeFile(filePath, content);
			generatedFiles.push(filePath);
		}

		return generatedFiles;
	}

	/**
	 * 从文件中读取指定位置的代码段
	 */
	private async readCodeSection(
		filePath: string,
		position: { start: { row: number, column: number }, end: { row: number, column: number } }
	): Promise<string> {
		try {
			const fileContent = await this.fileScanner.readFileContent(filePath);
			const lines = fileContent.split('\n');

			// 确保行索引在有效范围内
			const startRow = Math.max(0, position.start.row);
			const endRow = Math.min(lines.length - 1, position.end.row);

			// 提取指定行范围的代码
			const codeLines = lines.slice(startRow, endRow + 1);

			// 处理第一行和最后一行的列
			if (codeLines.length > 0) {
				// 只有在有足够字符的情况下才截取列
				if (codeLines[0].length > position.start.column) {
					codeLines[0] = codeLines[0].substring(position.start.column);
				}

				if (codeLines.length > 1) {
					const lastIndex = codeLines.length - 1;
					if (codeLines[lastIndex].length > position.end.column) {
						codeLines[lastIndex] = codeLines[lastIndex].substring(0, position.end.column);
					}
				}
			}

			return codeLines.join('\n');
		} catch (error) {
			console.error(`无法读取文件 ${filePath} 中的代码段:`, error);
			return `// 无法读取代码段 (${filePath}, 行 ${position.start.row}-${position.end.row})`;
		}
	}

	private sanitizeFileName(filename: string): string {
		return filename.replace(/[<>:"/\\|?*]/g, '_');
	}
}
