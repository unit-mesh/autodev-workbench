"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ExternalLink, Github, GitBranch, BookOpen, Code, Database, Copy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectCreateDialog } from "./project-create-dialog"
import { toast } from "@/hooks/use-toast"

import { Project } from "@/types/project.type";

export function ProjectsList() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchProjects() {
      if (session) {
        try {
          const response = await fetch(`/api/projects?userId=${session.user.id}`)
          if (response.ok) {
            const data = await response.json()
            setProjects(data)
          }
        } catch (error) {
          console.error("Error fetching projects:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (session) {
      fetchProjects()
    }
  }, [session])

  const handleCreateSuccess = (newProject: Project) => {
    setProjects([...projects, newProject])
    setIsCreateDialogOpen(false)
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-lg text-center">请登录以查看您的项目</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="mt-4 flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">项目列表</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建新项目
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg space-y-4 bg-gray-50">
          <p className="text-lg text-center text-gray-500">您还没有创建任何项目</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建第一个项目
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <ProjectCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const copyProjectId = () => {
    navigator.clipboard.writeText(project.id)
      .then(() => {
        toast({
          title: "已复制项目ID",
          description: "项目ID已复制到剪贴板",
        })
      })
      .catch((err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "复制失败",
          description: "无法复制项目ID",
          variant: "destructive",
        })
      })
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl truncate">{project.name}</CardTitle>
          {project.isDefault && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">默认</Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {project.description || "无项目描述"}
        </CardDescription>
        <div className="flex items-center mt-2 space-x-1">
          <span className="text-xs text-gray-500">项目ID:</span>
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">{project.id}</code>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyProjectId}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="info">基本信息</TabsTrigger>
            <TabsTrigger value="guidelines">规范({project.guidelines.length})</TabsTrigger>
            <TabsTrigger value="resources">资源</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="h-32 overflow-y-auto">
            {project.gitUrl && (
              <div className="flex items-center text-sm mb-2">
                <Github className="h-4 w-4 mr-2 text-gray-500" />
                <a
                  href={project.gitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {project.gitUrl}
                </a>
              </div>
            )}
            {project.liveUrl && (
              <div className="flex items-center text-sm mb-2">
                <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {project.liveUrl}
                </a>
              </div>
            )}
            <div className="flex items-center text-sm">
              <GitBranch className="h-4 w-4 mr-2 text-gray-500" />
              <span>创建于 {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </TabsContent>
          <TabsContent value="guidelines" className="h-32 overflow-y-auto">
            {project.guidelines.length > 0 ? (
              <ul className="space-y-2">
                {project.guidelines.map((guideline) => (
                  <li key={guideline.id} className="flex items-start">
                    <BookOpen className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium truncate">{guideline.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {typeof guideline.category === 'object' ? guideline.category.name || '未分类' : '未分类'}
                        </Badge>
                        <Badge
                          variant={guideline.status === 'PUBLISHED' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {guideline.status === 'PUBLISHED' ? '已发布' :
                           guideline.status === 'DRAFT' ? '草稿' : '已归档'}
                        </Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">暂无规范文档</p>
            )}
          </TabsContent>
          <TabsContent value="resources" className="h-32 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center">
                <Code className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">
                  代码分析: {project.codeAnalyses.length}
                </span>
              </div>
              <div className="flex items-center">
                <Database className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">
                  API资源: {project.apiResources?.length || 0}
                </span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">
                  概念词典: {project.conceptDictionaries?.length || 0}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href={`/projects/${project.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            查看详情
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
