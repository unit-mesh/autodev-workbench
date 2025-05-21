import { CodeDataStruct, ApiResource, CodeFunction } from '@autodev/worker-core';

export class ProtoApiResourceGenerator {
	/**
	 * 将 CodeDataStruct 数组转换为 ApiResource 数组
	 * @param dataStructs CodeDataStruct 数组
	 * @returns ApiResource 数组
	 */
	public generateApiResources(dataStructs: CodeDataStruct[]): ApiResource[] {
		const apiResources: ApiResource[] = [];

		for (const dataStruct of dataStructs) {
			if (dataStruct.Type === 'Interface') {
				for (const func of dataStruct.Functions) {
					apiResources.push(this.convertFunctionToApiResource(dataStruct, func));
				}
			}
		}

		return apiResources;
	}

	/**
	 * 将单个函数转换为 ApiResource
	 * @param dataStruct 数据结构
	 * @param func 函数信息
	 * @returns ApiResource
	 */
	private convertFunctionToApiResource(
		dataStruct: CodeDataStruct,
		func: CodeFunction
	): ApiResource {
		return {
			id: `${dataStruct.Package}.${dataStruct.NodeName}.${func.Name}`,
			sourceUrl: `rpc/${dataStruct.Package}/${dataStruct.NodeName}/${func.Name}`.replace(/\./g, '/'),
			sourceHttpMethod: this.determineHttpMethod(func),
			packageName: dataStruct.Package,
			className: dataStruct.NodeName,
			methodName: func.Name,
			supplyType: 'PROTO_RPC_API'
		};
	}

	/**
	 * 根据函数特性确定 HTTP 方法
	 * @param func 函数信息
	 * @returns HTTP 方法字符串
	 */
	private determineHttpMethod(func: CodeFunction): string {
		if (func.IsAsync) {
			return 'WS';
		}

		const lowerName = func.Name.toLowerCase();
		if (lowerName.startsWith('get') || lowerName.startsWith('query') || lowerName.startsWith('list')) {
			return 'RPC/GET';
		} else if (lowerName.startsWith('create') || lowerName.startsWith('add')) {
			return 'RPC/POST';
		} else if (lowerName.startsWith('update') || lowerName.startsWith('modify')) {
			return 'RPC/PUT';
		} else if (lowerName.startsWith('delete') || lowerName.startsWith('remove')) {
			return 'RPC/DELETE';
		}

		return 'RPC/POST';
	}
}
