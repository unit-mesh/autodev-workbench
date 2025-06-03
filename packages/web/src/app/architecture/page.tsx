"use client"
import {
	Database,
	Code,
	TestTube,
	Rocket,
	FileText,
	BrainCircuit,
	Users,
	Layers3,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AiSdlcHousePage() {
	const foundation = {
		name: "基础设施层",
		description: "提供稳固的运行环境、计算资源、存储和网络",
		elements: ["Serverless", "Kubernetes", "WASM", "边缘计算", "数据库", "对象存储"],
		icon: <Database className="h-6 w-6 text-slate-600 dark:text-slate-300" />,
	}

	const platformBase = {
		name: "平台基座层",
		description: "构建统一的开发运维平台",
		elements: ["CI/CD Pipeline", "API Gateway", "Service Mesh", "DevSecOps", "自动化测试"],
		icon: <Layers3 className="h-6 w-6 text-teal-600 dark:text-teal-400" />,
	}

	const pillars = [
		{
			name: "需求分析",
			description: "智能化需求理解与设计",
			elements: ["需求挖掘", "架构设计", "技术选型"],
			icon: <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
		},
		{
			name: "编码实现",
			description: "AI辅助编程与代码生成",
			elements: ["代码生成", "智能补全", "重构建议"],
			icon: <Code className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
		},
		{
			name: "测试保证",
			description: "自动化测试与质量分析",
			elements: ["测试生成", "质量分析", "性能监控"],
			icon: <TestTube className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
		},
		{
			name: "部署运维",
			description: "智能化部署与运维管理",
			elements: ["自动部署", "监控告警", "故障诊断"],
			icon: <Rocket className="h-6 w-6 text-violet-600 dark:text-violet-400" />,
		},
	]

	const roofContextLayer = {
		name: "上下文知识层",
		description: "为 AI 提供理解代码意图、项目历史和领域知识的能力",
		elements: ["代码知识图谱", "Prompt 工程", "需求溯源", "变更影响分析"],
		icon: <BrainCircuit className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
	}

	const roofCollaborationLayer = {
		name: "协作智能层",
		description: "实现人类与 AI 智能体间的无缝协作与任务编排",
		icon: <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
		elements: [
			"多智能体协作",
			"任务编排引擎",
			"人机交互界面",
			"工作流自动化",
			"决策支持系统",
		],
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 p-4">
			<div className="max-w-7xl mx-auto space-y-3">
				{/* Header */}
				<div className="text-center space-y-2 mb-4">
					<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
						AI 驱动的软件工程架构体系
					</h1>
					<p className="text-base text-muted-foreground max-w-3xl mx-auto">
						构建从基础设施到智能协作的完整技术栈，实现软件开发全生命周期的智能化升级
					</p>
				</div>

				{/* Collaboration Layer */}
				<Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-purple-950/30 border-purple-200 dark:border-purple-800 shadow-md">
					<CardHeader className="text-center pb-2">
						<div className="flex justify-center items-center gap-3 mb-2">
							<div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg">
								{roofCollaborationLayer.icon}
							</div>
							<CardTitle className="text-lg text-purple-700 dark:text-purple-300">
								{roofCollaborationLayer.name}
							</CardTitle>
						</div>
						<CardDescription className="text-sm">{roofCollaborationLayer.description}</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="flex flex-wrap gap-1.5 justify-center">
							{roofCollaborationLayer.elements.map((el, i) => (
								<Badge key={i} variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
									{el}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Context Layer */}
				<Card className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 border-indigo-200 dark:border-indigo-800 shadow-md">
					<CardHeader className="text-center pb-2">
						<div className="flex justify-center items-center gap-3 mb-2">
							<div className="p-2 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900 dark:to-blue-900 rounded-lg">
								{roofContextLayer.icon}
							</div>
							<CardTitle className="text-lg text-indigo-700 dark:text-indigo-300">
								{roofContextLayer.name}
							</CardTitle>
						</div>
						<CardDescription className="text-sm">{roofContextLayer.description}</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="flex flex-wrap gap-1.5 justify-center">
							{roofContextLayer.elements.map((el, i) => (
								<Badge key={i} variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
									{el}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Pillars */}
				<div className="grid grid-cols-4 gap-3">
					{pillars.map((pillar, index) => (
						<Card
							key={index}
							className={`
								${index === 0 ? 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 border-blue-200 dark:border-blue-800' : ''}
								${index === 1 ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800' : ''}
								${index === 2 ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800' : ''}
								${index === 3 ? 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800' : ''}
								shadow-md hover:shadow-lg transition-all duration-300
							`}
						>
							<CardHeader className="text-center pb-2">
								<div className="flex justify-center mb-2">
									<div className={`
										p-2 rounded-lg
										${index === 0 ? 'bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900 dark:to-sky-900' : ''}
										${index === 1 ? 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900 dark:to-green-900' : ''}
										${index === 2 ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900' : ''}
										${index === 3 ? 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900' : ''}
									`}>
										{pillar.icon}
									</div>
								</div>
								<CardTitle className={`
									text-sm
									${index === 0 ? 'text-blue-700 dark:text-blue-300' : ''}
									${index === 1 ? 'text-emerald-700 dark:text-emerald-300' : ''}
									${index === 2 ? 'text-amber-700 dark:text-amber-300' : ''}
									${index === 3 ? 'text-violet-700 dark:text-violet-300' : ''}
								`}>
									{pillar.name}
								</CardTitle>
								<CardDescription className="text-xs">{pillar.description}</CardDescription>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="flex flex-wrap gap-1 justify-center">
									{pillar.elements.map((el, i) => (
										<Badge
											key={i}
											variant="secondary"
											className={`
												text-xs
												${index === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}
												${index === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : ''}
												${index === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : ''}
												${index === 3 ? 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' : ''}
											`}
										>
											{el}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Platform Base */}
				<Card className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 dark:from-teal-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-teal-200 dark:border-teal-800 shadow-md">
					<CardHeader className="text-center pb-2">
						<div className="flex justify-center items-center gap-3 mb-2">
							<div className="p-2 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 rounded-lg">
								{platformBase.icon}
							</div>
							<CardTitle className="text-lg text-teal-700 dark:text-teal-300">
								{platformBase.name}
							</CardTitle>
						</div>
						<CardDescription className="text-sm">{platformBase.description}</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="flex flex-wrap gap-1.5 justify-center">
							{platformBase.elements.map((el, i) => (
								<Badge key={i} variant="secondary" className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
									{el}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Foundation */}
				<Card className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 dark:from-gray-950/30 dark:via-slate-950/30 dark:to-gray-950/30 border-gray-200 dark:border-gray-700 shadow-md">
					<CardHeader className="text-center pb-2">
						<div className="flex justify-center items-center gap-3 mb-2">
							<div className="p-2 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900 dark:to-slate-900 rounded-lg">
								{foundation.icon}
							</div>
							<CardTitle className="text-lg text-gray-700 dark:text-gray-300">
								{foundation.name}
							</CardTitle>
						</div>
						<CardDescription className="text-sm">{foundation.description}</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="flex flex-wrap gap-1.5 justify-center">
							{foundation.elements.map((el, i) => (
								<Badge key={i} variant="secondary" className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
									{el}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Footer */}
				<div className="text-center pt-2">
					<p className="text-xs text-muted-foreground">
						基于 AI 智能体的软件工程全栈架构 · 从基础设施到智能协作的完整解决方案
					</p>
				</div>
			</div>
		</div>
	)
}