import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

import { InstantiationService, providerContainer } from "../base/common/instantiation/instantiationService";
import { ILanguageServiceProvider, LanguageServiceProvider } from "../base/common/languages/languageService";
import { IHttpApiAnalyser, IStructurerProvider } from "../ProviderTypes";
import { JavaStructurerProvider } from "../code-context/java/JavaStructurerProvider";
import { JavaSpringControllerAnalyser } from "../code-context/java/JavaSpringControllerAnalyser";
import { TypeScriptStructurer } from "../code-context/typescript/TypeScriptStructurer";
import { GoStructurerProvider } from "../code-context/go/GoStructurerProvider";
import { KotlinStructurerProvider } from "../code-context/kotlin/KotlinStructurerProvider";
import { KotlinSpringControllerAnalyser } from "../code-context/kotlin/KotlinSpringControllerAnalyser";
import { CodeAnalyzer } from "./analyzers/CodeAnalyzer";
import { CodeAnalysisResult, SymbolAnalysisResult, SymbolInfo } from "./CodeAnalysisResult";
import { PythonStructurer } from "../code-context/python/PythonStructurer";
import { AppConfig } from "../types/AppConfig";
import { RustStructurer } from "../code-context/rust/RustStructurer";
import { CStructurer } from "../code-context/c/CStructurer";
import { CSharpStructurer } from "../code-context/csharp/CSharpStructurer";
import { analyseProtos, ProtoApiResourceGenerator, scanProtoFiles } from "@autodev/worker-protobuf";
import { ApiResource } from "@autodev/worker-core";
import { JavaScriptStructurer } from "../code-context/javascript/JavaScriptStructurer";
import { TypeScriptNextjsAnalyser } from "../code-context/typescript/TypeScriptNextjsAnalyser";
import { FastApiAnalyser } from "../code-context/python/FastApiAnalyser";
import { SymbolAnalyser } from "./analyzers/SymbolAnalyser";
import { SymbolKind } from "../code-context/base/SymbolExtractor";

export class InterfaceAnalyzerApp {
	private instantiationService: InstantiationService;
	private codeAnalyzer: CodeAnalyzer;
	private symbolAnalyser: SymbolAnalyser;
	private config: AppConfig;

	constructor(config: AppConfig) {
		this.config = config;
		this.instantiationService = new InstantiationService();
		this.instantiationService.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider);

		providerContainer.bind(IStructurerProvider).to(JavaStructurerProvider);
		providerContainer.bind(IStructurerProvider).to(KotlinStructurerProvider);
		providerContainer.bind(IStructurerProvider).to(JavaScriptStructurer);
		providerContainer.bind(IStructurerProvider).to(TypeScriptStructurer);
		providerContainer.bind(IStructurerProvider).to(GoStructurerProvider);
		providerContainer.bind(IStructurerProvider).to(PythonStructurer);
		providerContainer.bind(IStructurerProvider).to(RustStructurer);
		providerContainer.bind(IStructurerProvider).to(CStructurer);
		providerContainer.bind(IStructurerProvider).to(CSharpStructurer);

		providerContainer.bind(IHttpApiAnalyser).to(JavaSpringControllerAnalyser);
		providerContainer.bind(IHttpApiAnalyser).to(KotlinSpringControllerAnalyser);
		providerContainer.bind(IHttpApiAnalyser).to(TypeScriptNextjsAnalyser);
		providerContainer.bind(IHttpApiAnalyser).to(FastApiAnalyser);

