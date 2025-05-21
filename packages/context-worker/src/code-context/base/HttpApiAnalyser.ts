import { injectable } from 'inversify';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { ApiResource } from "@autodev/worker-core";
import { CodeFile } from "../../codemodel/CodeElement";
import Parser from "web-tree-sitter";
import { LanguageProfile } from "./LanguageProfile";
import { StructurerProvider } from "./StructurerProvider";

export interface ApiDemand {
	sourceCaller: string;
	targetUrl: string;
	targetHttpMethod: string;
}

@injectable()
export abstract class HttpApiAnalyser {
	abstract readonly langId: LanguageIdentifier;
	resources: ApiResource[] = [];
	demands: ApiDemand[] = [];
	private initialized: boolean = false;
	protected parser: Parser | undefined;
	protected language: Parser.Language | undefined;
	protected config: LanguageProfile;
	protected structurer: StructurerProvider;

	fileFilter: (codeFile: CodeFile) => boolean = (codeFile: CodeFile): boolean => {
		return true
	}

	/**
	 * Check if this analyser is applicable for a given language
	 * @param lang the language to check
	 */
	abstract isApplicable(lang: LanguageIdentifier): boolean;

	/**
	 * Initialize the analyser with language service
	 * @param langService the language service provider
	 */
	async init(langService: ILanguageServiceProvider): Promise<void> {
		if (this.initialized) {
			return;
		}

		await this.initializeAnalyser(langService);
		this.initialized = true;
	}

	/**
	 * Implementation of analyzer initialization
	 * @param langService the language service provider
	 */
	protected async initializeAnalyser(langService: ILanguageServiceProvider): Promise<void> {
		const parser = await langService.getParser(this.langId);
		const language = await this.config.grammar(langService, this.langId);
		parser!.setLanguage(language);
		this.parser = parser;
		this.language = language;
		await this.structurer.init(langService);
	}

	/**
	 * Analyse source code to extract API resources and demands
	 * @param sourceCode the source code to analyse
	 * @param filePath the file path of the source code
	 * @param workspacePath the workspace path
	 */
	abstract sourceCodeAnalysis(sourceCode: string, filePath: string, workspacePath: string): Promise<ApiResource[]>;

	/**
	 * Perform analysis on the code file
	 * @param codeFile the code file to analyse
	 * @param workspacePath the workspace path
	 */
	abstract analysis(codeFile: CodeFile, workspacePath: string): Promise<ApiResource[]>;
}
