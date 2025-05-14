"use client"

import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import { useState } from "react"

interface CodeBlockProps {
  language: string
  code: string
}

export default function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-950 text-gray-50 shadow-md group">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
        <span className="text-xs font-medium text-gray-400">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-gray-50 hover:bg-gray-800 transition-colors"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <div className="relative">
        <pre className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <code className="text-sm font-mono">{code}</code>
        </pre>
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none"></div>
      </div>
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none"></div>
    </div>
  )
}
