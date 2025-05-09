import { CodeCollector } from "../CodeCollector";

export interface ICodeAnalyzer {
	analyze(codeCollector: CodeCollector): Promise<any>;
}
