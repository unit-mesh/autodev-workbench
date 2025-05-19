import { injectable } from "inversify";
import Parser, { SyntaxNode } from 'web-tree-sitter';

import { RestApiAnalyser } from '../base/RestApiAnalyser';
import { LanguageProfile, MemoizedQuery } from '../base/LanguageProfile';
import { CodeFile } from '../../codemodel/CodeElement';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { StructurerProvider } from "../base/StructurerProvider";
import { ApiResource } from "@autodev/worker-core";
import { PythonProfile } from "./PythonProfile";
import { PythonStructurer } from "./PythonStructurer";

@injectable()
export class DjangoApiAnalyser extends RestApiAnalyser {
	isApplicable(lang: LanguageIdentifier): boolean {
		return lang === "python";
	}

	readonly langId: LanguageIdentifier = 'python';
	protected parser: Parser | undefined;
	protected language: Parser.Language | undefined;
	protected config: LanguageProfile;
	protected structurer: StructurerProvider;

	protected _restTemplateQuery: MemoizedQuery = new MemoizedQuery(`
        (call
            function: (attribute
                object: (identifier) @object-name
                attribute: (identifier) @method-name
            )
            arguments: (argument_list
                (string) @url-arg
            )
        )
    `);

	// 直接查询URL路径函数调用，不依赖urlpatterns变量
	protected urlPatternQuery: MemoizedQuery = new MemoizedQuery(`
		; 直接捕获 path() 函数调用
		(call
			function: (identifier) @path-function
			arguments: (argument_list
				(string) @route-path
				.
				[
					; 直接引用视图函数
					(identifier) @view-function
					
					; 通过模块引用视图函数
					(attribute
						object: (identifier) @view-module
						attribute: (identifier) @view-function
					)
					
					; 类视图的as_view()调用
					(call
						function: (attribute
							object: (identifier) @view-class
							attribute: (identifier) @view-method
						)
						arguments: (argument_list)?
					)
				]
				.
				(keyword_argument
					name: (identifier) @name-param
					value: (string) @name-value
				)?
			)
		)
		
		; 捕获视图类定义
		(class_definition
			name: (identifier) @class-name
			superclasses: (argument_list
				[
					; 直接继承
					(identifier) @superclass
					
					; 通过模块继承
					(attribute
						object: (identifier) @superclass-module
						attribute: (identifier) @superclass-name
					)
				]
			)
		)
	`);

	constructor(
		private pythonProfile: PythonProfile,
		private pythonStructurer: PythonStructurer
	) {
		super();
		this.config = pythonProfile;
		this.structurer = pythonStructurer;
	}

	get restTemplateQuery(): MemoizedQuery {
		return this._restTemplateQuery;
	}

	async init(langService: ILanguageServiceProvider): Promise<void> {
		const parser = await langService.getParser(this.langId);
		const language = await this.config.grammar(langService, this.langId);
		parser!.setLanguage(language);
		this.parser = parser;
		this.language = language;
		await this.structurer.init(langService);
	}

	analysis(codeFile: CodeFile): Promise<ApiResource[]> {
		throw new Error("Method not implemented.");
	}

	async analyse(sourceCode: string, filePath: string, workspacePath: string): Promise<ApiResource[]> {
		if (!this.language || !this.parser) {
			console.warn(`DjangoApiAnalyser not initialized for ${this.langId}`);
			return [];
		}

		if (!sourceCode) {
			console.warn('No source code available for analysis');
			return [];
		}

		// 解析源代码
		const codeFile = await this.structurer.parseFile(sourceCode, filePath);
		if (!codeFile) {
			console.warn('Failed to parse source code');
			return [];
		}

		// 获取抽象语法树
		const tree = this.parser.parse(sourceCode);

		// 分析Django URL路由
		await this.analyseUrls(tree.rootNode, codeFile, filePath, sourceCode);

		return Promise.all(this.resources);
	}

