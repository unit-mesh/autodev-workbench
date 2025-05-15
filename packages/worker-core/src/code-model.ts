export enum DataStructType {
	Class = 'Class',
	Enum = 'Enum',
	Interface = 'Interface',
	Message = 'Message',
}

export interface CodeField {
	Name: string;
	Type: string;
	IsArray: boolean;
	IsNullable: boolean;
	Default: unknown;
	Comment: string;
}

export interface CodeFunction {
	Name: string;
	ReturnType: string;
	Parameters: CodeParameter[];
	IsStatic: boolean;
	IsConstructor: boolean;
	IsAsync: boolean;
	Decorators: string[];
	Content: string;
}

export interface CodeParameter {
	Name: string;
	Type: string;
}

export interface CodePosition {
	StartLine: number;
	EndLine: number;
	StartColumn: number;
	EndColumn: number;
}

export interface CodeAnnotation {
	Name: string;
	Parameters: Record<string, string>;
}

export interface CodeDataStruct {
	NodeName: string;
	Module: string;
	Type: DataStructType;
	Package: string;
	FilePath: string;
	Fields: CodeField[];
	MultipleExtend: string[];
	Implements: string[];
	Extend: string;
	Functions: CodeFunction[];
	InnerStructures: CodeDataStruct[];
	Annotations: CodeAnnotation[];
	FunctionCalls: string[];
	Parameters: CodeParameter[];
	Imports: string[];
	Exports: string[];
	Extension: Record<string, unknown>;
	Position: CodePosition;
	Content: string;
}

export type ApiResource = {
	id: string | any[];
	systemId?: string | any[];
	sourceUrl: string;
	sourceHttpMethod: string;
	packageName: string;
	className: string;
	methodName: string;
	supplyType: string;
}
