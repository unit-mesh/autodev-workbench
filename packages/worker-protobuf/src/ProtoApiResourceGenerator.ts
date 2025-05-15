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
			// 只处理服务类型(Interface)的数据结构
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
		// 如果有流式响应或请求，使用 WebSocket
		if (func.IsAsync) {
			return 'WS';
		}

		// 根据函数名猜测方法类型
		const lowerName = func.Name.toLowerCase();
		if (lowerName.startsWith('get') || lowerName.startsWith('query') || lowerName.startsWith('list')) {
			return 'GET';
		} else if (lowerName.startsWith('create') || lowerName.startsWith('add')) {
			return 'POST';
		} else if (lowerName.startsWith('update') || lowerName.startsWith('modify')) {
			return 'PUT';
		} else if (lowerName.startsWith('delete') || lowerName.startsWith('remove')) {
			return 'DELETE';
		}

		// 默认使用 POST
		return 'POST';
	}
}
