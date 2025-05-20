import { HttpApiAnalyserManager } from "../../code-context/HttpApiAnalyserManager";
import { ApiResource } from "@autodev/worker-core";
import { ICodeAnalyzer } from "./ICodeAnalyzer";
import { CodeCollector } from "../CodeCollector";
import fs from "fs";
import { ILanguageServiceProvider } from "../../base/common/languages/languageService";
import { CodeFile } from "../../codemodel/CodeElement";
import { inferLanguage } from "../../base/common/languages/languages";

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

		let codeStructure = codeCollector.getAllCodeStructure();
		let pathCodeFileMap: Map<string, CodeFile> = new Map();
		for (let codeFile of codeStructure) {
			pathCodeFileMap.set(codeFile.filepath, codeFile);
		}

		for (let path of codeFiles) {
			const sourceCode = await fs.promises.readFile(path, 'utf-8');
			for (let analyser of this.analysers) {
				if (!analyser.isApplicable(inferLanguage(path))) {
					continue;
				}

				await analyser.init(this.languageService);

				let codeFile = pathCodeFileMap.get(path);
				let result: ApiResource[] = [];
				if (analyser.fileFilter(codeFile)) {
					result = result.concat(await analyser.analysis(codeFile));
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
