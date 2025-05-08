"use client"
import { Textarea } from "@/components/ui/textarea"

interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <Textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm p-4 min-h-[300px] resize-y"
        placeholder="Enter your code here..."
      />
    </div>
  )
}
