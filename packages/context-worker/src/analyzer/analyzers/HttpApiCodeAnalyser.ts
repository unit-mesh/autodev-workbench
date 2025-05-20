import { HttpApiAnalyserManager } from "../../code-context/HttpApiAnalyserManager";
import { ApiResource } from "@autodev/worker-core";
import { ICodeAnalyzer } from "./ICodeAnalyzer";
import { CodeCollector } from "../CodeCollector";
import fs from "fs";

export class HttpApiCodeAnalyser implements ICodeAnalyzer {
	private manager: HttpApiAnalyserManager = HttpApiAnalyserManager.getInstance()
	private analysers = this.manager.getAnalyser();

	async analyze(codeCollector: CodeCollector): Promise<ApiResource[]> {
		const codeFiles: string[] = codeCollector.getAllFiles();
		let apiResources: ApiResource[] = [];

		//// first filter by path
		for (let path of codeFiles) {
			const sourceCode = await fs.promises.readFile(path, 'utf-8');
			for (let analyser of this.analysers) {


				let result: ApiResource[] = await analyser.analyse(sourceCode, path, codeCollector.getWorkspacePath());
				if (result && result.length > 0) {
					apiResources = apiResources.concat(result);
				}
			}
		}

		return apiResources;
	}
}
