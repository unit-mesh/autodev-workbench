import { providerContainer } from "../base/common/instantiation/instantiationService";
import { RestApiAnalyser } from "./base/RestApiAnalyser";
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

	getAnalyser(): RestApiAnalyser[] {
		return providerContainer.getAll(IRestApiAnalyser);
	}
}
