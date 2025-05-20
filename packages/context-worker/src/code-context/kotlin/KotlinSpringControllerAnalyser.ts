import { injectable } from 'inversify';

import { MemoizedQuery } from '../base/LanguageProfile';
import { LanguageProfileUtil } from '../base/LanguageProfileUtil';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { KotlinProfile } from './KotlinProfile';
import { SpringRestApiAnalyser } from '../jvm/SpringRestApiAnalyser';
import { StructurerProvider } from "../base/StructurerProvider";
import { KotlinStructurerProvider } from "./KotlinStructurerProvider";

@injectable()
export class KotlinSpringControllerAnalyser extends SpringRestApiAnalyser {
	protected structurer: StructurerProvider = new KotlinStructurerProvider();
	readonly langId: LanguageIdentifier = 'kotlin';

	protected restTemplateQuery = new MemoizedQuery(`
    (call_expression
      (navigation_expression
        (simple_identifier) @object-name
        (navigation_suffix (simple_identifier) @method-name)
      )
      (call_suffix
        (value_arguments
          (value_argument
            (string_literal) @url-arg
          )
          (_)* @other-args
        )
      )
    )
  `);

	constructor() {
		super();
		this.config = LanguageProfileUtil.from(this.langId) || new KotlinProfile();
	}

	isApplicable(lang: LanguageIdentifier): boolean {
		return lang === this.langId;
	}

	protected cleanStringLiteral(text: string): string {
		return text.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
	}
}
