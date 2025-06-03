"use client"
import { Database, Code, TestTube, Rocket, FileText, BrainCircuit, Users, Layers3, Sparkles, Target, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AiSdlcHousePage() {
	const foundation = {
		name: "基础设施层",
		description: "提供稳固的运行环境、计算资源、存储和网络，是所有上层建筑的基石",
		elements: ["Serverless", "Kubernetes", "WASM", "边缘计算", "数据库", "对象存储"],
		icon: <Database className="h-12 w-12 text-slate-700 dark:text-slate-300" />,
	}

	const platformBase = {
		name: "平台基座层",
		description: "构建统一的开发、测试、部署和运维平台，为上层应用提供标准化服务",
		elements: [
			"CI/CD Platform",
			"Container Orchestration",
			"Service Mesh",
			"API Gateway",
			"DevSecOps Pipeline",
			"Automated Testing Infrastructure",
		],
		icon: <Layers3 className="h-12 w-12 text-blue-600 dark:text-blue-400" />,
	}

	const pillars = [
		{
			name: "需求分析与设计",
			description: "智能化需求理解、架构设计和技术方案生成",
			elements: ["需求挖掘", "架构设计", "技术选型", "设计模式"],
			icon: <FileText className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />,
			color: "emerald",
		},
		{
			name: "编码与实现",
			description: "AI辅助编程、代码生成和智能重构",
			elements: ["代码生成", "智能补全", "重构建议", "代码审查"],
			icon: <Code className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
			color: "blue",
		},
		{
			name: "测试与质量保证",
			description: "自动化测试生成、质量分析和性能优化",
			elements: ["测试生成", "质量分析", "性能监控", "安全检测"],
			icon: <TestTube className="h-10 w-10 text-orange-500 dark:text-orange-400" />,
			color: "orange",
		},
		{
			name: "部署与运维",
			description: "智能化部署策略、监控预警和故障处理",
			elements: ["自动部署", "监控告警", "故障诊断", "性能调优"],
			icon: <Rocket className="h-10 w-10 text-purple-600 dark:text-purple-400" />,
			color: "purple",
		},
	]

	const roofContextLayer = {
		name: "上下文与知识层",
		description: "为 AI 提供理解代码意图、项目历史和领域知识的能力，是智能协作的基础",
		elements: ["代码知识图谱", "Prompt 工程", "需求溯源", "变更影响分析", "Embedding Models"],
		icon: <BrainCircuit className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />,
	}

	const roofCollaborationLayer = {
		name: "协作与智能代理层",
		description: "实现人类与 AI 智能体、以及多智能体间的无缝协作与任务编排，是人机协同的核心交互空间",
		elements: [
			"多智能体协作",
			"任务编排引擎",
			"人机交互界面",
			"工作流自动化",
			"决策支持系统",
			"协作知识共享",
		],
		icon: <Users className="h-12 w-12 text-pink-600 dark:text-pink-400" />,
	}

	const getColorClasses = (color: string) => {
		const colorMap = {
			emerald: {
				bg: "bg-gradient-to-br from-emerald-50 via-white to-emerald-100/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-900/30",
				border: "border-emerald-200/60 dark:border-emerald-800/60",
				iconRing: "ring-emerald-100 dark:ring-emerald-900/50",
				badge: "bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200/80 dark:bg-emerald-900/50 dark:text-emerald-300",
			},
			blue: {
				bg: "bg-gradient-to-br from-blue-50 via-white to-blue-100/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-900/30",
				border: "border-blue-200/60 dark:border-blue-800/60",
				iconRing: "ring-blue-100 dark:ring-blue-900/50",
				badge: "bg-blue-100/80 text-blue-700 hover:bg-blue-200/80 dark:bg-blue-900/50 dark:text-blue-300",
			},
			orange: {
				bg: "bg-gradient-to-br from-orange-50 via-white to-orange-100/50 dark:from-orange-950/30 dark:via-slate-900 dark:to-orange-900/30",
				border: "border-orange-200/60 dark:border-orange-800/60",
				iconRing: "ring-orange-100 dark:ring-orange-900/50",
				badge: "bg-orange-100/80 text-orange-700 hover:bg-orange-200/80 dark:bg-orange-900/50 dark:text-orange-300",
			},
			purple: {
				bg: "bg-gradient-to-br from-purple-50 via-white to-purple-100/50 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-900/30",
				border: "border-purple-200/60 dark:border-purple-800/60",
				iconRing: "ring-purple-100 dark:ring-purple-900/50",
				badge: "bg-purple-100/80 text-purple-700 hover:bg-purple-200/80 dark:bg-purple-900/50 dark:text-purple-300",
			},
		}
		return colorMap[color as keyof typeof colorMap] || colorMap.blue
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6">
			<div className="max-w-7xl mx-auto space-y-8">
				{/* Header */}
				<div className="text-center space-y-6 mb-16">
					<div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white shadow-lg">
						<Sparkles className="h-6 w-6" />
						<span className="font-semibold text-lg">AI SDLC House</span>
						<Sparkles className="h-6 w-6" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-slate-200 dark:via-blue-400 dark:to-purple-400">
						AI 友好的架构：适应式架构实践
					</h1>
					<p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
						构建人工智能驱动的软件开发生态系统，实现智能化、协作化的开发体验
					</p>
				</div>

				{/* Collaboration Layer - Roof */}
				<Card className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50/50 dark:from-pink-950/20 dark:via-slate-900 dark:to-purple-950/20 border-pink-200/60 dark:border-pink-800/60 border-2 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
					<div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 dark:from-pink-400/10 dark:to-purple-400/10"></div>
					<CardHeader className="relative text-center pb-6">
						<div className="flex justify-center mb-6">
							<div className="p-4 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 rounded-2xl ring-8 ring-pink-100/50 dark:ring-pink-900/30 shadow-lg">
								{roofCollaborationLayer.icon}
							</div>
						</div>
						<CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
							{roofCollaborationLayer.name}
						</CardTitle>
						<CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
							{roofCollaborationLayer.description}
						</CardDescription>
					</CardHeader>
					<CardContent className="relative">
						<div className="flex flex-wrap gap-3 justify-center">
							{roofCollaborationLayer.elements.map((el, i) => (
								<Badge
									key={i}
									variant="secondary"
									className="px-4 py-2 text-sm font-medium bg-pink-100/80 text-pink-700 hover:bg-pink-200/80 dark:bg-pink-900/50 dark:text-pink-300 transition-colors"
								>
									{el}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Context Layer */}
				<Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50/50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-blue-950/20 border-indigo-200/60 dark:border-indigo-800/60 border-2 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
					<div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 dark:from-indigo-400/10 dark:to-blue-400/10"></div>
					<CardHeader className="relative text-center pb-6">
						<div className="flex justify-center mb-6">
							<div className="p-4 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 rounded-2xl ring-8 ring-indigo-100/50 dark:ring-indigo-900/30 shadow-lg">
								{roofContextLayer.icon}
							</div>
						</div>
						<CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
							{roofContextLayer.name}
						</CardTitle>
						<CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
							{roofContextLayer.description}
						</CardDescription>
					</CardHeader>
					<CardContent className="relative">
						<div className="flex flex-wrap gap-3 justify-center">
							{roofContextLayer.elements.map((el, i) => (
								<Badge
									key={i}
									variant="secondary"
									className="px-4 py-2 text-sm font-medium bg-indigo-100/80 text-indigo-700 hover:bg-indigo-200/80 dark:bg-indigo-900/50 dark:text-indigo-300 transition-colors"
								>
									{el}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Pillars */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{pillars.map((pillar, index) => {
						const colors = getColorClasses(pillar.color)
						return (
							<Card
								key={index}
								className={`relative overflow-hidden ${colors.bg} ${colors.border} border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group`}
							>
								<div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 to-slate-500/5 dark:from-slate-400/10 dark:to-slate-400/10 group-hover:opacity-100 opacity-0 transition-opacity"></div>
								<CardHeader className="relative text-center pb-4">
									<div className="flex justify-center mb-4">
										<div className={`p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl ring-4 ${colors.iconRing} shadow-md`}>
											{pillar.icon}
										</div>
									</div>
									<CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
										{pillar.name}
									</CardTitle>
									<CardDescription className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
										{pillar.description}
									</CardDescription>
								</CardHeader>
								<CardContent className="relative">
									<div className="flex flex-wrap gap-2 justify-center">
										{pillar.elements.map((el, i) => (
											<Badge
												key={i}
												variant="secondary"
												className={`px-3 py-1 text-xs font-medium ${colors.badge} transition-colors`}
											>
												{el}
											</Badge>
										))}
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>

				{/* Platform Base */}
				<Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50/50 dark:from-blue-950/20 dark:via-slate-900 dark:to-cyan-950/20 border-blue-200/60 dark:border-blue-800/60 border-2 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
					<div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 dark:from-blue-400/10 dark:to-cyan-400/10"></div>
					<CardHeader className="relative text-center pb-6">
						<div className="flex justify-center mb-6">
							<div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-2xl ring-8 ring-blue-100/50 dark:ring-blue-900/30 shadow-lg">
								{platformBase.icon}
							</div>
						</div>
						<CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
							{platformBase.name}
						</CardTitle>
						<CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
							{platformBase.description}
						</CardDescription>
					</CardHeader>
					<CardContent className="relative">
						<div className="flex flex-wrap gap-3 justify-center">
							{platformBase.elements.map((el, i) => (
								<Badge
									key={i}
									variant="secondary"
									className="px-4 py-2 text-sm font-medium bg-blue-100/80 text-blue-700 hover:bg-blue-200/80 dark:bg-blue-900/50 dark:text-blue-300 transition-colors"
								>
									{el}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Foundation */}
				<Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-gray-50/50 dark:from-slate-950/50 dark:via-slate-900 dark:to-gray-950/50 border-slate-200/60 dark:border-slate-700/60 border-2 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
					<div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 to-gray-500/5 dark:from-slate-400/10 dark:to-gray-400/10"></div>
					<CardHeader className="relative text-center pb-6">
						<div className="flex justify-center mb-6">
							<div className="p-4 bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 rounded-2xl ring-8 ring-slate-100/50 dark:ring-slate-800/50 shadow-lg">
								{foundation.icon}
							</div>
						</div>
						<CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
							{foundation.name}
						</CardTitle>
						<CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
							{foundation.description}
						</CardDescription>
					</CardHeader>
					<CardContent className="relative">
						<div className="flex flex-wrap gap-3 justify-center">
							{foundation.elements.map((el, i) => (
								<Badge
									key={i}
									variant="secondary"
									className="px-4 py-2 text-sm font-medium bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 transition-colors"
								>
									{el}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Footer */}
				<div className="text-center py-12">
					<div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full shadow-sm">
						<Target className="h-5 w-5 text-slate-600 dark:text-slate-400" />
						<span className="text-slate-700 dark:text-slate-300 font-medium">
							构建未来的智能化软件开发生态
						</span>
						<Zap className="h-5 w-5 text-slate-600 dark:text-slate-400" />
					</div>
				</div>
			</div>
		</div>
	)
}
