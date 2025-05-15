import * as protobuf from 'protobufjs';

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

export class ProtoAnalyser {
	/**
	 * 将 .proto 文件内容转换为 CodeDataStruct 数组
	 *
	 * @param protoContent proto 文件内容
	 * @param filePath proto 文件路径
	 * @returns CodeDataStruct 数组
	 */
	public analyseFromContent(protoContent: string, filePath: string): CodeDataStruct[] {
		if (!protoContent) {
			console.error("Empty proto content");
			return [];
		}

		const dataStructs: CodeDataStruct[] = [];
		let root: protobuf.Root;

		try {
			root = protobuf.parse(protoContent).root;
		} catch (e) {
			console.error("Failed to parse proto content:", e);
			return [];
		}

		// 获取包名
		const packageMatch = /^package\s+([\w.]+)\s*;/m.exec(protoContent);
		const packageName = packageMatch ? packageMatch[1] : '';

		// 处理根级嵌套对象
		if (root.nested) {
			this.processNestedObjects(
				root.nested,
				dataStructs,
				packageName,
				filePath,
				''
			);
		}

		return dataStructs;
	}

	/**
	 * 处理嵌套对象（消息、枚举、服务等）
	 */
	private processNestedObjects(
		nested: { [k: string]: protobuf.ReflectionObject },
		dataStructs: CodeDataStruct[],
		packageName: string,
		filePath: string,
		parentModule: string
	): void {
		for (const [key, obj] of Object.entries(nested)) {
			const currentModule = parentModule ? `${parentModule}.${key}` : key;

			if (obj instanceof protobuf.Type) {
				// 处理消息
				const messageStruct = this.processMessageType(obj, packageName, filePath, currentModule);
				dataStructs.push(messageStruct);

				// 检查消息内部是否有嵌套结构
				if (obj.nested) {
					this.processNestedObjects(
						obj.nested,
						dataStructs,
						packageName,
						filePath,
						currentModule
					);
				}
			} else if (obj instanceof protobuf.Enum) {
				// 处理枚举
				dataStructs.push(this.processEnumType(obj, packageName, filePath, currentModule));
			} else if (obj instanceof protobuf.Service) {
				// 处理服务
				dataStructs.push(this.processServiceType(obj, packageName, filePath, currentModule));
			} else if (obj instanceof protobuf.Namespace) {
				// 处理命名空间
				if (obj.nested) {
					this.processNestedObjects(
						obj.nested,
						dataStructs,
						packageName,
						filePath,
						currentModule
					);
				}
			}
		}
	}

	/**
	 * 处理消息类型
	 */
	private processMessageType(
		type: protobuf.Type,
		packageName: string,
		filePath: string,
		module: string
	): CodeDataStruct {
		const fields: CodeField[] = [];

		// 处理字段
		for (const [fieldName, field] of Object.entries(type.fields)) {
			fields.push({
				Name: fieldName,
				Type: this.getFieldType(field),
				IsArray: field.repeated,
				IsNullable: field.optional || false,
				Default: field.defaultValue,
				Comment: field.comment || '',
			});
		}

		return {
			NodeName: type.name,
			Module: module,
			Type: DataStructType.Message,
			Package: packageName,
			FilePath: filePath,
			Fields: fields,
			MultipleExtend: [],
			Implements: [],
			Extend: '',
			Functions: [],
			InnerStructures: [],
			Annotations: [],
			FunctionCalls: [],
			Parameters: [],
			Imports: [],
			Exports: [],
			Extension: {} as Record<string, unknown>,
			Position: { StartLine: 0, EndLine: 0, StartColumn: 0, EndColumn: 0 },
			Content: type.toJSON().fields ? JSON.stringify(type.toJSON().fields, null, 2) : '',
		};
	}

	/**
	 * 处理枚举类型
	 */
	private processEnumType(
		enumObj: protobuf.Enum,
		packageName: string,
		filePath: string,
		module: string
	): CodeDataStruct {
		const fields: CodeField[] = [];

		// 处理枚举值
		for (const [valueName, value] of Object.entries(enumObj.values)) {
			fields.push({
				Name: valueName,
				Type: 'number',
				IsArray: false,
				IsNullable: false,
				Default: value,
				Comment: '',
			});
		}

		return {
			NodeName: enumObj.name,
			Module: module,
			Type: DataStructType.Enum,
			Package: packageName,
			FilePath: filePath,
			Fields: fields,
			MultipleExtend: [],
			Implements: [],
			Extend: '',
			Functions: [],
			InnerStructures: [],
			Annotations: [],
			FunctionCalls: [],
			Parameters: [],
			Imports: [],
			Exports: [],
			Extension: {} as Record<string, unknown>,
			Position: { StartLine: 0, EndLine: 0, StartColumn: 0, EndColumn: 0 },
			Content: JSON.stringify(enumObj.values, null, 2),
		};
	}

	/**
	 * 处理服务类型
	 */
	private processServiceType(
		service: protobuf.Service,
		packageName: string,
		filePath: string,
		module: string
	): CodeDataStruct {
		const functions: CodeFunction[] = [];

		// 处理服务方法
		for (const [methodName, method] of Object.entries(service.methods)) {
			functions.push({
				Name: methodName,
				ReturnType: method.responseType,
				Parameters: [{
					Name: 'request',
					Type: method.requestType
				}],
				IsStatic: false,
				IsConstructor: false,
				IsAsync: !!(method.requestStream || method.responseStream),
				Decorators: [],
				Content: '',
			});
		}

		return {
			NodeName: service.name,
			Module: module,
			Type: DataStructType.Interface,
			Package: packageName,
			FilePath: filePath,
			Fields: [],
			MultipleExtend: [],
			Implements: [],
			Extend: '',
			Functions: functions,
			InnerStructures: [],
			Annotations: [],
			FunctionCalls: [],
			Parameters: [],
			Imports: [],
			Exports: [],
			Extension: {} as Record<string, unknown>,
			Position: { StartLine: 0, EndLine: 0, StartColumn: 0, EndColumn: 0 },
			Content: JSON.stringify(service.methods, null, 2),
		};
	}

	/**
	 * 获取字段类型
	 */
	private getFieldType(field: protobuf.Field): string {
		if (field.resolvedType) {
			return field.resolvedType.name;
		}

		// 映射 protobuf 类型到对应的 TypeScript 类型
		const typeMapping: { [key: string]: string } = {
			'double': 'number',
			'float': 'number',
			'int32': 'number',
			'int64': 'number',
			'uint32': 'number',
			'uint64': 'number',
			'sint32': 'number',
			'sint64': 'number',
			'fixed32': 'number',
			'fixed64': 'number',
			'sfixed32': 'number',
			'sfixed64': 'number',
			'bool': 'boolean',
			'string': 'string',
			'bytes': 'Uint8Array',
		};

		return typeMapping[field.type] || field.type;
	}
}
