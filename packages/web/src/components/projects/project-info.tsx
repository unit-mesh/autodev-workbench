import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, ClipboardList, Code, Database, ExternalLink, GitBranch, Github, GitPullRequest } from "lucide-react"
import { Project } from "@/types/project.type"
import Image from "next/image"

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ProjectInfo({ project, symbols }: { project: Project, symbols: any[] }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>项目信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500">基本信息</h3>
          <div className="flex items-center">
            <ClipboardList className="h-4 w-4 mr-2 text-gray-500"/>
            <span className="text-sm">
              项目ID: <span
                className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{project.id}</span>
            </span>
          </div>
          <div className="flex items-center">
            <ClipboardList className="h-4 w-4 mr-2 text-gray-500"/>
            <span className="text-sm">
              创建于 {formatDate(project.createdAt)}
            </span>
          </div>
          <div className="flex items-center">
            <GitBranch className="h-4 w-4 mr-2 text-gray-500"/>
            <span className="text-sm">
              最后更新 {formatDate(project.updatedAt)}
            </span>
          </div>
          {project.user && (
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-gray-200 mr-2 overflow-hidden">
                {project.user.image ? (
                  <Image
                    src={project.user.image}
                    alt={project.user.name || "用户"}
                    width={20}
                    height={20}
                    className="h-full w-full object-cover"
                  />
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
              <Github className="h-4 w-4 mr-2 text-gray-500"/>
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
              <ExternalLink className="h-4 w-4 mr-2 text-gray-500"/>
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
              <ClipboardList className="h-4 w-4 mr-2 text-gray-500"/>
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
              <GitPullRequest className="h-4 w-4 mr-2 text-gray-500"/>
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
              <BookOpen className="h-4 w-4 mr-2 text-indigo-500"/>
              <div>
                <p className="text-xs text-gray-500">规范文档</p>
                <p className="text-sm font-medium">{project.guidelines.length}</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-50 p-2 rounded">
              <Code className="h-4 w-4 mr-2 text-blue-500"/>
              <div>
                <p className="text-xs text-gray-500">代码分析</p>
                <p className="text-sm font-medium">{project.codeAnalyses.length}</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-50 p-2 rounded">
              <Database className="h-4 w-4 mr-2 text-green-500"/>
              <div>
                <p className="text-xs text-gray-500">API资源</p>
                <p className="text-sm font-medium">{project.apiResources.length}</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-50 p-2 rounded">
              <BookOpen className="h-4 w-4 mr-2 text-amber-500"/>
              <div>
                <p className="text-xs text-gray-500">概念词典</p>
                <p className="text-sm font-medium">{project.conceptDictionaries.length}</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-50 p-2 rounded">
              <Code className="h-4 w-4 mr-2 text-purple-500"/>
              <div>
                <p className="text-xs text-gray-500">符号分析</p>
                <p className="text-sm font-medium">{symbols?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
