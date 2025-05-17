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
        (type_identifier) @name.definition.class) @definition.class
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
			  (identifier) @package-name)?

			(import_header
			  (identifier) @import-name)?

			(class_declaration
		    (modifiers
          (annotation
            (user_type
              (type_identifier) @class-annotation-name)
            (constructor_invocation
              (value_arguments
                (value_argument
                  (string_literal) @class-annotation-value)?
              )?
            )?
          )?
        )?
		    (type_identifier) @class-name
		    (delegation_specifier
		      (user_type
		        (type_identifier)) @extend-name)?
		    )?
        (primary_constructor
          (class_parameter
            (simple_identifier) @field-name
            (user_type (type_identifier)) @field-type
          )?
        )?
        (class_body
          (property_declaration
            (modifiers
              (member_modifier)?)? 
            (binding_pattern_kind)?
            (variable_declaration
              (simple_identifier) @field-name
              (user_type (type_identifier)) @field-type
            )
          )?
          (function_declaration
            (modifiers
              (member_modifier)?
              (annotation
                (user_type
                  (type_identifier) @method-annotation-name)?
                (constructor_invocation
                  (user_type
                    (type_identifier) @method-annotation-name)
                  (value_arguments
                    (value_argument
                      (string_literal) @method-annotation-value)?
                  )?
                )?
              )?
            )? 
            (simple_identifier) @method-name
            (function_value_parameters
              (parameter_modifiers
                (annotation
                  (user_type
                    (type_identifier) @param-annotation-name)
                )?
              )?
              (parameter
                (simple_identifier) @method-param-name
                (user_type (type_identifier)) @method-param-type
              )?
            )?
            (user_type (type_identifier))? @method-returnType
            (function_body)? @method-body
          )?
        )?
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
			(modifiers (member_modifier))?
			(binding_pattern_kind)?
			(variable_declaration
				(simple_identifier) @field-name
				(user_type (type_identifier)) @field-type
			)
			(integer_literal | string_literal | boolean_literal)? @field-value
		) @field-declaration
	`);

	interfaceQuery = new MemoizedQuery(`
		(class_declaration
			(type_identifier) @interface-name
			(class_body
				(property_declaration
					(binding_pattern_kind)?
					(variable_declaration
						(simple_identifier) @interface-property-name
						(user_type (type_identifier)) @interface-property-type
					)
				)?
				(function_declaration
					(simple_identifier) @interface-method-name
					(function_value_parameters)?
					(function_body)? @interface-method-body
				)?
			)
		)
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
