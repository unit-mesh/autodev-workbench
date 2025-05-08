import { injectable } from 'inversify';

import { TextRange } from '../../code-search/scope-graph/model/TextRange';
import { ScopeGraph } from '../../code-search/scope-graph/ScopeGraph';
import { JavaStructurerProvider } from './JavaStructurerProvider';
import { JavaRelevantLookup } from './utils/JavaRelevantLookup';
import { RelevantCodeProvider } from '../base/RelevantCodeProvider';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { NamedElement } from "../../ast/NamedElement";
import { TreeSitterFile } from '../../ast/TreeSitterFile';
import { CodeFile } from '../../codemodel/CodeElement';

@injectable()
export class JavaRelevantCodeProvider implements RelevantCodeProvider {
	name = 'JavaRelatedProvider';
	language = 'java';
	languageService: ILanguageServiceProvider | undefined;

	async setupLanguage(defaultLanguageServiceProvider: ILanguageServiceProvider) {
		this.languageService = defaultLanguageServiceProvider;
	}

	async getMethodFanInAndFanOut(file: TreeSitterFile, method: NamedElement): Promise<CodeFile[]> {
		let graph = await file.scopeGraph();
		return await this.lookupRelevantClass(method, file, graph);
	}

	async lookupRelevantClass(element: NamedElement, tsfile: TreeSitterFile, graph: ScopeGraph): Promise<CodeFile[]> {
		let structurer = new JavaStructurerProvider();
		await structurer.init(this.languageService!!);

		const textRange: TextRange = element.blockRange.toTextRange();
		const source = tsfile.sourcecode;
		let ios: string[] =
			(await structurer.retrieveMethodIOImports(graph, tsfile.tree.rootNode, textRange, source)) ?? [];

		let lookup = new JavaRelevantLookup(tsfile);
		let paths = lookup.relevantImportToFilePath(ios);

		// read file by path and structurer to parse it to uml
		async function parseCodeFile(path: string): Promise<CodeFile | undefined> {
			const fs = require('fs').promises;
			const data = await fs.readFile(path, 'utf8');
			return await structurer.parseFile(data, path);
		}

		let codeFiles: CodeFile[] = [];
		for (const path of paths) {
			let codeFile: CodeFile | undefined = undefined;
			try {
				codeFile = await parseCodeFile(path);
			} catch (e) {
				console.info(`Failed to parse file ${path}`);
			}

			if (codeFile !== undefined) {
				codeFiles.push(codeFile);
			}
		}

		return codeFiles;
	}
}
