import { injectable } from 'inversify';
import Parser from 'web-tree-sitter';

import { BaseStructurerProvider } from "../base/StructurerProvider";
import { CodeFile, CodeFunction, CodeStructure, CodeVariable, StructureType } from '../../codemodel/CodeElement';
import { LanguageProfile } from '../base/LanguageProfile';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { LanguageProfileUtil } from "../base/LanguageProfileUtil";

@injectable()
export class KotlinStructurerProvider extends BaseStructurerProvider {
	protected langId: LanguageIdentifier = 'kotlin';
	protected config: LanguageProfile = LanguageProfileUtil.from(this.langId)!!;
	protected parser: Parser | undefined;
	protected language: Parser.Language | undefined;

	constructor() {
		super();
	}

	isApplicable(lang: string) {
		return lang === this.langId;
	}

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
		let classObj: CodeStructure = this.createEmptyStructure(StructureType.Class);
		let interfaceObj: CodeStructure = this.createEmptyStructure(StructureType.Interface);

		let isLastNode = false;
		let isInInterface = false;
		const methods: CodeFunction[] = [];
		let methodReturnType = '';
		let methodName = '';

		const fields: CodeVariable[] = [];
		let lastField: CodeVariable = this.initVariable();

		// 类注解相关变量
		let currentClassAnnotation: { name: string; keyValues: { key: string; value: string }[] } | null = null;
		let classAnnotations: { name: string; keyValues: { key: string; value: string }[] }[] = [];

		// 方法注解相关变量
		let currentMethodAnnotation: { name: string; keyValues: { key: string; value: string }[] } | null = null;
		let methodAnnotations: { name: string; keyValues: { key: string; value: string }[] }[] = [];

		// 参数注解相关变量
		let currentParamAnnotation: { name: string; keyValues: { key: string; value: string }[] } | null = null;
		let paramAnnotations: { name: string; keyValues: { key: string; value: string }[] }[] = [];

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'package-name':
					codeFile.package = text;
					break;
				case 'import-name':
					codeFile.imports.push(text);
					break;
				case 'class-annotation-name':
					const existingAnnotationIndex = classAnnotations.findIndex(a => a.name === text);
					if (existingAnnotationIndex !== -1) {
						currentClassAnnotation = classAnnotations[existingAnnotationIndex];
					} else {
						currentClassAnnotation = {
							name: text,
							keyValues: []
						};
						classAnnotations.push(currentClassAnnotation);
					}
					break;
				case 'class-annotation-value':
					if (currentClassAnnotation) {
						// 添加默认的值键值对
						currentClassAnnotation.keyValues.push({
							key: 'value',
							value: this.cleanStringLiteral(text)
						});
					}
					break;
				case 'class-name':
					if (classObj.name !== '') {
						classObj.fields = fields.slice();
						classObj.methods = methods.slice();
						codeFile.classes.push({ ...classObj });

						// 重置字段和方法
						methods.length = 0;
						fields.length = 0;
					}

					classObj = this.createEmptyStructure(StructureType.Class);
					classObj.name = text;
					classObj.canonicalName = codeFile.package ? codeFile.package + '.' + classObj.name : classObj.name;
					classObj.package = codeFile.package;
					isInInterface = false;

