import {
	User,
	Bot,
	Code,
	Pencil,
	Network,
	FileJson,
	ServerCog,
	Users,
	FileText,
	Zap,
	Home,
	Database,
	ShieldCheck,
	Lightbulb,
	BrainCircuit,
	Layers3,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AiSdlcHousePage() {
	const foundation = {
		name: "1. 基础执行层 (地基)",
		description: "提供稳固的运行环境、计算资源、存储和网络，是所有上层建筑的基石。",
		elements: ["Serverless", "Kubernetes", "WASM", "边缘计算", "数据库", "对象存储"],
		icon: <Database className="h-10 w-10 text-neutral-700 dark:text-neutral-300" />,
		bgColor: "bg-neutral-300 dark:bg-neutral-700",
		borderColor: "border-neutral-400 dark:border-neutral-600",
		textColor: "text-neutral-800 dark:text-neutral-200",
	}

	const platformBase = {
		name: "5. 自动化平台层 (平台基础)",
		description: "提供 CI/CD、可观测性和自动化工具，支撑高效的开发与运维流程。",
		elements: [
			"CI/CD 流水线",
			"可观测性 (Logging, Metrics, Tracing)",
			"IaC (Terraform, Pulumi)",
			"AI 驱动的DevOps",
			"Automated Testing Infrastructure",
		],
		icon: <Layers3 className="h-10 w-10 text-teal-700 dark:text-teal-300" />,
		bgColor: "bg-teal-200 dark:bg-teal-800",
		borderColor: "border-teal-300 dark:border-teal-700",
		textColor: "text-teal-800 dark:text-teal-200",
	}

	const pillars = [
		{
			name: "2. 服务架构层",
			description: "定义系统如何组织、扩展和交互，确保结构合理。",
			elements: ["Right-Fit 架构", "微服务/模块化", "弹性设计", "数据驱动"],
			icon: <ServerCog className="h-8 w-8 text-stone-600 dark:text-stone-400" />,
		},
		{
			name: "3. 接口与契约层",
			description: "规范服务间的通信方式，确保信息准确传递。",
			elements: ["API-first", "OpenAPI", "GraphQL", "CDC 测试", "服务网格"],
			icon: <Network className="h-8 w-8 text-stone-600 dark:text-stone-400" />,
		},
		{
			name: "4. 开发与实现层",
			description: "高质量代码的生产车间，关注代码本身的可维护性和效率。",
			elements: ["SOLID", "TDD/BDD", "模块化代码", "AI 辅助编码", "代码元信息"],
			icon: <Code className="h-8 w-8 text-stone-600 dark:text-stone-400" />,
		},
	]

	const roofContextLayer = {
		name: "6. AI 上下文与知识层",
		description: "为 AI 提供理解代码意图、项目历史和领域知识的能力，是智能协作的基础。",
		elements: ["代码知识图谱", "Prompt 工程", "需求溯源", "变更影响分析", "Embedding Models"],
		icon: <BrainCircuit className="h-8 w-8 text-indigo-100 dark:text-indigo-300" />,
		bgColor: "bg-indigo-500 dark:bg-indigo-700", // Slightly lighter than L7
		borderColor: "border-indigo-400 dark:border-indigo-600",
		textColor: "text-indigo-50 dark:text-indigo-200",
	}

	const roofCollaborationLayer = {
		name: "7. 协作与智能代理层",
		description: "实现人类与 AI 智能体、以及多智能体间的无缝协作与任务编排，是人机协同的核心交互空间。",
		icon: <Users className="h-8 w-8 text-purple-100 dark:text-purple-300" />,
		bgColor: "bg-purple-600 dark:bg-purple-800", // Darkest part of the roof
		borderColor: "border-purple-500 dark:border-purple-700",
		textColor: "text-purple-50 dark:text-purple-200",
	}

	const humanActivities = [
		{ activity: "业务需求分析与定义", icon: <Pencil size={18} /> },
		{ activity: "高阶架构设计与决策", icon: <ServerCog size={18} /> },
		{ activity: "复杂逻辑编码与审查", icon: <Code size={18} /> },
		{ activity: "探索性测试与用户验收", icon: <Zap size={18} /> },
		{ activity: "战略规划与产品演进", icon: <Lightbulb size={18} /> },
	]

	const aiActivities = [
		{ activity: "需求澄清与用例生成", icon: <FileText size={18} /> },
		{ activity: "代码草稿生成与优化建议", icon: <Bot size={18} /> },
		{ activity: "自动化测试用例创建", icon: <FileJson size={18} /> },
		{ activity: "CI/CD 流程监控与故障预警", icon: <ShieldCheck size={18} /> },
		{ activity: "代码库知识问答与文档生成", icon: <BrainCircuit size={18} /> },
	]

	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-100 to-slate-100 dark:from-sky-900 dark:to-slate-950 p-4 md:p-8">
			<header className="text-center mb-10">
				<h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center">
					<Home className="h-10 w-10 mr-3 text-green-600" />
					坚实架构适应，赋能智能开发
				</h1>
			</header>

			{/* House Structure */}
			<div className="max-w-5xl mx-auto">
				{/* Roof - Top Part: L7 Collaboration & Agent Layer (with Human/AI Paths) */}
				<Card className={`mb-1 shadow-xl ${roofCollaborationLayer.bgColor} ${roofCollaborationLayer.borderColor}`}>
					<CardHeader className="text-center pb-2">
						<CardTitle
							className={`text-2xl font-bold flex items-center justify-center ${roofCollaborationLayer.textColor}`}
						>
							{roofCollaborationLayer.icon} <span className="ml-2">{roofCollaborationLayer.name}</span>
						</CardTitle>
						<CardDescription className={`${roofCollaborationLayer.textColor} opacity-90 px-4`}>
							{roofCollaborationLayer.description}
						</CardDescription>
					</CardHeader>
					<CardContent className="p-4">
						<div className="grid md:grid-cols-2 gap-4 bg-white/10 dark:bg-black/10 p-4 rounded-lg backdrop-blur-sm">
							<Card className="bg-blue-500/20 dark:bg-blue-900/30 border-blue-400/50 dark:border-blue-700/50">
								<CardHeader className="pb-2 pt-3">
									<CardTitle className="flex items-center text-blue-100 dark:text-blue-200 text-lg">
										<User className="h-5 w-5 mr-2" /> 👤 人类驱动路径
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-1 pb-3">
									<ul className="space-y-2">
										{humanActivities.map((item, index) => (
											<li key={index} className="flex items-center text-blue-100 dark:text-blue-300">
												{item.icon} <span className="ml-2 text-xs">{item.activity}</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
							<Card className="bg-green-500/20 dark:bg-green-900/30 border-green-400/50 dark:border-green-700/50">
								<CardHeader className="pb-2 pt-3">
									<CardTitle className="flex items-center text-green-100 dark:text-green-200 text-lg">
										<Bot className="h-5 w-5 mr-2" /> 🤖 AI 驱动路径
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-1 pb-3">
									<ul className="space-y-2">
										{aiActivities.map((item, index) => (
											<li key={index} className="flex items-center text-green-100 dark:text-green-300">
												{item.icon} <span className="ml-2 text-xs">{item.activity}</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						</div>
					</CardContent>
				</Card>

				{/* Roof - Lower Part: L6 AI Context & Knowledge Layer */}
				<Card className={`mb-1 shadow-lg ${roofContextLayer.bgColor} ${roofContextLayer.borderColor}`}>
					<CardHeader className="text-center pb-2">
						<CardTitle
							className={`text-xl font-semibold flex items-center justify-center ${roofContextLayer.textColor}`}
						>
							{roofContextLayer.icon} <span className="ml-2">{roofContextLayer.name}</span>
						</CardTitle>
						<CardDescription className={`${roofContextLayer.textColor} opacity-90 px-4`}>
							{roofContextLayer.description}
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center p-3">
						<div className="flex flex-wrap gap-2 justify-center">
							{roofContextLayer.elements.map((el, i) => (
								<span
									key={i}
									className={`px-2 py-1 text-xs rounded-full ${roofContextLayer.bgColor} ${roofContextLayer.textColor} border ${roofContextLayer.borderColor} bg-opacity-50 border-opacity-50`}
								>
                  {el}
                </span>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Pillars (L2, L3, L4) */}
				<div
					className={`grid md:grid-cols-3 gap-2 mb-1 p-4 rounded-md shadow-lg bg-stone-200 dark:bg-stone-800/50 border border-stone-300 dark:border-stone-700`}
				>
					{pillars.map((pillar, index) => (
						<Card
							key={index}
							className="flex flex-col bg-stone-50 dark:bg-stone-700/60 backdrop-blur-sm h-full shadow-md"
						>
							<CardHeader className="pb-2">
								<div className="flex items-center space-x-2 mb-1">
									{pillar.icon}
									<CardTitle className="text-md font-semibold text-stone-700 dark:text-stone-300">
										{pillar.name}
									</CardTitle>
								</div>
								<CardDescription className="text-xs text-slate-500 dark:text-slate-400">
									{pillar.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex-grow">
								<div className="flex flex-wrap gap-1">
									{pillar.elements.map((el, i) => (
										<span
											key={i}
											className="px-1.5 py-0.5 text-xs rounded-full bg-stone-200 text-stone-700 border border-stone-300 dark:bg-stone-600 dark:text-stone-200 dark:border-stone-500"
										>
                      {el}
                    </span>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Platform Base (L5) */}
				<Card className={`mb-1 shadow-lg ${platformBase.bgColor} ${platformBase.borderColor}`}>
					<CardHeader className="text-center pb-2">
						<CardTitle className={`text-xl font-semibold flex items-center justify-center ${platformBase.textColor}`}>
							{platformBase.icon} <span className="ml-2">{platformBase.name}</span>
						</CardTitle>
						<CardDescription className={`${platformBase.textColor} opacity-90 px-4`}>
							{platformBase.description}
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center p-3">
						<div className="flex flex-wrap gap-2 justify-center">
							{platformBase.elements.map((el, i) => (
								<span
									key={i}
									className={`px-2 py-1 text-xs rounded-full ${platformBase.bgColor} ${platformBase.textColor} border ${platformBase.borderColor} bg-opacity-50 border-opacity-50`}
								>
                  {el}
                </span>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Foundation (L1) */}
				<Card className={`shadow-xl ${foundation.bgColor} ${foundation.borderColor}`}>
					<CardHeader className="text-center pb-2">
						<CardTitle className={`text-xl font-bold flex items-center justify-center ${foundation.textColor}`}>
							{foundation.icon} <span className="ml-2">{foundation.name}</span>
						</CardTitle>
						<CardDescription className={`${foundation.textColor} opacity-90 px-4`}>
							{foundation.description}
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center p-4">
						<div className="flex flex-wrap gap-2 justify-center">
							{foundation.elements.map((el, i) => (
								<span
									key={i}
									className={`px-3 py-1 text-sm rounded-full ${foundation.bgColor} ${foundation.textColor} border-2 ${foundation.borderColor} font-medium`}
								>
                  {el}
                </span>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
