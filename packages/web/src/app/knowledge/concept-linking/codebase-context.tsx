"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, RefreshCw } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

export function CodebaseContext() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contextData, setContextData] = useState<any[]>([])
  const [isLoadingContext, setIsLoadingContext] = useState(false)

  // Function to fetch context data
  const fetchContextData = async () => {
    setIsLoadingContext(true)
    try {
      const response = await fetch("/api/context")
      if (response.ok) {
        const data = await response.json()
        setContextData(data)
      } else {
        console.error("Failed to fetch context data")
      }
    } catch (error) {
      console.error("Error fetching context data:", error)
    } finally {
      setIsLoadingContext(false)
    }
  }

  // Fetch context data on component mount
  useEffect(() => {
    fetchContextData()
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLanguageFromContext = (item: any) => {
    if (item.language) return item.language.toLowerCase()
    if (item.path) {
      const extension = item.path.split(".").pop()?.toLowerCase()
      switch (extension) {
        case "js":
          return "javascript"
        case "ts":
          return "typescript"
        case "tsx":
          return "tsx"
        case "jsx":
          return "jsx"
        case "py":
          return "python"
        case "java":
          return "java"
        case "rb":
          return "ruby"
        case "go":
          return "go"
        case "php":
          return "php"
        case "c":
          return "c"
        case "cpp":
          return "cpp"
        case "cs":
          return "csharp"
        case "html":
          return "html"
        case "css":
          return "css"
        case "json":
          return "json"
        case "md":
          return "markdown"
        case "yaml":
        case "yml":
          return "yaml"
        default:
          return "text"
      }
    }
    return "text"
  }

  // Function to extract code blocks from content
  const extractCodeBlock = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9]+)?\s*\n([\s\S]*?)```/g
    const matches = [...content.matchAll(codeBlockRegex)]

    if (matches.length > 0) {
      return matches.map((match) => ({
        language: match[1] || "text",
        code: match[2].trim(),
      }))
    }

    return null
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden w-full max-w-[100%]">
      <CardHeader
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500"/>
            <CardTitle className="text-lg">Codebase Context</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContextData}
            disabled={isLoadingContext}
            className="h-8"
          >
            {isLoadingContext ? (
              <Loader2 className="h-3 w-3 animate-spin"/>
            ) : (
              <RefreshCw className="h-3 w-3 mr-1"/>
            )}
            {isLoadingContext ? "Loading..." : "Refresh Context"}
          </Button>
        </div>
        <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Available codebase concept for concept validation
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {isLoadingContext ? (
            <div className="flex flex-col items-center justify-center p-8 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3"/>
              <p>Loading context data...</p>
            </div>
          ) : contextData.length > 0 ? (
            contextData.map((item, index) => {
              const codeBlocks = item.content ? extractCodeBlock(item.content) : null

              return (
                <div
                  key={item.id || index}
                  className={`border-b border-slate-200 dark:border-slate-700 ${
                    index === contextData.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                        {item.path || item.source || "Unknown source"}
                      </div>
                      {item.language && (
                        <Badge variant="outline" className="text-xs">
                          {item.language}
                        </Badge>
                      )}
                    </div>
                    {item.title && <div className="mt-1 font-medium text-sm">{item.title}</div>}
                    {item.description && (
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800">
                    {codeBlocks ? (
                      codeBlocks.map((block, blockIndex) => (
                        <div key={blockIndex} className="mb-3 last:mb-0">
                          <SyntaxHighlighter
                            language={block.language}
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            {block.code}
                          </SyntaxHighlighter>
                        </div>
                      ))
                    ) : item.code ? (
                      <SyntaxHighlighter
                        language={getLanguageFromContext(item)}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          borderRadius: "0.375rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        {item.code}
                      </SyntaxHighlighter>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">
                        {item.content || "No content available"}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center p-8 text-slate-500">
              <p>No context data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
