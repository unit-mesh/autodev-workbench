import * as path from 'path';
import * as fs from 'fs';
import { DocumentAnalyser, CodeDocument } from './MarkdownAnalyser';

/**
 * ReSTAnalyser is a class that is responsible for analyzing ReST (reStructuredText) documents.
 */
export class ReSTAnalyser implements DocumentAnalyser {
	/**
	 * Parses a reStructuredText string and extracts code documents from it
	 * @param content - The ReST string to parse
	 * @returns A promise that resolves to an array of CodeDocument objects
	 */
	async parse(content: string): Promise<CodeDocument[]> {
		const result: CodeDocument[] = [];
		const lines = content.split('\n');

		// Track headings and their levels
		let lastHeading = '';
		const headings: { [key: number]: string } = {};

		// Parse document line by line
		let inCodeBlock = false;
		let codeBlockStartLine = 0;
		let codeBlockLanguage = 'plaintext';
		let codeContent = '';

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Check for section headers (underlined text)
			// ReST headers are typically underlined with characters like =, -, ~, etc.
			if (i > 0 && !inCodeBlock &&
				(line.match(/^={3,}$/) || line.match(/^-{3,}$/) ||
					line.match(/^~{3,}$/) || line.match(/^\^{3,}$/) ||
					line.match(/^"{3,}$/))) {

				lastHeading = lines[i - 1];
				headings[i - 1] = lastHeading;
			}

			// Check for code blocks
			// Code blocks in ReST typically start with '.. code-block:: language'
			if (line.trim().startsWith('.. code-block::')) {
				inCodeBlock = true;
				codeBlockStartLine = i;
				const langMatch = line.match(/\.\. code-block:: (\w+)/);
				codeBlockLanguage = langMatch ? langMatch[1] : 'plaintext';
				codeContent = '';
				continue;
			}

			// Inside code block
			if (inCodeBlock) {
				// In ReST, code blocks are indented
				if (line.trim() === '' && codeContent === '') {
					// Skip initial empty lines
					continue;
				} else if (line.startsWith('    ') || line.startsWith('\t') || line.trim() === '') {
					// Add to code content (removing leading indentation)
					codeContent += (line.startsWith('    ') ? line.slice(4) : line) + '\n';
				} else {
					// End of code block
					inCodeBlock = false;

					// Find the last heading before this code block
					let codeLastTitle = '';
					let maxHeadingLine = 0;

					for (const lineNum in headings) {
						const lineNumber = parseInt(lineNum);
						if (lineNumber < codeBlockStartLine && lineNumber > maxHeadingLine) {
							maxHeadingLine = lineNumber;
							codeLastTitle = headings[lineNum];
						}
					}

					// Get context lines before and after the code block
					const beforeLineCount = 20;
					const afterLineCount = 20;

					const beforeStart = Math.max(0, codeBlockStartLine - beforeLineCount);
					const beforeEnd = codeBlockStartLine;
					const beforeString = lines.slice(beforeStart, beforeEnd).join('\n');

					const afterStart = i - 1;
					const afterEnd = Math.min(lines.length, i - 1 + afterLineCount);
					const afterString = lines.slice(afterStart, afterEnd).join('\n');

					// Create a CodeDocument for the code block
					result.push({
						title: `Code block at line ${codeBlockStartLine + 1}`,
						language: codeBlockLanguage,
						lastTitle: codeLastTitle,
						beforeString,
						afterString,
						code: codeContent.trim()
					});

					// Process this line again as it might be the start of something else
					i--;
				}
			}

			// Check for inline literal text that might be file paths
			// In ReST, inline literals are marked with double backticks ``like this``
			const literalMatches = line.match(/``([^`]+)``/g);
			if (literalMatches) {
				for (const match of literalMatches) {
					const value = match.slice(2, -2); // Remove the backticks

					if (this.looksLikeFilePath(value)) {
						try {
							const normalizedPath = value.replace(/\//g, path.sep);

							if (fs.existsSync(normalizedPath)) {
								const fileContent = fs.readFileSync(normalizedPath, 'utf-8');

								// Find the last heading before this inline code
								let codeLastTitle = '';
								let maxHeadingLine = 0;

								for (const lineNum in headings) {
									const lineNumber = parseInt(lineNum);
									if (lineNumber < i && lineNumber > maxHeadingLine) {
										maxHeadingLine = lineNumber;
										codeLastTitle = headings[lineNum];
									}
								}

								result.push({
									title: `File: ${normalizedPath}`,
									language: this.getLanguageFromFilePath(normalizedPath),
									lastTitle: codeLastTitle,
									beforeString: '',
									afterString: '',
									code: fileContent
								});
							}
						} catch (error) {
							console.error(`Failed to read file at path: ${value}`, error);
						}
					}
				}
			}
		}

		// Handle the case where the document ends with a code block
		if (inCodeBlock && codeContent.trim() !== '') {
			let codeLastTitle = '';
			let maxHeadingLine = 0;

			for (const lineNum in headings) {
				const lineNumber = parseInt(lineNum);
				if (lineNumber < codeBlockStartLine && lineNumber > maxHeadingLine) {
					maxHeadingLine = lineNumber;
					codeLastTitle = headings[lineNum];
				}
			}

			const beforeStart = Math.max(0, codeBlockStartLine - 3);
			const beforeEnd = codeBlockStartLine;
			const beforeString = lines.slice(beforeStart, beforeEnd).join('\n');

			result.push({
				title: `Code block at line ${codeBlockStartLine + 1}`,
				language: codeBlockLanguage,
				lastTitle: codeLastTitle,
				beforeString,
				afterString: '',
				code: codeContent.trim()
			});
		}

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
			'.rst': 'restructuredtext',
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
