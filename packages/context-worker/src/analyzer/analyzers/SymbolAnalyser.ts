import { ILanguageServiceProvider } from "../../base/common/languages/languageService";
import { SymbolAnalysisResult, SymbolInfo } from "../CodeAnalysisResult";
import { CodeSymbol, SymbolExtractor, SymbolKind } from "../../code-context/base/SymbolExtractor";
import fs from "fs";
import { inferLanguage } from "../../base/common/languages/languages";

export class SymbolAnalyser {
	private languageService: ILanguageServiceProvider;

	constructor(languageService: ILanguageServiceProvider) {
		this.languageService = languageService;
	}

	async analyzeByDir(filesInDir: string[]): Promise<SymbolAnalysisResult> {
		const symbolInfoArray: SymbolInfo[] = [];
		for (let path of filesInDir) {
			const content = fs.readFileSync(path, { encoding: 'utf-8' });
			const language = inferLanguage(path);

			if (!language) {
				continue;
			}

			try {
				const symbolExtractor = new SymbolExtractor(language, this.languageService);
				const symbols = await symbolExtractor.executeQuery(path, content);

				for (const symbol of symbols) {
					symbolInfoArray.push(this.convertToSymbolInfo(symbol, path));
				}
			} catch (error) {
				console.error(`分析文件 ${path} 的符号时出错:`, error);
			}
		}

		return {
			symbols: symbolInfoArray,
			stats: {
				totalSymbols: symbolInfoArray.length,
				// classesByFile,
				// methodsByFile,
				// symbolsByKind
			}
		};
	}


	private updateStats(
		symbol: CodeSymbol,
		filePath: string,
		classesByFile: Map<string, number>,
		methodsByFile: Map<string, number>,
		symbolsByKind: Map<number, number>
	): void {
		// 更新符号类型统计
		const kindCount = symbolsByKind.get(symbol.kind) || 0;
		symbolsByKind.set(symbol.kind, kindCount + 1);

		// 更新每个文件的类统计
		if (symbol.kind === SymbolKind.Class ||
			symbol.kind === SymbolKind.Interface ||
			symbol.kind === SymbolKind.Struct) {
			const classCount = classesByFile.get(filePath) || 0;
			classesByFile.set(filePath, classCount + 1);
		}

		// 更新每个文件的方法统计
		if (symbol.kind === SymbolKind.Method ||
			symbol.kind === SymbolKind.Function) {
			const methodCount = methodsByFile.get(filePath) || 0;
			methodsByFile.set(filePath, methodCount + 1);
		}
	}

	private convertToSymbolInfo(symbol: CodeSymbol, filePath: string): SymbolInfo {
		// 提取开始和结束点
		const { startLine: startRow, startColumn } = this.getLineAndColumn(symbol.extentRange.start);
		const { startLine: endRow, startColumn: endColumn } = this.getLineAndColumn(symbol.extentRange.end);

		return {
			name: symbol.name,
			qualifiedName: symbol.qualifiedName,
			kind: symbol.kind,
			filePath: filePath,
			comment: symbol.comment,
			position: {
				start: { row: startRow, column: startColumn },
				end: { row: endRow, column: endColumn }
			}
		};
	}

	private getLineAndColumn(offset: number): { startLine: number, startColumn: number } {
		// 这里简化处理，因为我们没有具体的源代码内容来计算行和列
		// 实际实现应根据文件内容计算精确的行号和列号
		return {
			startLine: 0,
			startColumn: offset
		};
	}
}
