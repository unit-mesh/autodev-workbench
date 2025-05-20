import Parser, { SyntaxNode } from 'web-tree-sitter';
import { injectable } from 'inversify';

import { TextRange } from '../../code-search/scope-graph/model/TextRange';
import { ScopeGraph } from '../../code-search/scope-graph/ScopeGraph';
import { BaseStructurerProvider } from "../base/StructurerProvider";
import { LanguageIdentifier } from "../../base/common/languages/languages";
import { LanguageProfile } from "../base/LanguageProfile";
import { CodeFile, CodeFunction, CodeStructure, CodeVariable, StructureType } from "../../codemodel/CodeElement";
import { LanguageProfileUtil } from "../base/LanguageProfileUtil";

@injectable()
export class GoStructurerProvider extends BaseStructurerProvider {
	protected langId: LanguageIdentifier = 'go';
	protected config: LanguageProfile = LanguageProfileUtil.from(this.langId)!!;
	protected parser: Parser | undefined;
	protected language: Parser.Language | undefined;

	constructor() {
		super();
	}

	isApplicable(lang: string) {
		return lang === this.langId;
	}

	/**
	 * 解析Go代码文件，构建代码结构
	 * @param code 源代码字符串
	 * @param filepath 文件路径
	 * @returns 解析后的代码文件结构
	 */
	async parseFile(code: string, filepath: string): Promise<CodeFile | undefined> {
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

		// 用于存储结构体信息
		let structObj: CodeStructure = this.initStructure();

		// 用于存储函数信息
		const functions: CodeFunction[] = [];

		// 用于存储字段信息
		const fields: CodeVariable[] = [];
		let lastField: CodeVariable = this.initVariable();

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'package-name':
					codeFile.package = text;
					break;
				case 'import-name':
					// 处理Go导入路径，移除引号
					const importPath = this.cleanStringLiteral(text);
					codeFile.imports.push(importPath);
					break;
				case 'type-name':
					// 如果已经有一个结构体，先保存
					if (structObj.name !== '') {
						codeFile.classes.push({ ...structObj });
						// 重置结构体对象
						structObj = this.initStructure();
					}

					structObj.name = text;
					structObj.canonicalName = codeFile.package + '.' + structObj.name;
					structObj.package = codeFile.package;
					structObj.type = StructureType.Class; // 在Go中，我们将struct映射为类

					const structNode: Parser.SyntaxNode | null = capture.node?.parent?.parent ?? null;
					if (structNode !== null) {
						this.insertLocation(structNode, structObj);
					}
					break;
				case 'field-name':
					lastField.name = text;
					break;
				case 'field-type':
					lastField.type = text;
					if (lastField.name !== '') {
						fields.push({ ...lastField });
						lastField = this.initVariable();
					}
					break;
				case 'function-name':
					const funcNode = capture.node.parent;
					if (funcNode) {
						const funcObj = this.createFunction(funcNode, text);
						functions.push(funcObj);

						// 同时添加到文件的函数列表中
						codeFile.functions.push(funcObj);
					}
					break;
				case 'method-name':
					const methodNode = capture.node.parent;
					if (methodNode) {
						// 获取接收者类型（结构体名称）
						const receiverStructName = methodNode.childForFieldName('receiver')?.text || '';
						const receiverType = this.extractReceiverType(receiverStructName);

						const methodObj = this.createFunction(methodNode, text);
						// 添加到结构体的方法列表中
						if (structObj.name === receiverType) {
							structObj.methods.push(methodObj);
						} else {
							// 如果方法的接收者是其他结构体，可能需要查找或创建该结构体
							let targetStruct = codeFile.classes.find(c => c.name === receiverType);
							if (!targetStruct) {
								// 创建新的结构体
								targetStruct = this.initStructure();
								targetStruct.name = receiverType;
								targetStruct.canonicalName = codeFile.package + '.' + receiverType;
								targetStruct.package = codeFile.package;
								targetStruct.type = StructureType.Class;

								codeFile.classes.push(targetStruct);
							}

							// 确保不会添加重复的方法
							if (!targetStruct.methods.some(m => m.name === methodObj.name)) {
								targetStruct.methods.push(methodObj);
							}
						}
					}
					break;
				default:
					break;
			}
		}

		// 添加字段到结构体
		structObj.fields = fields;

		// 如果有未保存的结构体，保存它
		if (structObj.name !== '') {
			codeFile.classes.push({ ...structObj });
		}

		return codeFile;
	}

	/**
	 * 提取Go方法接收者类型
	 * 例如从 "(r *Repository)" 中提取 "Repository"
	 */
	private extractReceiverType(receiverText: string): string {
		// 从接收者文本中提取类型
		const pointerMatch = receiverText.match(/\*([A-Za-z0-9_]+)/);
		if (pointerMatch) {
			return pointerMatch[1];
		}

		// 非指针类型
		const typeMatch = receiverText.match(/\b([A-Za-z0-9_]+)\b/);
		return typeMatch ? typeMatch[1] : '';
	}

	/**
	 * 从方法中提取输入输出相关的导入
	 */
	async retrieveMethodIOImports(
		graph: ScopeGraph,
		node: SyntaxNode,
		range: TextRange,
		src: string,
	): Promise<string[] | undefined> {
		let syntaxNode = node.namedDescendantForPosition(
			{ row: range.start.line, column: range.start.column },
			{ row: range.end.line, column: range.end.column },
		);

		const query = this.config.methodIOQuery!!.query(this.language!!);
		const captures = query!!.captures(syntaxNode);

		const inputAndOutput: string[] = [];

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;

			switch (capture.name) {
				case 'method-returnType':
					let imports = await this.fetchImportsWithinScope(graph, capture.node, src);
					inputAndOutput.push(...imports);
					break;
				case 'method-param.type':
					let typeImports = await this.fetchImportsWithinScope(graph, capture.node, src);
					inputAndOutput.push(...typeImports);
					break;
				default:
					break;
			}
		}

		// remove duplicates
		return [...new Set(inputAndOutput)];
	}

	/**
	 * 清理字符串字面量，移除引号
	 */
	private cleanStringLiteral(text: string): string {
		if ((text.startsWith('"') && text.endsWith('"')) ||
			(text.startsWith('`') && text.endsWith('`'))) {
			return text.substring(1, text.length - 1);
		}
		return text;
	}

	/**
	 * 初始化结构体对象
	 */
	private initStructure(): CodeStructure {
		return {
			type: StructureType.Class,
			canonicalName: '',
			constant: [],
			extends: [],
			methods: [],
			name: '',
			package: '',
			implements: [],
			annotations: [],
			start: { row: 0, column: 0 },
			end: { row: 0, column: 0 },
			fields: [],
		};
	}

	/**
	 * 提取结构体字段
	 */
	async extractFields(node: SyntaxNode) {
		const query = this.config.classQuery.query(this.language!!);
		const captures = query!!.captures(node);

		const fields: CodeVariable[] = [];
		let fieldObj: CodeVariable = this.initVariable();

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'field-name':
					fieldObj.name = text;
					break;
				case 'field-type':
					fieldObj.type = text;
					if (fieldObj.name !== '') {
						fields.push({ ...fieldObj });
						fieldObj = this.initVariable();
					}
					break;
				default:
					break;
			}
		}

		return fields;
	}
}
