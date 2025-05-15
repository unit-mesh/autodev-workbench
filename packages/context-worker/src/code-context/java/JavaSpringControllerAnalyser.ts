import { injectable } from 'inversify';

import { LanguageProfile } from '../base/LanguageProfile';
import { LanguageProfileUtil } from '../base/LanguageProfileUtil';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { JavaProfile } from './JavaProfile';
import { MemoizedQuery } from '../base/LanguageProfile';
import { JVMRestApiAnalyser } from '../jvm/JVMRestApiAnalyser';
import { StructurerProvider } from '../base/StructurerProvider';
import { JavaStructurerProvider } from "./JavaStructurerProvider";

@injectable()
export class JavaSpringControllerAnalyser extends JVMRestApiAnalyser {
	protected structurer: StructurerProvider = new JavaStructurerProvider();
	readonly langId: LanguageIdentifier = 'java';
	protected config: LanguageProfile;

	protected get springAnnotationQuery(): MemoizedQuery {
		return this.config.structureQuery;
	}

	protected get restTemplateQuery(): MemoizedQuery {
		return this.config.structureQuery;
	}

	constructor() {
		super();
		this.config = LanguageProfileUtil.from(this.langId) || new JavaProfile();
	}

	isApplicable(lang: LanguageIdentifier): boolean {
		return lang === this.langId;
	}

	protected cleanStringLiteral(text: string): string {
		return text.replace(/^"(.*)"$/, '$1');
	}
}
