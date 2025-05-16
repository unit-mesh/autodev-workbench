import React, { useEffect, useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CopyCliCommandProps {
  projectId: string;
  variant?: "simple" | "withPath";
  className?: string;
}

export function CopyCliCommand({ projectId, variant = "simple", className = "" }: CopyCliCommandProps) {
  const [command, setCommand] = useState("");

  useEffect(() => {
    const serverUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : '';

    // Create the command with the server URL parameter
    const baseCommand = variant === "simple"
      ? `npx @autodev/context-worker ${projectId}`
      : `npx @autodev/context-worker --project-id ${projectId} your_code_base_path`;

    // Add the server-url parameter if we have a valid serverUrl
    setCommand(serverUrl ? `${baseCommand} --server-url ${serverUrl}` : baseCommand);
  }, [projectId, variant]);

  const handleCopy = () => {
    navigator.clipboard.writeText(command)
      .then(() => toast.success('命令已复制到剪贴板'))
      .catch(() => toast.error('复制失败，请手动复制'));
  };

  return (
    <div className={`bg-muted p-4 rounded-lg font-mono text-sm flex justify-between items-center ${className}`}>
      {command}
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        <ClipboardCopy className="w-4 h-4" />
      </Button>
    </div>
  );
}
