import React, { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Code, Copy, FileText } from "lucide-react"
import { ApiResource, CodeAnalysis, Guideline } from "@/types/project.type"
import { Skeleton } from "@/components/ui/skeleton"

interface AssetRecommendationProps {
  keywords: string[]
  selectedAPIs: string[]
  selectedCodeSnippets: string[]
  selectedStandards: string[]
  onSelectAPI: (apiId: string) => void
  onSelectCodeSnippet: (snippetId: string) => void
  onSelectStandard: (standardId: string) => void
  onConfirm: () => void
  onSkip?: () => void
  // 新增以下回调函数，用于传递完整的对象列表
  onSelectAPIObjects?: (apis: ApiResource[]) => void
  onSelectCodeSnippetObjects?: (codeSnippets: CodeAnalysis[]) => void
  onSelectStandardObjects?: (guidelines: Guideline[]) => void
}

const getMethodColorClass = (method: string): string => {
  switch (method) {
    case 'GET':
      return 'text-green-600';
    case 'POST':
      return 'text-yellow-600';
    case 'PUT':
      return 'text-blue-600';
    case 'DELETE':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const getMethodBgClass = (method: string): string => {
  switch (method) {
    case 'GET':
      return 'bg-green-100';
    case 'POST':
      return 'bg-yellow-100';
    case 'PUT':
      return 'bg-blue-100';
    case 'DELETE':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
};

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
    onSkip,
    onSelectAPIObjects,
    onSelectCodeSnippetObjects,
    onSelectStandardObjects
  } = props

  const [apis, setApis] = useState<ApiResource[]>([])
  const [isLoadingApis, setIsLoadingApis] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const [codeSnippets, setCodeSnippets] = useState<CodeAnalysis[]>([])
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false)
  const [snippetsError, setSnippetsError] = useState<string | null>(null)

  const [guidelines, setGuidelines] = useState<Guideline[]>([])
  const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false)
  const [guidelinesError, setGuidelinesError] = useState<string | null>(null)

  const keywordsParam = keywords && keywords.length > 0 ? `keywords=${keywords.join(',')}` : '';

  useEffect(() => {
    const fetchApis = async () => {
      setIsLoadingApis(true)
      setApiError(null)
      try {
        const response = await fetch(`/api/context/api${keywordsParam ? `?${keywordsParam}` : ''}`)
        if (!response.ok) throw new Error(`Failed to fetch APIs: ${response.status}`)
        setApis(await response.json())
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setIsLoadingApis(false)
      }
    }
    fetchApis()
  }, [keywordsParam])

  // Fetch Guidelines
  useEffect(() => {
    const fetchGuidelines = async () => {
      setIsLoadingGuidelines(true)
      setGuidelinesError(null)
      try {
        const response = await fetch(`/api/guideline${keywordsParam ? `?${keywordsParam}` : ''}`)
        if (!response.ok) throw new Error(`Failed to fetch guidelines: ${response.status}`)
        setGuidelines(await response.json())
      } catch (error) {
        setGuidelinesError(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setIsLoadingGuidelines(false)
      }
    }
    fetchGuidelines()
  }, [keywordsParam])

  // Fetch Code Snippets
  useEffect(() => {
    const fetchCodeSnippets = async () => {
      setIsLoadingSnippets(true)
      setSnippetsError(null)
      try {
        const response = await fetch(`/api/context/code${keywordsParam ? `?${keywordsParam}` : ''}`)
        if (!response.ok) throw new Error(`Failed to fetch code snippets: ${response.status}`)
        setCodeSnippets(await response.json())
      } catch (error) {
        setSnippetsError(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setIsLoadingSnippets(false)
      }
    }
    fetchCodeSnippets()
  }, [keywordsParam])

  // 修改 useEffect 钩子，在 API 数据加载完成后检查和传递已选对象
  useEffect(() => {
    if (!isLoadingApis && apis.length > 0 && selectedAPIs.length > 0 && onSelectAPIObjects) {
      const selectedApiObjects = apis.filter(api => selectedAPIs.includes(api.id));
      onSelectAPIObjects(selectedApiObjects);
    }
  }, [apis, isLoadingApis, selectedAPIs, onSelectAPIObjects]);

  // 为代码片段添加类似的 useEffect
  useEffect(() => {
    if (!isLoadingSnippets && codeSnippets.length > 0 && selectedCodeSnippets.length > 0 && onSelectCodeSnippetObjects) {
      const selectedCodeObjects = codeSnippets.filter(snippet => selectedCodeSnippets.includes(snippet.id));
      onSelectCodeSnippetObjects(selectedCodeObjects);
    }
  }, [codeSnippets, isLoadingSnippets, selectedCodeSnippets, onSelectCodeSnippetObjects]);

  // 为规范指南添加类似的 useEffect
  useEffect(() => {
    if (!isLoadingGuidelines && guidelines.length > 0 && selectedStandards.length > 0 && onSelectStandardObjects) {
      const selectedGuidelineObjects = guidelines.filter(guideline => selectedStandards.includes(guideline.id));
      onSelectStandardObjects(selectedGuidelineObjects);
    }
  }, [guidelines, isLoadingGuidelines, selectedStandards, onSelectStandardObjects]);

  // 修改 onConfirm 处理逻辑，在确认前确保传递完整对象
  const handleConfirm = () => {
    // 在确认前传递所有已选对象
    if (onSelectAPIObjects) {
      const selectedApiObjects = apis.filter(api => selectedAPIs.includes(api.id));
      onSelectAPIObjects(selectedApiObjects);
    }
    
    if (onSelectCodeSnippetObjects) {
      const selectedCodeObjects = codeSnippets.filter(snippet => selectedCodeSnippets.includes(snippet.id));
      onSelectCodeSnippetObjects(selectedCodeObjects);
    }
    
    if (onSelectStandardObjects) {
      const selectedGuidelineObjects = guidelines.filter(guideline => selectedStandards.includes(guideline.id));
      onSelectStandardObjects(selectedGuidelineObjects);
    }

    // 调用原始的确认回调
    onConfirm();
  };

  const selectedCount = selectedAPIs.length + selectedCodeSnippets.length + selectedStandards.length

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm">
          <span className="font-semibold">关键词：</span>
          {keywords.map((keyword, index) => (
            <span key={index} className="text-sm text-gray-500">
              {keyword}{index < keywords.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
        <p className="text-sm text-muted-foreground">根据您的需求，系统找到了以下可能有用的资源：</p>
        {selectedCount > 0 && (
          <Badge variant="outline" className="bg-primary/10">
            已选 {selectedCount} 项资源
          </Badge>
        )}
      </div>

      <Tabs defaultValue="apis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="apis">
            API 资源 <Badge variant="outline" className="ml-2">{apis.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="code">
            代码片段 <Badge variant="outline" className="ml-2">{codeSnippets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="standards">
            规范指南 <Badge variant="outline" className="ml-2">{guidelines.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* API Resources Tab */}
        <TabsContent value="apis" className="mt-2 max-h-[50vh] overflow-y-auto pr-1">
          {isLoadingApis ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="overflow-hidden">
                  <CardHeader className="p-3">
                    <Skeleton className="h-5 w-40"/>
                    <Skeleton className="h-4 w-64 mt-2"/>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : apiError ? (
            <div className="text-sm text-red-500 p-4 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {apiError}
            </div>
          ) : apis.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
              <Code className="h-12 w-12 text-gray-300"/>
              <p className="text-center text-gray-500">暂无API资源</p>
            </div>
          ) : (
            <Card className="overflow-hidden bg-blue-50/50">
              <CardContent className="p-4 space-y-3">
                {apis.map((api: ApiResource) => (
                  <div key={api.id} className="p-3 bg-white border border-blue-200 rounded-md shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className={`h-4 w-4 ${selectedAPIs.includes(api.id) ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className="font-mono text-sm text-gray-800 break-all" title={api.sourceUrl}>
                          {api.sourceUrl}
                        </span>
                      </div>
                      <Checkbox
                        checked={selectedAPIs.includes(api.id)}
                        onCheckedChange={() => onSelectAPI(api.id)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {api.sourceHttpMethod && (
                        <span
                          className={`text-xs font-semibold py-0.5 px-1.5 rounded-sm ${getMethodBgClass(api.sourceHttpMethod)} ${getMethodColorClass(api.sourceHttpMethod)}`}
                        >
                          {api.sourceHttpMethod}
                        </span>
                      )}
                    </div>

                    <div className="text-sm space-y-1 pt-2 border-t border-blue-100 mt-2">
                      {api.packageName && (
                        <div className="flex items-baseline">
                          <span className="text-gray-500 font-medium w-20 text-xs flex-shrink-0">Package:</span>
                          <span className="font-mono text-gray-700 truncate" title={api.packageName}>
                            {api.packageName}
                          </span>
                        </div>
                      )}
                      {api.className && (
                        <div className="flex items-baseline">
                          <span className="text-gray-500 font-medium w-20 text-xs flex-shrink-0">Class:</span>
                          <span className="font-mono text-blue-600 truncate" title={api.className}>
                            {api.className}
                          </span>
                        </div>
                      )}
                      {api.methodName && (
                        <div className="flex items-baseline">
                          <span className="text-gray-500 font-medium w-20 text-xs flex-shrink-0">Method:</span>
                          <span className="font-mono text-green-600 truncate" title={api.methodName}>
                            {api.methodName}()
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Code Snippets Tab */}
        <TabsContent value="code" className="mt-2 max-h-[50vh] overflow-y-auto pr-1">
          {isLoadingSnippets ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <Card key={n} className="overflow-hidden">
                  <CardHeader className="p-3">
                    <Skeleton className="h-5 w-40"/>
                    <Skeleton className="h-4 w-64 mt-2"/>
                  </CardHeader>
                  <CardContent className="p-3">
                    <Skeleton className="h-24 w-full"/>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : snippetsError ? (
            <div className="text-sm text-red-500 p-4 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {snippetsError}
            </div>
          ) : codeSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
              <Code className="h-12 w-12 text-gray-300"/>
              <p className="text-center text-gray-500">暂无代码片段</p>
            </div>
          ) : (
            <div className="space-y-3">
              {codeSnippets.map((snippet: CodeAnalysis) => (
                <Card key={snippet.id} className={`overflow-hidden ${selectedCodeSnippets.includes(snippet.id) ? 'border-green-500 bg-green-50/30' : ''}`}>
                  <CardHeader className="px-4 py-2 pb-0 bg-muted/50 flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className={`h-4 w-4 ${selectedCodeSnippets.includes(snippet.id) ? 'text-green-500' : 'text-gray-300'}`} />
                      <CardTitle className="text-sm font-medium">{snippet.title}</CardTitle>
                    </div>
                    <Checkbox
                      checked={selectedCodeSnippets.includes(snippet.id)}
                      onCheckedChange={() => onSelectCodeSnippet(snippet.id)}
                      className="data-[state=checked]:bg-green-600"
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
            </div>
          )}
        </TabsContent>

        {/* Guidelines/Standards Tab */}
        <TabsContent value="standards" className="mt-2 max-h-[50vh] overflow-y-auto pr-1">
          {isLoadingGuidelines ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <Card key={n} className="overflow-hidden">
                  <CardHeader className="p-3">
                    <Skeleton className="h-5 w-40"/>
                    <Skeleton className="h-4 w-64 mt-2"/>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : guidelinesError ? (
            <div className="text-sm text-red-500 p-4 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {guidelinesError}
            </div>
          ) : guidelines.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
              <FileText className="h-12 w-12 text-gray-300"/>
              <p className="text-center text-gray-500">暂无规范指南</p>
            </div>
          ) : (
            <Card className="overflow-hidden bg-green-50/50">
              <CardContent className="p-4 space-y-3">
                {guidelines.map((standard: Guideline) => (
                  <div key={standard.id} className={`p-3 border rounded-md shadow-sm space-y-2 ${
                    selectedStandards.includes(standard.id) 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-white border-green-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <FileText className={`h-4 w-4 ${selectedStandards.includes(standard.id) ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className="font-medium text-sm">
                          {standard.title} {standard.version && <span className="text-xs font-normal text-gray-500">{standard.version}</span>}
                        </span>
                      </div>
                      <Checkbox
                        checked={selectedStandards.includes(standard.id)}
                        onCheckedChange={() => onSelectStandard(standard.id)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>

                    <div className="text-sm text-gray-600 mt-1">
                      {standard.description}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex space-x-2 pt-2">
        <Button
          onClick={handleConfirm}
          disabled={selectedCount === 0}
          className="relative"
        >
          确认选择
          {selectedCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCount}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onSkip}
        >
          忽略推荐
        </Button>
      </div>
    </div>
  )
}
