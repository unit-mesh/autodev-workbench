import { injectable } from 'inversify';
import { CodeStructure } from '../../codemodel/CodeElement';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';

/**
 * API resource representation
 */
export interface ApiResource {
  // URL path of the API
  url: string;
  // HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
  httpMethod: string;
  // Package name where the API controller is defined
  packageName: string;
  // Class name of the controller
  className: string;
  // Method name that handles the request
  methodName: string;
}

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

/**
 * API service representation
 */
export interface ApiService {
  // Service name
  name: string;
  // API resources offered by this service
  resources: ApiResource[];
  // API demands (calls to other services)
  demands: ApiDemand[];
}

/**
 * Interface for analysing REST API resources from code
 */
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
   * Convert analysed resources and demands into API services
   */
  toApiServices(): ApiService[] {
    return [
      {
        name: "",
        resources: this.resources,
        demands: this.demands
      }
    ];
  }
}
