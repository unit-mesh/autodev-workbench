import { injectable } from "inversify";
import { SyntaxNode } from 'web-tree-sitter';

import { HttpApiAnalyser } from '../base/HttpApiAnalyser';
import { MemoizedQuery } from '../base/LanguageProfile';
import { CodeFile, CodeFunction, CodeStructure } from '../../codemodel/CodeElement';
import { LanguageIdentifier } from '../../base/common/languages/languages';
import { StructurerProvider } from "../base/StructurerProvider";
import { ApiResource } from "@autodev/worker-core";

export interface Annotation {
	name: string;
	keyValues: { key: string; value: string }[];
}

@injectable()
export abstract class SpringRestApiAnalyser extends HttpApiAnalyser {
	protected abstract structurer: StructurerProvider;
	protected abstract get restTemplateQuery(): MemoizedQuery;

	abstract override readonly langId: LanguageIdentifier;

	fileFilter: (codeFile: CodeFile) => boolean = (codeFile: CodeFile): boolean => {
		let filepath = codeFile.filepath;
		return filepath.endsWith('Controller.java') ||
			filepath.endsWith('RestController.java') ||
			filepath.endsWith('Controller.kt') ||
			filepath.endsWith('RestController.kt');
	}

	async sourceCodeAnalysis(sourceCode: string, filePath: string, workspacePath: string): Promise<ApiResource[]> {
		if (!this.language || !this.parser) {
			console.warn(`${this.constructor.name} not initialized for ${this.langId}`);
			return;
		}

		if (!sourceCode) {
			console.warn('No source code available for analysis');
			return;
		}

		if (!this.structurer) {
			console.warn(`No structurer available for language ${this.langId}`);
			return;
		}

		const codeFile = await this.structurer.parseFile(sourceCode, filePath);

		if (!codeFile || !codeFile.classes || codeFile.classes.length === 0) {
			console.warn('No code structures found in the source code');
			return;
		}

		return this.analysis(codeFile);
	}

	analysis(codeFile: CodeFile): Promise<ApiResource[]> {
		for (const node of codeFile.classes) {
			const classAnnotations = node.annotations
			const isController = this.isSpringController(classAnnotations);

			if (isController) {
				const baseUrl = this.getBaseUrl(classAnnotations);

				if (node.methods && node.methods.length > 0) {
					node.methods.forEach(method => {
						if (method.annotations == undefined) return;
						this.processControllerMethod(method, method.annotations, baseUrl, node);
					});
				}
			}
		}

		return Promise.all(this.resources)
	}

	protected cleanStringLiteral(text: string): string {
		return text.replace(/^"(.*)"$/, '$1');
	}

	protected isSpringController(annotations: Annotation[]): boolean {
		if (!annotations || annotations.length === 0) return false;
		return annotations.some(anno =>
			anno.name === 'RestController' ||
			anno.name === 'Controller'
		);
	}

	protected getBaseUrl(annotations: Annotation[]): string {
		const requestMapping = annotations.find(anno => anno.name === 'RequestMapping');
		if (!requestMapping) return '';

		if (requestMapping.keyValues.length === 1 && requestMapping.keyValues[0].key === '') {
			return requestMapping.keyValues[0].value;
		}

		const valueKeyValue = requestMapping.keyValues.find(kv => kv.key === 'value');
		return valueKeyValue ? valueKeyValue.value : '';
	}