					const classNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (classNode !== null) {
						this.insertLocation(classNode, classObj);
						if (!isLastNode) {
							isLastNode = true;
						}
						// 设置类注解
						classObj.annotations = [...classAnnotations];
					}
					break;
				case 'method-annotation-name':
					const existingMethodAnnotationIndex = methodAnnotations.findIndex(a => a.name === text);
					if (existingMethodAnnotationIndex !== -1) {
						currentMethodAnnotation = methodAnnotations[existingMethodAnnotationIndex];
					} else {
						currentMethodAnnotation = {
							name: text,
							keyValues: []
						};
						methodAnnotations.push(currentMethodAnnotation);
					}
					break;
				case 'method-annotation-value':
					if (currentMethodAnnotation) {
						// 添加默认的值键值对
						// 检查是否已经有相同的值，避免重复添加
						if (!currentMethodAnnotation.keyValues.some(kv =>
							kv.key === 'value' && kv.value === this.cleanStringLiteral(text))) {
							currentMethodAnnotation.keyValues.push({
								key: 'value',
								value: this.cleanStringLiteral(text)
							});
						}
					}
					break;
				case 'param-annotation-name':
					const existingParamAnnotationIndex = paramAnnotations.findIndex(a => a.name === text);
					if (existingParamAnnotationIndex !== -1) {
						currentParamAnnotation = paramAnnotations[existingParamAnnotationIndex];
					} else {
						currentParamAnnotation = {
							name: text,
							keyValues: []
						};
						paramAnnotations.push(currentParamAnnotation);
					}
					break;
				case 'interface-name':
					if (interfaceObj.name !== '') {
						interfaceObj.fields = fields.slice();
						interfaceObj.methods = methods.slice();
						codeFile.classes.push({ ...interfaceObj });

						// 重置字段和方法
						methods.length = 0;
						fields.length = 0;
					}

					interfaceObj = this.createEmptyStructure(StructureType.Interface);
					interfaceObj.name = text;
					interfaceObj.canonicalName = codeFile.package ? codeFile.package + '.' + interfaceObj.name : interfaceObj.name;
					isInInterface = true;

					const interfaceNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (interfaceNode !== null) {
						this.insertLocation(interfaceNode, interfaceObj);
						if (!isLastNode) {
							isLastNode = true;
						}
					}
					break;
				case 'extend-name':
					if (isInInterface) {
						interfaceObj.extends.push(text);
					} else {
						classObj.extends.push(text);
					}
					break;
				case 'implements-name':
					classObj.implements.push(text);
					break;
				case 'method-returnType':
					methodReturnType = text;
					break;
				case 'method-name':
				case 'interface-method-name':
					methodName = text;
					break;
				case 'method-body':
				case 'interface-method-body':
					if (methodName !== '') {
						const methodNode = capture.node;
						const methodObj = this.createFunction(capture.node, methodName);
						if (methodReturnType !== '') {
							methodObj.returnType = methodReturnType;
						}

						// 设置方法注解
						methodObj.annotations = methodAnnotations.length > 0 ? [...methodAnnotations] : [];

						methods.push(methodObj);

						// 重置方法注解
						methodAnnotations = [];
						currentMethodAnnotation = null;
					}

					methodReturnType = '';
					methodName = '';
					break;
				case 'method-param-name':
					// 参数注解处理可以在这里添加
					break;
				case 'method-param-type':
					// 可以在这里添加参数类型处理
					break;
				case 'field-name':
				case 'interface-property-name':
					lastField = this.initVariable();
					lastField.name = text;
					break;
				case 'field-type':
				case 'interface-property-type':
					if (lastField.name) {
						lastField.type = text;
						fields.push({ ...lastField });
						lastField = this.initVariable();
					}
					break;
				default:
					break;
			}
		}

		// 处理最后一个类或接口
		if (isInInterface && interfaceObj.name !== '') {
			interfaceObj.fields = fields;
			interfaceObj.methods = methods;
			codeFile.classes.push({ ...interfaceObj });
		} else if (!isInInterface && classObj.name !== '') {
			classObj.fields = fields;
			classObj.methods = methods;
			codeFile.classes.push({ ...classObj });
		}

		return this.combineSimilarClasses(codeFile);
	}

	// 创建空的结构对象
	private createEmptyStructure(type: StructureType): CodeStructure {
		return {
			type: type,
			canonicalName: '',
			constant: [],
			extends: [],
			methods: [],
			name: '',
			package: '',
			implements: [],
			annotations: [], // 确保包含注解字段
			start: { row: 0, column: 0 },
			end: { row: 0, column: 0 },
		};
	}

	// 清理字符串字面量，移除引号
	private cleanStringLiteral(text: string): string {
		if (text.startsWith('"') && text.endsWith('"')) {
			return text.substring(1, text.length - 1);
		}
		return text;
	}
}
