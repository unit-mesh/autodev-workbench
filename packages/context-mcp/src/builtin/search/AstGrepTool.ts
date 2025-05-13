import cpp from '@ast-grep/lang-typescript'
import { registerDynamicLanguage, parse } from '@ast-grep/napi'

import { Tool } from "../../base/Tool";

export class AstGrepTool implements Tool {
	name(): string {
		return "";
	}

	description(): string {
		return "";
	}

	usage(): string {
		return "";
	}
	execute(_input: object): Promise<object> {
		registerDynamicLanguage({ cpp })

		const sg = parse('cpp', `console.log('hello world')`)
		const result = sg.root().kind();
		return Promise.resolve({ result });
	}

	icon(): string {
		return "";
	}
}
