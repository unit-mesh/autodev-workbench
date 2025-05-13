import { injectable } from 'inversify';

import cppscm from '../../code-search/schemas/indexes/cpp.scm';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { LanguageProfile, MemoizedQuery } from '../base/LanguageProfile';
import { LanguageIdentifier } from '../../base/common/languages/languages';

@injectable()
export class CppProfile implements LanguageProfile {
  languageIds = ['cpp'];
  fileExtensions = ['cpp', 'hpp', 'c', 'h', 'cc', 'cxx', 'hxx'];
  grammar = (langService: ILanguageServiceProvider, langId?: LanguageIdentifier) => {
    return langService.getLanguage('cpp');
  };
  isTestFile = (filePath: string) => filePath.endsWith('_test.cpp') || filePath.endsWith('_spec.cpp') || filePath.includes('/test/');
  scopeQuery = new MemoizedQuery(cppscm);

  hoverableQuery = new MemoizedQuery(`
    [(identifier) 
     (type_identifier)] @hoverable
  `);

  methodQuery = new MemoizedQuery(`
    (function_definition
      declarator: (function_declarator
        declarator: (identifier) @name.definition.method)) @definition.method
  `);

  classQuery = new MemoizedQuery(`
    (class_specifier
      name: (type_identifier) @name.definition.class) @definition.class
  `);

  blockCommentQuery = new MemoizedQuery(`
    ((comment) @block_comment
      (#match? @block_comment "^\\/\\*\\*")) @docComment
  `);

  includeQuery = new MemoizedQuery(`
    (preproc_include
      path: (system_lib_string) @include-system-path)
    
    (preproc_include
      path: (string_literal) @include-path)
  `);

  namespaceQuery = new MemoizedQuery(`
    (namespace_definition
      name: (identifier) @namespace-name
      body: (declaration_list)? @namespace-body)
  `);

  structureQuery = new MemoizedQuery(`
    (preproc_include
      path: [(system_lib_string) (string_literal)] @include-path)?
    
    (namespace_definition
      name: (identifier) @namespace-name)?
    
    (class_specifier
      name: (type_identifier) @class-name
      body: (field_declaration_list
        (access_specifier)? @access-specifier
        (field_declaration
          type: (_) @field-type
          declarator: (field_identifier) @field-name)?
        (function_definition
          type: (_) @method-returnType
          declarator: (function_declarator
            declarator: (field_identifier) @method-name)
          body: (compound_statement)? @method-body)?
      )?
      (base_class_clause
        (type_identifier) @extend-name)?
    )?

    (struct_specifier
      name: (type_identifier) @struct-name
      body: (field_declaration_list
        (field_declaration
          type: (_) @field-type
          declarator: (field_identifier) @field-name)?
        (function_definition
          type: (_) @method-returnType
          declarator: (function_declarator
            declarator: (field_identifier) @method-name)
          body: (compound_statement)? @method-body)?
      )?
      (base_class_clause
        (type_identifier) @extend-name)?
    )?
  `);

  methodIOQuery = new MemoizedQuery(`
    (function_definition
      type: (_) @method-returnType
      declarator: (function_declarator
        declarator: [(identifier) (field_identifier)] @method-name
        parameters: (parameter_list
          (parameter_declaration
            type: (_) @method-param.type
            declarator: (identifier) @method-param.value)?
        ) @method-params)
      body: (compound_statement) @method-body
    )
  `);

  fieldQuery = new MemoizedQuery(`
    (field_declaration
      type: (_) @field-type
      declarator: (field_identifier) @field-name
      default_value: (_)? @field-value
    ) @field-declaration
  `);

  namespaces = [
    [
      // variables
      'local',
      // functions
      'method',
      'function',
      // namespacing
      'namespace',
      // types
      'class',
      'struct',
      'enum',
      'union',
      'interface',
      'typedef',
      // others
      'macro',
      'label',
    ],
  ];

  autoSelectInsideParent = [];

  builtInTypes = [
    'void', 'bool', 'char', 'int', 'short', 'long', 'float', 'double',
    'size_t', 'wchar_t', 'ptrdiff_t', 'nullptr_t', 'int8_t', 'int16_t',
    'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
    'intptr_t', 'uintptr_t', 'string', 'vector', 'map', 'set', 'list',
    'queue', 'stack', 'deque', 'array', 'bitset', 'pair', 'tuple',
    'shared_ptr', 'unique_ptr', 'weak_ptr', 'auto'
  ];
}
