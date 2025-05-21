import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Code, Search, Loader2 } from "lucide-react"
import { Project } from "@/types/project.type"
import { CodeAnalysisItem, CodeAnalysisList } from "@/components/code-analysis/code-analysis-list"
import { Input } from "@/components/ui/input"
import { Dispatch, SetStateAction, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { ApiResourceList } from "./ApiResourceList"

interface ProjectResourcesProps {
  project: Project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  symbols: any[]
  symbolSearch: string
  symbolLoading: boolean
  setSymbolSearch: Dispatch<SetStateAction<string>>
  fetchSymbols: (query?: string) => Promise<void>
  refreshProject: () => void
  onOpenGuidelineModal: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiResources: any[]
  isLoadingApiResources: boolean
  apiResourcesError: string | null
}

export function ProjectResources({
  project,
  symbols,
  symbolSearch,
  symbolLoading,
  setSymbolSearch,
  fetchSymbols,
  refreshProject,
  onOpenGuidelineModal,
  apiResources,
  isLoadingApiResources,
  apiResourcesError,
}: ProjectResourcesProps) {
  const [analyzingSymbolIds, setAnalyzingSymbolIds] = useState<string[]>([]);

  const handleSymbolSearch = () => {
    fetchSymbols(symbolSearch);
  };

  const handleTabChange = (value: string) => {
    if (value === "symbols" && symbols.length === 0) {
      fetchSymbols();
    }
  };

  const handleAnalyzeSymbol = async (symbolId: string) => {
    setAnalyzingSymbolIds(prev => [...prev, symbolId]);
    try {
      const response = await fetch("/api/symbols/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbolId,
          projectId: project.id
        })
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: "符号分析已完成，概念已添加到词典",
          variant: "default"
        });
        refreshProject();
      } else {
        const errorData = await response.json();
        toast({
          title: "错误",
          description: errorData.message || "符号分析失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "处理符号分析时出错",
        variant: "destructive"
      });
    } finally {
      setAnalyzingSymbolIds(prev => prev.filter(id => id !== symbolId));
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>项目资源</CardTitle>
        <CardDescription>浏览项目的所有资源</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="guidelines" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="guidelines">规范文档</TabsTrigger>
            <TabsTrigger value="code">代码分析</TabsTrigger>
            <TabsTrigger value="dictionary">概念词典</TabsTrigger>
            <TabsTrigger value="symbols">符号分析</TabsTrigger>
            <TabsTrigger value="api">API资源</TabsTrigger>
          </TabsList>

          <TabsContent value="guidelines" className="mt-4">
            {project.guidelines.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">规范文档列表</h3>
                  <Button size="sm" variant="outline" onClick={onOpenGuidelineModal}>
                    <BookOpen className="h-4 w-4 mr-2"/>
                    新建规范
                  </Button>
                </div>
                <div className="divide-y">
                  {project.guidelines.map((guideline) => (
                    <div key={guideline.id} className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{guideline.title}</h4>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {guideline.description || guideline.content.substring(0, 120) + '...'}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge
                              variant={guideline.status === 'PUBLISHED' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {guideline.status === 'PUBLISHED' ? '已发布' :
                                guideline.status === 'DRAFT' ? '草稿' : '已归档'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {typeof guideline.category === 'object' ? guideline.category.name || '未分类' : '未分类'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(guideline.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          查看
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
                <BookOpen className="h-12 w-12 text-gray-300"/>
                <p className="text-center text-gray-500">暂无规范文档</p>
                <Button size="sm" onClick={onOpenGuidelineModal}>
                  创建第一个规范文档
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            {project.codeAnalyses.length > 0 ? (
              <div className="space-y-4">
                <CodeAnalysisList
                  codeAnalyses={project.codeAnalyses as CodeAnalysisItem[]}
                  projectId={project.id}
                  onRefresh={refreshProject}
                />
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
                <Code className="h-12 w-12 text-gray-300"/>
                <p className="text-center text-gray-500">暂无代码分析</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dictionary" className="mt-4">
            {project.conceptDictionaries.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">概念词典列表</h3>
                  <Button size="sm" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2"/>
                    添加词条
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文术语
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">英文术语
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文描述
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作
                      </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {project.conceptDictionaries.map((term) => (
                      <tr key={term.id}>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{term.termChinese}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{term.termEnglish}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{term.descChinese}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button size="sm" variant="ghost">查看</Button>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
                <BookOpen className="h-12 w-12 text-gray-300"/>
                <p className="text-center text-gray-500">暂无概念词典</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="symbols" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="搜索符号..."
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline" size="sm" onClick={handleSymbolSearch} disabled={symbolLoading}>
                  {symbolLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  搜索
                </Button>
              </div>

              {symbolLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <Card key={n} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-64 mt-2" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : symbols.length > 0 ? (
                <div className="space-y-2">
                  {symbols.map((symbol) => (
                    <Card key={symbol.id} className="overflow-hidden py-2 gap-0">
                      <CardHeader className="p-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              {symbol.name}
                            </CardTitle>
                            <CardDescription className="text-xs font-mono mt-1">
                              {symbol.path}
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAnalyzeSymbol(symbol.id)}
                            disabled={analyzingSymbolIds.includes(symbol.id)}
                          >
                            {analyzingSymbolIds.includes(symbol.id) ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                分析中...
                              </>
                            ) : "AI分析"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="px-2">
                        {symbol.detail && <span className="text-xs">${JSON.stringify(symbol.detail)}</span>}
                        <div className="text-xs text-gray-400 mt-2">
                          更新于: {new Date(symbol.updatedAt).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
                  <Code className="h-12 w-12 text-gray-300"/>
                  <p className="text-center text-gray-500">暂无符号分析数据</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="api" className="mt-4">
            <div className="space-y-4">
              <ApiResourceList 
                apiResources={apiResources} 
                isLoading={isLoadingApiResources} 
                error={apiResourcesError} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
