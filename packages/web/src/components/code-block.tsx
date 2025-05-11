"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import Prism from "prismjs"

import "prismjs/themes/prism-tomorrow.css"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-css"
import "prismjs/components/prism-scss"
import "prismjs/components/prism-json"

interface CodeBlockProps {
  code: string
  language: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [code, language])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
  }

  // Map common language names to Prism's language classes
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
  }

  const prismLanguage = languageMap[language.toLowerCase()] || "javascript"

  return (
    <div className="relative">
      <Button variant="outline" size="icon" className="absolute top-2 right-2 z-10" onClick={copyToClipboard}>
        <Copy size={16} />
      </Button>
      <pre className="rounded-md bg-gray-900 p-4 overflow-x-auto">
        <code ref={codeRef} className={`language-${prismLanguage}`}>
          {code}
        </code>
      </pre>
    </div>
  )
}
