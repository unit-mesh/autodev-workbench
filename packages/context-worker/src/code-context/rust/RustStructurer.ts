import { injectable } from 'inversify';
import Parser, { Language } from 'web-tree-sitter';

import { BaseStructurerProvider } from "../base/StructurerProvider";
import { CodeFile, CodeFunction, CodeStructure, CodeVariable, StructureType } from "../../codemodel/CodeElement";
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
		let currentStruct: CodeStructure | null = null;
		let currentTrait: CodeStructure | null = null;
		let currentFunction: CodeFunction | null = null;

		// 用于跟踪参数解析状态
		let paramCollection: { functionNode: Parser.SyntaxNode | null; params: CodeVariable[]; } | null = null;

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'use-path':
					// 处理导入语句
					codeFile.imports.push(text);
					break;

				case 'struct-name':
					// 创建新的结构体对象
					currentStruct = this.createEmptyClassStructure();
					currentStruct.name = text;
					currentStruct.type = StructureType.Class; // 使用Class类型表示Rust的struct
					currentStruct.fields = [];

					const structNode = capture.node.parent;
					if (structNode) {
						currentStruct.start = { row: structNode.startPosition.row, column: structNode.startPosition.column };
						currentStruct.end = { row: structNode.endPosition.row, column: structNode.endPosition.column };

						structMap.set(text, currentStruct);
						codeFile.classes.push(currentStruct);
					}
					break;

				case 'struct-field-name':
					// 添加字段到当前struct
					if (currentStruct) {
						const fieldNode = capture.node;
						const fieldType = fieldNode.nextNamedSibling?.text || '';

						currentStruct.fields!!.push(this.createVariable(fieldNode, text, fieldType));
					}
					break;

				case 'struct-field-type':
					// 如果field-type是单独捕获的，更新最后添加的字段的类型
					if (currentStruct && currentStruct.fields && currentStruct.fields.length > 0) {
						const lastField = currentStruct.fields[currentStruct.fields.length - 1];
						lastField.type = text;
					}
					break;

				case 'trait-name':
					// 创建新的trait对象
					currentTrait = this.createEmptyClassStructure();
					currentTrait.name = text;
					currentTrait.type = StructureType.Interface; // 使用Interface类型表示Rust的trait
					currentTrait.methods = [];

					const traitNode = capture.node.parent;
					if (traitNode) {
						currentTrait.start = { row: traitNode.startPosition.row, column: traitNode.startPosition.column };
						currentTrait.end = { row: traitNode.endPosition.row, column: traitNode.endPosition.column };

						traitMap.set(text, currentTrait);
						codeFile.classes.push(currentTrait);
					}
					break;

				case 'trait-method-name':
					// 将方法添加到当前trait
					if (currentTrait) {
						currentFunction = this.createFunction(capture.node, text);
						currentTrait.methods.push(currentFunction);

						// 开始收集方法参数
						paramCollection = {
							functionNode: capture.node.parent,
							params: []
						};
					}
					break;

				case 'impl-trait-name':
					// 开始处理实现块
					currentImpl = {
						structName: '',
						traitName: text
					};
					break;

				case 'impl-struct-name':
					// 设置实现块的结构体名称
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
							currentFunction = this.createFunction(capture.node, text);
							structObj.methods = structObj.methods || [];
							structObj.methods.push(currentFunction);

							// 开始收集方法参数
							paramCollection = {
								functionNode: capture.node.parent,
								params: []
							};
						}
					}
					break;

				case 'function-name':
					// 处理独立函数（不属于struct或trait）
					currentFunction = this.createFunction(capture.node, text);
					codeFile.functions.push(currentFunction);

					// 开始收集函数参数
					paramCollection = {
						functionNode: capture.node.parent,
						params: []
					};
					break;

				case 'function-params':
				case 'impl-method-params':
				case 'trait-method-params':
					// 解析参数列表
					if (paramCollection && capture.node) {
						this.parseParameters(capture.node, paramCollection.params);

						// 将参数添加到当前的函数/方法中
						if (currentFunction) {
							currentFunction.parameters = paramCollection.params;
						}
					}
					break;

				case 'function-return-type':
				case 'impl-method-return-type':
				case 'trait-method-return-type':
					// 设置返回类型
					if (currentFunction && text && text !== '()') {
						currentFunction.returnType = text;
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

		// 合并相同名称的结构体（如果有多次定义或实现）
		this.mergeStructures(codeFile);

		return Promise.resolve(codeFile);
	}

	// 解析参数节点并提取参数信息
	private parseParameters(paramsNode: Parser.SyntaxNode, result: CodeVariable[]): void {
		// 遍历所有parameter子节点
		for (let i = 0; i < paramsNode.namedChildCount; i++) {
			const paramNode = paramsNode.namedChild(i);

			if (paramNode && paramNode.type === 'parameter') {
				// 参数可能有pattern(名称)和type(类型)
				let paramName = '';
				let paramType = '';

				// 查找参数名称（pattern通常是identifier）
				const patternNode = paramNode.childForFieldName('pattern');
				if (patternNode) {
					paramName = patternNode.text;
				}

				// 查找参数类型
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
			} else if (paramNode && paramNode.type === 'self_parameter') {
				// 处理self参数
				result.push({
					name: 'self',
					type: 'Self',
					start: { row: paramNode.startPosition.row, column: paramNode.startPosition.column },
					end: { row: paramNode.endPosition.row, column: paramNode.endPosition.column }
				});
			}
		}
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

	// 合并相同名称的结构体和特征
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

				// 合并字段
				if (structure.fields && structure.fields.length > 0) {
					existing.fields = [...(existing.fields || []), ...structure.fields];
				}

				// 合并实现的trait
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
