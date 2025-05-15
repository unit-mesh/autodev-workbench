import { providerContainer } from "../base/common/instantiation/instantiationService";
import { RestApiAnalyser } from "./base/RestApiAnalyser";

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
		let providers = providerContainer.getAll(RestApiAnalyser);
		return providers;
	}
}
