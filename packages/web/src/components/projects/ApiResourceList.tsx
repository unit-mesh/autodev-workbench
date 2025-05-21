import React from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ApiResource {
	sourceHttpMethod: string;
	sourceUrl: string;
	packageName: string;
	className: string;
	methodName: string;
	type?: string;
}

interface ApiResourceListProps {
	apiResources: ApiResource[];
	isLoading: boolean;
	error?: string | null;
}

// 获取 HTTP Method 对应的样式
const getMethodColorClass = (method: string): string => {
	switch (method) {
		case 'GET':
			return 'text-green-600';
		case 'POST':
			return 'text-yellow-600';
		case 'PUT':
			return 'text-blue-600';
		case 'DELETE':
			return 'text-red-600';
		default:
			return 'text-gray-600';
	}
};

// 获取 HTTP Method 对应的背景色样式
const getMethodBgClass = (method: string): string => {
	switch (method) {
		case 'GET':
			return 'bg-green-100';
		case 'POST':
			return 'bg-yellow-100';
		case 'PUT':
			return 'bg-blue-100';
		case 'DELETE':
			return 'bg-red-100';
		default:
			return 'bg-gray-100';
	}
};

const getUrlPrefix = (url: string): string => {
	if (!url || typeof url !== 'string') return '';
	const trimmedUrl = url.startsWith('/') ? url.substring(1) : url;
	const firstSegment = trimmedUrl.split('/')[0];
	return firstSegment || '';
};

