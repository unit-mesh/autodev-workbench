import { HttpApiAnalyserManager } from "../../code-context/HttpApiAnalyserManager";
import { ApiResource } from "@autodev/worker-core";
import { ICodeAnalyzer } from "./ICodeAnalyzer";
import { CodeCollector } from "../CodeCollector";
import fs from "fs";
import { ILanguageServiceProvider } from "../../base/common/languages/languageService";

export class HttpApiCodeAnalyser implements ICodeAnalyzer {
	private readonly languageService: ILanguageServiceProvider;

	constructor(languageService: ILanguageServiceProvider) {
		this.languageService = languageService;
	}

	private manager: HttpApiAnalyserManager = HttpApiAnalyserManager.getInstance()
	private analysers = this.manager.getAnalyser();

	async analyze(codeCollector: CodeCollector): Promise<ApiResource[]> {
		const codeFiles: string[] = codeCollector.getAllFiles();
		let apiResources: ApiResource[] = [];

		for (let path of codeFiles) {
			const sourceCode = await fs.promises.readFile(path, 'utf-8');
			for (let analyser of this.analysers) {
				await analyser.init(this.languageService);

				let allCodeFiles = codeCollector.getAllCodeFiles();
				let filteredFiles = allCodeFiles.filter((codeFile) => {
					return analyser.fileFilter(codeFile);
				});

				if (filteredFiles.length === 0) {
					continue;
				}

				let result: ApiResource[] = [];
				for (let filteredFile of filteredFiles) {
					result.concat(await analyser.analysis(filteredFile));
				}

				if (result && result.length > 0) {
					apiResources = apiResources.concat(result);
					continue;
				}

				result = await analyser.sourceCodeAnalysis(sourceCode, path, codeCollector.getWorkspacePath());
				if (result && result.length > 0) {
					apiResources = apiResources.concat(result);
				}
			}
		}

		return apiResources;
	}
}
