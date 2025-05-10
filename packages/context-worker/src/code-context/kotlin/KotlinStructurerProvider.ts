import { injectable } from 'inversify';
import Parser, { SyntaxNode } from 'web-tree-sitter';

import { BaseStructurerProvider } from "../base/StructurerProvider";
import { TextRange } from '../../code-search/scope-graph/model/TextRange';
import { ScopeGraph } from '../../code-search/scope-graph/ScopeGraph';
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
			start: { row: 0, column: 0 },
			end: { row: 0, column: 0 },
		};
		let isLastNode = false;
		const methods: CodeFunction[] = [];
		let methodReturnType = '';
		let methodName = '';

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
							start: { row: 0, column: 0 },
							end: { row: 0, column: 0 },
						};
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
					break;
				case 'extend-name':
					classObj.extends.push(text);
					break;
				case 'implements-name':
					classObj.implements.push(text);
					break;
				case 'method-returnType':
					methodReturnType = text;
					break;
				case 'method-name':
					methodName = text;
					break;
				case 'method-body':
					if (methodName !== '') {
						const methodNode = capture.node;
						const methodObj = this.createFunction(capture.node, methodName);
						if (methodReturnType !== '') {
							methodObj.returnType = methodReturnType;
						}
						if (methodNode !== null) {
							this.insertLocation(methodNode, classObj);
						}

						methods.push(methodObj);
					}

					methodReturnType = '';
					methodName = '';
					break;
				case 'field-type':
					lastField.type = text;
					break;
				case 'field-name':
					lastField.name = text;
					fields.push({ ...lastField });
					lastField = this.initVariable();
					break;
				case 'constructor-param-name':
					// 处理构造函数参数，可以选择添加到字段中
					const paramName = text;
					const constructorParam = this.initVariable();
					constructorParam.name = paramName;
					// 暂存参数，等待类型信息
					lastField = constructorParam;
					break;
				case 'constructor-param-type':
					// 如果之前处理了构造函数参数名，则设置其类型
					if (lastField.name && !lastField.type) {
						lastField.type = text;
						fields.push({ ...lastField });
						lastField = this.initVariable();
					}
					break;
				default:
					break;
			}
		}

		classObj.fields = fields;
		classObj.methods = methods;

		if (isLastNode && classObj.name !== '') {
			codeFile.classes.push({ ...classObj });
		}

		return this.combineSimilarClasses(codeFile);
	}
}
