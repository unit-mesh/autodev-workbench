import { injectable } from 'inversify';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { ApiResource } from "@autodev/worker-core";
import { CodeFile } from "../../codemodel/CodeElement";

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
}
