import fs from "fs";

import { ILanguageServiceProvider } from "../../base/common/languages/languageService";
import { FileSymbols, SymbolAnalysisResult, SymbolInfo } from "../CodeAnalysisResult";
import { CodeSymbol, SymbolExtractor, SymbolKind } from "../../code-context/base/SymbolExtractor";
import { inferLanguage } from "../../base/common/languages/languages";
import { CodeCollector } from "../CodeCollector";
import { ICodeAnalyzer } from "./ICodeAnalyzer";

export class SymbolAnalyser implements ICodeAnalyzer {
	private languageService: ILanguageServiceProvider;

	constructor(languageService: ILanguageServiceProvider) {
		this.languageService = languageService;
	}

	public async analyze(codeCollector: CodeCollector): Promise<SymbolAnalysisResult> {
		const allSymbols: SymbolInfo[] = [];
		const fileSymbolsMap: Record<string, FileSymbols> = {}; // 改为使用对象而非数组
		const classesByFileMap = new Map<string, number>();
		const methodsByFileMap = new Map<string, number>();
		const symbolsByKindMap = new Map<number, number>();

		for (let path of codeCollector.getAllFiles()) {
			const fileSymbols = await this.analyzeFile(path);
			if (fileSymbols) {
				fileSymbolsMap[path] = fileSymbols; // 使用文件路径作为键存储
				allSymbols.push(...fileSymbols.symbols);

				classesByFileMap.set(path, fileSymbols.stats.classCount);
				methodsByFileMap.set(path, fileSymbols.stats.methodCount);

				this.updateSymbolsByKind(fileSymbols.symbols, symbolsByKindMap);
			}
		}

		const classesByFile = Array.from(classesByFileMap.entries())
			.filter(([_, count]) => count > 0)
			.map(([filePath, count]) => ({
				filePath,
				count
			}));

		const methodsByFile = Array.from(methodsByFileMap.entries())
			.filter(([_, count]) => count > 0)
			.map(([filePath, count]) => ({
				filePath,
				count
			}));

		const symbolsByKind = Array.from(symbolsByKindMap.entries())
			.map(([kind, count]) => ({
				kind,
				count
			}));

		return {
			symbols: allSymbols,
			fileSymbols: fileSymbolsMap, // 返回文件路径到符号的映射
			stats: {
				totalSymbols: allSymbols.length,
				classesByFile,
				methodsByFile,
				symbolsByKind
			}
		};
	}

	private updateSymbolsByKind(symbols: SymbolInfo[], symbolsByKindMap: Map<number, number>): void {
		for (const symbol of symbols) {
			const count = symbolsByKindMap.get(symbol.kind) || 0;
			symbolsByKindMap.set(symbol.kind, count + 1);
		}
	}

	private async analyzeFile(path: string): Promise<FileSymbols | null> {
		try {
			const content = fs.readFileSync(path, { encoding: 'utf-8' });
			const language = inferLanguage(path);

			if (!language) {
				return null;
			}

			const symbolExtractor = new SymbolExtractor(language, this.languageService);
			const symbols = await symbolExtractor.executeQuery(path, content);
			const symbolInfos = symbols.map(symbol => this.convertToSymbolInfo(symbol, path));

			if (symbolInfos.length === 0) {
				return null;
			}

			// 计算文件中的类和方法数量
			const classCount = symbolInfos.filter(s =>
				s.kind === SymbolKind.Class ||
				s.kind === SymbolKind.Interface ||
				s.kind === SymbolKind.Struct
			).length;

			const methodCount = symbolInfos.filter(s =>
				s.kind === SymbolKind.Method ||
				s.kind === SymbolKind.Function
			).length;

			return {
				filePath: path,
				symbols: symbolInfos,
				stats: {
					classCount,
					methodCount,
					totalSymbols: symbolInfos.length
				}
			};
		} catch (error) {
			console.error(`分析文件 ${path} 的符号时出错:`, error);
			return null;
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
