"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, RefreshCw, Code } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CodebaseContext() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contextData, setContextData] = useState<any[]>([])
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingIds, setGeneratingIds] = useState<string[]>([])

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

  // 单条AI生成
  const handleAIGenerateOne = async (id: string) => {
    setGeneratingIds((prev) => [...prev, id])
    try {
      const response = await fetch("/api/context/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      if (response.ok) {
        // 只刷新该条数据
        const updated = await fetch(`/api/context?id=${id}`)
        if (updated.ok) {
          const [updatedItem] = await updated.json()
          setContextData((prev) => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item))
          toast({
            title: "成功",
            description: "AI生成成功",
            variant: "default"
          })
        } else {
          toast({
            title: "错误",
            description: "获取更新数据失败",
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "错误",
          description: "AI生成失败",
          variant: "destructive"
        })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: "错误",
        description: "AI生成出错: " + error,
        variant: "destructive"
      })
    } finally {
      setGeneratingIds((prev) => prev.filter(_id => _id !== id))
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
    <div className="w-full max-w-[100%]">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-t-lg shadow-sm mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500"/>
            <h2 className="text-lg font-semibold">Codebase Context</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchContextData}
              disabled={isLoadingContext || isGenerating}
              className="h-8"
            >
              {isLoadingContext ? (
                <Loader2 className="h-3 w-3 animate-spin"/>
              ) : (
                <RefreshCw className="h-3 w-3 mr-1"/>
              )}
              {isLoadingContext ? "Loading..." : "Refresh Context"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsGenerating(true)}
              disabled={isGenerating || isLoadingContext}
              className="h-8"
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1"/>
              ) : null}
              {isGenerating ? "AI 生成中..." : "AI 生成"}
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Available codebase concept for concept validation
        </p>
      </div>
      <div className="overflow-y-auto">
        {isLoadingContext ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3"/>
            <p>Loading context data...</p>
          </div>
        ) : contextData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contextData.map((item, index) => {
              const codeBlocks = item.content ? extractCodeBlock(item.content) : null
              const displayTitle = item.title || item.path || item.source || "Unknown source";

              return (
                <Card key={item.id || index} className="border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col">
                  <CardHeader className="p-3 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[90%]">
                        {displayTitle}
                      </div>
                      {/* AI生成按钮：仅无title时显示 */}
                      {!item.title && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          disabled={generatingIds.includes(item.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAIGenerateOne(item.id);
                          }}
                        >
                          {generatingIds.includes(item.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : null}
                          {generatingIds.includes(item.id) ? "生成中..." : "AI生成"}
                        </Button>
                      )}
                    </div>
                    {item.language && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.language}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 bg-white dark:bg-slate-800 flex-1 overflow-hidden">
                    {item.description ? (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {item.description}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 italic">No description available</div>
                    )}

                    {/* Code content in dialog */}
                    {(codeBlocks || item.code || item.content) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="mt-3 w-full">
                            <Code className="h-4 w-4 mr-2" />
                            View Code
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                          <DialogHeader>
                            <DialogTitle>{displayTitle}</DialogTitle>
                          </DialogHeader>
                          <div className="overflow-y-auto max-h-[calc(80vh-100px)]">
                            {codeBlocks ? (
                              codeBlocks.map((block, blockIndex) => (
                                <div key={blockIndex} className="mb-3 last:mb-0 overflow-x-auto">
                                  <SyntaxHighlighter
                                    language={block.language}
                                    style={vscDarkPlus}
                                    customStyle={{
                                      fontSize: "0.875rem",
                                      maxHeight: "400px",
                                      overflow: "auto",
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
                                  maxHeight: "400px",
                                  overflow: "auto",
                                }}
                              >
                                {item.code}
                              </SyntaxHighlighter>
                            ) : (
                              <div className="text-sm whitespace-pre-wrap overflow-y-auto max-h-[400px]">
                                {item.content || "No content available"}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center p-8 text-slate-500">
            <p>No context data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