	/**
	 * 分析Django URL路由
	 * @param rootNode AST根节点
	 * @param codeFile 解析后的代码文件结构
	 * @param filePath 源文件路径
	 * @param sourceCode
	 */
	private async analyseUrls(rootNode: SyntaxNode, codeFile: CodeFile, filePath: string, sourceCode: string): Promise<void> {
		if (!this.language) return;

		const query = this.urlPatternQuery.query(this.language);
		if (!query) return;

		const captures = query.captures(rootNode);

		// 存储类视图信息，用于后续处理
		const classViews = new Map<string, string[]>();

		// 收集所有类定义及其支持的HTTP方法
		for (const capture of captures) {
			if (capture.name === 'class-name') {
				const className = capture.node.text;

				// 检查是否是Django视图类
				const isViewClass = captures.some(c =>
					(c.name === 'superclass' || c.name === 'superclass-name') &&
					['View', 'APIView', 'ViewSet', 'ModelViewSet', 'ReadOnlyModelViewSet'].includes(c.node.text) &&
					c.node.parent === capture.node.parent?.namedChild(1)
				);

				if (isViewClass) {
					// 查找该类中定义的HTTP方法
					const httpMethods = this.findHttpMethodsInClass(capture.node.parent!, sourceCode);
					classViews.set(className, httpMethods);
				}
			}
		}

		// 处理URL路由定义
		for (const capture of captures) {
			if (capture.name === 'path-function' && capture.node.text === 'path') {
				// 获取路由路径
				const routePathCapture = captures.find(c =>
					c.name === 'route-path' &&
					c.node.parent === capture.node.parent
				);

				if (routePathCapture) {
					const routePath = this.cleanStringLiteral(routePathCapture.node.text);

					// 处理视图函数或类视图
					const viewFunctionCapture = captures.find(c =>
						(c.name === 'view-function' || c.name === 'view-class') &&
						c.node.parent === capture.node.parent ||
						c.node.parent?.parent === capture.node.parent
					);

					if (viewFunctionCapture) {
						const viewModuleCapture = captures.find(c =>
							c.name === 'view-module' &&
							c.node.parent === viewFunctionCapture.node.parent
						);

						// 判断是否是类视图的as_view()调用
						const isClassView = captures.some(c =>
							c.name === 'view-method' &&
							c.node.text === 'as_view' &&
							c.node.parent?.parent === capture.node.parent?.namedChild(2)
						);

						if (isClassView) {
							// 处理类视图
							const viewClassName = viewFunctionCapture.node.text;

							if (classViews.has(viewClassName)) {
								// 为类中的每个HTTP方法创建一个API资源
								const httpMethods = classViews.get(viewClassName) || ['get'];

								for (const method of httpMethods) {
									this.resources.push({
										id: "",
										sourceUrl: routePath,
										sourceHttpMethod: method.toUpperCase(),
										packageName: this.getPackageName(filePath),
										className: viewClassName,
										methodName: method.toLowerCase(),
										supplyType: "Python",
									});
								}
							} else {
								// 如果找不到类定义，假设它至少支持GET
								this.resources.push({
									id: "",
									sourceUrl: routePath,
									sourceHttpMethod: "GET",
									packageName: this.getPackageName(filePath),
									className: viewClassName,
									methodName: "get",
									supplyType: "Python",
								});
							}
						} else {
							// 处理函数视图
							const viewModule = viewModuleCapture ? viewModuleCapture.node.text : '';
							const viewFunction = viewFunctionCapture.node.text;

							// 对于函数视图，默认为GET请求
							this.resources.push({
								id: "",
								sourceUrl: routePath,
								sourceHttpMethod: "GET",
								packageName: this.getPackageName(filePath),
								className: viewModule,
								methodName: viewFunction,
								supplyType: "Python",
							});
						}
					}
				}
			}
		}

		// 处理DRF ViewSet注册
		this.processViewSetRegistrations(rootNode, classViews, filePath);
	}

	/**
	 * 在类定义中查找HTTP方法
	 */
	private findHttpMethodsInClass(classNode: SyntaxNode, sourceCode: string): string[] {
		const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
		const foundMethods: string[] = [];

		// 遍历类的所有子节点查找方法定义
		let functionNodes = this.findAllFunctionDefinitions(classNode);

		for (const funcNode of functionNodes) {
			const functionName = funcNode.namedChild(0)?.text;
			if (functionName && httpMethods.includes(functionName.toLowerCase())) {
				foundMethods.push(functionName.toLowerCase());
			}
		}

		// 如果没有找到任何HTTP方法，但类继承自ViewSet相关类，添加标准CRUD方法
		if (foundMethods.length === 0 && this.isViewSetClass(classNode)) {
			// ModelViewSet支持的标准方法
			return ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'];
		}

		return foundMethods.length > 0 ? foundMethods : ['get'];
	}

