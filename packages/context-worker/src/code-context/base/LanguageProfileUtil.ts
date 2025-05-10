import { languageContainer } from "../../ProviderLanguageProfile.config";
import { ILanguageProfile } from "../../ProviderTypes";
import { LanguageProfile } from "./LanguageProfile";

/**
 * Utility class for working with tree-sitter languages.
 */
export class LanguageProfileUtil {
	static from(langId: string): LanguageProfile | undefined {
		let languageProfiles = languageContainer.getAll(ILanguageProfile);

		return languageProfiles.find(target => {
			return target.languageIds.some(id => id.toLowerCase() === langId.toLowerCase());
		});
	}
}
