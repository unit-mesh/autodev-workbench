import { CodeCollector } from "../CodeCollector";
import { ICodeAnalyzer } from "./ICodeAnalyzer";
import { ControllerAnalyserManager } from "../../code-context/ControllerAnalyserManager";
import { ApiResource } from "@autodev/worker-core";

export class HttpApiAnalyser implements ICodeAnalyzer {
	private manager: ControllerAnalyserManager = ControllerAnalyserManager.getInstance()

	async analyze(codeCollector: CodeCollector): Promise<ApiResource[]> {
		let allFiles = codeCollector.getAllFiles();
		let analysers = this.manager.getAnalyser();

		let apiResources: ApiResource[] = [];
		for (let file of allFiles) {
			for (let analyser of analysers) {
				let result: ApiResource[] = await analyser.analysis(file);
				if (result && result.length > 0) {
					apiResources = apiResources.concat(result);
				}
			}
		}

		return Promise.all(apiResources);
	}
}