	/**
	 * 查找类中的所有函数定义
	 */
	private findAllFunctionDefinitions(classNode: SyntaxNode): SyntaxNode[] {
		const functionNodes: SyntaxNode[] = [];

		// 查找类体内的函数定义
		const bodyNode = classNode.namedChild(2); // 类体通常是第三个命名子节点
		if (bodyNode) {
			for (let i = 0; i < bodyNode.namedChildCount; i++) {
				const child = bodyNode.namedChild(i);
				if (child?.type === 'function_definition') {
					functionNodes.push(child);
				}
			}
		}

		return functionNodes;
	}

	/**
	 * 判断是否是ViewSet类
	 */
	private isViewSetClass(classNode: SyntaxNode): boolean {
		const superclassesNode = classNode.namedChild(1);
		if (!superclassesNode) return false;

		for (let i = 0; i < superclassesNode.namedChildCount; i++) {
			const superclass = superclassesNode.namedChild(i);
			if (superclass) {
				const superclassName = superclass.text;
				if (superclassName.includes('ViewSet') || superclassName.includes('ModelViewSet')) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * 处理DRF ViewSet注册
	 */
	private processViewSetRegistrations(rootNode: SyntaxNode, classViews: Map<string, string[]>, filePath: string): void {
		if (!this.language) return;

		// 创建一个新的查询来捕获router.register调用
		const routerRegisterQuery = `
            (call
                function: (attribute
                    object: (identifier) @router-name
                    attribute: (identifier) @register-method
                )
                arguments: (argument_list
                    (string) @prefix
                    (identifier) @viewset-class
                    .
                    (keyword_argument
                        name: (identifier) @basename-param
                        value: (string) @basename-value
                    )?
                )
            )
        `;

		const query = this.language.query(routerRegisterQuery);
		const captures = query.captures(rootNode);

		// 查找router.register调用
		const routers = new Set<string>();
		const registrations: { router: string, prefix: string, viewsetClass: string }[] = [];

		// 首先识别所有路由器
		for (const capture of captures) {
			if (capture.name === 'router-name' &&
				captures.some(c => c.name === 'register-method' && c.node.text === 'register' && c.node.parent === capture.node.parent)) {
				routers.add(capture.node.text);
			}
		}

		// 然后处理所有注册
		for (const capture of captures) {
			if (capture.name === 'router-name' && routers.has(capture.node.text)) {
				const routerName = capture.node.text;

				const prefixCapture = captures.find(c =>
					c.name === 'prefix' &&
					c.node.parent === capture.node.parent?.parent
				);

				const viewsetClassCapture = captures.find(c =>
					c.name === 'viewset-class' &&
					c.node.parent === capture.node.parent?.parent
				);

				if (prefixCapture && viewsetClassCapture) {
					registrations.push({
						router: routerName,
						prefix: this.cleanStringLiteral(prefixCapture.node.text),
						viewsetClass: viewsetClassCapture.node.text
					});
				}
			}
		}

		// 为每个注册创建API资源
		for (const reg of registrations) {
			const viewsetClass = reg.viewsetClass;

			// 获取ViewSet支持的方法
			let methods = ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'];
			if (classViews.has(viewsetClass)) {
				methods = classViews.get(viewsetClass)!;
			}

			// 为每个方法创建相应的API资源
			const methodToHttpMethod: { [key: string]: string } = {
				'list': 'GET',
				'retrieve': 'GET',
				'create': 'POST',
				'update': 'PUT',
				'partial_update': 'PATCH',
				'destroy': 'DELETE'
			};

			for (const method of methods) {
				const httpMethod = methodToHttpMethod[method] || 'GET';

				// 构建URL路径 - 基于DRF的默认路由规则
				let path = reg.prefix;
				if (method === 'retrieve' || method === 'update' || method === 'partial_update' || method === 'destroy') {
					path += '/{id}/';
				} else {
					path += '/';
				}

				this.resources.push({
					id: "",
					sourceUrl: path,
					sourceHttpMethod: httpMethod,
					packageName: this.getPackageName(filePath),
					className: viewsetClass,
					methodName: method,
					supplyType: "Python",
				});
			}
		}
	}

	/**
	 * 清理字符串字面量，移除引号
	 */
	private cleanStringLiteral(text: string): string {
		if ((text.startsWith('"') && text.endsWith('"')) ||
			(text.startsWith("'") && text.endsWith("'"))) {
			return text.substring(1, text.length - 1);
		}
		return text;
	}

	/**
	 * 获取包名
	 */
	private getPackageName(filePath: string): string {
		const parts = filePath.split('/');
		return parts[parts.length - 2] || '';
	}
}
