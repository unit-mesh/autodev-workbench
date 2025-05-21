import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Code } from "lucide-react"
import { Project } from "@/types/project.type"
import { CodeAnalysisItem, CodeAnalysisList } from "@/components/code-analysis/code-analysis-list"
import { Dispatch, SetStateAction } from "react"
import { ApiResourceList } from "./ApiResourceList"
import { SymbolAnalysisTab } from "./SymbolAnalysisTab"
import { ConceptDictionaryTab } from "./ConceptDictionaryTab"

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
  const handleTabChange = (value: string) => {
    if (value === "symbols" && symbols.length === 0) {
      fetchSymbols();
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
            <TabsTrigger value="dictionary">概念词典</TabsTrigger>
            <TabsTrigger value="code">代码上下文</TabsTrigger>
            <TabsTrigger value="api">API资源</TabsTrigger>
            <TabsTrigger value="symbols">代码符号</TabsTrigger>
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
            <ConceptDictionaryTab conceptDictionaries={project.conceptDictionaries} />
          </TabsContent>

          <TabsContent value="symbols" className="mt-4">
            <SymbolAnalysisTab
              symbols={symbols}
              symbolSearch={symbolSearch}
              symbolLoading={symbolLoading}
              setSymbolSearch={setSymbolSearch}
              fetchSymbols={fetchSymbols}
              projectId={project.id}
              refreshProject={refreshProject}
            />
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
