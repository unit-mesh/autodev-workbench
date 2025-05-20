import { injectable } from 'inversify';
import Parser, { Language } from 'web-tree-sitter';

import { CProfile } from './CProfile';
import { BaseStructurerProvider } from "../base/StructurerProvider";
import { CodeFile, CodeStructure, StructureType } from "../../codemodel/CodeElement";
import { LanguageProfileUtil } from "../base/LanguageProfileUtil";

@injectable()
export class CStructurer extends BaseStructurerProvider {
	protected langId: string = 'c';
	protected config: CProfile = LanguageProfileUtil.from(this.langId)!!;
	protected parser: Parser | undefined;
	protected language: Language | undefined;

	isApplicable(lang: string) {
		return lang === 'c';
	}

	parseFile(code: string, filepath: string): Promise<CodeFile | undefined> {
		const tree = this.parser!!.parse(code);
		const query = this.config.structureQuery.query(this.language!!);
		const captures = query!!.captures(tree.rootNode);

		let filename = filepath.split('/')[filepath.split('/').length - 1];
		const codeFile: CodeFile = {
			name: filename,
			filepath: filepath,
			language: this.langId,
			functions: [],
			package: '',
			imports: [],
			classes: [],
		};

		let structObj: CodeStructure = this.createEmptyStructStructure();

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'include-path':
					codeFile.imports.push(text);
					break;
				case 'struct-name':
					structObj = this.createEmptyStructStructure();
					structObj.name = text;
					structObj.type = StructureType.Struct;
					const structNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (structNode) {
						structObj.start = { row: structNode.startPosition.row, column: structNode.startPosition.column };
						structObj.end = { row: structNode.endPosition.row, column: structNode.endPosition.column };

						codeFile.classes.push(structObj);
					}
					break;
				case 'typedef-name':
					// 找到最后一个结构体，如果存在，添加类型定义名称
					if (codeFile.classes.length > 0) {
						let lastClass = codeFile.classes[codeFile.classes.length - 1];
						lastClass.canonicalName = text;
					}
					break;
				case 'field-name':
					// 为结构体添加字段
					if (codeFile.classes.length > 0) {
						let lastClass = codeFile.classes[codeFile.classes.length - 1];
						lastClass.fields = lastClass.fields ?? [];
						lastClass.fields.push(this.createVariable(capture.node, text, ''));
					}
					break;
				case 'field-type':
					// 为最后添加的字段设置类型
					if (codeFile.classes.length > 0) {
						let lastClass = codeFile.classes[codeFile.classes.length - 1];
						if (lastClass.fields && lastClass.fields.length > 0) {
							const lastField = lastClass.fields[lastClass.fields.length - 1];
							lastField.type = text;
						}
					}
					break;
				case 'function-name':
					const functionNode = capture.node?.parent?.parent;
					if (functionNode) {
						const func = this.createFunction(functionNode, text);
						codeFile.functions.push(func);
					}
					break;
				case 'function-return-type':
					// 设置最后一个函数的返回类型
					if (codeFile.functions.length > 0) {
						const lastFunc = codeFile.functions[codeFile.functions.length - 1];
						lastFunc.returnType = text;
					}
					break;
				case 'macro-name':
					// 添加宏定义作为常量
					if (codeFile.classes.length > 0) {
						let lastClass = codeFile.classes[codeFile.classes.length - 1];
						lastClass.constant = lastClass.constant || [];
						lastClass.constant.push({ name: text, type: 'macro', start: { row: 0, column: 0 }, end: { row: 0, column: 0 } });
					} else {
						// 如果没有当前结构体，创建一个"全局"结构体来保存宏
						const globalStruct = this.createEmptyStructStructure();
						globalStruct.name = "_GlobalMacros";
						globalStruct.type = StructureType.Struct;
						globalStruct.constant = [{ name: text, type: 'macro', start: { row: 0, column: 0 }, end: { row: 0, column: 0 } }];
						codeFile.classes.push(globalStruct);
					}
					break;
				default:
					break;
			}
		}

		// 合并重复的结构体
		this.mergeStructures(codeFile);

		return Promise.resolve(codeFile);
	}

	// 创建空的结构体结构对象
	private createEmptyStructStructure(): CodeStructure {
		return {
			type: StructureType.Struct,
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

	// 合并重复的结构体
	private mergeStructures(codeFile: CodeFile): void {
		const uniqueStructs: CodeStructure[] = [];
		const structMap = new Map<string, CodeStructure>();

		for (const structObj of codeFile.classes) {
			const structName = structObj.name;

			if (structMap.has(structName)) {
				// 合并属性到现有结构体
				const existingStruct = structMap.get(structName)!;

				// 合并方法
				if (structObj.methods && structObj.methods.length > 0) {
					existingStruct.methods = [...(existingStruct.methods || []), ...structObj.methods];
				}

				// 合并字段
				if (structObj.fields && structObj.fields.length > 0) {
					existingStruct.fields = [...(existingStruct.fields || []), ...structObj.fields];
				}

				// 合并常量
				if (structObj.constant && structObj.constant.length > 0) {
					existingStruct.constant = [...(existingStruct.constant || []), ...structObj.constant];
				}
			} else {
				// 添加新结构体到映射表
				structMap.set(structName, structObj);
				uniqueStructs.push(structObj);
			}
		}

		// 更新代码文件中的结构体数组
		codeFile.classes = uniqueStructs;
	}
}
