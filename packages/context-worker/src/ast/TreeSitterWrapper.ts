import { TreeSitterFile } from './TreeSitterFile';
import { ILanguageServiceProvider } from "../base/common/languages/languageService";

/**
 * For fix generate code
 */
export async function textToTreeSitterFile(
	src: string, langId: string, languageService: ILanguageServiceProvider
) {
	return TreeSitterFile.create(src, langId, languageService);
}
