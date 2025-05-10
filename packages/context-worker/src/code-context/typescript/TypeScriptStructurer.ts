import { injectable } from 'inversify';
import Parser, { Language } from 'web-tree-sitter';

import { TypeScriptProfile } from './TypeScriptProfile';
import { BaseStructurerProvider } from "../base/StructurerProvider";
import { CodeFile, CodeStructure, StructureType } from "../../codemodel/CodeElement";
import { LanguageProfileUtil } from "../base/LanguageProfileUtil";

@injectable()
export class TypeScriptStructurer extends BaseStructurerProvider {
	protected langId: string = 'typescript';
	protected config: TypeScriptProfile = LanguageProfileUtil.from(this.langId)!!;
	protected parser: Parser | undefined;
	protected language: Language | undefined;

	isApplicable(lang: string) {
		return lang === 'typescript' || lang === 'javascript' || lang === 'typescriptreact' || lang === 'javascriptreact';
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
			path: '',
			package: '',
			imports: [],
			classes: [],
		};

		let classObj: CodeStructure = this.createEmptyClassStructure();

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'import-source':
					codeFile.imports.push(text);
					break;
				case 'class-name':
					// 创建新的类对象
					classObj = this.createEmptyClassStructure();
					classObj.name = text;
					classObj.type = StructureType.Class;
					const classNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (classNode) {
						classObj.start = { row: classNode.startPosition.row, column: classNode.startPosition.column };
						classObj.end = { row: classNode.endPosition.row, column: classNode.endPosition.column };

						codeFile.classes.push(classObj);
					}
					break;
				case 'extend-name':
					// 将扩展的类名添加到当前类的extends数组中
					if (codeFile.classes.length > 0) {
						let currentClass = codeFile.classes[codeFile.classes.length - 1];
						currentClass.extends.push(text);
					}
					break;
				case 'implements-name':
					// 将实现的接口名添加到当前类的implements数组中
					if (codeFile.classes.length > 0) {
						let currentClass = codeFile.classes[codeFile.classes.length - 1];
						currentClass.implements.push(text);
					}
					break;
				case 'class-method-name':
					classObj.methods.push(this.createFunction(capture.node, text));
					break;
				case 'interface-name':
					classObj = this.createEmptyClassStructure();
					classObj.name = text;
					classObj.type = StructureType.Interface;
					const interfaceNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (interfaceNode) {
						classObj.start = { row: interfaceNode.startPosition.row, column: interfaceNode.startPosition.column };
						classObj.end = { row: interfaceNode.endPosition.row, column: interfaceNode.endPosition.column };

						codeFile.classes.push(classObj);
					}
					break;
				case 'interface-prop-name':
					let lastClass = codeFile.classes[codeFile.classes.length - 1];
					lastClass.fields = lastClass.fields ?? [];
					lastClass.fields.push(this.createVariable(capture.node, text, ''));
					break;
				case 'interface-prop-type':
					let lastClass_ = codeFile.classes[codeFile.classes.length - 1];
					const lastField = lastClass_.fields!![lastClass_.fields!!.length - 1];
					lastField.type = text;
					break;
				default:
					break;
			}
		}

		// 合并重复的类
		this.mergeClasses(codeFile);

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

	// 合并重复的类
	private mergeClasses(codeFile: CodeFile): void {
		const uniqueClasses: CodeStructure[] = [];
		const classMap = new Map<string, CodeStructure>();

		for (const classObj of codeFile.classes) {
			const className = classObj.name;

			if (classMap.has(className)) {
				// 合并属性到现有类
				const existingClass = classMap.get(className)!;

				// 合并方法
				if (classObj.methods && classObj.methods.length > 0) {
					existingClass.methods = [...(existingClass.methods || []), ...classObj.methods];
				}

				// 合并字段
				if (classObj.fields && classObj.fields.length > 0) {
					existingClass.fields = [...(existingClass.fields || []), ...classObj.fields];
				}

				// 合并常量
				if (classObj.constant && classObj.constant.length > 0) {
					existingClass.constant = [...(existingClass.constant || []), ...classObj.constant];
				}

				// 更新其他可能需要合并的属性
				if (classObj.implements && classObj.implements.length > 0) {
					existingClass.implements = [...(existingClass.implements || []), ...classObj.implements];
				}

				if (classObj.extends && classObj.extends.length > 0) {
					existingClass.extends = [...(existingClass.extends || []), ...classObj.extends];
				}
			} else {
				// 添加新类到映射表
				classMap.set(className, classObj);
				uniqueClasses.push(classObj);
			}
		}

		// 更新代码文件中的类数组
		codeFile.classes = uniqueClasses;
	}
}
