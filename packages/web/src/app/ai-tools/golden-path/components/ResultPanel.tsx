import React from 'react';
import { Loader2, FileJson } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeBlock } from "@/components/code/code-block";
import { ProjectMetadata } from '../types';
import { FRAMEWORKS } from '../constants';

interface ResultPanelProps {
	metadata: ProjectMetadata;
	generatedResult: string;
	isLoading: boolean;
}

export function ResultPanel({
	metadata,
	generatedResult,
	isLoading
}: ResultPanelProps) {
	const allFrameworks = Object.values(FRAMEWORKS).flat();
	const currentFrameworkLabel = allFrameworks.find(f => f.value === metadata.framework)?.label || '';
	const isLegacyFramework = allFrameworks.find(f => f.value === metadata.framework)?.legacy;

	return (
		<div className="flex flex-col h-full bg-white border-l">
			<div className="p-3 border-b">
				<div className="flex items-center space-x-2">
					<FileJson className="h-5 w-5 text-blue-500"/>
					<h2 className="text-base font-medium">配置预览</h2>
				</div>
				<p className="text-xs text-muted-foreground mt-1">
					{metadata.name ?
						`${metadata.name} (${metadata.language} / ${currentFrameworkLabel})` :
						"生成的项目配置将显示在这里"
					}
					{isLegacyFramework && (
						<span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded">
							Legacy
						</span>
					)}
				</p>
			</div>

			<div className="flex-1 overflow-hidden p-4">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center h-full">
						<Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4"/>
						<p className="text-muted-foreground">生成项目配置中，这可能需要一点时间...</p>
					</div>
				) : generatedResult ? (
					<ScrollArea className="h-full w-full">
						<CodeBlock code={generatedResult} language="json"/>
					</ScrollArea>
				) : (
					<div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
						<FileJson size={48} className="mb-4 text-blue-200"/>
						<p className="text-sm">填写项目信息并点击&#34;生成项目配置&#34;按钮</p>
						<p className="text-xs mt-2">配置生成后将显示在此处</p>
					</div>
				)}
			</div>
		</div>
	);
}
