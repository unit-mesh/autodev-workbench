'use client'

import React, { useState } from 'react'
import { ArrowRight, Plus, CheckCircle2, ClipboardCopy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function Home() {
	const [project, setProject] = useState<string | null>(null)
	const [showDialog, setShowDialog] = useState(false)
	const [projectName, setProjectName] = useState('')

	const handleCreate = () => {
		if (!projectName.trim()) return toast.error('请输入项目名称')
		setProject(projectName.trim())
		setShowDialog(false)
		setTimeout(() => {
			toast.success(`项目 "${projectName}" 创建成功`)
		}, 200)
	}

	const copyCLI = () => {
		if (project)
			navigator.clipboard.writeText(`npx @autodev/context-worker ${project}`)
				.then(() => toast.success('命令已复制到剪贴板'))
	}

	return (
		<div className="p-8 space-y-8">
			{/* 欢迎卡片 */}
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

			{/* 项目引导模块 */}
			{!project ? (
				<div className="border-2 border-dashed rounded-xl p-8 text-center">
					<h3 className="text-xl font-semibold mb-2">尚未创建项目</h3>
					<p className="text-muted-foreground mb-4">创建一个项目以启动 AutoDev CLI 初始化知识。</p>
					<Button onClick={() => setShowDialog(true)}>
						<Plus className="mr-2 h-4 w-4"/> 创建新项目
					</Button>
				</div>
			) : (
				<Card className="p-6">
					<div className="flex items-center gap-3 mb-4 text-green-600 font-medium">
						<CheckCircle2 className="h-5 w-5"/>
						项目 <strong>{project}</strong> 创建成功！
					</div>
					<div className="bg-muted p-4 rounded-lg font-mono text-sm flex justify-between items-center">
						npx @autodev/context-worker {project}
						<Button variant="ghost" size="icon" onClick={copyCLI}>
							<ClipboardCopy className="w-4 h-4"/>
						</Button>
					</div>
					<p className="text-sm text-muted-foreground mt-2">
						请在您的本地终端中运行以上命令，完成上下文初始化。
					</p>
				</Card>
			)}

			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>创建新项目</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="请输入项目名称"
							value={projectName}
							onChange={(e) => setProjectName(e.target.value)}
						/>
					</div>
					<DialogFooter className="mt-4">
						<Button onClick={handleCreate}>创建</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
