import { injectable } from 'inversify';
import { SyntaxNode } from 'web-tree-sitter';

import { HttpApiAnalyser } from '../base/HttpApiAnalyser';
import { MemoizedQuery } from '../base/LanguageProfile';
import { CodeFile, CodeFunction } from '../../codemodel/CodeElement';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { StructurerProvider } from "../base/StructurerProvider";
import { ApiResource } from "@autodev/worker-core";
import { TypeScriptProfile } from './TypeScriptProfile';
import path from "path";
import { TypeScriptStructurer } from './TypeScriptStructurer';
import fs from "fs";

@injectable()
export class TypeScriptNextjsAnalyser extends HttpApiAnalyser {
  protected structurer: StructurerProvider = new TypeScriptStructurer();
  readonly langId: LanguageIdentifier = 'typescript';

  isApplicable(lang: LanguageIdentifier): boolean {
    return lang === this.langId;
  }

  fileFilter: (codeFile: CodeFile) => boolean = (codeFile: CodeFile): boolean => {
    let filePath = codeFile.filepath;
    let isInLocation = filePath.includes('/pages/api/') || filePath.includes('/app/api/');

    if (isInLocation === false) return false;

    return filePath.endsWith('route.ts') || filePath.endsWith('route.js');
  }

  // 旧版 Next.js pages API 的查询 - 检测条件语句中的 req.method 判断
  protected httpMethodQuery = new MemoizedQuery(`
    (export_statement
      declaration: (function_declaration 
        name: (identifier) @functionName
        body: (statement_block 
          (if_statement
            condition: (parenthesized_expression 
              (binary_expression
                left: (member_expression
                  object: (identifier) @req
                  property: (property_identifier) @method
                )
                right: (string) @httpMethod
              )
            )
          )?
        )
      )
    )
  `);

  // 新版 Next.js App Router API 的查询 - 直接检测 HTTP 方法函数导出
  protected appRouterApiQuery = new MemoizedQuery(`
    (export_statement
      (function_declaration
        name: (identifier) @http-method
      )
    )
  `);

  protected restClientQuery = new MemoizedQuery(`
    (call_expression
      function: (member_expression
        object: (identifier) @client
        property: (property_identifier) @method
      )
      arguments: (arguments
        (string) @url
        (_)* @otherArgs
      )
    )
  `);

  constructor() {
    super();
    this.config = new TypeScriptProfile();
  }

  sourceCodeAnalysis(sourceCode: string, filePath: string, workspacePath: string): Promise<ApiResource[]> {
    return Promise.resolve([]);
  }

  async analysis(codeFile: CodeFile): Promise<ApiResource[]> {
    const filePath = codeFile.filepath;
    const sourceCode = await fs.promises.readFile(filePath, 'utf-8');

    const tree = this.parser.parse(sourceCode);
    const apiUrl = this.extractApiUrlFromFilePath(filePath);

    const isAppRouter = filePath.includes('/app/api/');
    if (isAppRouter) {
      return this.analyseNextAppRouterApi(codeFile, tree.rootNode, apiUrl, filePath);
    } else {
      return this.analyseNextApiRoute(codeFile, tree.rootNode, apiUrl, filePath);
    }
  }

  protected extractApiUrlFromFilePath(filePath: string): string {
    const apiDirIndex = filePath.indexOf('/api/');
    if (apiDirIndex === -1) return '';

    let apiPath = filePath.substring(apiDirIndex);

    const extName = path.extname(apiPath);
    apiPath = apiPath.substring(0, apiPath.length - extName.length);

    if (apiPath.endsWith('/index')) {
      apiPath = apiPath.substring(0, apiPath.length - 6);
    }

    if (apiPath.endsWith('/route')) {
      apiPath = apiPath.substring(0, apiPath.length - 6);
    }

    return apiPath;
  }

  protected async analyseNextAppRouterApi(codeFile: CodeFile, rootNode: SyntaxNode, apiUrl: string, filePath: string): Promise<ApiResource[]> {
    if (!this.language) return [];
    this.resources = [];
    const httpMethods = this.extractAppRouterHttpMethods(rootNode);
    for (const method of httpMethods) {
      if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE' && method !== 'PATCH') {
        continue;
      }

      this.resources.push({
        id: "",
        sourceUrl: apiUrl,
        sourceHttpMethod: method,
        packageName: path.dirname(filePath),
        className: path.basename(filePath),
        methodName: method,
        supplyType: "Nextjs",
      });

      const handlerFunction = codeFile.functions.find(f => f.name === method);
      this.findApiClientUsages(rootNode, handlerFunction);
    }

