import fs from 'fs';
import path from 'path';
import { Language } from 'web-tree-sitter';

import { ROOT_DIR } from './TestUtil';
import { LanguageIdentifier } from "../base/common/languages/languages";
import { ILanguageServiceProvider } from "../base/common/languages/languageService";

// In the test, we need to import Parser from "web-tree-sitter" as a const.
const Parser = require('web-tree-sitter');

/**
 * TestOnly: Language service for tree-sitter languages, used in test code.
 */
export class TestLanguageServiceProvider implements ILanguageServiceProvider {
	_parser: any;

	constructor(parser: any) {
		this._parser = parser;
	}

	async parse(identifier: LanguageIdentifier, input: string) {
		return undefined;
	}

	async getLanguage(langId: string): Promise<Language | undefined> {
		const nodeModulesPath = path.join(ROOT_DIR, 'node_modules');


		let lang = langId
		if (lang == 'csharp') {
			lang = 'c_sharp'
		}

		const wasmPath = path.join(
			nodeModulesPath,
			'@unit-mesh',
			'treesitter-artifacts',
			'wasm',
			`tree-sitter-${lang}.wasm`,
		);
		let bits: NonSharedBuffer;
		try {
			bits = fs.readFileSync(wasmPath);
		} catch (e) {
			throw new Error(`Failed to load language ${wasmPath}: ${e}`);
		}

		await Parser.init();
		return await Parser.Language.load(bits);
	}

	getParser(): any {
		return this._parser;
	}

	isSupportLanguage(identifier: LanguageIdentifier): boolean {
		return true;
	}

	ready(): Promise<void> {
		return Promise.resolve();
	}

	dispose(): void {
		// pass
	}
}
