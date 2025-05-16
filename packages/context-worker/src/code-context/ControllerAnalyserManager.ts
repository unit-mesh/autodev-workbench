import { providerContainer } from "../base/common/instantiation/instantiationService";
import { RestApiAnalyser } from "./base/RestApiAnalyser";
import { IRestApiAnalyser } from "../ProviderTypes";

export class ControllerAnalyserManager {
	private static instance: ControllerAnalyserManager;

	private constructor() {}

	static getInstance(): ControllerAnalyserManager {
		if (!ControllerAnalyserManager.instance) {
			ControllerAnalyserManager.instance = new ControllerAnalyserManager();
		}
		return ControllerAnalyserManager.instance;
	}

	getAnalyser(): RestApiAnalyser[] {
		return providerContainer.getAll(IRestApiAnalyser);
	}
}
