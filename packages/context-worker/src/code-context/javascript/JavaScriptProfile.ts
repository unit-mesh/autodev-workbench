import { injectable } from 'inversify';

import tsscm from '../../code-search/schemas/indexes/typescript.scm';
import { LanguageProfile, MemoizedQuery } from '../base/LanguageProfile';
import { ILanguageServiceProvider } from "../../base/common/languages/languageService";
import { LanguageIdentifier } from '../../base/common/languages/languages';

@injectable()
export class JavaScriptProfile implements LanguageProfile {
	languageIds = ['javascript', 'javascriptreact'];
	fileExtensions = ['js', 'jsx', 'mjs'];
	grammar = (langService: ILanguageServiceProvider, langId?: LanguageIdentifier) => {
		if (langId === 'javascriptreact') {
			return langService.getLanguage('javascriptreact');
		}

		return langService.getLanguage('javascript');
	};
	isTestFile = (filePath: string) => filePath.endsWith('.test.js') || filePath.endsWith('.spec.js');
	scopeQuery = new MemoizedQuery(tsscm);
	hoverableQuery = new MemoizedQuery(`
      [(identifier)
        (property_identifier)
        (shorthand_property_identifier)
        (shorthand_property_identifier_pattern)
        (statement_identifier)] @hoverable
    `);
	classQuery = new MemoizedQuery(`
      (class_declaration
        (identifier) @name.definition.class) @definition.class
    `);
	methodQuery = new MemoizedQuery(`
      (function_declaration
        (identifier) @name.definition.method) @definition.method

      (generator_function_declaration
        name: (identifier) @name.identifier.method
      ) @definition.method

      (export_statement
        declaration: (lexical_declaration
          (variable_declarator
            name: (identifier) @name.identifier.method
            value: (arrow_function)
          )
        ) @definition.method
      )

      (class_declaration
        name: (identifier)
        body: (class_body
          ((method_definition
            name: (property_identifier) @name.definition.method
          ) @definition.method)
        )
      )
    `);
	blockCommentQuery = new MemoizedQuery(`
		((comment) @comment
			(#match? @comment "^\\\\/\\\\*\\\\*")) @docComment
	`);
	symbolExtractor = new MemoizedQuery(`
(
  ((comment)* @comment)
	.
  [
    (class_declaration name: (_) @name body: (_) @body) @definition.class
  ]
)
(
  ((comment)* @comment)
  .
  [
    (method_definition name: (_) @name body: (_) @body) @definition.method
    (function_declaration name: (_) @name body: (_) @body) @definition.function
    (variable_declarator name: (identifier) @name)
  ]
)
`);
	structureQuery = new MemoizedQuery(`
    (import_statement
      (import_clause
        (named_imports
          (import_specifier
            name: (identifier)? @source-name
            alias: (identifier)? @as-name
          )
        )
      )
    )

    (import_statement
      (import_clause (identifier)?  @use-name)
      source: (string)? @import-source
    )

    (import_statement
      source: (_)? @import-source
    )

    (class_declaration
      name: (identifier) @class-name
      (class_heritage 
        (identifier) @extend-name
      )?
      body: (class_body
        (method_definition
          name: (property_identifier) @class-method-name
          parameters: (formal_parameters) @parameter
        )
      )?
    )
    
    (program (function_declaration
      name: (identifier) @function-name))
      
    (export_statement
      (function_declaration
        name: (identifier) @function-name
      )
    )
`);
	namespaces = [
		[
			//variables
			'constant',
			'variable',
			'property',
			'parameter',
			// functions
			'function',
			'method',
			'generator',
			// types
			'class',
			// devops.
			'label',
		],
	];
	autoSelectInsideParent = ['export_statement'];
	builtInTypes = [
		'Array',
		'String',
		'Number',
		'Boolean',
		'Object',
		'Symbol',
		'Function',
		'Promise',
		'undefined',
		'null',
	];
}
