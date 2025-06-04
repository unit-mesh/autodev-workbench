import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface DownloadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	generatedResult: string;
	savedConfigId: string;
	onDownloadJson: () => void;
	onCopyCliCommand: () => void;
	onCopyCurlCommand: () => void;
	getCliCommand: () => string;
	getCurlCommand: () => string;
}

export function DownloadDialog({
	open,
	onOpenChange,
	generatedResult,
	savedConfigId,
	onDownloadJson,
	onCopyCliCommand,
	onCopyCurlCommand,
	getCliCommand,
	getCurlCommand
}: DownloadDialogProps) {
	const handleDownloadAndClose = () => {
		onDownloadJson();
		onOpenChange(false);
	};

	const handleCopyCliAndClose = () => {
		onCopyCliCommand();
		onOpenChange(false);
	};

	const handleCopyCurlAndClose = () => {
		onCopyCurlCommand();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>下载配置或使用 CLI</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<Button
						variant="outline"
						className="w-full"
						onClick={handleDownloadAndClose}
						disabled={!generatedResult}
					>
						<Download className="h-4 w-4 mr-2" />
						下载 JSON 配置
					</Button>
					{savedConfigId && (
						<div className="space-y-4">
							<div>
								<div className="flex items-center mb-2">
									<span className="text-sm font-medium text-gray-700">NPX 命令 (需要 Node.js)</span>
									<Button
										variant="ghost"
										size="icon"
										className="ml-2"
										onClick={handleCopyCliAndClose}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
								<code className="block text-xs text-gray-600 font-mono break-all bg-gray-100 rounded p-2">
									{getCliCommand()}
								</code>
							</div>
							<div>
								<div className="flex items-center mb-2">
									<span className="text-sm font-medium text-gray-700">Curl 安装脚本 (无需 Node.js)</span>
									<Button
										variant="ghost"
										size="icon"
										className="ml-2"
										onClick={handleCopyCurlAndClose}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
								<code className="block text-xs text-gray-600 font-mono break-all bg-gray-100 rounded p-2">
									{getCurlCommand()}
								</code>
								<p className="text-xs text-gray-500 mt-1">
									此脚本会自动检测环境并安装 Node.js（如需要），然后运行项目生成器
								</p>
							</div>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="secondary" onClick={() => onOpenChange(false)}>
						关闭
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
