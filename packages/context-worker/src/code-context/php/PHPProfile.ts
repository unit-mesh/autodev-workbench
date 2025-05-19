import { injectable } from 'inversify';

import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { LanguageProfile, MemoizedQuery } from '../base/LanguageProfile';

@injectable()
export class PHPProfile implements LanguageProfile {
  languageIds = ['php'];
  fileExtensions = ['php'];
  grammar = (langService: ILanguageServiceProvider) => langService.getLanguage('php');
  isTestFile = (filePath: string) => filePath.includes('test') || filePath.includes('Test.php');
  scopeQuery = new MemoizedQuery(`
    (program) @scope
  `);
  hoverableQuery = new MemoizedQuery(`
    [(identifier)
     (variable_name)
     (name)] @hoverable
  `);
  classQuery = new MemoizedQuery(`
    (class_declaration (name) @type_identifier) @type_declaration
  `);
  methodQuery = new MemoizedQuery(`
    (method_declaration name: (name) @name.definition.method) @definition.method
  `);
  blockCommentQuery = new MemoizedQuery(`
    (comment) @docComment
  `);
  methodIOQuery = new MemoizedQuery(`
    (method_declaration
      name: (name) @function.identifier
      return_type: (_)? @method-returnType
    ) @function
  `);
  structureQuery = new MemoizedQuery(`
    (program
      (php_tag)?

      ; 类定义
      (class_declaration
        name: (name) @class-name
        (base_clause
          (qualified_name) @extends-name
        )?
        (class_interface_clause
          (qualified_name) @implements-name
        )?
        body: (declaration_list
          ; 属性
          (property_declaration
            (visibility_modifier)? @property-visibility
            (property_element
              (variable_name) @property-name
              ((_) @property-default-value)?
            )
          )?
          
          ; 方法
          (method_declaration
            (visibility_modifier)? @method-visibility
            (static_modifier)? @method-static
            name: (name) @method-name
            parameters: (formal_parameters) @method-params
            body: (compound_statement) @method-body
          )?
        )?
      )?
      
      ; 接口定义
      (interface_declaration
        name: (name) @interface-name
        (base_clause
          (qualified_name) @interface-extends
        )?
        body: (declaration_list)?
      )?
      
      ; 特征(trait)定义
      (trait_declaration
        name: (name) @trait-name
        body: (declaration_list)?
      )?
      
      ; 函数定义
      (function_definition
        name: (name) @function-name
        parameters: (formal_parameters) @function-params
        body: (compound_statement)
      )?
    )?
    
    ; 参数
    (formal_parameters
      (simple_parameter
        name: (variable_name) @param-name
        ((_) @param-default-value)?
      )?
    )?
  `);
  namespaces = [[
    // 变量
    "variable",
    "function",
    "const",
    // 类型
    "class",
    "interface",
    "trait",
    "enum",
    // 字段
    "property",
    "method",
    // 命名空间
    "namespace"
  ]];
  autoSelectInsideParent = [];
  builtInTypes = [
    // 标量类型
    "int",
    "float",
    "bool",
    "string",
    "array",
    "object",
    "callable",
    "iterable",
    "void",
    "null",
    "mixed",
    "resource",

    // 常用类库
    "stdClass",
    "Exception",
    "DateTime",
    "DateTimeInterface",
    "DateInterval",
    "ArrayAccess",
    "Countable",
    "Iterator",
    "IteratorAggregate",
    "Traversable",
    "Serializable",
    "Closure",
    "Generator",
  ];
  symbolExtractor = new MemoizedQuery(`
(
  [(comment) @comment]
  . (class_declaration 
      name: (name) @name 
      body: (declaration_list) @body) @definition.class
)
(
  [(comment) @comment]
  . (method_declaration 
      name: (name) @name 
      body: (compound_statement) @body) @definition.method
)
(
  [(comment) @comment]
  . (property_declaration 
      (property_element (variable_name) @name)) @definition.field
)
(
  [(comment) @comment]
  . (interface_declaration 
      name: (name) @name 
      body: (declaration_list) @body) @definition.interface
)
(
  [(comment) @comment]
  . (trait_declaration 
      name: (name) @name 
      body: (declaration_list) @body) @definition.trait
)
(
  [(comment) @comment]
  . (function_definition 
      name: (name) @name 
      body: (compound_statement) @body) @definition.function
)
(
  [(comment) @comment]
  . (const_declaration 
      (const_element (name) @name)) @definition.constant
)
`);
}
