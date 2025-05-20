import { injectable } from 'inversify';

import { LanguageProfile } from '../base/LanguageProfile';
import { LanguageProfileUtil } from '../base/LanguageProfileUtil';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { JavaProfile } from './JavaProfile';
import { MemoizedQuery } from '../base/LanguageProfile';
import { SpringRestApiAnalyser } from '../jvm/SpringRestApiAnalyser';
import { StructurerProvider } from '../base/StructurerProvider';
import { JavaStructurerProvider } from "./JavaStructurerProvider";

@injectable()
export class JavaSpringControllerAnalyser extends SpringRestApiAnalyser {
	protected structurer: StructurerProvider = new JavaStructurerProvider();
	readonly langId: LanguageIdentifier = 'java';

	protected restTemplateQuery = new MemoizedQuery(`
    (method_invocation
      object: (identifier) @object-name
      name: (identifier) @method-name
      arguments: (argument_list
        (string_literal) @url-arg
        (_)* @other-args
      )
    )
  `);

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
