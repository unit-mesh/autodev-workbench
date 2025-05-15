import { injectable } from 'inversify';
import Parser, { SyntaxNode } from 'web-tree-sitter';


import { TextRange } from '../../code-search/scope-graph/model/TextRange';
import { ScopeGraph } from '../../code-search/scope-graph/ScopeGraph';
import { CodeFile, CodeFunction, CodeStructure, CodeVariable, StructureType } from '../../codemodel/CodeElement';
import { LanguageProfile } from '../base/LanguageProfile';
import { BaseStructurerProvider } from '../base/StructurerProvider';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { LanguageProfileUtil } from "../base/LanguageProfileUtil";

@injectable()
export class JavaStructurerProvider extends BaseStructurerProvider {
	protected langId: LanguageIdentifier = 'java';
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
	 * The `parseFile` method is an asynchronous function that parses a given code string and generates a CodeFile object. This object represents the structure of the code.
	 *
	 * @param code - A string representing the code to be parsed.
	 * @param filepath - A string representing the path of the file.
	 *
	 * @returns A Promise that resolves to a CodeFile object. This object contains information about the structure of the parsed code, including the name, filepath, language, functions, path, package, imports, and classes. If the parsing fails, the Promise resolves to undefined.
	 *
	 * The method uses a parser to parse the code and a query to capture the structure of the code. It then iterates over the captures to extract information about the package, imports, classes, methods, and other elements of the code. This information is used to populate the CodeFile object.
	 *
	 * The method also handles nested classes and methods, ensuring that each class and method is correctly associated with its parent class or method.
	 *
	 * Note: This method assumes that the code string is written in a language that the parser can parse. If the parser cannot parse the code, the method may fail or return incorrect results.
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
			path: '',
			package: '',
			imports: [],
			classes: [],
		};
		let classObj: CodeStructure = {
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
		};
		let isLastNode = false;
		const methods: CodeFunction[] = [];
		let methodReturnType = '';
		let methodName = '';
		let methodModifiers = '';

		const fields: CodeVariable[] = [];
		let lastField: CodeVariable = this.initVariable();

		// 接口相关变量
		let interfaceObj: CodeStructure | null = null;
		let interfaceMethodReturnType = '';
		let interfaceMethodName = '';
		const interfaceMethods: CodeFunction[] = [];
		let lastInterfaceMethod: CodeFunction | null = null;

		// 类方法相关变量
		let classMethodReturnType = '';
		let classMethodName = '';
		let classMethodModifiers = '';

		// 类注解相关变量
		let currentClassAnnotation: { name: string; keyValues: { key: string; value: string }[] } | null = null;
		let classAnnotations: { name: string; keyValues: { key: string; value: string }[] }[] = [];

		// 方法注解相关变量
		let currentMethodAnnotation: { name: string; keyValues: { key: string; value: string }[] } | null = null;
		let methodAnnotations: { name: string; keyValues: { key: string; value: string }[] }[] = [];

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
				case 'class-name':
					if (classObj.name !== '') {
						codeFile.classes.push({ ...classObj });
						classObj = {
							type: StructureType.Class,
							canonicalName: '',
							package: codeFile.package,
							implements: [],
							constant: [],
							extends: [],
							methods: [],
							name: '',
							annotations: [],
							start: { row: 0, column: 0 },
							end: { row: 0, column: 0 },
							fields: [],
						};
						classAnnotations = []; // 重置类注解
					}

					classObj.name = text;
					classObj.canonicalName = codeFile.package + '.' + classObj.name;
					const classNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (classNode !== null) {
						this.insertLocation(classNode, classObj);
						if (!isLastNode) {
							isLastNode = true;
						}
					}
					// 设置之前收集的类注解
					classObj.annotations = classAnnotations;
					break;
				case 'class-annotation-name':
					// 创建新的注解对象
					currentClassAnnotation = {
						name: text,
						keyValues: []
					};
					classAnnotations.push(currentClassAnnotation);
					break;
				case 'class-annotation-key':
					if (currentClassAnnotation) {
						// 创建一个键值对，等待后续的值
						currentClassAnnotation.keyValues.push({
							key: text,
							value: ''
						});
					}
					break;
				case 'class-annotation-value':
					if (currentClassAnnotation && currentClassAnnotation.keyValues.length > 0) {
						// 更新最后一个键值对的值
						let lastKeyValue = currentClassAnnotation.keyValues[currentClassAnnotation.keyValues.length - 1];
						lastKeyValue.value = this.cleanStringLiteral(text);
					} else if (currentClassAnnotation) {
						// 如果没有键，只有值（单值注解）
						currentClassAnnotation.keyValues.push({
							key: "value",
							value: this.cleanStringLiteral(text)
						});
					}
					break;
				case 'method-annotation-name':
					// 创建新的方法注解对象
					currentMethodAnnotation = {
						name: text,
						keyValues: []
					};
					methodAnnotations.push(currentMethodAnnotation);
					break;
				case 'key':
					if (currentMethodAnnotation) {
						// 创建一个键值对，等待后续的值
						currentMethodAnnotation.keyValues.push({
							key: text,
							value: ''
						});
					}
					break;
				case 'value':
					if (currentMethodAnnotation && currentMethodAnnotation.keyValues.length > 0) {
						// 更新最后一个键值对的值
						let lastKeyValue = currentMethodAnnotation.keyValues[currentMethodAnnotation.keyValues.length - 1];
						lastKeyValue.value = this.cleanStringLiteral(text);
					} else if (currentMethodAnnotation) {
						// 如果没有键，只有值（单值注解）
						currentMethodAnnotation.keyValues.push({
							key: "value",
							value: this.cleanStringLiteral(text)
						});
					}
					break;
				case 'method-returnType':
					methodReturnType = text;
					break;
				case 'method-name':
					methodName = text;
					break;
				case 'method-modifiers':
					methodModifiers = text;
					break;
				case 'method-body':
					if (methodName !== '') {
						const methodNode = capture.node;
						const methodObj = this.createFunction(capture.node, methodName);
						if (methodReturnType !== '') {
							methodObj.returnType = methodReturnType;
						}
						if (methodModifiers !== '') {
							methodObj.modifiers = methodModifiers;
						}
						if (methodNode !== null) {
							this.insertLocation(methodNode, classObj);
						}
						// 设置方法注解
						methodObj.annotations = [...methodAnnotations];
						
						// 在添加方法到 methods 数组之前，检查是否已经存在相同的方法
						if (!methods.some(m => m.name === methodObj.name && m.start.row === methodObj.start.row && m.start.column === methodObj.start.column)) {
							methods.push(methodObj);
							methodAnnotations = [];
							currentMethodAnnotation = null;
						}
					}

					methodReturnType = '';
					methodName = '';
					methodModifiers = '';
					break;
				case 'field-type':
					lastField.type = text;
					break;
				case 'field-decl':
					lastField.name = text;
					fields.push({ ...lastField });
					lastField = this.initVariable();
					break;
				case 'interface-name':
					// 如果有上一个接口，先保存
					if (interfaceObj !== null) {
						interfaceObj.methods = interfaceMethods.slice();
						codeFile.classes.push({ ...interfaceObj });
						interfaceMethods.length = 0; // 清空方法数组
					}

					// 创建新接口对象
					interfaceObj = {
						type: StructureType.Interface,
						canonicalName: '',
						constant: [],
						extends: [],
						methods: [],
						name: text,
						package: codeFile.package,
						implements: [],
						annotations: [],
						start: { row: 0, column: 0 },
						end: { row: 0, column: 0 },
					};

					const interfaceNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (interfaceNode !== null) {
						this.insertLocation(interfaceNode, interfaceObj);
					}

					interfaceObj.canonicalName = codeFile.package + '.' + interfaceObj.name;
					break;
				case 'interface-method.returnType':
					interfaceMethodReturnType = text;
					break;
				case 'interface-method.name':
					interfaceMethodName = text;

					lastInterfaceMethod = this.createFunction(capture.node, interfaceMethodName);
					if (interfaceMethodReturnType !== '') {
						lastInterfaceMethod.returnType = interfaceMethodReturnType;
					}

					interfaceMethods.push(lastInterfaceMethod);
					interfaceMethodName = '';
					interfaceMethodReturnType = '';
					break;
				case 'interface-method.modifiers':
					if (lastInterfaceMethod) {
						lastInterfaceMethod.modifiers = text;
					}
					break;
				case 'interface-method.param.type':
					if (lastInterfaceMethod && !lastInterfaceMethod.parameters) {
						lastInterfaceMethod.parameters = [];
					}
					if (lastInterfaceMethod) {
						lastInterfaceMethod.parameters = lastInterfaceMethod.parameters || [];
						lastInterfaceMethod.parameters.push({
							type: text,
							name: ''
						});
					}
					break;
				case 'interface-method.param.value':
					if (lastInterfaceMethod && lastInterfaceMethod.parameters && lastInterfaceMethod.parameters.length > 0) {
						const lastParam = lastInterfaceMethod.parameters[lastInterfaceMethod.parameters.length - 1];
						lastParam.name = text;
					}
					break;
				case 'class-method.returnType':
					classMethodReturnType = text;
					break;
				case 'class-method.name':
					classMethodName = text;
					break;
				case 'class-method.modifiers':
					classMethodModifiers = text;
					break;
				case 'class-method.body':
					if (classMethodName !== '') {
						const methodObj = this.createFunction(capture.node, classMethodName);
						if (classMethodReturnType !== '') {
							methodObj.returnType = classMethodReturnType;
						}
						if (classMethodModifiers !== '') {
							methodObj.modifiers = classMethodModifiers;
						}
						// 设置方法注解
						methodObj.annotations = [...methodAnnotations];
						
						// 在添加方法到 methods 数组之前，检查是否已经存在相同的方法
						if (!methods.some(m => m.name === methodObj.name && m.start.row === methodObj.start.row && m.start.column === methodObj.start.column)) {
							methods.push(methodObj);
							methodAnnotations = [];
							currentMethodAnnotation = null;
						}
					}

					// 重置
					classMethodName = '';
					classMethodReturnType = '';
					classMethodModifiers = '';
					break;
				case 'impl-name':
					classObj.implements.push(text);
					break;
				default:
					break;
			}
		}

		// 处理最后一个接口
		if (interfaceObj !== null) {
			interfaceObj.methods = interfaceMethods.slice();
			codeFile.classes.push({ ...interfaceObj });
		}

		classObj.fields = fields;
		classObj.methods = methods;

		if (isLastNode && classObj.name !== '') {
			codeFile.classes.push({ ...classObj });
		}

		return this.combineSimilarClasses(codeFile);
	}

	/**
	 * `extractMethodIOImports` is an asynchronous method that extracts the import statements related to the input and output
	 * types of a given method from the source code.
	 *
	 * @param {ScopeGraph} graph - The node graph of the source code.
	 * @param {SyntaxNode} node - The syntax node representing the method in the source code.
	 * @param {TextRange} range - The range of the method in the source code.
	 * @param {string} src - The source code as a string.
	 *
	 * @returns {Promise<string[] | undefined>} A promise that resolves to an array of import statements or undefined if no import statements are found.
	 *
	 * The method works by first finding the syntax node that corresponds to the given range in the source code. It then uses a query to capture the return type and parameter types of the method. For each captured element, it fetches the corresponding import statements from the source code and adds them to an array. Finally, it removes any duplicate import statements from the array before returning it.
	 *
	 * The method uses the `fetchImportsWithinScope` method to fetch the import statements for a given syntax node from the source code.
	 *
	 * Note: The method assumes that the `methodIOQuery` and `language` properties of the `config` object are defined.
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

	async extractFields(node: SyntaxNode) {
		const query = this.config.fieldQuery!!.query(this.language!!);
		const captures = query!!.captures(node);

		const fields: CodeVariable[] = [];
		let fieldObj: CodeVariable = this.initVariable();

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'field-name':
					fieldObj.name = text;
					fields.push({ ...fieldObj });
					fieldObj = this.initVariable();
					break;
				case 'field-type':
					fieldObj.type = text;
					break;
				case 'field-declaration':
					break;
				default:
					break;
			}
		}

		return fields;
	}

	// 清理字符串字面量，移除引号
	private cleanStringLiteral(text: string): string {
		return text.replace(/^"(.*)"$/, '$1');
	}
}
