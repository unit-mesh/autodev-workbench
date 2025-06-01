import React, { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Code, Copy, FileText, CheckSquare, Square } from "lucide-react"
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
        const fetchedApis = await response.json()
        setApis(fetchedApis)

      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setIsLoadingApis(false)
      }
    }
    fetchApis()
  }, [keywordsParam])

  useEffect(() => {
    const fetchGuidelines = async () => {
      setIsLoadingGuidelines(true)
      setGuidelinesError(null)
      try {
        const response = await fetch(`/api/guideline${keywordsParam ? `?${keywordsParam}` : ''}`)
        if (!response.ok) throw new Error(`Failed to fetch guidelines: ${response.status}`)
        const fetchedGuidelines = await response.json()
        setGuidelines(fetchedGuidelines)

      } catch (error) {
        setGuidelinesError(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setIsLoadingGuidelines(false)
      }
    }
    fetchGuidelines()
  }, [keywordsParam])

  useEffect(() => {
    const fetchCodeSnippets = async () => {
      setIsLoadingSnippets(true)
      setSnippetsError(null)
      try {
        const response = await fetch(`/api/context/code${keywordsParam ? `?${keywordsParam}` : ''}`)
        if (!response.ok) throw new Error(`Failed to fetch code snippets: ${response.status}`)
        const fetchedSnippets = await response.json()
        setCodeSnippets(fetchedSnippets)

        // Remove the auto-selection logic
      } catch (error) {
        setSnippetsError(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setIsLoadingSnippets(false)
      }
    }
    fetchCodeSnippets()
  }, [keywordsParam])

  const selectedCount = selectedAPIs.length + selectedCodeSnippets.length + selectedStandards.length;
  useEffect(() => {
    if (!isLoadingApis && apis.length > 0 && selectedAPIs.length === 0) {
      apis.forEach(api => onSelectAPI(api.id));
      if (onSelectAPIObjects) {
        onSelectAPIObjects(apis);
      }
    }
  }, [apis, isLoadingApis, selectedAPIs.length, onSelectAPI, onSelectAPIObjects])

  useEffect(() => {
    if (!isLoadingSnippets && codeSnippets.length > 0 && selectedCodeSnippets.length === 0) {
      codeSnippets.forEach(snippet => onSelectCodeSnippet(snippet.id));
      if (onSelectCodeSnippetObjects) {
        onSelectCodeSnippetObjects(codeSnippets);
      }
    }
  }, [codeSnippets, isLoadingSnippets, selectedCodeSnippets.length, onSelectCodeSnippet, onSelectCodeSnippetObjects])

  useEffect(() => {
    if (!isLoadingGuidelines && guidelines.length > 0 && selectedStandards.length === 0) {
      guidelines.forEach(guideline => onSelectStandard(guideline.id));
      if (onSelectStandardObjects) {
        onSelectStandardObjects(guidelines);
      }
    }
  }, [guidelines, isLoadingGuidelines, selectedStandards.length, onSelectStandard, onSelectStandardObjects])

  const handleSelectAllAPIs = () => {
    apis.forEach(api => {
      if (!selectedAPIs.includes(api.id)) {
        onSelectAPI(api.id);
      }
    });
    if (onSelectAPIObjects) {
      onSelectAPIObjects(apis);
    }
  };

  const handleDeselectAllAPIs = () => {
    selectedAPIs.forEach(apiId => onSelectAPI(apiId));
    if (onSelectAPIObjects) {
      onSelectAPIObjects([]);
    }
  };

  const handleSelectAllCodeSnippets = () => {
    codeSnippets.forEach(snippet => {
      if (!selectedCodeSnippets.includes(snippet.id)) {
        onSelectCodeSnippet(snippet.id);
      }
    });
    if (onSelectCodeSnippetObjects) {
      onSelectCodeSnippetObjects(codeSnippets);
    }
  };

  const handleDeselectAllCodeSnippets = () => {
    selectedCodeSnippets.forEach(snippetId => onSelectCodeSnippet(snippetId));
    if (onSelectCodeSnippetObjects) {
      onSelectCodeSnippetObjects([]);
    }
  };

  const handleSelectAllGuidelines = () => {
    guidelines.forEach(guideline => {
      if (!selectedStandards.includes(guideline.id)) {
        onSelectStandard(guideline.id);
      }
    });
    if (onSelectStandardObjects) {
      onSelectStandardObjects(guidelines);
    }
  };

  const handleDeselectAllGuidelines = () => {
    selectedStandards.forEach(standardId => onSelectStandard(standardId));
    if (onSelectStandardObjects) {
      onSelectStandardObjects([]);
    }
  };

  // 确认处理函数
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

    onConfirm();
  };

  const renderCodeSnippets = () => {
    if (isLoadingSnippets) {
      return (
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
      );
    }

    if (snippetsError) {
      return (
        <div className="text-sm text-red-500 p-4 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {snippetsError}
        </div>
      );
    }

    if (codeSnippets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
          <Code className="h-12 w-12 text-gray-300"/>
          <p className="text-center text-gray-500">暂无代码片段</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {codeSnippets.map((snippet: CodeAnalysis) => (
          <Card key={snippet.id} className={`overflow-hidden gap-0 py-0 shadow-sm ${selectedCodeSnippets.includes(snippet.id) ? 'ring-2 ring-primary/40' : ''}`}>
            <div className="flex justify-between items-center px-4 py-2.5 border-b bg-muted/30">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className={`h-4 w-4 ${selectedCodeSnippets.includes(snippet.id) ? 'text-primary' : 'text-gray-300'}`} />
                <h3 className="text-sm font-medium">{snippet.title}</h3>
              </div>
              <Checkbox
                checked={selectedCodeSnippets.includes(snippet.id)}
                onCheckedChange={() => onSelectCodeSnippet(snippet.id)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="p-4">
              {snippet.description && (
                <p className="text-sm text-muted-foreground mb-3">{snippet.description}</p>
              )}

              <div className="rounded-md overflow-hidden border">
                <div className="flex justify-between items-center px-3 py-2 bg-zinc-800 text-zinc-100">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-zinc-400" />
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-zinc-700 rounded">
                      {snippet.language}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    onClick={() => navigator.clipboard.writeText(snippet.content)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    复制
                  </Button>
                </div>

                <div className="bg-zinc-950 text-zinc-100">
                  <div className="overflow-x-auto overflow-y-auto max-h-[200px] p-3 text-xs font-mono">
                    <pre className="leading-relaxed whitespace-pre max-w-[600px] overflow-x-auto">{snippet.content}</pre>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CategoryControls = ({ count, onSelectAll, onDeselectAll } : any) => (
    <div className="flex justify-between items-center py-2 px-1 mb-2">
      <Badge variant="outline" className="bg-primary/10">
        {count} 项
      </Badge>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs flex items-center"
          onClick={onSelectAll}
        >
          <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
          全选
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs flex items-center"
          onClick={onDeselectAll}
        >
          <Square className="h-3.5 w-3.5 mr-1.5" />
          取消全选
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-[100%] mx-auto">
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
          {!isLoadingApis && !apiError && apis.length > 0 && (
            <CategoryControls
              count={apis.length}
              onSelectAll={handleSelectAllAPIs}
              onDeselectAll={handleDeselectAllAPIs}
            />
          )}
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
          {!isLoadingSnippets && !snippetsError && codeSnippets.length > 0 && (
            <CategoryControls
              count={codeSnippets.length}
              onSelectAll={handleSelectAllCodeSnippets}
              onDeselectAll={handleDeselectAllCodeSnippets}
            />
          )}

          {renderCodeSnippets()}
        </TabsContent>

        {/* Guidelines/Standards Tab */}
        <TabsContent value="standards" className="mt-2 max-h-[50vh] overflow-y-auto pr-1">
          {!isLoadingGuidelines && !guidelinesError && guidelines.length > 0 && (
            <CategoryControls
              count={guidelines.length}
              onSelectAll={handleSelectAllGuidelines}
              onDeselectAll={handleDeselectAllGuidelines}
            />
          )}
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
        {props.onSkip && (
          <Button variant="outline" onClick={props.onSkip}>
            跳过
          </Button>
        )}
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
      </div>
    </div>
  )
}