	protected processControllerMethod(
		method: CodeFunction,
		annotations: Annotation[],
		baseUrl: string,
		node: CodeStructure
	): void {
		let httpMethod = '';
		let path = '';

		for (const annotation of annotations) {
			switch (annotation.name) {
				case 'GetMapping':
					httpMethod = 'GET';
					path = this.getPathFromAnnotation(annotation);
					break;
				case 'PostMapping':
					httpMethod = 'POST';
					path = this.getPathFromAnnotation(annotation);
					break;
				case 'DeleteMapping':
					httpMethod = 'DELETE';
					path = this.getPathFromAnnotation(annotation);
					break;
				case 'PutMapping':
					httpMethod = 'PUT';
					path = this.getPathFromAnnotation(annotation);
					break;
				case 'PatchMapping':
					httpMethod = 'PATCH';
					path = this.getPathFromAnnotation(annotation);
					break;
				case 'RequestMapping':
					path = this.getPathFromAnnotation(annotation);
					// For RequestMapping, we need to check the method attribute
					const methodAttr = annotation.keyValues.find(kv => kv.key === 'method');
					if (methodAttr) {
						if (methodAttr.value.includes('GET')) httpMethod = 'GET';
						else if (methodAttr.value.includes('POST')) httpMethod = 'POST';
						else if (methodAttr.value.includes('DELETE')) httpMethod = 'DELETE';
						else if (methodAttr.value.includes('PUT')) httpMethod = 'PUT';
						else if (methodAttr.value.includes('PATCH')) httpMethod = 'PATCH';
					}
					break;
			}

			if (httpMethod && path) break;
		}

		if (httpMethod) {
			const fullPath = this.combinePaths(baseUrl, path);

			this.resources.push({
				id: "",
				sourceUrl: fullPath,
				sourceHttpMethod: httpMethod,
				packageName: node.package,
				className: node.name,
				methodName: method.name,
				supplyType: "Java",
			});
		}
	}

	protected getPathFromAnnotation(annotation: Annotation): string {
		// Try to get the value directly if it's a single value annotation
		if (annotation.keyValues.length === 1 && annotation.keyValues[0].key === '') {
			return annotation.keyValues[0].value;
		}

		const valueKeyValue = annotation.keyValues.find(kv => kv.key === 'value');
		return valueKeyValue ? valueKeyValue.value : '';
	}

	protected findRestTemplateUsages(rootNode: SyntaxNode, node: CodeStructure): void {
		if (!this.language) return;

		const query = this.restTemplateQuery.query(this.language);
		if (!query) return;

		const captures = query.captures(rootNode);
		let currentInvocation = {
			objectName: '',
			methodName: '',
			urlArg: ''
		};

		for (const capture of captures) {
			switch (capture.name) {
				case 'object-name':
					currentInvocation.objectName = capture.node.text;
					break;
				case 'method-name':
					currentInvocation.methodName = capture.node.text;
					break;
				case 'url-arg':
					currentInvocation.urlArg = this.cleanStringLiteral(capture.node.text);

					// If we have all parts of a RestTemplate invocation, record it
					if (currentInvocation.objectName === 'restTemplate' &&
						currentInvocation.methodName &&
						currentInvocation.urlArg) {

						// Determine HTTP method from method name
						let httpMethod = '';
						const methodName = currentInvocation.methodName.toLowerCase();

						if (methodName.startsWith('get')) httpMethod = 'GET';
						else if (methodName.startsWith('post')) httpMethod = 'POST';
						else if (methodName.startsWith('delete')) httpMethod = 'DELETE';
						else if (methodName.startsWith('put')) httpMethod = 'PUT';
						else if (methodName.startsWith('patch')) httpMethod = 'PATCH';

						if (httpMethod) {
							this.demands.push({
								sourceCaller: node.name,
								targetUrl: currentInvocation.urlArg,
								targetHttpMethod: httpMethod
							});
						}

						// Reset for next invocation
						currentInvocation = { objectName: '', methodName: '', urlArg: '' };
					}
					break;
			}
		}
	}

	protected combinePaths(basePath: string, subPath: string): string {
		if (!basePath && !subPath) return '/';

		if (!basePath) return subPath.startsWith('/') ? subPath : '/' + subPath;
		if (!subPath) return basePath.startsWith('/') ? basePath : '/' + basePath;

		const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
		const normalizedSub = subPath.startsWith('/') ? subPath : '/' + subPath;

		return normalizedBase + normalizedSub;
	}
}
