import React from "react";
import {
	Card,
	CardHeader,
	CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

	const httpPrefixKeys = Object.keys(httpApisByPrefix);
	const showRpcTab = rpcResources.length > 0;
	const rpcTabValue = "__rpc__";

	const allTabKeys = [...httpPrefixKeys];
	if (showRpcTab) {
		allTabKeys.push(rpcTabValue);
	}

	if (allTabKeys.length === 0 && !showRpcTab && httpResources.length === 0 && rpcResources.length === 0) {
		// but kept for clarity if logic evolves.
		return (
			<div
				className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
				<Code className="h-12 w-12 text-gray-300"/>
				<p className="text-center text-gray-500">暂无API资源</p>
			</div>
		);
	}

	// Determine default tab: first HTTP prefix, or RPC if no HTTP, or null if no tabs
	const getDefaultTabValue = () => {
		if (httpPrefixKeys.length > 0) {
			return httpPrefixKeys[0];
		}
		if (showRpcTab) {
			return rpcTabValue;
		}
		return undefined; // Should not happen if allTabKeys has items
	}

	const defaultTab = getDefaultTabValue();

	// If there are no specific HTTP prefixes and no RPC APIs, but httpResources might exist (e.g. all under '其他HTTP接口')
	// and that single prefix is the only content, tabs might be overkill.
	// However, the request is to base tabs on httpApisByPrefix.
	// If allTabKeys is empty here, it means no HTTP prefixes and no RPCs, handled by the earlier check.

	return (
		<Tabs defaultValue={defaultTab} className="w-full">
			<TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${allTabKeys.length}, minmax(0, 1fr))` }}>
				{httpPrefixKeys.map(prefixKey => (
					<TabsTrigger key={prefixKey} value={prefixKey}>
						{prefixKey.toUpperCase()} <Badge variant="outline" className="ml-2">{Object.keys(httpApisByPrefix[prefixKey]).length}</Badge>
					</TabsTrigger>
				))}
				{showRpcTab && (
					<TabsTrigger value={rpcTabValue}>
						RPC APIs <Badge variant="outline" className="ml-2">{rpcResources.length}</Badge>
					</TabsTrigger>
				)}
			</TabsList>

			{httpPrefixKeys.map(prefixKey => {
				const apisByUrl = httpApisByPrefix[prefixKey];
				return (
					<TabsContent key={prefixKey} value={prefixKey} className="mt-4">
						<Card className="overflow-hidden bg-blue-50/50">
							<CardContent className="p-4 space-y-4">
								{/* Removed the explicit prefix header h3 as it's now in the tab title */}
								{Object.entries(apisByUrl).map(([url, apiInstances]) => {
									const representativeApi = apiInstances[0];
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
							</CardContent>
						</Card>
					</TabsContent>
				);
			})}

			{showRpcTab && (
				<TabsContent value={rpcTabValue} className="mt-4">
					{rpcResources.length > 0 ? ( // This check is somewhat redundant due to showRpcTab but good for safety
						<Card className="overflow-hidden bg-green-50/50">
							<CardContent className="p-4 space-y-3">
								{rpcResources.map((api, index) => (
									<div key={index} className="border border-green-200 rounded-md overflow-hidden bg-white shadow-sm">
										<div className="flex items-center border-b border-green-200 bg-green-100/50 p-2.5">
											<span className="font-mono text-sm text-green-800 flex-1 truncate" title={api.sourceUrl || `${api.packageName}.${api.className}/${api.methodName}`}>
												{api.sourceUrl || `${api.packageName}.${api.className}/${api.methodName}`}
											</span>
											<Badge variant="outline" className="ml-2 text-xs bg-white text-green-700 border-green-300">
												RPC
											</Badge>
										</div>
										<div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
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
					) : (
						// This case should ideally not be reached if showRpcTab is true and rpcResources.length is 0
						// but as a fallback:
						<div className="text-center text-gray-500 py-8">No RPC APIs found.</div>
					)}
				</TabsContent>
			)}
		</Tabs>
	);
}
