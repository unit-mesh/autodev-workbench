import React, { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Copy, FileText } from "lucide-react"
import { ApiResource, CodeAnalysis, Guideline } from "@/types/project.type"

interface AssetRecommendationProps {
  keywords: string[]
  selectedAPIs: string[]
  selectedCodeSnippets: string[]
  selectedStandards: string[]
  onSelectAPI: (apiId: string) => void
  onSelectCodeSnippet: (snippetId: string) => void
  onSelectStandard: (standardId: string) => void
  onConfirm: () => void
}

export default function AssetRecommendation(props: AssetRecommendationProps) {
  const {
    keywords,
    selectedAPIs,
    selectedCodeSnippets,
    selectedStandards,
    onSelectAPI,
    onSelectCodeSnippet,
    onSelectStandard,
    onConfirm,
  } = props

  const [apis, setApis] = useState<ApiResource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // 获取 API 资源
  useEffect(() => {
    const fetchApis = async () => {
      setIsLoading(true)
      setApiError(null)
      try {
        const response = await fetch('/api/context/api')
        if (!response.ok) throw new Error(`Failed to fetch APIs: ${response.status}`)
        setApis(await response.json())
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Unknown error occurred")
        setApis([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchApis()
  }, [])

  const [guidelines, setGuidelines] = useState<Guideline[]>([])
  useEffect(() => {
    fetch("/api/guidelines")
      .then(res => res.json())
      .then(data => setGuidelines(data))
      .catch(() => setGuidelines([]))
  }, [])

  const [codeSnippets, setCodeSnippets] = useState<CodeAnalysis[]>([])
  useEffect(() => {
    fetch("/api/context/code")
      .then(res => res.json())
      .then(data => setCodeSnippets(data))
      .catch(() => setCodeSnippets([]))
  }, [])

  const filteredApis = apis
  const filteredCodeSnippets = codeSnippets
  const filteredStandards = guidelines

  return (
    <div className="space-y-4">
      <p>根据您的需求，我找到了以下可能有用的资源：</p>
      <Tabs defaultValue="apis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="apis">API ({filteredApis.length})</TabsTrigger>
          <TabsTrigger value="code">代码片段 ({filteredCodeSnippets.length})</TabsTrigger>
          <TabsTrigger value="standards">规范 ({filteredStandards.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="apis" className="mt-2 space-y-2">
          {isLoading ? <div>加载中...</div> : apiError ? <div className="text-red-500">{apiError}</div> :
            filteredApis.map((api: ApiResource) => (
              <Card key={api.id} className="overflow-hidden">
                <CardHeader className="py-2 px-3 bg-muted/50 flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`h-4 w-4 ${selectedAPIs.includes(api.id) ? 'text-green-500' : 'text-gray-300'}`} />
                    <CardTitle className="text-sm font-medium">{api.sourceHttpMethod} {api.sourceUrl}</CardTitle>
                  </div>
                  <Checkbox
                    checked={selectedAPIs.includes(api.id)}
                    onCheckedChange={() => onSelectAPI(api.id)}
                  />
                </CardHeader>
                <CardContent className="p-3 text-sm">
                  <p>{api.className} {api.packageName}</p>
                </CardContent>
              </Card>
            ))
          }
        </TabsContent>
        <TabsContent value="code" className="mt-2 space-y-2">
          {filteredCodeSnippets.map((snippet: CodeAnalysis) => (
            <Card key={snippet.id} className="overflow-hidden">
              <CardHeader className="py-2 px-3 bg-muted/50 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className={`h-4 w-4 ${selectedCodeSnippets.includes(snippet.id) ? 'text-green-500' : 'text-gray-300'}`} />
                  <CardTitle className="text-sm font-medium">{snippet.title}</CardTitle>
                </div>
                <Checkbox
                  checked={selectedCodeSnippets.includes(snippet.id)}
                  onCheckedChange={() => onSelectCodeSnippet(snippet.id)}
                />
              </CardHeader>
              <CardContent className="p-3 text-sm">
                <p>{snippet.description}</p>
                <div className="mt-2 text-xs bg-zinc-900 text-zinc-100 p-2 rounded font-mono overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span>{snippet.language}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 text-zinc-400 hover:text-zinc-100"
                      onClick={() => navigator.clipboard.writeText(snippet.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    <pre>{snippet.content.split('\n').slice(0, 5).join('\n') + (snippet.content.split('\n').length > 5 ? '\n...' : '')}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="standards" className="mt-2 space-y-2">
          {filteredStandards.map((standard: Guideline) => (
            <Card key={standard.id} className="overflow-hidden">
              <CardHeader className="py-2 px-3 bg-muted/50 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className={`h-4 w-4 ${selectedStandards.includes(standard.id) ? 'text-green-500' : 'text-gray-300'}`} />
                  <CardTitle className="text-sm font-medium">
                    {standard.title} <span className="text-xs font-normal">{standard.version}</span>
                  </CardTitle>
                </div>
                <Checkbox
                  checked={selectedStandards.includes(standard.id)}
                  onCheckedChange={() => onSelectStandard(standard.id)}
                />
              </CardHeader>
              <CardContent className="p-3 text-sm">
                <p>{standard.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      <div className="flex space-x-2">
        <Button onClick={onConfirm}>
          确认选择
        </Button>
        <Button variant="outline">
          忽略推荐
        </Button>
      </div>
    </div>
  )
}
