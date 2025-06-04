import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Copy, Download } from 'lucide-react';

interface ProjectGenerationHeaderProps {
	isLoading: boolean;
	isSaving: boolean;
	generatedResult: string;
	onSave: () => void;
	onCopy: () => void;
	onDownload: () => void;
}

export function ProjectGenerationHeader({
	isLoading,
	isSaving,
	generatedResult,
	onSave,
	onCopy,
	onDownload
}: ProjectGenerationHeaderProps) {
	return (
		<header className="p-4 border-b bg-white z-10 flex items-center justify-between shadow-sm">
			<div className="flex items-center">
				<h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
					后端应用生成
				</h1>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					disabled={!generatedResult}
					onClick={onDownload}
					title="下载/CLI"
				>
					<Download className="h-5 w-5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					disabled={!generatedResult}
					onClick={onCopy}
					title="复制 JSON"
				>
					<Copy className="h-5 w-5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					disabled={!generatedResult || isSaving}
					onClick={onSave}
					title="保存配置"
				>
					{isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
				</Button>
				{isLoading && (
					<div className="flex items-center space-x-2 text-sm text-muted-foreground ml-2">
						<Loader2 className="h-3 w-3 animate-spin"/>
						<span>生成中...</span>
					</div>
				)}
			</div>
		</header>
	);
}
