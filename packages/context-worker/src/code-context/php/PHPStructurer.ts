import { injectable } from 'inversify';
import Parser, { Language } from 'web-tree-sitter';

import { BaseStructurerProvider } from "../base/StructurerProvider";
import { CodeFile, CodeFunction, CodeStructure, CodeVariable, StructureType } from "../../codemodel/CodeElement";
import { LanguageProfileUtil } from "../base/LanguageProfileUtil";
import { LanguageProfile } from "../base/LanguageProfile";

@injectable()
export class PHPStructurer extends BaseStructurerProvider {
  protected langId: string = 'php';
  protected config: LanguageProfile = LanguageProfileUtil.from(this.langId)!!;
  protected parser: Parser | undefined;
  protected language: Language | undefined;

  isApplicable(lang: string) {
    return lang === 'php';
  }

  parseFile(code: string, filepath: string): Promise<CodeFile | undefined> {
    const tree = this.parser!!.parse(code);
    const query = this.config.structureQuery.query(this.language!!);
    const captures = query!!.captures(tree.rootNode);

    const filename = filepath.split('/').pop() || '';
    const codeFile: CodeFile = {
      name: filename,
      filepath: filepath,
      language: this.langId,
      functions: [],
      package: '',
      imports: [],
      classes: [], // 在PHP中，这将包含class、interface和trait
    };

    // 创建映射来跟踪类和接口
    const classMap = new Map<string, CodeStructure>();
    const interfaceMap = new Map<string, CodeStructure>();
    const traitMap = new Map<string, CodeStructure>();

    let currentClass: CodeStructure | null = null;
    let currentInterface: CodeStructure | null = null;
    let currentTrait: CodeStructure | null = null;
    let currentFunction: CodeFunction | null = null;
    let currentNamespace: string = '';

    // 用于跟踪参数解析状态
    let paramCollection: { params: CodeVariable[]; } | null = null;

    // 跟踪已处理过的字段名，防止重复
    const processedFields = new Set<string>();

    for (const element of captures) {
      const capture: Parser.QueryCapture = element!!;
      const text = capture.node.text;

      switch (capture.name) {
        case 'use-path':
          // 处理导入语句
          codeFile.imports.push(text);
          break;

        case 'namespace-name':
          // 处理命名空间
          currentNamespace = text;
          codeFile.package = text;
          break;

        case 'class-name':
          // 创建新的类对象
          currentClass = this.createEmptyClassStructure();
          currentClass.name = text;
          currentClass.type = StructureType.Class;
          currentClass.package = currentNamespace;
          currentClass.fields = [];

          const classNode = capture.node.parent;
          if (classNode) {
            currentClass.start = { row: classNode.startPosition.row, column: classNode.startPosition.column };
            currentClass.end = { row: classNode.endPosition.row, column: classNode.endPosition.column };

            classMap.set(text, currentClass);
            codeFile.classes.push(currentClass);
          }

          // 重置处理过的字段集合
          processedFields.clear();
          break;

        case 'extends-name':
          // 处理类继承
          if (currentClass) {
            currentClass.extends = [text];
          }
          break;

        case 'implements-name':
          // 处理类实现接口
          if (currentClass) {
            if (!currentClass.implements) {
              currentClass.implements = [];
            }
            currentClass.implements.push(text);
          }
          break;

        case 'property-name':
          // 添加属性到当前类
          if (currentClass) {
            const propName = text.replace('$', ''); // 移除PHP变量前缀$

            // 检查是否已处理过该字段
            if (!processedFields.has(propName)) {
              processedFields.add(propName);

              const propVisibility = captures.find(c =>
                c.name === 'property-visibility' &&
                Math.abs(c.node.startPosition.row - capture.node.startPosition.row) < 2
              )?.node.text || 'public';

              currentClass.fields!!.push({
                name: propName,
                type: '',
                start: { row: capture.node.startPosition.row, column: capture.node.startPosition.column },
                end: { row: capture.node.endPosition.row, column: capture.node.endPosition.column }
              });
            }
          }
          break;

        case 'method-name':
          // 将方法添加到当前类
          if (currentClass) {
            const methodVisibility = captures.find(c =>
              c.name === 'method-visibility' &&
              Math.abs(c.node.startPosition.row - capture.node.startPosition.row) < 2
            )?.node.text || 'public';

            const isStatic = !!captures.find(c =>
              c.name === 'method-static' &&
              Math.abs(c.node.startPosition.row - capture.node.startPosition.row) < 2
            );

            currentFunction = this.createFunction(capture.node, text);
            currentClass.methods = currentClass.methods || [];
            currentClass.methods.push(currentFunction);

            // 开始收集方法参数
            paramCollection = { params: [] };
          }
          break;

        case 'method-params':
          // 解析参数列表
          if (paramCollection && capture.node) {
            this.parseParameters(capture.node, paramCollection.params);

            // 将参数添加到当前的函数/方法中
            if (currentFunction) {
              currentFunction.parameters = paramCollection.params;
              paramCollection = null;
            }
          }
          break;

        case 'method-return-type':
          // 设置返回类型
          if (currentFunction && text) {
            currentFunction.returnType = text;
          }
          break;

        case 'interface-name':
          // 创建新的接口对象
          currentInterface = this.createEmptyClassStructure();
          currentInterface.name = text;
          currentInterface.type = StructureType.Interface;
          currentInterface.package = currentNamespace;

          const interfaceNode = capture.node.parent;
          if (interfaceNode) {
            currentInterface.start = { row: interfaceNode.startPosition.row, column: interfaceNode.startPosition.column };
            currentInterface.end = { row: interfaceNode.endPosition.row, column: interfaceNode.endPosition.column };

            interfaceMap.set(text, currentInterface);
            codeFile.classes.push(currentInterface);
          }
          break;

        case 'trait-name':
          // 创建新的trait对象
          currentTrait = this.createEmptyClassStructure();
          currentTrait.name = text;
          currentTrait.type = StructureType.Trait;
          currentTrait.package = currentNamespace;

          const traitNode = capture.node.parent;
          if (traitNode) {
            currentTrait.start = { row: traitNode.startPosition.row, column: traitNode.startPosition.column };
            currentTrait.end = { row: traitNode.endPosition.row, column: traitNode.endPosition.column };

            traitMap.set(text, currentTrait);
            codeFile.classes.push(currentTrait);
          }
          break;

        case 'function-name':
          // 处理独立函数
          currentFunction = this.createFunction(capture.node, text);
          codeFile.functions.push(currentFunction);

          // 开始收集函数参数
          paramCollection = { params: [] };
          break;

        default:
          break;
      }
    }

    // 合并相同名称的结构
    this.mergeStructures(codeFile);

    return Promise.resolve(codeFile);
  }

