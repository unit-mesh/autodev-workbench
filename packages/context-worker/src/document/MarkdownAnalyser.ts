import * as path from 'path';
import * as fs from 'fs';
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export interface CodeDocument {
	title: string;
	language: string;
	lastTitle: string; /// the heading title before the code block
	beforeString: string; /// x lines before the code block
	afterString: string;  /// x lines after the code block
	code: string;
	startIndex?: number; // 代码块在原始文本中的开始位置
	endIndex?: number;   // 代码块在原始文本中的结束位置
}

export interface DocumentAnalyser {
	parse(markdown: string): Promise<CodeDocument[]>;
}

/**
 * 1. get all markdown files
 * 2. parse markdown files to collect code fence block(```) and file in code(`)
 *    - if code (`) is path, get the file content by search in path, replace `/` by os.path.sep
 *    - if code block collect it
 * 3. parse code to get code structure
 */
export class MarkdownAnalyser implements DocumentAnalyser {
	/**
	 * Parses a markdown string and extracts code documents from it
	 * @param markdown - The markdown string to parse
	 * @returns A promise that resolves to an array of CodeDocument objects
	 */
	async parse(markdown: string): Promise<CodeDocument[]> {
		const result: CodeDocument[] = [];
		const lines = markdown.split('\n');

		// Parse markdown using unified and remark-parse
		const ast = unified()
			.use(remarkParse)
			.parse(markdown);

		let lastHeading = '';
		const headings: { [key: number]: string } = {};

		visit(ast, 'heading', (node: any, index: number, parent: any) => {
			const headingText = node.children
				.filter((child: any) => child.type === 'text')
				.map((child: any) => child.value)
				.join('');

			lastHeading = headingText;
			headings[node.position.start.line] = headingText;
		});

		visit(ast, 'code', (node: any) => {
			const { lang, value, position } = node;
			const startLine = position.start.line;
			const endLine = position.end.line;

			let codeLastTitle = '';
			let maxHeadingLine = 0;

			for (const lineNum in headings) {
				const lineNumber = parseInt(lineNum);
				if (lineNumber < startLine && lineNumber > maxHeadingLine) {
					maxHeadingLine = lineNumber;
					codeLastTitle = headings[lineNum];
				}
			}

			result.push({
				title: `Code block at line ${startLine}-${endLine}`,
				language: lang || 'plaintext',
				lastTitle: codeLastTitle,
				beforeString: '',  // 保留字段但不再填充内容
				afterString: '',   // 保留字段但不再填充内容
				code: value,
				startIndex: position.start.offset,
				endIndex: position.end.offset
			});
		});

		// Extract inline code that might be file paths
		visit(ast, 'inlineCode', (node: any) => {
			const { value, position } = node;

			// Check if the inline code looks like a file path
			if (this.looksLikeFilePath(value)) {
				try {
					// Replace / with OS-specific path separator if needed
					const normalizedPath = value.replace(/\//g, path.sep);

					// Try to read the file content if it exists
					if (fs.existsSync(normalizedPath)) {
						const fileContent = fs.readFileSync(normalizedPath, 'utf-8');

						// Find the last heading before this inline code
						const startLine = position.start.line;
						let codeLastTitle = '';
						let maxHeadingLine = 0;

						for (const lineNum in headings) {
							const lineNumber = parseInt(lineNum);
							if (lineNumber < startLine && lineNumber > maxHeadingLine) {
								maxHeadingLine = lineNumber;
								codeLastTitle = headings[lineNum];
							}
						}

						// Create a CodeDocument for the file content
						result.push({
							title: `File: ${normalizedPath}`,
							language: this.getLanguageFromFilePath(normalizedPath),
							lastTitle: codeLastTitle,
							beforeString: '',
							afterString: '',
							code: fileContent,
							startIndex: position.start.offset,
							endIndex: position.end.offset
						});
					}
				} catch (error) {
					// Silently fail if file cannot be read
					console.error(`Failed to read file at path: ${value}`, error);
				}
			}
		});

		return result;
	}

	/**
	 * Checks if a string looks like a file path
	 */
	private looksLikeFilePath(str: string): boolean {
		// Simple heuristic: contains slash or backslash and has an extension
		return (str.includes('/') || str.includes('\\')) &&
			/\.\w+$/.test(str);
	}

	/**
	 * Gets the language identifier from a file path based on its extension
	 */
	private getLanguageFromFilePath(filePath: string): string {
		const extension = path.extname(filePath).toLowerCase();

		// Map common file extensions to language identifiers
		const extensionToLanguage: { [key: string]: string } = {
			'.js': 'javascript',
			'.jsx': 'jsx',
			'.ts': 'typescript',
			'.tsx': 'tsx',
			'.html': 'html',
			'.css': 'css',
			'.scss': 'scss',
			'.py': 'python',
			'.java': 'java',
			'.rb': 'ruby',
			'.go': 'go',
			'.php': 'php',
			'.c': 'c',
			'.cpp': 'cpp',
			'.cs': 'csharp',
			'.rs': 'rust',
			'.swift': 'swift',
			'.kt': 'kotlin',
			'.md': 'markdown',
			'.json': 'json',
			'.xml': 'xml',
			'.yaml': 'yaml',
			'.yml': 'yaml',
			'.sh': 'bash',
			'.bat': 'batch',
			'.ps1': 'powershell',
		};

		return extensionToLanguage[extension] || 'plaintext';
	}
}
