import { ControllerAnalyserManager } from "../../code-context/ControllerAnalyserManager";
import { ApiResource } from "@autodev/worker-core";
import { CodeFile } from "../../codemodel/CodeElement";

export class HttpApiAnalyser {
	private manager: ControllerAnalyserManager = ControllerAnalyserManager.getInstance()
	private analysers = this.manager.getAnalyser();

	async analyze(codeFiles: CodeFile[]): Promise<ApiResource[]> {
		let apiResources: ApiResource[] = [];
		for (let file of codeFiles) {
			for (let analyser of this.analysers) {
				let result: ApiResource[] = await analyser.analysis(file);
				if (result && result.length > 0) {
					apiResources = apiResources.concat(result);
				}
			}
		}

		return Promise.all(apiResources);
	}
}