    return this.resources;
  }

  protected extractAppRouterHttpMethods(rootNode: SyntaxNode): string[] {
    if (!this.language) return [];

    const methods: string[] = [];
    const query = this.appRouterApiQuery.query(this.language);
    if (!query) return methods;

    const captures = query.captures(rootNode);
    for (const capture of captures) {
      if (capture.name === 'http-method') {
        const httpMethod = capture.node.text.toUpperCase();
        // 确认是有效的 HTTP 方法
        if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(httpMethod)) {
          methods.push(httpMethod);
        }
      }
    }

    return methods;
  }

  protected async analyseNextApiRoute(codeFile: CodeFile, rootNode: SyntaxNode, apiUrl: string, filePath: string): Promise<ApiResource[]> {
    if (!this.language) return [];
    this.resources = [];
    const handlerFunction = codeFile.functions.find(f => f.name === 'handler' || f.name === 'GET' || f.name === 'POST' || f.name === 'PUT' || f.name === 'DELETE' || f.name === 'PATCH');
    if (!handlerFunction) {
      return [];
    }

    const supportedMethods = this.extractSupportedHttpMethods(rootNode);
    if (supportedMethods.length > 0) {
      for (const method of supportedMethods) {
        this.resources.push({
          id: "",
          sourceUrl: apiUrl,
          sourceHttpMethod: method,
          packageName: path.dirname(filePath),
          className: path.basename(filePath),
          methodName: handlerFunction[0] || 'handler',
          supplyType: "Nextjs",
        });
      }
    } else {
      const defaultMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      for (const method of defaultMethods) {
        this.resources.push({
          id: "",
          sourceUrl: apiUrl,
          sourceHttpMethod: method,
          packageName: path.dirname(filePath),
          className: path.basename(filePath),
          methodName: handlerFunction.name || 'handler',
          supplyType: "Nextjs",
        });
      }
    }

    // 分析 API 调用
    this.findApiClientUsages(rootNode, handlerFunction);

    return this.resources;
  }

  protected extractSupportedHttpMethods(rootNode: SyntaxNode): string[] {
    if (!this.language) return [];

    const methods: string[] = [];
    const query = this.httpMethodQuery.query(this.language);

    if (!query) return methods;

    const captures = query.captures(rootNode);
    for (const capture of captures) {
      if (capture.name === 'method' && capture.node.text === 'method') {
        const nextCapture = captures.find(c =>
          c.name === 'httpMethod' &&
          c.node.startIndex > capture.node.startIndex
        );

        if (nextCapture) {
          const method = nextCapture.node.text.replace(/['"]/g, '').toUpperCase();
          if (method && !methods.includes(method)) {
            methods.push(method);
          }
        }
      }
    }

    return methods;
  }

  protected findApiClientUsages(rootNode: SyntaxNode, currentFunction: CodeFunction): void {
    if (!this.language) return;

    const query = this.restClientQuery.query(this.language);
    if (!query) return;

    const captures = query.captures(rootNode);
    let currentInvocation = {
      clientName: '',
      methodName: '',
      urlArg: ''
    };

    for (const capture of captures) {
      switch (capture.name) {
        case 'client':
          currentInvocation.clientName = capture.node.text;
          break;
        case 'method':
          currentInvocation.methodName = capture.node.text;
          break;
        case 'url':
          currentInvocation.urlArg = this.cleanStringLiteral(capture.node.text);

          // 如果我们有API客户端调用的所有部分
          if (currentInvocation.clientName &&
            currentInvocation.methodName &&
            currentInvocation.urlArg) {

            // 确定 HTTP 方法
            let httpMethod = '';
            const methodName = currentInvocation.methodName.toLowerCase();

            if (methodName === 'get') httpMethod = 'GET';
            else if (methodName === 'post') httpMethod = 'POST';
            else if (methodName === 'delete') httpMethod = 'DELETE';
            else if (methodName === 'put') httpMethod = 'PUT';
            else if (methodName === 'patch') httpMethod = 'PATCH';

            if (httpMethod) {
              this.demands.push({
                sourceCaller: currentFunction.name || '',
                targetUrl: currentInvocation.urlArg,
                targetHttpMethod: httpMethod
              });
            }

            // 重置下一次调用
            currentInvocation = { clientName: '', methodName: '', urlArg: '' };
          }
          break;
      }
    }
  }

  protected cleanStringLiteral(text: string): string {
    return text.replace(/^["'`](.*)["'`]$/, '$1');
  }
}
