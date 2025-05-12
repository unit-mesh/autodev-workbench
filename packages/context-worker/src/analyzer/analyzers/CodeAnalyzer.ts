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
import { CodeBlockContextMerger } from "../utils/CodeBlockContextMerger";

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
		const files = await this.fileScanner.scanDirectory(dirPath);

		const markdownFiles: string[] = [];
		const codeFiles: string[] = [];

		for (const file of files) {
			if (path.extname(file).toLowerCase() === '.md') {
				markdownFiles.push(file);
			} else {
				codeFiles.push(file);
			}
		}

		await this.collectCodeStructures(codeFiles);

		const [interfaceAnalysis, extensionAnalysis] = await Promise.all([
			this.analyzers[0].analyze(this.codeCollector),
			this.analyzers[1].analyze(this.codeCollector)
		]);

		const markdownAnalysisResult = await this.analyzeMarkdownFiles(markdownFiles);
		return {
			interfaceAnalysis,
			extensionAnalysis,
			markdownAnalysis: markdownAnalysisResult
		};
	}

	private async collectCodeStructures(files: string[]): Promise<void> {
		const silentExtensions = ['.svg', '.json', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.ttf', '.woff', '.woff2', '.eot', '.css', '.scss', '.less'];

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

				const content = await this.fileScanner.readFileContent(file);
				const structurer = this.structurerManager.getStructurer(language);
				await structurer.init(this.serviceProvider);
				const codeFile: CodeFile = await structurer.parseFile(content, file);

				this.codeCollector.addCodeFile(file, codeFile);

			} catch (error) {
				console.error(`处理文件 ${file} 时出错:`, error);
			}
		}
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

	public async generateLearningMaterials(result: CodeAnalysisResult, outputDir: string): Promise<string[]> {
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const generatedFiles: string[] = [];
		for (const intf of result.interfaceAnalysis.interfaces) {
			if (intf.implementations.length === 0) continue;

			const content = await this.generateInterfaceContent(intf);
			const fileName = this.sanitizeFileName(`${intf.interfaceName}_实现.txt`);
			const filePath = path.join(outputDir, fileName);
			await fs.promises.writeFile(filePath, content);
			generatedFiles.push(filePath);
		}

		// 添加对类继承关系的处理
		for (const ext of result.extensionAnalysis.extensions) {
			if (ext.children.length === 0) continue;

			const content = await this.generateExtensionContent(ext);
			const fileName = this.sanitizeFileName(`${ext.parentName}_继承.txt`);
			const filePath = path.join(outputDir, fileName);
			await fs.promises.writeFile(filePath, content);
			generatedFiles.push(filePath);
		}

		if (result.markdownAnalysis && result.markdownAnalysis.codeBlocks.length > 0) {
			const markdownDir = path.join(outputDir, 'markdown_code');
			if (!fs.existsSync(markdownDir)) {
				fs.mkdirSync(markdownDir, { recursive: true });
			}

			const fileGroups: { [key: string]: CodeBlock[] } = {};
			for (const block of result.markdownAnalysis.codeBlocks) {
				const sourceFileName = path.basename(block.filePath, path.extname(block.filePath));
				if (!fileGroups[sourceFileName]) {
					fileGroups[sourceFileName] = [];
				}
				fileGroups[sourceFileName].push(block);
			}

			for (const [sourceFileName, blocks] of Object.entries(fileGroups)) {
				for (let i = 0; i < blocks.length; i++) {
					const block = blocks[i];
					const index = i + 1;

					const content = await this.generateMarkdownBlockContent(block);
					const docFileName = this.sanitizeFileName(`${sourceFileName}-${index}.txt`);
					const docFilePath = path.join(markdownDir, docFileName);

					await fs.promises.writeFile(docFilePath, content);
					generatedFiles.push(docFilePath);
				}
			}
		}

		return generatedFiles;
	}

	public async convertToList(result: CodeAnalysisResult, targetDir: string): Promise<{ path: string; content: string }[]> {
		const items: { path: string; content: string }[] = [];

		for (const intf of result.interfaceAnalysis.interfaces) {
			if (intf.implementations.length === 0) continue;
			const content = await this.generateInterfaceContent(intf, true);
			const relativePath = path.relative(targetDir, intf.interfaceFile);
			items.push({ path: relativePath, content });
		}

		for (const ext of result.extensionAnalysis.extensions) {
			const content = await this.generateExtensionContent(ext, true);
			const relativePath = path.relative(targetDir, ext.parentFile);
			items.push({ path: relativePath, content });
		}

		if (result.markdownAnalysis && result.markdownAnalysis.codeBlocks.length > 0) {
			// 按文件分组代码块
			const fileGroups: { [key: string]: CodeBlock[] } = {};
			for (const block of result.markdownAnalysis.codeBlocks) {
				if (!fileGroups[block.filePath]) {
					fileGroups[block.filePath] = [];
				}
				fileGroups[block.filePath].push(block);
			}

			for (const [filePath, blocks] of Object.entries(fileGroups)) {
				const processedBlocks = CodeBlockContextMerger.processOverlappingContexts(blocks, 20);
				for (const block of processedBlocks) {
					const content = await this.generateMarkdownBlockContent(block, true);

					const blockIdentifier = block.heading
						? `#${block.heading}`
						: `#code-block-${Math.random().toString(36).substring(2, 9)}`;

					const relativePath = path.relative(targetDir, block.filePath) + blockIdentifier;
					items.push({ path: relativePath, content });
				}
			}
		}

		return items;
	}

	/**
	 * Generate content for an interface and its implementations
	 */
	private async generateInterfaceContent(intf: any, escapeForMarkdown: boolean = false): Promise<string> {
		let content = '';
		content += `接口: ${intf.interfaceName}\n`;
		content += `文件: ${intf.interfaceFile}\n`;

		const lang = inferLanguage(intf.interfaceFile) || "";

		const interfaceCode = await this.readCodeSection(intf.interfaceFile, intf.position);
		const codeToUse = escapeForMarkdown ? this.escapeCodeForMarkdown(interfaceCode) : interfaceCode;
		content += "接口定义：\n\n```" + lang + "\n";
		content += codeToUse;
		content += "```\n\n";
		content += `=== 实现类 (${intf.implementations.length}) ===\n\n`;

		for (const impl of intf.implementations) {
			content += `实现类: ${impl.className}\n`;
			content += `文件: ${impl.classFile}\n\n`;

			if (impl.position) {
				const implCode = await this.readCodeSection(impl.classFile, impl.position);
				const implCodeToUse = escapeForMarkdown ? this.escapeCodeForMarkdown(implCode) : implCode;
				content += "```" + lang + "\n";
				content += implCodeToUse;
				content += "\n```\n";
			}
		}

		return content;
	}

	/**
	 * Generate content for a class extension hierarchy
	 */
	private async generateExtensionContent(ext: any, escapeForMarkdown: boolean = false): Promise<string> {
		let content = '';
		content += `父类: ${ext.parentName}\n`;
		content += `文件: ${ext.parentFile}\n\n`;

		const lang = inferLanguage(ext.parentFile) || "";

		if (ext.position) {
			const parentCode = await this.readCodeSection(ext.parentFile, ext.position);
			const codeToUse = escapeForMarkdown ? this.escapeCodeForMarkdown(parentCode) : parentCode;
			content += "父类定义：\n\n```" + lang + "\n";
			content += codeToUse;
			content += "```\n\n";
		}

		content += `=== 子类 (${ext.children.length}) ===\n\n`;

		for (const child of ext.children) {
			content += `子类: ${child.className}\n`;
			content += `文件: ${child.classFile}\n\n`;

			if (child.position) {
				const childCode = await this.readCodeSection(child.classFile, child.position);
				const childCodeToUse = escapeForMarkdown ? this.escapeCodeForMarkdown(childCode) : childCode;
				content += "```" + lang + "\n";
				content += childCodeToUse;
				content += "\n```\n";
			}
		}

		return content;
	}

	private async generateMarkdownBlockContent(block: CodeBlock, escapeForMarkdown: boolean = false): Promise<string> {
		let content = '';

		content += `Source: ${block.filePath}\n`;
		if (block.heading) {
			content += `Chapter: ${block.heading}\n`;
		}
		content += `Language: ${block.language}\n`;
		if (block.position) {
			content += `Position: Line ${block.position.start.row}-${block.position.end.row}\n`;
		}
		content += `\nContent:\n\n`;

		try {
			const fileContent = await this.fileScanner.readFileContent(block.filePath);
			const lines = fileContent.split('\n');
			if (block.position) {
				const contextLines = 20;
				const beforeStartRow = Math.max(0, block.position.start.row - contextLines);
				const beforeContext = lines.slice(beforeStartRow, block.position.start.row).join('\n');
				if (beforeContext.trim()) {
					content += beforeContext + '\n';
				}

				const codeToUse = await this.readCodeSection(block.filePath, block.position);
				content += codeToUse + '\n';

				const afterEndRow = Math.min(lines.length, block.position.end.row + contextLines);
				const afterContext = lines.slice(block.position.end.row + 1, afterEndRow).join('\n');
				if (afterContext.trim()) {
					content += afterContext;
				}
			} else {
				content += block.code;
			}
		} catch (error) {
			console.error(`无法读取文件 ${block.filePath} 中的上下文:`, error);
			content += `// 无法读取上下文 (${block.filePath})\n`;
			content += block.code;
		}

		return content;
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

			const startRow = Math.max(0, position.start.row);
			const endRow = Math.min(lines.length - 1, position.end.row);

			const codeLines = lines.slice(startRow, endRow + 1);

			if (codeLines.length > 0) {
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

	/**
	 * Escape code content for safe inclusion in Markdown code blocks
	 */
	private escapeCodeForMarkdown(code: string): string {
		// If code contains triple backticks, use alternative approach
		if (code.includes("```")) {
			// Strategy: Replace each ` with \` to escape it
			return code.replace(/`/g, "\\`");
		}
		return code;
	}
}

