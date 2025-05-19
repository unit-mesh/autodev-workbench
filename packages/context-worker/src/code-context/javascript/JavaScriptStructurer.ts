import { injectable } from 'inversify';
import Parser, { Language } from 'web-tree-sitter';

import { JavaScriptProfile } from './JavaScriptProfile';
import { BaseStructurerProvider } from "../base/StructurerProvider";
import { CodeFile, CodeStructure, StructureType } from "../../codemodel/CodeElement";
import { LanguageProfileUtil } from "../base/LanguageProfileUtil";

@injectable()
export class JavaScriptStructurer extends BaseStructurerProvider {
	protected langId: string = 'javascript';
	protected config: JavaScriptProfile = LanguageProfileUtil.from(this.langId)!!;
	protected parser: Parser | undefined;
	protected language: Language | undefined;

	isApplicable(lang: string) {
		return lang === 'javascript' || lang === 'javascriptreact';
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
		const processedImports = new Set<string>();

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'import-source':
					// 避免重复添加相同的导入
					if (!processedImports.has(text)) {
						codeFile.imports.push(text);
						processedImports.add(text);
					}
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
					// 将扩展的类名添加到当前类的extends数组中（避免重复）
					if (codeFile.classes.length > 0) {
						let currentClass = codeFile.classes[codeFile.classes.length - 1];
						if (!currentClass.extends.includes(text)) {
							currentClass.extends.push(text);
						}
					}
					break;
				case 'class-method-name':
					classObj.methods.push(this.createFunction(capture.node, text));
					break;
				case 'function-name':
					const functionNode = capture.node?.parent ?? null;
					if (functionNode) {
						const functionObj = this.createFunction(functionNode, text);
						codeFile.functions.push(functionObj);
					}
					break;
				default:
					break;
			}
		}

		// 合并重复的类
		this.mergeClasses(codeFile);
		
		// 确保导入不重复
		codeFile.imports = [...new Set(codeFile.imports)];

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

				// 合并extends
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
