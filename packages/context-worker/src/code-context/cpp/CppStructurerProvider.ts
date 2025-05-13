import { injectable } from 'inversify';
import Parser from 'web-tree-sitter';

import { BaseStructurerProvider } from "../base/StructurerProvider";
import { CodeFile, CodeFunction, CodeStructure, CodeVariable, StructureType } from '../../codemodel/CodeElement';
import { LanguageProfile } from '../base/LanguageProfile';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { LanguageProfileUtil } from "../base/LanguageProfileUtil";

@injectable()
export class CppStructurerProvider extends BaseStructurerProvider {
	protected langId: LanguageIdentifier = 'cpp';
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
			path: '',
			package: '',
			imports: [],
			classes: [],
		};
		let classObj: CodeStructure = this.createEmptyStructure(StructureType.Class);
		let structObj: CodeStructure = this.createEmptyStructure(StructureType.Struct);

		let isLastNode = false;
		let isInStruct = false;
		let currentAccessSpecifier = "private"; // C++ 默认访问修饰符为 private
		const methods: CodeFunction[] = [];
		let methodReturnType = '';
		let methodName = '';

		const fields: CodeVariable[] = [];
		let lastField: CodeVariable = this.initVariable();

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'namespace-name':
					// C++ 命名空间处理
					codeFile.package = text;
					break;
				case 'include-path':
				case 'include-system-path':
					// 处理 C++ 的 #include 语句
					codeFile.imports.push(text);
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
					classObj.canonicalName = codeFile.package ? codeFile.package + '::' + classObj.name : classObj.name;
					isInStruct = false;
					currentAccessSpecifier = "private"; // 类的默认访问修饰符为 private

					const classNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (classNode !== null) {
						this.insertLocation(classNode, classObj);
						if (!isLastNode) {
							isLastNode = true;
						}
					}
					break;
				case 'struct-name':
					if (structObj.name !== '') {
						structObj.fields = fields.slice();
						structObj.methods = methods.slice();
						codeFile.classes.push({ ...structObj });

						// 重置字段和方法
						methods.length = 0;
						fields.length = 0;
					}

					structObj = this.createEmptyStructure(StructureType.Struct);
					structObj.name = text;
					structObj.canonicalName = codeFile.package ? codeFile.package + '::' + structObj.name : structObj.name;
					isInStruct = true;
					currentAccessSpecifier = "public"; // 结构体的默认访问修饰符为 public

					const structNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (structNode !== null) {
						this.insertLocation(structNode, structObj);
						if (!isLastNode) {
							isLastNode = true;
						}
					}
					break;
				case 'access-specifier':
					// 处理访问修饰符 (public, private, protected)
					currentAccessSpecifier = text.toLowerCase();
					break;
				case 'extend-name':
					if (isInStruct) {
						structObj.extends.push(text);
					} else {
						classObj.extends.push(text);
					}
					break;
				case 'method-name':
					methodName = text;
					break;
				case 'method-returnType':
					methodReturnType = text;
					break;
				case 'method-body':
					if (methodName !== '') {
						const methodObj = this.createFunction(capture.node, methodName);
						if (methodReturnType !== '') {
							methodObj.returnType = methodReturnType;
						}

						methods.push(methodObj);
					}

					methodReturnType = '';
					methodName = '';
					break;
				case 'field-name':
					lastField = this.initVariable();
					lastField.name = text;
					break;
				case 'field-type':
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

		// 处理最后一个类或结构体
		if (isInStruct && structObj.name !== '') {
			structObj.fields = fields;
			structObj.methods = methods;
			codeFile.classes.push({ ...structObj });
		} else if (!isInStruct && classObj.name !== '') {
			classObj.fields = fields;
			classObj.methods = methods;
			codeFile.classes.push({ ...classObj });
		}

		// 处理全局函数
		const functionQuery = this.config.methodQuery.query(this.language!!);
		const functionCaptures = functionQuery!!.captures(tree.rootNode);

		for (const element of functionCaptures) {
			const capture: Parser.QueryCapture = element!!;
			if (capture.name === 'name.definition.method' && capture.node.parent) {
				const funcNode = capture.node.parent.parent;
				if (funcNode) {
					const func = this.createFunction(funcNode, capture.node.text);
					// 检查函数是否已经属于类/结构体的方法
					const isClassMethod = codeFile.classes.some(cls =>
						cls.methods.some(method => method.name === func.name)
					);

					if (!isClassMethod) {
						codeFile.functions.push(func);
					}
				}
			}
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
			start: { row: 0, column: 0 },
			end: { row: 0, column: 0 },
		};
	}
}
