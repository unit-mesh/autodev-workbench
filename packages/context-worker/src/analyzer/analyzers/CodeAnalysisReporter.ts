import fs from "fs";
import path from "path";

import { CodeAnalysisResult, CodeBlock } from "../CodeAnalysisResult";
import { FileSystemScanner } from "../FileSystemScanner";
import { inferLanguage } from "../../base/common/languages/languages";
import { AppConfig } from "../../types/AppConfig";

export class CodeAnalysisReporter {
	private fileScanner: FileSystemScanner;
	private config: AppConfig;

	constructor(fileScanner: FileSystemScanner, config: AppConfig) {
		this.fileScanner = fileScanner;
		this.config = config;
	}

	public async generateLearningMaterials(result: CodeAnalysisResult, outputDir?: string): Promise<string[]> {
		// 使用传入的输出目录或配置中的输出目录
		const targetDir = outputDir || this.config.outputDir;

		if (!fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true });
		}

		const generatedFiles: string[] = [];
		for (const intf of result.interfaceAnalysis.interfaces) {
			if (intf.implementations.length === 0) continue;

			const content = await this.generateInterfaceContent(intf);
			const fileName = this.sanitizeFileName(`${intf.interfaceName}_实现.txt`);
			const filePath = path.join(targetDir, fileName);
			await fs.promises.writeFile(filePath, content);
			generatedFiles.push(filePath);
		}

		// 添加对类继承关系的处理
		for (const ext of result.extensionAnalysis.extensions) {
			if (ext.children.length === 0) continue;

			const content = await this.generateExtensionContent(ext);
			const fileName = this.sanitizeFileName(`${ext.parentName}_继承.txt`);
			const filePath = path.join(targetDir, fileName);
			await fs.promises.writeFile(filePath, content);
			generatedFiles.push(filePath);
		}

		if (result.markdownAnalysis && result.markdownAnalysis.codeBlocks.length > 0) {
			const markdownDir = path.join(targetDir, 'markdown_code');
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

		// 添加对符号分析结果的处理
		if (result.symbolAnalysis && result.symbolAnalysis.symbols.length > 0) {
			const symbolsDir = path.join(targetDir, 'symbols');
			if (!fs.existsSync(symbolsDir)) {
				fs.mkdirSync(symbolsDir, { recursive: true });
			}

			// 按文件分组符号
			const fileGroups: { [key: string]: any[] } = {};
			for (const symbol of result.symbolAnalysis.symbols) {
				const filePath = symbol.filePath;
				if (!fileGroups[filePath]) {
					fileGroups[filePath] = [];
				}
				fileGroups[filePath].push(symbol);
			}

			for (const [filePath, symbols] of Object.entries(fileGroups)) {
				const content = await this.generateSymbolsContent(filePath, symbols);
				const fileName = this.sanitizeFileName(`${path.basename(filePath)}_symbols.txt`);
				const docFilePath = path.join(symbolsDir, fileName);

				await fs.promises.writeFile(docFilePath, content);
				generatedFiles.push(docFilePath);
			}
		}

		return generatedFiles;
	}

	/**
	 * 将分析结果转换为列表形式
	 */
	public async convertToList(result: CodeAnalysisResult, targetDir?: string): Promise<{
		path: string;
		content: string
	}[]> {
		// 使用传入的目标目录或配置中的扫描目录
		const scanDir = targetDir || this.config.dirPath;

		const items: { path: string; content: string }[] = [];

		for (const intf of result.interfaceAnalysis.interfaces) {
			if (intf.implementations.length === 0) continue;
			const content = await this.generateInterfaceContent(intf, true);
			const relativePath = path.relative(scanDir, intf.interfaceFile);
			items.push({ path: relativePath, content });
		}

		for (const ext of result.extensionAnalysis.extensions) {
			const content = await this.generateExtensionContent(ext, true);
			const relativePath = path.relative(scanDir, ext.parentFile);
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
				for (const block of blocks) {
					const content = await this.generateMarkdownBlockContent(block, true);

					const blockIdentifier = block.heading
						? `#${block.heading}`
						: `#code-block-${Math.random().toString(36).substring(2, 9)}`;

					const relativePath = path.relative(scanDir, block.filePath) + blockIdentifier;
					items.push({ path: relativePath, content });
				}
			}
		}

		return items;
	}

	/**
	 * 生成接口及其实现的内容
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
	 * 生成类继承层次结构的内容
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

	/**
	 * 生成Markdown代码块的内容
	 */
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
	 * 生成符号分析内容
	 */
	private async generateSymbolsContent(filePath: string, symbols: any[]): Promise<string> {
		let content = '';
		content += `文件: ${filePath}\n`;
		content += `共发现 ${symbols.length} 个符号\n\n`;

		// 按类型分组
		const symbolsByKind: { [key: number]: any[] } = {};
		for (const symbol of symbols) {
			if (!symbolsByKind[symbol.kind]) {
				symbolsByKind[symbol.kind] = [];
			}
			symbolsByKind[symbol.kind].push(symbol);
		}

		// 获取文件的代码内容
		const fileContent = await this.fileScanner.readFileContent(filePath);

		for (const [kind, kindSymbols] of Object.entries(symbolsByKind)) {
			content += `== ${this.getSymbolKindName(parseInt(kind))} (${kindSymbols.length}) ==\n\n`;

			for (const symbol of kindSymbols) {
				content += `- ${symbol.qualifiedName}\n`;
				if (symbol.comment) {
					content += `  注释: ${symbol.comment.trim()}\n`;
				}

				try {
					const symbolCode = this.extractCodeFromContent(fileContent, symbol.position);
					content += "```\n";
					content += symbolCode;
					content += "\n```\n\n";
				} catch (error) {
					content += `  无法提取代码: ${error}\n\n`;
				}
			}
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

	/**
	 * 从文本内容中提取代码片段
	 */
	private extractCodeFromContent(content: string, position: any): string {
		const lines = content.split('\n');
		const startRow = position.start.row;
		const endRow = position.end.row;

		// 提取代码行
		return lines.slice(startRow, endRow + 1).join('\n');
	}

	/**
	 * 获取符号类型的名称
	 */
	private getSymbolKindName(kind: number): string {
		const kindNames = [
			"类", "常量", "枚举", "枚举成员", "字段", "函数",
			"实现", "接口", "宏", "方法", "模块", "结构体",
			"特征", "类型", "联合类型", "变量", "引用", "导入",
			"通配符", "别名"
		];

		if (kind >= 0 && kind < kindNames.length) {
			return kindNames[kind];
		}
		return "未知类型";
	}

	/**
	 * 处理文件名，避免不合法字符
	 */
	private sanitizeFileName(filename: string): string {
		return filename.replace(/[<>:"/\\|?*]/g, '_');
	}

	/**
	 * 为安全在Markdown代码块中包含代码内容进行转义
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
