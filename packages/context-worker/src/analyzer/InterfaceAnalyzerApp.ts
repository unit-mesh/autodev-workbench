import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

import { InstantiationService, providerContainer } from "../base/common/instantiation/instantiationService";
import { ILanguageServiceProvider, LanguageServiceProvider } from "../base/common/languages/languageService";
import { IRestApiAnalyser, IStructurerProvider } from "../ProviderTypes";
import { JavaStructurerProvider } from "../code-context/java/JavaStructurerProvider";
import { JavaSpringControllerAnalyser } from "../code-context/java/JavaSpringControllerAnalyser";
import { TypeScriptStructurer } from "../code-context/typescript/TypeScriptStructurer";
import { GoStructurerProvider } from "../code-context/go/GoStructurerProvider";
import { KotlinStructurerProvider } from "../code-context/kotlin/KotlinStructurerProvider";
import { KotlinSpringControllerAnalyser } from "../code-context/kotlin/KotlinSpringControllerAnalyser";
import { CodeAnalyzer } from "./analyzers/CodeAnalyzer";
import { CodeAnalysisResult } from "./CodeAnalysisResult";
import { PythonStructurer } from "../code-context/python/PythonStructurer";
import { AppConfig } from "../types/AppConfig";
import { RustStructurer } from "../code-context/rust/RustStructurer";
import { CStructurer } from "../code-context/c/CStructurer";
import { CSharpStructurer } from "../code-context/csharp/CSharpStructurer";
import { analyseProtos, ProtoApiResourceGenerator, scanProtoFiles } from "@autodev/worker-protobuf";
import { ApiResource } from "@autodev/worker-core";

export class InterfaceAnalyzerApp {
	private instantiationService: InstantiationService;
	private codeAnalyzer: CodeAnalyzer;
	private config: AppConfig;

	constructor(config: AppConfig) {
		this.config = config;
		this.instantiationService = new InstantiationService();
		this.instantiationService.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider);

		providerContainer.bind(IStructurerProvider).to(JavaStructurerProvider);
		providerContainer.bind(IStructurerProvider).to(KotlinStructurerProvider);
		providerContainer.bind(IStructurerProvider).to(TypeScriptStructurer);
		providerContainer.bind(IStructurerProvider).to(GoStructurerProvider);
		providerContainer.bind(IStructurerProvider).to(PythonStructurer);
		providerContainer.bind(IStructurerProvider).to(RustStructurer);
		providerContainer.bind(IStructurerProvider).to(CStructurer);
		providerContainer.bind(IStructurerProvider).to(CSharpStructurer);

		providerContainer.bind(IRestApiAnalyser).to(JavaSpringControllerAnalyser);
		providerContainer.bind(IRestApiAnalyser).to(KotlinSpringControllerAnalyser);

		this.codeAnalyzer = new CodeAnalyzer(this.instantiationService, config);
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

	async handleInterfaceContext() {
		await this.codeAnalyzer.initializeFiles();
		const config = this.config;
		this.codeAnalyzer.updateConfig(config);

		console.log(`正在扫描目录: ${config.dirPath}`);
		const result: CodeAnalysisResult = await this.codeAnalyzer.analyzeDirectory();

		const outputFilePath = path.join(process.cwd(), config.outputJsonFile || 'interface_analysis_result.json');
		fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));

		if (config.upload) {
			console.log(`正在上传分析结果到 ${config.baseUrl}/projects/${config.projectId}`);
			await this.uploadCodeResult(result);
		}

		console.log(`分析结果已保存到 ${outputFilePath}`);
		await this.codeAnalyzer.generateLearningMaterials(result);
	}

	async handleApiContext() {
		const config = this.config;
		const controllerFilter = (fileName: string) => {
			const baseName = path.basename(fileName);
			return baseName.includes('controller') || baseName.includes('Controller');
		};

		let codeFiles = await this.codeAnalyzer.initializeFiles(controllerFilter);
		let apiResources = await this.analysisProtobuf(config);
		let normalApis: ApiResource[] = await this.codeAnalyzer.analyzeApi(codeFiles);
		apiResources = apiResources.concat(normalApis);

		if (config.upload) {
			console.log(`正在上传分析结果到 ${config.baseUrl}`);
			await this.uploadApiCodeResult(apiResources);
		}

		// write to file
		const outputFilePath = path.join(process.cwd(), config.outputJsonFile || 'api_analysis_result.json');
		fs.writeFileSync(outputFilePath, JSON.stringify(apiResources, null, 2));
	}

	private async analysisProtobuf(config: AppConfig): Promise<ApiResource[]> {
		const protoFiles = await scanProtoFiles(config.dirPath);
		const results = await analyseProtos(protoFiles);

		const outputFilePath = path.join(process.cwd(), 'protobuf_analysis_result.json');
		fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));

		const resourceAnalyser = new ProtoApiResourceGenerator();
		const apiResources = resourceAnalyser.generateApiResources(results.flatMap(result => result.dataStructures));
		return apiResources
	}
}
