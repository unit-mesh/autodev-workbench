'use client'

import React, { useState, useEffect } from 'react'
import { ArrowRight, Plus, CheckCircle2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from "next/link";
import { CopyCliCommand } from '@/components/CopyCliCommand'
import { Project } from "@/types/project.type";

export default function Home() {
  const { data: session, status } = useSession()
  const [project, setProject] = useState<Project | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchingProject, setFetchingProject] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gitUrl: '',
    liveUrl: '',
    jiraUrl: '',
    jenkinsUrl: ''
  })

  useEffect(() => {
    async function fetchDefaultProject() {
      if (session?.user?.id) {
        try {
          setFetchingProject(true)
          const response = await fetch(`/api/projects?userId=${session.user.id}&default=true`)
          if (response.ok) {
            const data = await response.json()
            // Get the default project if it exists
            const defaultProject = Array.isArray(data) && data.length > 0
              ? data.find(p => p.isDefault) || data[0]
              : null
            setProject(defaultProject)
          }
        } catch (error) {
          console.error("Error fetching default project:", error)
        } finally {
          setFetchingProject(false)
        }
      } else if (status !== 'loading') {
        setFetchingProject(false)
      }
    }

    fetchDefaultProject()
  }, [session, status])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreate = async () => {
    // 只验证项目名称
    if (!formData.name.trim()) return toast.error('请输入项目名称')
    if (!session) return toast.error('请先登录')

    setIsLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || '创建项目失败')
      }

      setProject(data.project)
      setShowDialog(false)
      toast.success(`项目 "${formData.name}" 创建成功`)

      // 重置表单
      setFormData({
        name: '',
        description: '',
        gitUrl: '',
        liveUrl: '',
        jiraUrl: '',
        jenkinsUrl: ''
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建项目失败')
    } finally {
      setIsLoading(false)
    }
  }

  // Function to check if project has any data
  const hasProjectData = (project: Project | null): boolean => {
    if (!project) return false;

    return (
      project.guidelines?.length > 0 ||
      project.codeAnalyses?.length > 0 ||
      project.conceptDictionaries?.length > 0 ||
      project.apiResources?.length > 0
    );
  };

  return (
    <div className="p-8 space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">欢迎使用 AutoDev 智能研发驾驶舱</h2>
        <p className="mb-6 text-blue-100">
          点击下方按钮，立即开始您的智能研发体验。驾驶舱提供全方位的研发数据可视化、AI辅助分析和智能决策支持。
        </p>
        <a
          href="/cockpit"
          className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
        >
          立即体验驾驶舱 <ArrowRight className="ml-2 h-5 w-5"/>
        </a>
      </div>

      {status === 'loading' || fetchingProject ? (
        <Card className="p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-10 w-full mt-4" />
        </Card>
      ) : !session ? (
        <div className="border-2 border-dashed rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">请先登录</h3>
          <p className="text-muted-foreground mb-4">登录后可以查看或创建您的项目。</p>
          <Button asChild>
            <Link href="/api/auth/signin" className="text-blue-600 hover:underline">
              登录 / 注册
            </Link>
          </Button>
        </div>
      ) : !project ? (
        <div className="border-2 border-dashed rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">尚未创建项目</h3>
          <p className="text-muted-foreground mb-4">创建一个项目以启动 AutoDev CLI 初始化知识。</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4"/> 创建新项目
          </Button>
        </div>
      ) : (
        <Card className="p-6">
          {hasProjectData(project) ? (
            <>
              <div className="flex items-center gap-3 mb-4 text-blue-600 font-medium">
                <BookOpen className="h-5 w-5"/>
                项目 <strong>{project.name}</strong> 数据已准备就绪！
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                您已经有项目数据，可以浏览项目内容或继续使用 CLI 进行更新。
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href={`/projects/${project.id}`}>
                    浏览项目 <ArrowRight className="ml-2 h-4 w-4"/>
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => document.getElementById('cli-command')?.focus()}>
                  使用 CLI
                </Button>
              </div>
              <div className="mt-4">
                <CopyCliCommand projectId={project.id} />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4 text-green-600 font-medium">
                <CheckCircle2 className="h-5 w-5"/>
                项目 <strong>{project.name}</strong> 已就绪！
              </div>
              <CopyCliCommand projectId={project.id} />
              <p className="text-sm text-muted-foreground mt-2">
                请在您的本地终端中运行以上命令，完成上下文初始化。
              </p>
            </>
          )}
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>创建新项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="name" className="required">项目名称</Label>
              <Input
                id="name"
                name="name"
                placeholder="请输入项目名称"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="请输入项目描述"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
