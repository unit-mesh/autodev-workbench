import { providerContainer } from "../base/common/instantiation/instantiationService";
import { HttpApiAnalyser } from "./base/HttpApiAnalyser";
import { IRestApiAnalyser } from "../ProviderTypes";

export class HttpApiAnalyserManager {
	private static instance: HttpApiAnalyserManager;

	private constructor() {}

	static getInstance(): HttpApiAnalyserManager {
		if (!HttpApiAnalyserManager.instance) {
			HttpApiAnalyserManager.instance = new HttpApiAnalyserManager();
		}
		return HttpApiAnalyserManager.instance;
	}

	getAnalyser(): HttpApiAnalyser[] {
		return providerContainer.getAll(IRestApiAnalyser);
	}
}
