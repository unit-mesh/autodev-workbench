import { StructurerProvider } from "./base/StructurerProvider";
import { LanguageIdentifier } from "../base/common/languages/languages";
import { IStructurerProvider } from "../ProviderTypes";
import { providerContainer } from "../base/common/instantiation/instantiationService";

export class StructurerProviderManager {
	private static instance: StructurerProviderManager;

	private constructor() {}

	static getInstance(): StructurerProviderManager {
		if (!StructurerProviderManager.instance) {
			StructurerProviderManager.instance = new StructurerProviderManager();
		}
		return StructurerProviderManager.instance;
	}

	getStructurer(lang: LanguageIdentifier): StructurerProvider | undefined {
		let testProviders = providerContainer.getAll(IStructurerProvider);
		let provider = testProviders.find(provider => {
			return provider.isApplicable(lang);
		});

		if (!provider) {
			return undefined;
		}

		return provider;
	}
}
