import { injectable } from 'inversify';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { ApiResource } from "@autodev/worker-core";
import { CodeFile } from "../../codemodel/CodeElement";

/**
 * API call representation
 */
export interface ApiDemand {
  // Source of the API call (class name)
  sourceCaller: string;
  // Target URL
  targetUrl: string;
  // Target HTTP method
  targetHttpMethod: string;
}

@injectable()
export abstract class RestApiAnalyser {
  // Language identifier that this analyser supports
  abstract readonly langId: LanguageIdentifier;

  // API resources extracted from code
  resources: ApiResource[] = [];
  // API demands extracted from code
  demands: ApiDemand[] = [];

  /**
   * Check if this analyser is applicable for a given language
   * @param lang the language to check
   */
  abstract isApplicable(lang: LanguageIdentifier): boolean;

  /**
   * Initialize the analyser with language service
   * @param langService the language service provider
   */
  abstract init(langService: ILanguageServiceProvider): Promise<void>;

  /**
   * Analyse source code to extract API resources and demands
   * @param sourceCode the source code to analyse
   * @param filePath the file path of the source code
   * @param workspacePath the workspace path
   */
  abstract analyse(sourceCode: string, filePath: string, workspacePath: string): Promise<ApiResource[]>;

  /**
   * Perform analysis on the code file
   * @param codeFile the code file to analyse
   */
  abstract analysis(codeFile: CodeFile): Promise<ApiResource[]>;
}
