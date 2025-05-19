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
export class FastApiAnalyser extends RestApiAnalyser {
	isApplicable(lang: LanguageIdentifier): boolean {
		return lang === "python";
	}

	analysis(codeFile: CodeFile): Promise<ApiResource[]> {
		throw new Error("Method not implemented.");
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

	protected routeQuery: MemoizedQuery = new MemoizedQuery(`
        ; 捕获应用实例定义
        (assignment 
            left: (identifier) @app-variable
            right: (call
                function: (identifier) @fastapi-class
                arguments: (argument_list)?
            )
        )

        ; 捕获路由定义
        (decorated_definition
            (decorator
                (call
                    function: (attribute 
                        object: (identifier) @router-object
                        attribute: (identifier) @http-method
                    )
                    arguments: (argument_list
                        (string) @route-path
                        .
                        (keyword_argument
                            name: (identifier) @param-name
                            value: (_) @param-value
                        )?
                    )?
                )
            )
            definition: (function_definition
                name: (identifier) @endpoint-function
                parameters: (parameters)? @function-params
            )
        )

        ; 捕获APIRouter实例化
        (assignment
            left: (identifier) @router-variable
            right: (call
                function: (identifier) @router-class
                arguments: (argument_list
                    (keyword_argument
                        name: (identifier) @router-param-name
                        value: (string) @router-param-value
                    )?
                )?
            )
        )

        ; 捕获注册路由到应用
        (expression_statement
            (call
                function: (attribute
                    object: (identifier) @app-instance
                    attribute: (identifier) @include-method
                )
                arguments: (argument_list
                    (identifier) @included-router
                    (keyword_argument
                        name: (identifier) @mount-param-name
                        value: (string) @mount-param-value
                    )?
                )
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

	async analyse(sourceCode: string, filePath: string, workspacePath: string): Promise<ApiResource[]> {
		if (!this.language || !this.parser) {
			console.warn(`FastApiAnalyser not initialized for ${this.langId}`);
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

		// 分析FastAPI路由
		await this.analyseRoutes(tree.rootNode, codeFile, filePath);

		return Promise.all(this.resources);
	}

	/**
	 * 分析FastAPI路由
	 * @param rootNode AST根节点
	 * @param codeFile 解析后的代码文件结构
	 * @param filePath 源文件路径
	 */
	private async analyseRoutes(rootNode: SyntaxNode, codeFile: CodeFile, filePath: string): Promise<void> {
		if (!this.language) return;

		const query = this.routeQuery.query(this.language);
		if (!query) return;

		const captures = query.captures(rootNode);

		// 跟踪FastAPI应用实例和路由器
		const appInstances = new Set<string>();
		const routerInstances = new Map<string, { prefix: string }>();

		// 跟踪当前处理的路由信息
		let currentRoute = {
			routerObject: '',
			httpMethod: '',
			path: '',
			functionName: '',
			hasMethodCapture: false
		};

		// 处理路由挂载点
		const mountedRouters = new Map<string, string>();

		for (const capture of captures) {
			switch (capture.name) {
				// 跟踪FastAPI应用实例
				case 'app-variable':
					if (captures.some(c =>
						c.name === 'fastapi-class' &&
						c.node.text === 'FastAPI' &&
						c.node.parent === capture.node.parent?.parent?.parent
					)) {
						appInstances.add(capture.node.text);
					}
					break;

				// 跟踪APIRouter实例
				case 'router-variable':
					if (captures.some(c =>
						c.name === 'router-class' &&
						c.node.text === 'APIRouter' &&
						c.node.parent === capture.node.parent?.parent?.parent
					)) {
						const routerName = capture.node.text;
						const prefix = this.getRouterPrefix(capture.node, captures);
						routerInstances.set(routerName, { prefix: prefix });
					}
					break;

				// 处理路由挂载
				case 'app-instance':
					if (appInstances.has(capture.node.text) &&
						captures.some(c => c.name === 'include-method' && c.node.text === 'include_router')) {
						const includedRouterCapture = captures.find(c =>
							c.name === 'included-router' &&
							c.node.parent === capture.node.parent?.parent
						);

						if (includedRouterCapture) {
							const mountPrefix = this.getMountPrefix(includedRouterCapture.node, captures);
							mountedRouters.set(includedRouterCapture.node.text, mountPrefix);
						}
					}
					break;

				// 路由对象
				case 'router-object':
					currentRoute.routerObject = capture.node.text;
					currentRoute.hasMethodCapture = false;
					break;

				// HTTP方法
				case 'http-method':
					if (this.isHttpMethod(capture.node.text)) {
						currentRoute.httpMethod = this.normalizeHttpMethod(capture.node.text);
						currentRoute.hasMethodCapture = true;
					}
					break;

				// 路由路径
				case 'route-path':
					if (currentRoute.hasMethodCapture) {
						currentRoute.path = this.cleanStringLiteral(capture.node.text);
					}
					break;

				// 路由处理函数
				case 'endpoint-function':
					if (currentRoute.hasMethodCapture && currentRoute.httpMethod && currentRoute.path) {
						currentRoute.functionName = capture.node.text;

						// 构建完整路径，考虑路由器前缀
						let fullPath = currentRoute.path;

						// 如果是路由器上的方法，添加前缀
						if (routerInstances.has(currentRoute.routerObject)) {
							const routerPrefix = routerInstances.get(currentRoute.routerObject)!.prefix;
							fullPath = this.combinePaths(routerPrefix, fullPath);

							// 如果路由器被挂载到应用上，还需要添加挂载前缀
							if (mountedRouters.has(currentRoute.routerObject)) {
								fullPath = this.combinePaths(mountedRouters.get(currentRoute.routerObject)!, fullPath);
							}
						}

						// 处理直接在app上声明的路由
						if (appInstances.has(currentRoute.routerObject)) {
							// 不需要额外处理，路径已经是完整的
						}

						// 创建API资源
						this.resources.push({
							id: "",
							sourceUrl: fullPath,
							sourceHttpMethod: currentRoute.httpMethod,
							packageName: this.getPackageName(filePath),
							className: this.getModuleName(filePath),
							methodName: currentRoute.functionName,
							supplyType: "Python",
						});

						// 重置当前路由信息
						currentRoute = {
							routerObject: '',
							httpMethod: '',
							path: '',
							functionName: '',
							hasMethodCapture: false
						};
					}
					break;
			}
		}
	}

	/**
	 * 获取路由器的前缀
	 */
	private getRouterPrefix(routerNode: SyntaxNode, captures: Parser.QueryCapture[]): string {
		const prefixCapture = captures.filter(c =>
			c.name === 'router-param-name' &&
			c.node.text === 'prefix' &&
			c.node.parent?.parent === routerNode.parent?.parent?.parent?.child(1)?.child(0)
		).find(Boolean);

		if (prefixCapture) {
			const prefixValueCapture = captures.find(c =>
				c.name === 'router-param-value' &&
				c.node.parent === prefixCapture.node.parent
			);

			if (prefixValueCapture) {
				return this.cleanStringLiteral(prefixValueCapture.node.text);
			}
		}

		return '';
	}

	/**
	 * 获取路由挂载前缀
	 */
	private getMountPrefix(routerNode: SyntaxNode, captures: Parser.QueryCapture[]): string {
		const prefixCapture = captures.filter(c =>
			c.name === 'mount-param-name' &&
			c.node.text === 'prefix' &&
			c.node.parent?.parent === routerNode.parent
		).find(Boolean);

		if (prefixCapture) {
			const prefixValueCapture = captures.find(c =>
				c.name === 'mount-param-value' &&
				c.node.parent === prefixCapture.node.parent
			);

			if (prefixValueCapture) {
				return this.cleanStringLiteral(prefixValueCapture.node.text);
			}
		}

		return '';
	}

	/**
	 * 判断是否为HTTP方法
	 */
	private isHttpMethod(method: string): boolean {
		const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
		return httpMethods.includes(method.toLowerCase());
	}

	/**
	 * 标准化HTTP方法名称
	 */
	private normalizeHttpMethod(method: string): string {
		return method.toUpperCase();
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
	 * 组合路径
	 */
	private combinePaths(basePath: string, subPath: string): string {
		if (!basePath && !subPath) return '/';

		if (!basePath) return subPath.startsWith('/') ? subPath : '/' + subPath;
		if (!subPath) return basePath.startsWith('/') ? basePath : '/' + basePath;

		const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
		const normalizedSub = subPath.startsWith('/') ? subPath : '/' + subPath;

		return normalizedBase + normalizedSub;
	}

	/**
	 * 获取包名
	 */
	private getPackageName(filePath: string): string {
		const parts = filePath.split('/');
		return parts[parts.length - 2] || '';
	}

	/**
	 * 获取模块名
	 */
	private getModuleName(filePath: string): string {
		const parts = filePath.split('/');
		const fileName = parts[parts.length - 1];
		return fileName.replace('.py', '');
	}
}
