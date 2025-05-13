import { injectable } from 'inversify';
import Parser, { Language } from 'web-tree-sitter';

import { BaseStructurerProvider } from "../base/StructurerProvider";
import { CodeFile, CodeStructure, StructureType } from "../../codemodel/CodeElement";
import { LanguageProfileUtil } from "../base/LanguageProfileUtil";
import { LanguageProfile } from "../base/LanguageProfile";

@injectable()
export class RustStructurer extends BaseStructurerProvider {
  protected langId: string = 'rust';
  protected config: LanguageProfile = LanguageProfileUtil.from(this.langId)!!;
  protected parser: Parser | undefined;
  protected language: Language | undefined;

  isApplicable(lang: string) {
    return lang === 'rust';
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
      path: '',
      package: '',
      imports: [],
      classes: [], // 在Rust中，这将包含struct、trait和impl
    };

    // 创建映射来跟踪trait和struct
    const structMap = new Map<string, CodeStructure>();
    const traitMap = new Map<string, CodeStructure>();
    const implMap = new Map<string, string[]>(); // <struct名, 实现的trait名数组>

    let currentImpl: { structName: string, traitName: string | null } | null = null;

    for (const element of captures) {
      const capture: Parser.QueryCapture = element!!;
      const text = capture.node.text;

      switch (capture.name) {
        case 'use-path':
          codeFile.imports.push(text);
          break;

        case 'struct-name':
          // 创建新的结构体对象
          const structObj = this.createEmptyClassStructure();
          structObj.name = text;
          structObj.type = StructureType.Class; // 使用Class类型表示Rust的struct
          const structNode = capture.node.parent;
          if (structNode) {
            structObj.start = { row: structNode.startPosition.row, column: structNode.startPosition.column };
            structObj.end = { row: structNode.endPosition.row, column: structNode.endPosition.column };

            structMap.set(text, structObj);
            codeFile.classes.push(structObj);
          }
          break;

        case 'trait-name':
          // 创建新的trait对象
          const traitObj = this.createEmptyClassStructure();
          traitObj.name = text;
          traitObj.type = StructureType.Interface; // 使用Interface类型表示Rust的trait
          const traitNode = capture.node.parent;
          if (traitNode) {
            traitObj.start = { row: traitNode.startPosition.row, column: traitNode.startPosition.column };
            traitObj.end = { row: traitNode.endPosition.row, column: traitNode.endPosition.column };

            traitMap.set(text, traitObj);
            codeFile.classes.push(traitObj);
          }
          break;

        case 'trait-method-name':
          // 将方法添加到当前trait
          if (traitMap.has(capture.node.parent?.parent?.parent?.childForFieldName('name')?.text || '')) {
            const traitName = capture.node.parent?.parent?.parent?.childForFieldName('name')?.text || '';
            const traitObj = traitMap.get(traitName);
            if (traitObj) {
              traitObj.methods.push(this.createFunction(capture.node, text));
            }
          }
          break;

        case 'impl-trait-name':
          currentImpl = {
            structName: '',
            traitName: text
          };
          break;

        case 'impl-struct-name':
          if (currentImpl) {
            currentImpl.structName = text;

            // 记录struct实现的trait
            if (currentImpl.traitName) {
              if (!implMap.has(text)) {
                implMap.set(text, []);
              }
              implMap.get(text)?.push(currentImpl.traitName);
            }
          }
          break;

        case 'impl-method-name':
          // 将方法添加到当前struct
          if (currentImpl && currentImpl.structName) {
            const structObj = structMap.get(currentImpl.structName);
            if (structObj) {
              structObj.methods.push(this.createFunction(capture.node, text));
            }
          }
          break;

        case 'struct-field-name':
          // 添加字段到当前struct
          const fieldName = text;
          const fieldType = capture.node.nextNamedSibling?.text || '';
          const structName = capture.node.parent?.parent?.parent?.childForFieldName('name')?.text || '';

          if (structMap.has(structName)) {
            const structObj = structMap.get(structName);
            if (structObj) {
              structObj.fields = structObj.fields || [];
              structObj.fields.push(this.createVariable(capture.node, fieldName, fieldType));
            }
          }
          break;

        default:
          break;
      }
    }

    // 更新struct的实现trait信息
    for (const [structName, traits] of implMap.entries()) {
      const structObj = structMap.get(structName);
      if (structObj) {
        structObj.implements = traits;
      }
    }

    return Promise.resolve(codeFile);
  }

  // 创建空的类结构对象
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
}
