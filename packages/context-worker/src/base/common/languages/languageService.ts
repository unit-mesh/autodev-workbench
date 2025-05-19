/* eslint-disable @typescript-eslint/naming-convention */

/* eslint-disable curly */
import { inject, injectable } from 'inversify';
import Parser from 'web-tree-sitter';

import { TreeSitterLoader } from '../../node/tree-sitter/treeSitterLoader';

import { ServiceIdentifier } from '../instantiation/instantiation';
import { isSupportedLanguage, LanguageIdentifier } from './languages';

export const ILanguageServiceProvider: ServiceIdentifier<ILanguageServiceProvider> = Symbol('LanguageServiceProvider');

export interface ILanguageServiceProvider {
	isSupportLanguage(identifier: LanguageIdentifier): boolean;

	ready(): Promise<void>;

	parse(identifier: LanguageIdentifier, input: string): Promise<Parser.Tree | undefined>;

	getParser(identifier: LanguageIdentifier): Promise<Parser | undefined>;
	getLanguage(identifier: LanguageIdentifier): Promise<Parser.Language | undefined>;

	dispose(): void;
}

@injectable()
export class LanguageServiceProvider implements ILanguageServiceProvider {
	private _loader: TreeSitterLoader;

	constructor() {
		this._loader = new TreeSitterLoader({
			readFile: path => {
				return new Promise((resolve, reject) => {
					const fs = require('fs');
					fs.readFile(path, (err: Error, data: Buffer) => {
						if (err) {
							reject(err);
						} else {
							resolve(data);
						}
					});
				});
			}
		});
	}

	ready() {
		return this._loader.ready();
	}

	async parse(identifier: LanguageIdentifier, input: string) {
		if (!this.isSupportLanguage(identifier)) {
			return;
		}

		return this._loader.parse(identifier, input);
	}

	getParser(identifier: LanguageIdentifier): Promise<Parser | undefined> {
		if (this.isSupportLanguage(identifier)) {
			return this._loader.getLanguageParser(identifier);
		}

		return Promise.resolve(undefined);
	}

	async getLanguage(identifier: LanguageIdentifier): Promise<Parser.Language | undefined> {
		console.log(identifier)
		const parser = await this.getParser(identifier);
		return parser?.getLanguage();
	}

	isSupportLanguage(identifier: LanguageIdentifier) {
		return isSupportedLanguage(identifier);
	}

	dispose() {
		this._loader.dispose();
	}
}