  // 解析参数节点并提取参数信息
  private parseParameters(paramsNode: Parser.SyntaxNode, result: CodeVariable[]): void {
    for (let i = 0; i < paramsNode.namedChildCount; i++) {
      const paramNode = paramsNode.namedChild(i);

      if (paramNode && paramNode.type === 'simple_parameter') {
        let paramName = '';
        let paramType = '';

        // 查找参数名称
        for (let j = 0; j < paramNode.namedChildCount; j++) {
          const child = paramNode.namedChild(j);
          if (child && child.type === 'variable_name') {
            paramName = child.text.replace('$', ''); // 移除PHP变量前缀$
            break;
          }
        }

        // 查找参数类型（如果有）
        const typeNode = paramNode.childForFieldName('type');
        if (typeNode) {
          paramType = typeNode.text;
        }

        if (paramName) {
          result.push({
            name: paramName,
            type: paramType,
            start: { row: paramNode.startPosition.row, column: paramNode.startPosition.column },
            end: { row: paramNode.endPosition.row, column: paramNode.endPosition.column }
          });
        }
      }
    }
  }

  private createEmptyClassStructure(): CodeStructure {
    return {
      type: StructureType.Class,
      canonicalName: '',
      constant: [],
      extends: [],
      methods: [],
      name: '',
      package: '',
      implements: [],
      start: { row: 0, column: 0 },
      end: { row: 0, column: 0 },
    };
  }

  // 合并相同名称的结构
  private mergeStructures(codeFile: CodeFile): void {
    const uniqueClasses: CodeStructure[] = [];
    const classMap = new Map<string, CodeStructure>();

    for (const structure of codeFile.classes) {
      const name = structure.name;

      if (classMap.has(name)) {
        // 合并属性到现有结构
        const existing = classMap.get(name)!;

        // 合并方法
        if (structure.methods && structure.methods.length > 0) {
          existing.methods = [...(existing.methods || []), ...structure.methods];
        }

        // 合并字段，避免重复
        if (structure.fields && structure.fields.length > 0) {
          const existingFieldNames = new Set(existing.fields?.map(f => f.name) || []);

          const newFields = structure.fields.filter(field => !existingFieldNames.has(field.name));
          existing.fields = [...(existing.fields || []), ...newFields];
        }

        // 合并实现的接口
        if (structure.implements && structure.implements.length > 0) {
          existing.implements = [
            ...(existing.implements || []),
            ...structure.implements.filter(impl => !existing.implements?.includes(impl))
          ];
        }
      } else {
        // 添加新结构到映射表
        classMap.set(name, structure);
        uniqueClasses.push(structure);
      }
    }

    // 更新代码文件中的类数组
    codeFile.classes = uniqueClasses;
  }
}
