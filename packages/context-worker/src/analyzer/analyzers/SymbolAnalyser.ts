import { ILanguageServiceProvider } from "../../base/common/languages/languageService";
import { SymbolAnalysisResult, SymbolInfo } from "../CodeAnalysisResult";
import { CodeSymbol, SymbolExtractor, SymbolKind } from "../../code-context/base/SymbolExtractor";
import fs from "fs";
import { inferLanguage } from "../../base/common/languages/languages";
import { CodeCollector } from "../CodeCollector";
import { ICodeAnalyzer } from "./ICodeAnalyzer";

export class SymbolAnalyser implements ICodeAnalyzer {
	private languageService: ILanguageServiceProvider;

	constructor(languageService: ILanguageServiceProvider) {
		this.languageService = languageService;
	}

	public async analyze(codeCollector: CodeCollector): Promise<SymbolAnalysisResult> {
		const symbolInfoArray: SymbolInfo[] = [];
		for (let path of codeCollector.getAllFiles()) {
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
		const kindCount = symbolsByKind.get(symbol.kind) || 0;
		symbolsByKind.set(symbol.kind, kindCount + 1);

		if (symbol.kind === SymbolKind.Class ||
			symbol.kind === SymbolKind.Interface ||
			symbol.kind === SymbolKind.Struct) {
			const classCount = classesByFile.get(filePath) || 0;
			classesByFile.set(filePath, classCount + 1);
		}

		if (symbol.kind === SymbolKind.Method ||
			symbol.kind === SymbolKind.Function) {
			const methodCount = methodsByFile.get(filePath) || 0;
			methodsByFile.set(filePath, methodCount + 1);
		}
	}

	private convertToSymbolInfo(symbol: CodeSymbol, filePath: string): SymbolInfo {
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
		return {
			startLine: 0,
			startColumn: offset
		};
	}
}
