export interface InterfaceImplementation {
	interfaceName: string;
	interfaceFile: string;
	methodCount: number;
	package: string;
	position: {
		start: { row: number, column: number },
		end: { row: number, column: number }
	};
	implementations: Array<{
		className: string;
		classFile: string;
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface MultiImplementation {
	className: string;
	classFile: string;
	position?: {
		start: { row: number, column: number },
		end: { row: number, column: number }
	};
	interfaceCount: number;
	interfaces: Array<{
		interfaceName: string;
		interfaceFile: string;
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface ClassExtension {
	parentName: string;
	parentFile: string;
	package: string;
	position: {
		start: { row: number, column: number },
		end: { row: number, column: number }
	};
	children: Array<{
		className: string;
		classFile: string;
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface MultiExtension {
	className: string;
	classFile: string;
	position?: {
		start: { row: number, column: number },
		end: { row: number, column: number }
	};
	parentCount: number;
	parents: Array<{
		parentName: string;
		parentFile: string;
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface InheritanceHierarchy {
	maxDepth: number;
	deepestClasses: Array<{
		className: string;
		classFile: string;
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface CodeBlock {
    filePath: string;
    title: string;
    heading: string;
    language: string;
    internalLanguage: string;
    code: string;
    position?: {
        start: { row: number, column: number },
        end: { row: number, column: number }
    };
}

export interface MarkdownAnalysisResult {
    codeBlocks: CodeBlock[];
    totalCount: number;
}

export interface CodeAnalysisResult {
	interfaceAnalysis: {
		interfaces: InterfaceImplementation[];
		multiImplementers: MultiImplementation[];
		stats: {
			totalInterfaces: number;
			implementedInterfaces: number;
			unimplementedInterfaces: number;
			multiImplementerCount: number;
		};
	};
	extensionAnalysis: {
		extensions: ClassExtension[];
		multiExtensions: MultiExtension[];
		hierarchy: InheritanceHierarchy;
		stats: {
			extendedClassCount: number;
			totalExtensionRelations: number;
			multiExtendedClassCount: number;
		};
	};
	markdownAnalysis?: MarkdownAnalysisResult;
}
