import { injectable } from 'inversify';

import kotlinscm from '../../code-search/schemas/indexes/kotlin.scm';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { LanguageProfile, MemoizedQuery } from '../base/LanguageProfile';

@injectable()
export class KotlinProfile implements LanguageProfile {
	languageIds = ['kotlin'];
	fileExtensions = ['kt'];
	grammar = (langService: ILanguageServiceProvider) => langService.getLanguage('kotlin');
	isTestFile = (filePath: string) => filePath.endsWith('Test.kt') && filePath.includes('src/test');
	scopeQuery = new MemoizedQuery(kotlinscm);
	hoverableQuery = new MemoizedQuery(`
      [(simple_identifier)
       (user_type (type_identifier))] @hoverable
    `);
	methodQuery = new MemoizedQuery(`
      (function_declaration
        (simple_identifier) @name.definition.method) @definition.method
    `);
	classQuery = new MemoizedQuery(`
      (class_declaration
        (user_type (type_identifier)) @name.definition.class) @definition.class
    `);
	blockCommentQuery = new MemoizedQuery(`
		((block_comment) @block_comment
			(#match? @block_comment "^\\\\/\\\\*\\\\*")) @docComment`);
	packageQuery = new MemoizedQuery(`
		(package_header
			(identifier) @package-name)
	`);
	structureQuery = new MemoizedQuery(`
			(package_header
			  (identifier) @package-name)

			(import_header
			  (identifier) @import-name)?

			(class_declaration
		    (type_identifier) @class-name
		    (delegation_specifier
		      (user_type
		        (type_identifier) @extend-name)
		    )?
        (primary_constructor
          (class_parameter
            (simple_identifier) @field-name
            (user_type (type_identifier)) @field-type
          )?
        )?
        (class_body
          (property_declaration
            (variable_declaration
              (simple_identifier) @field-name
              (user_type (type_identifier)) @field-type
            )
          )?
          (secondary_constructor
            (function_value_parameters
              (parameter
                (simple_identifier) @constructor-param-name
                (user_type (type_identifier)) @constructor-param-type
              )?
            )?
            (constructor_delegation_call)?
          )?
        )
		  )
  `);
	methodIOQuery = new MemoizedQuery(`
		(function_declaration
        type: (_) @method-returnType
        (simple_identifier) @method-name
        (function_value_parameters
          (parameter
            (simple_identifier) @method-param.value
            (user_type (type_identifier)) @method-param.type
          )?
          @method-params)
        (function_body) @method-body
      )`);

	fieldQuery = new MemoizedQuery(`
		(property_declaration
			(variable_declaration
				(simple_identifier) @field-name
				(user_type (type_identifier)) @field-type
			)
		) @field-declaration
	`);
	namespaces = [
		[
			// variables
			'local',
			// functions
			'method',
			// namespacing, modules
			'package',
			'module',
			// types
			'class',
			'enum',
			'enumConstant',
			'interface',
			'typealias',
			// devops.
			'label',
		],
	];
	autoSelectInsideParent = [];
	builtInTypes = [
		'Boolean',
		'Byte',
		'Char',
		'Short',
		'Int',
		'Long',
		'Float',
		'Double',
		'Unit',
		'String',
		'Array',
		'List',
		'Map',
		'Set',
		'Collection',
		'Iterable',
		'Iterator',
		'Sequence',
		'Any',
		'Nothing',
		'Unit',
		'Boolean',
		'Byte',
		'Char',
		'Short',
		'Int',
		'Long',
		'Float',
		'Double',
		'String',
		'Array',
		'List',
		'Map',
		'Set',
		'Collection',
		'Iterable',
		'Iterator',
		'Sequence',
	];
}
