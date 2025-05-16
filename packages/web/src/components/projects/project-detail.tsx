"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  BookOpen, ClipboardCopy,
  ClipboardList,
  Code,
  Database,
  ExternalLink,
  GitBranch,
  Github,
  GitPullRequest,
  Loader2,
  Settings,
  X
} from "lucide-react"
import { Project } from "@/types/project.type";
import { ProjectEditDialog } from "./project-edit-dialog"
import { toast } from "sonner";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { CopyCliCommand } from "@/components/CopyCliCommand";

// 规范文档状态
enum GuidelineStatus {
  DRAFT = "草稿",
  PUBLISHED = "已发布",
  ARCHIVED = "已归档",
}

const statusMapping = {
  "草稿": "DRAFT",
  "已发布": "PUBLISHED",
  "已归档": "ARCHIVED"
};

// 规范创建弹窗组件
interface GuidelineCreateModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GuidelineCreateModal: React.FC<GuidelineCreateModalProps> = ({ projectId, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'frontend',
    status: GuidelineStatus.DRAFT,
    content: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Convert to API format
      const apiData = {
        ...formData,
        projectId: projectId,
        status: statusMapping[formData.status as keyof typeof statusMapping],
        category: JSON.stringify({ subcategory: formData.category }),
      };

      const response = await fetch('/api/guideline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error('创建规范失败');
      }

      toast.success('规范文档已成功创建');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('创建规范失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              创建规范文档
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={24}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="规范标题"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="简短描述"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类别
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="frontend">前端</option>
                <option value="backend">后端</option>
                <option value="architecture">架构</option>
                <option value="systems">系统开发</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as GuidelineStatus)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {Object.values(GuidelineStatus).map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容 (Markdown 格式)
            </label>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <CodeMirror
                value={formData.content}
                height="400px"
                extensions={[markdown()]}
                onChange={(value) => handleChange('content', value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
              创建
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function ProjectDetail({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError("项目不存在")
          } else if (response.status === 403) {
            setError("无权访问此项目")
          } else {
            setError("加载项目失败")
          }
          return
        }

        const data = await response.json()
        setProject(data)
      } catch (error) {
        console.error("Error fetching project:", error)
        setError("加载项目时出错")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id])

  const handleEditSuccess = (updatedProject: Project) => {
    setProject(updatedProject)
  }

  const handleGuidelineCreated = async () => {
    // Refresh project data to show the new guideline
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      }
    } catch (error) {
      console.error("Error refreshing project:", error)
    }
  }

  if (loading) {
    return <ProjectDetailSkeleton />
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <p className="text-lg text-center text-red-500">{error || "加载项目失败"}</p>
        <Button variant="outline" onClick={() => router.push("/projects")}>
          返回项目列表
        </Button>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              {project.name}
              {project.isDefault && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">默认</Badge>
              )}
            </h1>
            <p className="text-gray-500 mt-1">
              {project.description || "无项目描述"}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            编辑项目
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>项目信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">基本信息</h3>
              <div className="flex items-center">
                <ClipboardList className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  项目ID: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{project.id}</span>
                </span>
              </div>
              <div className="flex items-center">
                <ClipboardList className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  创建于 {formatDate(project.createdAt)}
                </span>
              </div>
              <div className="flex items-center">
                <GitBranch className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  最后更新 {formatDate(project.updatedAt)}
                </span>
              </div>
              {project.user && (
                <div className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-gray-200 mr-2 overflow-hidden">
                    {project.user.image ? (
                      <img src={project.user.image} alt={project.user.name || "用户"} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="text-sm">
                    {project.user.name || project.user.email || "未知用户"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">相关链接</h3>
              {project.gitUrl && (
                <div className="flex items-center">
                  <Github className="h-4 w-4 mr-2 text-gray-500" />
                  <a
                    href={project.gitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {project.gitUrl}
                  </a>
                </div>
              )}
              {project.liveUrl && (
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {project.liveUrl}
                  </a>
                </div>
              )}
              {project.jiraUrl && (
                <div className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2 text-gray-500" />
                  <a
                    href={project.jiraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    Jira
                  </a>
                </div>
              )}
              {project.jenkinsUrl && (
                <div className="flex items-center">
                  <GitPullRequest className="h-4 w-4 mr-2 text-gray-500" />
                  <a
                    href={project.jenkinsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    Jenkins
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">资源统计</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-gray-50 p-2 rounded">
                  <BookOpen className="h-4 w-4 mr-2 text-indigo-500" />
                  <div>
                    <p className="text-xs text-gray-500">规范文档</p>
                    <p className="text-sm font-medium">{project.guidelines.length}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 p-2 rounded">
                  <Code className="h-4 w-4 mr-2 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">代码分析</p>
                    <p className="text-sm font-medium">{project.codeAnalyses.length}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 p-2 rounded">
                  <Database className="h-4 w-4 mr-2 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">API资源</p>
                    <p className="text-sm font-medium">{project.apiResources.length}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 p-2 rounded">
                  <BookOpen className="h-4 w-4 mr-2 text-amber-500" />
                  <div>
                    <p className="text-xs text-gray-500">概念词典</p>
                    <p className="text-sm font-medium">{project.conceptDictionaries.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>项目资源</CardTitle>
            <CardDescription>浏览项目的所有资源</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="guidelines">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="guidelines">规范文档</TabsTrigger>
                <TabsTrigger value="code">代码分析</TabsTrigger>
                <TabsTrigger value="dictionary">概念词典</TabsTrigger>
              </TabsList>

              <TabsContent value="guidelines" className="mt-4">
                {project.guidelines.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-700">规范文档列表</h3>
                      <Button size="sm" variant="outline" onClick={() => setIsGuidelineModalOpen(true)}>
                        <BookOpen className="h-4 w-4 mr-2" />
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
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
                    <BookOpen className="h-12 w-12 text-gray-300" />
                    <p className="text-center text-gray-500">暂无规范文档</p>
                    <Button size="sm" onClick={() => setIsGuidelineModalOpen(true)}>
                      创建第一个规范文档
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="code" className="mt-4">
                {project.codeAnalyses.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-700">代码分析列表</h3>
                      <Button size="sm" variant="outline">
                        <Code className="h-4 w-4 mr-2" />
                        分析代码
                      </Button>
                    </div>
                    <div className="divide-y">
                      {project.codeAnalyses.map((analysis) => (
                        <div key={analysis.id} className="py-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{analysis.title || analysis.path}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {analysis.path}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                {analysis.language && (
                                  <Badge variant="outline" className="text-xs">
                                    {analysis.language}
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(analysis.createdAt).toLocaleDateString()}
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
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
                    <Code className="h-12 w-12 text-gray-300" />
                    <p className="text-center text-gray-500">暂无代码分析</p>
                    <CopyCliCommand projectId={project.id} variant="withPath" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dictionary" className="mt-4">
                {project.conceptDictionaries.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-700">概念词典列表</h3>
                      <Button size="sm" variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        添加词条
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文术语</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">英文术语</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文描述</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {project.conceptDictionaries.map((term) => (
                            <tr key={term.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{term.termChinese}</td>
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
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
                    <BookOpen className="h-12 w-12 text-gray-300" />
                    <p className="text-center text-gray-500">暂无概念词典</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {project && (
        <ProjectEditDialog
          project={project}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      {project && (
        <GuidelineCreateModal
          projectId={project.id}
          isOpen={isGuidelineModalOpen}
          onClose={() => setIsGuidelineModalOpen(false)}
          onSuccess={handleGuidelineCreated}
        />
      )}
    </div>
  )
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[600px] lg:col-span-1" />
        <Skeleton className="h-[600px] lg:col-span-2" />
      </div>
    </div>
  )
}