		this.codeAnalyzer = new CodeAnalyzer(this.instantiationService, config);
		this.symbolAnalyser = new SymbolAnalyser(this.instantiationService.get(ILanguageServiceProvider));
	}

	/**
	 * Upload interface based and markdown analysis result to the server
	 * @param result
	 * @param config
	 */
	public async uploadCodeResult(result: CodeAnalysisResult): Promise<void> {
		const config = this.config;
		try {
			const textResult = await this.codeAnalyzer.convertToList(result);

			const debugFilePath = path.join(process.cwd(), 'debug_analysis_result.json');
			fs.writeFileSync(debugFilePath, JSON.stringify(textResult, null, 2));

			const response = await fetch(config.baseUrl + '/api/context/code', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					data: textResult,
					projectId: config.projectId
				})
			});

			const data = await response.json();
			if (data.success) {
				console.log('分析结果上传成功!');
				console.log(`ID: ${data.id}`);
			} else {
				console.error('上传失败:', data);
			}
		} catch (error) {
			console.error('上传过程中发生错误:', error);
		}
	}

	/**
	 * Upload interface based and markdown analysis result to the server
	 * @param result
	 * @param config
	 */
	public async uploadApiCodeResult(result: ApiResource[]): Promise<void> {
		const config = this.config;
		try {
			const response = await fetch(config.baseUrl + '/api/context/api', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					data: result,
					projectId: config.projectId
				})
			});

			const data = await response.json();
			if (data.success) {
				console.log('分析结果上传成功!');
				console.log(`ID: ${data.id}`);
			} else {
				console.error('上传失败:', data);
			}
		} catch (error) {
			console.error('上传过程中发生错误:', error);
		}
	}

	/**
	 * Upload symbol analysis result to the server
	 * @param result
	 */
	public async uploadSymbolResult(result: SymbolAnalysisResult): Promise<void> {
		const config = this.config;
		try {
			const simplifiedResult = this.simplifySymbolResult(result, config.dirPath);
			const response = await fetch(config.baseUrl + '/api/context/symbol', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					data: simplifiedResult,
					projectId: config.projectId
				})
			});

			const data = await response.json();
			if (data.success) {
				console.log('关键代码标识结果上传成功!');
				console.log(`ID: ${data.id}`);
			} else {
				console.error('上传失败:', data);
			}
		} catch (error) {
			console.error('上传过程中发生错误:', error);
		}
	}

	/**
	 * 将关键代码标识结果简化为只包含必要信息的格式
	 * @param result 原始关键代码标识结果
	 * @param dirPath
	 * @returns 简化后的结果
	 */
	private simplifySymbolResult(result: SymbolAnalysisResult, dirPath: string): Array<{
		filePath: string;
		symbols: SymbolInfo[];
		summary: {
			[className: string]: {
				_classComment?: string;
				[methodName: string]: string;
			}
		}
	}> {
		const { fileSymbols } = result;
		const simplifiedResult: Array<{
			filePath: string;
			symbols: SymbolInfo[];
			summary: {
				[className: string]: {
					_classComment?: string;
					[methodName: string]: string;
				}
			}
		}> = [];

		for (const [filePath, fileSymbol] of Object.entries(fileSymbols)) {
			const classSymbols = fileSymbol.symbols
				.filter(s => s.kind === SymbolKind.Class || s.kind === SymbolKind.Interface
					|| s.kind === SymbolKind.Struct || SymbolKind.Trait || SymbolKind.Type);

			const summary: {
				[className: string]: {
					_classComment?: string;
					[methodName: string]: string;
				}
			} = {};

			for (const classSymbol of classSymbols) {
				if (classSymbol.comment && classSymbol.comment.trim() !== '') {
					summary[classSymbol.name] = {
						_classComment: classSymbol.comment
					};
				} else {
					summary[classSymbol.name] = {};
				}
			}

			for (const symbol of fileSymbol.symbols) {
				if (symbol.kind === SymbolKind.Method || symbol.kind === SymbolKind.Function) {
					const parts = (symbol.qualifiedName || symbol.name).split('.');
					if (parts.length === 2) {
						const [className, methodName] = parts;
						if (summary[className]) {
							summary[className][methodName] = symbol.comment || '';
						}
					} else if (parts.length === 1 && symbol.qualifiedName) {
						const methodName = parts[0];
						const classSymbol = classSymbols.find(c =>
							symbol.qualifiedName?.startsWith(c.name + '.')
						);

						if (classSymbol) {
							summary[classSymbol.name][methodName] = symbol.comment || '';
						}
					}
				}
			}

			const relativePath = path.relative(dirPath, filePath);
			simplifiedResult.push({
				filePath: relativePath,
				symbols: fileSymbol.symbols,
				summary
			});
		}

		return simplifiedResult;
	}

	async handleInterfaceContext(isOutputInterface: boolean = true) {
		await this.codeAnalyzer.initializeFiles();
		const config = this.config;
		this.codeAnalyzer.updateConfig(config);

		const result: CodeAnalysisResult = await this.codeAnalyzer.analyzeDirectory();

		if (isOutputInterface) {
			const outputFilePath = path.join(process.cwd(), 'interface_analysis_result.json');
			fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));

			if (config.upload) {
				console.log(`Upload results to ${config.baseUrl}/projects/${config.projectId}`);
				await this.uploadCodeResult(result);
			}

			console.log(`Save results to ${outputFilePath}`);
			await this.codeAnalyzer.generateLearningMaterials(result);
		}
	}

	async handleHttpApiContext() {
		const config = this.config;

		let apiResources = await this.analysisProtobuf(config);
		let normalApis: ApiResource[] = await this.codeAnalyzer.analyzeApi();
		apiResources = apiResources.concat(normalApis);

		if (apiResources.length === 0) {
			console.log('No API resources found.');
			return;
		}

		if (config.upload) {
			console.log(`Upload api resources to ${config.baseUrl}`);
			await this.uploadApiCodeResult(apiResources);
		}

		const outputFilePath = path.join(process.cwd(), 'api_analysis_result.json');
		fs.writeFileSync(outputFilePath, JSON.stringify(apiResources, null, 2));
	}

	async handleSymbolContext() {
		await this.codeAnalyzer.initializeFiles();
		const config = this.config;

		const codeCollector = this.codeAnalyzer.getCodeCollector();
		const result: SymbolAnalysisResult = await this.symbolAnalyser.analyze(codeCollector);

		const outputFilePath = path.join(process.cwd(), 'symbol_analysis_result.json');
		fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));
		console.log(`Save symbol analysis results to ${outputFilePath}`);

		if (config.upload) {
			console.log(`Upload symbol analysis results to ${config.baseUrl}/projects/${config.projectId}`);
			await this.uploadSymbolResult(result);
		}
	}

	private async analysisProtobuf(config: AppConfig): Promise<ApiResource[]> {
		const protoFiles = await scanProtoFiles(config.dirPath);
		const results = await analyseProtos(protoFiles);

		if (!results || results.length === 0) {
			console.log('No proto files found or no analysis result.');
			return [];
		}

		const outputFilePath = path.join(process.cwd(), 'protobuf_analysis_result.json');
		fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));

		const generator = new ProtoApiResourceGenerator();
		return generator.generateApiResources(results.flatMap(result => result.dataStructures))
	}
}