export function ApiResourceList({ apiResources, isLoading, error }: ApiResourceListProps) {
	if (isLoading) {
		return (
			<div className="space-y-2">
				{[1, 2, 3].map((n) => (
					<Card key={n} className="overflow-hidden">
						<CardHeader className="p-4">
							<Skeleton className="h-5 w-40"/>
							<Skeleton className="h-4 w-64 mt-2"/>
						</CardHeader>
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-sm text-red-500 p-4 border border-red-200 rounded-lg">
				{error}
			</div>
		);
	}

	if (apiResources.length === 0) {
		return (
			<div
				className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
				<Code className="h-12 w-12 text-gray-300"/>
				<p className="text-center text-gray-500">暂无API资源</p>
			</div>
		);
	}

	// separate HTTP and RPC APIs
	const httpResources = apiResources.filter(api => api.type !== 'RPC' && api.sourceHttpMethod);
	const rpcResources = apiResources.filter(api => api.type === 'RPC' || !api.sourceHttpMethod);

	// group HTTP APIs by URL prefix, then by URL
	const httpApisByPrefix: Record<string, Record<string, ApiResource[]>> = {};
	httpResources.forEach(api => {
		const prefix = getUrlPrefix(api.sourceUrl) || '其他HTTP接口';
		if (!httpApisByPrefix[prefix]) {
			httpApisByPrefix[prefix] = {};
		}
		if (!httpApisByPrefix[prefix][api.sourceUrl]) {
			httpApisByPrefix[prefix][api.sourceUrl] = [];
		}
		httpApisByPrefix[prefix][api.sourceUrl].push(api);
	});

	return (
		<div className="space-y-6">
			{/* HTTP APIs Section */}
			{httpResources.length > 0 && (
				<Card className="overflow-hidden bg-blue-50/50">
					<CardHeader className="p-4"> {/* Increased padding */}
						<CardTitle className="text-lg font-semibold text-blue-700">
							HTTP APIs <Badge variant="outline" className="ml-2 bg-white">{httpResources.length} 个接口</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 space-y-4"> {/* Increased padding */}
						{Object.entries(httpApisByPrefix).map(([prefix, apisByUrl]) => (
							<div key={prefix} className="space-y-3">
								<h3 className="text-md font-semibold text-blue-600 mb-2 border-b border-blue-200 pb-1.5"> {/* Increased font size & padding */}
									{prefix}
								</h3>
								{Object.entries(apisByUrl).map(([url, apiInstances]) => {
									const representativeApi = apiInstances[0]; // Assuming details are consistent for the same URL
									return (
										<div key={url} className="p-3 bg-white border border-blue-200 rounded-md shadow-sm space-y-2">
											<div>
												<span className="font-mono text-sm text-gray-800 break-all" title={url}>{url}</span>
												<div className="flex flex-wrap gap-1.5 mt-1.5">
													{apiInstances.map((api, idx) => (
														<span
															key={idx}
															className={`text-xs font-semibold py-0.5 px-1.5 rounded-sm ${getMethodBgClass(api.sourceHttpMethod)} ${getMethodColorClass(api.sourceHttpMethod)}`}
														>
															{api.sourceHttpMethod}
														</span>
													))}
												</div>
											</div>
											{(representativeApi.packageName || representativeApi.className || representativeApi.methodName) && (
												<div className="text-sm space-y-1 pt-2 border-t border-blue-100 mt-2">
													{representativeApi.packageName && (
														<div className="flex items-baseline">
															<span className="text-gray-500 font-medium w-20 text-xs flex-shrink-0">Package:</span>
															<span className="font-mono text-gray-700 truncate" title={representativeApi.packageName}>
																{representativeApi.packageName}
															</span>
														</div>
													)}
													{representativeApi.className && (
														<div className="flex items-baseline">
															<span className="text-gray-500 font-medium w-20 text-xs flex-shrink-0">Class:</span>
															<span className="font-mono text-blue-600 truncate" title={representativeApi.className}>
																{representativeApi.className}
															</span>
														</div>
													)}
													{representativeApi.methodName && (
														<div className="flex items-baseline">
															<span className="text-gray-500 font-medium w-20 text-xs flex-shrink-0">Handler:</span>
															<span className="font-mono text-green-600 truncate" title={representativeApi.methodName}>
																{representativeApi.methodName}()
															</span>
														</div>
													)}
												</div>
											)}
										</div>
									);
								})}
							</div>
						))}
					</CardContent>
				</Card>
			)}

			{/* RPC APIs Section */}
			{rpcResources.length > 0 && (
				<Card className="overflow-hidden bg-green-50/50">
					<CardHeader className="p-4"> {/* Increased padding */}
						<CardTitle className="text-lg font-semibold text-green-700">
							RPC APIs <Badge variant="outline" className="ml-2 bg-white">{rpcResources.length} 个接口</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 space-y-3"> {/* Increased padding */}
						{rpcResources.map((api, index) => (
							<div key={index} className="border border-green-200 rounded-md overflow-hidden bg-white shadow-sm">
								<div className="flex items-center border-b border-green-200 bg-green-100/50 p-2.5"> {/* Increased padding */}
									<span className="font-mono text-sm text-green-800 flex-1 truncate" title={api.sourceUrl || `${api.packageName}.${api.className}/${api.methodName}`}>
										{api.sourceUrl || `${api.packageName}.${api.className}/${api.methodName}`}
									</span>
									<Badge variant="outline" className="ml-2 text-xs bg-white text-green-700 border-green-300">
										RPC
									</Badge>
								</div>
								<div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"> {/* Increased padding, gap, and base text size */}
									<div className="overflow-hidden">
										<div className="text-gray-500 font-medium text-xs">Package</div>
										<div className="font-mono text-gray-700 truncate" title={api.packageName}>{api.packageName || '-'}</div>
									</div>
									<div className="overflow-hidden">
										<div className="text-gray-500 font-medium text-xs">Class</div>
										<div className="font-mono text-blue-600 truncate" title={api.className}>{api.className || '-'}</div>
									</div>
									<div className="overflow-hidden">
										<div className="text-gray-500 font-medium text-xs">Method</div>
										<div className="font-mono text-green-600 truncate" title={api.methodName}>{api.methodName}()</div>
									</div>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
