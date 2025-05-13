import { injectable } from 'inversify';

import cscm from '../../code-search/schemas/indexes/c.scm';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { LanguageProfile, MemoizedQuery } from '../base/LanguageProfile';
import { LanguageIdentifier } from '../../base/common/languages/languages';

@injectable()
export class CProfile implements LanguageProfile {
  languageIds = ['c'];
  fileExtensions = ['c', 'h'];
  grammar = (langService: ILanguageServiceProvider, langId?: LanguageIdentifier) => {
    return langService.getLanguage('c');
  };
  isTestFile = (filePath: string) => filePath.endsWith('_test.c') || filePath.endsWith('_spec.c') || filePath.includes('/test/');
  scopeQuery = new MemoizedQuery(cscm);
  hoverableQuery = new MemoizedQuery(`
    [(identifier)
     (field_identifier)
     (statement_identifier)
     (type_identifier)] @hoverable
  `);
  classQuery = new MemoizedQuery(`
    (struct_specifier
      name: (type_identifier) @name.definition.struct) @definition.struct
  `);
  methodQuery = new MemoizedQuery(`
    (function_definition
      declarator: (function_declarator
        declarator: (identifier) @name.definition.function)) @definition.function
  `);
  blockCommentQuery = new MemoizedQuery(`
    ((comment) @comment
      (#match? @comment "^\\/\\*")) @docComment
  `);
  structureQuery = new MemoizedQuery(`
    (preproc_include
      path: (_) @include-path)

    (struct_specifier
      name: (type_identifier) @struct-name
      body: (field_declaration_list
        (field_declaration
          type: (_)? @field-type
          declarator: (field_identifier) @field-name)?)
    )?

    (type_definition 
      type: (struct_specifier
        name: (type_identifier)? @struct-name
        body: (field_declaration_list
          (field_declaration
            type: (_)? @field-type
            declarator: (field_identifier) @field-name)?))
      declarator: (type_identifier) @typedef-name
    )?

    (function_definition
      type: (_) @function-return-type
      declarator: (function_declarator
        declarator: (identifier) @function-name
        parameters: (parameter_list
          (parameter_declaration
            type: (_)? @param-type
            declarator: (identifier)? @param-name)?)))

    (declaration
      type: (_) @var-type
      declarator: (init_declarator
        declarator: (identifier) @var-name))

    (preproc_def
      name: (identifier) @macro-name)
  `);
  namespaces = [
    [
      // variables
      'variable',
      'parameter',
      // functions
      'function',
      // types
      'struct',
      'enum',
      'typedef',
      'macro',
    ],
  ];
  autoSelectInsideParent = [];
  builtInTypes = [
    'void',
    'char',
    'short',
    'int',
    'long',
    'float',
    'double',
    'signed',
    'unsigned',
    'size_t',
    'bool',
  ];
}
