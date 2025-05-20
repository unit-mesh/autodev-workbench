import { injectable } from 'inversify';

import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { LanguageProfile, MemoizedQuery } from '../base/LanguageProfile';

@injectable()
export class PythonProfile implements LanguageProfile {
	languageIds = ['python'];
	fileExtensions = ['py'];
	grammar = (langService: ILanguageServiceProvider) => langService.getLanguage('python');
	isTestFile = (filePath: string) => filePath.endsWith('_test.py');
	hoverableQuery = new MemoizedQuery(`
     (identifier) @hoverable
  `);
	classQuery = new MemoizedQuery(`
	    (class_definition
				(identifier) @type_identifier) @type_declaration
    `);
	methodQuery = new MemoizedQuery(`
      (function_definition
				name: (identifier)@name.definition.method
			) @definition.method
    `);
	blockCommentQuery = new MemoizedQuery(`
		(expression_statement
			(string) @docComment)
	`);
	methodIOQuery = new MemoizedQuery(`
		(function_definition
				name: (identifier) @function.identifier
		) @function
	`);
	structureQuery = new MemoizedQuery(`
		(import_statement
			name: (dotted_name)? @import-name
			module_name: (dotted_name)? @module-name
		)
		
		(class_definition
			name: (identifier) @class-name
			superclasses: (argument_list
				(identifier)? @superclass-name
			)?
			body: (block
				(function_definition
					name: (identifier) @class-method-name
				)?
				(expression_statement
					(assignment
						left: (identifier) @class-attribute-name
					)
				)?
			)
		)
		
		; 明确指定模块级别的顶层函数
		(module 
			(function_definition
				name: (identifier) @toplevel-function-name
			)
		)
	`);
	symbolExtractor = new MemoizedQuery(`
(
  (class_definition
    name: (identifier) @name
    body: (block
      (expression_statement
        (string) @comment
      )?
    ) @body
  ) @definition.class
)

(
  (module
    (function_definition
      name: (identifier) @name
      body: (block
        .
        (expression_statement
          (string) @comment
        )?
        .
        (_)* @body
      )
    ) @definition.function
  )
)

(
  (class_definition
    name: (identifier) @class_name
    body: (block
      (function_definition
        name: (identifier) @name
        body: (block
          (expression_statement
            (string) @comment
          )?
        ) (_)* @body
      ) @definition.method
    )
  )
)
(
  (module
    (expression_statement
      (string) @comment
    )?
  )
)
`);
	namespaces = [['class', 'function', 'parameter', 'variable']];
	autoSelectInsideParent = [];
	builtInTypes = [
		'int',
		'float',
		'str',
		'bool',
		'list',
		'dict',
		'tuple',
		'set',
		'complex',
		'bytes',
		'bytearray',
		'memoryview',
		'range',
		'frozenset',
		'type',
		'None',
		'NotImplemented',
		'Ellipsis',
		'object',
	];
}
