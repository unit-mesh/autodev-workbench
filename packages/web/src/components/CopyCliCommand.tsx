import React, { useEffect, useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CopyCliCommandProps {
	projectId: string;
	className?: string;
}

export function CopyCliCommand({ projectId, className = "" }: CopyCliCommandProps) {
	const [command, setCommand] = useState("");

	useEffect(() => {
		const serverUrl = typeof window !== 'undefined'
			? `${window.location.protocol}//${window.location.host}`
			: '';

		const baseCommand = `npx @autodev/context-worker@latest --project-id ${projectId}`;
		setCommand(serverUrl ? `${baseCommand} --server-url ${serverUrl} -p your_code_base_path` : `${baseCommand} -p your_code_base_path`);
	}, [projectId,]);

	const handleCopy = () => {
		navigator.clipboard.writeText(command)
			.then(() => toast.success('命令已复制到剪贴板'))
			.catch(() => toast.error('复制失败，请手动复制'));
	};

	return (
		<div className={`bg-muted p-4 rounded-lg font-mono text-sm flex justify-between items-center ${className}`}>
			{command}
			<Button variant="ghost" size="icon" onClick={handleCopy}>
				<ClipboardCopy className="w-4 h-4"/>
			</Button>
		</div>
	);
}
