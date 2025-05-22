"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
	Send,
	ChevronLeft,
	Loader2,
	CheckCircle2,
	RefreshCw,
	LogIn,
	BookmarkPlus,
	AlignJustify,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import AssetRecommendation from "@/app/chat/components/asset-recommendation"
import RequirementCardComponent, { RequirementCard } from "./components/requirement-card"
import { MarkdownCodeBlock } from "@/app/api/_utils/MarkdownCodeBlock";
import { ApiResource, CodeAnalysis, Guideline, ConceptDictionary } from "@/types/project.type"
import { ScrollArea } from "@/components/ui/scroll-area"
import RequirementInfoPanel from "./components/requirement-info-panel"

type MessageType =
	| "user"
	| "system"
	| "intent-recognition"
	| "bullet-prompts"
	| "asset-recommendation"
	| "requirement-card"
	| "confirmation"

interface Message {
	id: string
	type: MessageType
	content: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any
	loading?: boolean
}

const PROMPTS = {
	INTENT_RECOGNITION: `你是一个需求分析助手。请分析用户的需求描述，提取以下信息：
1. 主要意图（用户想要做什么）
2. 关键词（与需求相关的重要术语）。如果用户问的是业务问题，请忽略技术词汇
3. 置信度（你对理解正确的把握程度，0.0-1.0）

参考以下业务术语词典进行分析：
{concepts}

以JSON格式返回结果：
{
  "intent": "主要意图",
  "keywords": ["关键词1", "关键词2"],
  "confidence": 0.95,
  "summary": "对用户需求的简短总结"
}`,

	CLARIFYING_QUESTIONS: `基于用户的需求描述和以下背景信息，生成4-5个澄清问题，以便更好地定义需求：
背景信息：{intentInfo}

同时，生成一个可能的回答示例，作为用户可能如何回答这些问题的参考。

以JSON格式返回结果：
{
  "prompts": [
    "问题1？",
    "问题2？",
    "问题3？",
    "问题4？"
  ],
  "exampleAnswer": "这里是对以上问题的一个可能回答示例，应包含具体、明确的信息"
}`,

	ASSET_RECOMMENDATION: `基于用户的需求和回答，推荐可能有用的资源。
需求：{initialRequirement}
澄清问题的回答：{clarification}

以JSON格式返回三类资源：
{
  "apis": [
    {"id": "api1", "name": "ExcelExportAPI", "description": "Excel导出接口", "example": "示例代码片段"}
  ],
  "codeSnippets": [
    {"id": "code1", "name": "导出功能示例", "language": "TypeScript", "code": "示例代码", "description": "实现Excel导出的代码片段"}
  ],
  "standards": [
    {"id": "std1", "name": "数据导出规范", "description": "公司关于数据导出功能的开发规范"}
  ]
}`,

	REQUIREMENT_CARD: `根据用户需求和选择的资源，生成一个完整的需求卡片。
需求：{initialRequirement}
澄清问题的回答：{clarification}
选择的API：{selectedApis}
选择的代码片段：{selectedCodeSnippets}
选择的标准：{selectedStandards}

以JSON格式返回需求卡片：
{
  "name": "功能名称",
  "module": "所属模块",
  "description": "功能详细描述",
  "apis": [{selectedApis}],
  "codeSnippets": [{selectedCodeSnippets}],
  "guidelines": [{selectedStandards}],
  "assignee": "",
  "deadline": "",
  "status": "draft"
}`
}

export default function Chat() {
	const { data: session, status } = useSession()
	const router = useRouter()
	const [input, setInput] = useState("")
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "welcome",
			type: "system",
			content: "欢迎使用需求生成助手！请描述您的需求，例如：'我想加一个导出 Excel 的功能'",
		},
	])
	const [selectedAPIs, setSelectedAPIs] = useState<string[]>([])
	const [selectedCodeSnippets, setSelectedCodeSnippets] = useState<string[]>([])
	const [selectedStandards, setSelectedStandards] = useState<string[]>([])

	// 添加存储完整对象的状态
	const [selectedAPIObjects, setSelectedAPIObjects] = useState<ApiResource[]>([])
	const [selectedCodeSnippetObjects, setSelectedCodeSnippetObjects] = useState<CodeAnalysis[]>([])
	const [selectedStandardObjects, setSelectedStandardObjects] = useState<Guideline[]>([])

	const [isProcessing, setIsProcessing] = useState(false)
	const [requirementCard, setRequirementCard] = useState<RequirementCard | null>(null)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [editField, setEditField] = useState<keyof RequirementCard | null>(null)
	const [editValue, setEditValue] = useState("")
	const [hasDraft, setHasDraft] = useState(false)
	const [concepts, setConcepts] = useState<ConceptDictionary[]>([])
	const [isLoadingConcepts, setIsLoadingConcepts] = useState(false)
	const chatContainerRef = useRef<HTMLDivElement>(null)
	const [showSidebar, setShowSidebar] = useState(true)

	const [conversationContext, setConversationContext] = useState({
		initialRequirement: "",
		intentInfo: {},
		clarification: "",
		conversationId: "",
	})

	useEffect(() => {
		const fetchConcepts = async () => {
			setIsLoadingConcepts(true)
			try {
				const response = await fetch("/api/concepts")
				if (response.ok) {
					const data = await response.json()
					setConcepts(data)
				} else {
					console.error("Failed to fetch concepts:", response.statusText)
				}
			} catch (error) {
				console.error("Error fetching concepts:", error)
			} finally {
				setIsLoadingConcepts(false)
			}
		}

		fetchConcepts()
	}, [])

	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
		}
	}, [messages])

	// Generate intent recognition prompt with concepts
	const getIntentRecognitionPrompt = () => {
		return PROMPTS.INTENT_RECOGNITION.replace(
			"{concepts}",
			JSON.stringify(concepts)
		)
	}

	const callChatAPI = async (userPrompt: string, systemPrompt: string) => {
		console.log("Calling chat API with prompt:", userPrompt, systemPrompt)
		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: userPrompt }
					],
					conversationId: conversationContext.conversationId || undefined
				})
			});

			const data = await response.json();

			if (data.conversationId && !conversationContext.conversationId) {
				setConversationContext(prev => ({
					...prev,
					conversationId: data.conversationId
				}));
			}

			return data.text;
		} catch (error) {
			console.error("Error calling chat API:", error);
			return "抱歉，处理您的请求时出现错误。";
		}
	}

	const parseJsonResponse = (text: string) => {
		try {
			const blocks = MarkdownCodeBlock.from(text).filter(it => it.language === "json");
			let jsonStr = blocks.length > 0 ? blocks[0].code : text;
			if (jsonStr == undefined) {
				jsonStr = text
			}
			return JSON.parse(jsonStr);
		} catch (error) {
			console.error("Error parsing JSON response:", error);
			console.log("Raw text:", text);
			return null;
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isProcessing) return

		const userMessage: Message = {
			id: Date.now().toString(),
			type: "user",
			content: input,
		}

		const processingMessage: Message = {
			id: (Date.now() + 1).toString(),
			type: "system",
			content: "正在分析您的需求...",
			loading: true,
		}

		setMessages((prev) => [...prev, userMessage, processingMessage])
		setInput("")
		setIsProcessing(true)

		setConversationContext(prev => ({
			...prev,
			initialRequirement: input
		}))

		// Step 1: Intent recognition
		try {
			const intentPrompt = getIntentRecognitionPrompt()
			const intentResponse = await callChatAPI(input, intentPrompt);
			const intentData = parseJsonResponse(intentResponse);

			if (!intentData) {
				throw new Error("无法解析意图识别结果");
			}

			setConversationContext(prev => ({
				...prev,
				intentInfo: intentData
			}));

			setMessages((prev) => prev.filter((msg) => msg.id !== processingMessage.id));

			// Add intent recognition message
			const intentMessage: Message = {
				id: Date.now().toString(),
				type: "intent-recognition",
				content: intentData.summary || `我理解您需要${intentData.intent}。`,
				data: intentData
			}

			setMessages(prev => [...prev, intentMessage]);

			// Step 2: Generate clarifying questions
			const promptSystemMessage = PROMPTS.CLARIFYING_QUESTIONS.replace(
				"{intentInfo}",
				JSON.stringify(intentData)
			);

			const questionsResponse = await callChatAPI(input, promptSystemMessage);
			const questionsData = parseJsonResponse(questionsResponse);

			if (!questionsData || !questionsData.prompts) {
				throw new Error("无法生成澄清问题");
			}

			const promptMessage: Message = {
				id: Date.now().toString(),
				type: "bullet-prompts",
				content: "为了更好地定义这个需求，请告诉我：",
				data: questionsData
			}

			setMessages(prev => [...prev, promptMessage]);
		} catch (error) {
			console.error("Error during intent recognition:", error);
			setMessages(prev => [
				...prev.filter(msg => msg.id !== processingMessage.id),
				{
					id: Date.now().toString(),
					type: "system",
					content: "抱歉，处理您的需求时出现了问题。请再试一次。"
				}
			]);
		} finally {
			setIsProcessing(false);
		}
	}

	const generateAssetRecommendation = async (processingMessageId: string, userInput?: string) => {
		try {
			const clarification = userInput ? userInput : conversationContext.clarification || "";
			if (!clarification) {
				throw new Error("缺少用户输入");
			}

			const assetPrompt = PROMPTS.ASSET_RECOMMENDATION
				.replace("{initialRequirement}", conversationContext.initialRequirement)
				.replace("{clarification}", clarification);

			const assetResponse = await callChatAPI(clarification, assetPrompt);
			const assetData = parseJsonResponse(assetResponse);

			if (!assetData) {
				throw new Error("无法生成资源推荐");
			}

			setMessages(prev => prev.filter(msg => msg.id !== processingMessageId));
			const assetMessage: Message = {
				id: Date.now().toString(),
				type: "asset-recommendation",
				content: "根据您的需求，我找到了以下可能有用的资源：",
				data: assetData
			}

			setMessages(prev => [...prev, assetMessage]);
			return true;
		} catch (error) {
			console.error("Error during asset recommendation:", error);
			setMessages(prev => [
				...prev.filter(msg => msg.id !== processingMessageId),
				{
					id: Date.now().toString(),
					type: "system",
					content: "抱歉，生成资源推荐时出现了问题。请再试一次。",
					data: { errorType: "asset" }
				}
			]);
			return false;
		}
	};

	const generateRequirementCard = async (processingMessageId: string) => {
		try {
			const cardPrompt = PROMPTS.REQUIREMENT_CARD
				.replace("{initialRequirement}", conversationContext.initialRequirement)
				.replace("{clarification}", conversationContext.clarification)
				.replace("{selectedApis}", selectedAPIObjects.map((api: ApiResource) => {
					return `name: ${api.packageName}.${api.className}.${api.methodName}\nurl: ${api.sourceHttpMethod} ${api.sourceUrl}}`;
				}).join(","))
				.replace("{selectedCodeSnippets}", selectedCodeSnippetObjects.map((code: CodeAnalysis) => {
					return `name: ${code.title}\ndescription: ${code.description}\ncode: ${code.content}`;
				}).join("\n"))
				.replace("{selectedStandards}", JSON.stringify(selectedStandardObjects));

			const cardResponse = await callChatAPI(
				`生成需求卡片: ${conversationContext.initialRequirement}`,
				cardPrompt
			);

			const cardData = parseJsonResponse(cardResponse);

			if (!cardData) {
				throw new Error("无法生成需求卡片");
			}

			const newRequirementCard: RequirementCard = {
				...cardData,
				apis: selectedAPIObjects,
				codeSnippets: selectedCodeSnippetObjects,
				guidelines: selectedStandardObjects,
				status: "draft"
			};

			setRequirementCard(newRequirementCard);
			setMessages(prev => prev.filter(msg => msg.id !== processingMessageId));

			const cardPreviewMessage: Message = {
				id: Date.now().toString(),
				type: "requirement-card",
				content: "已为您生成需求卡片预览：",
				data: { card: newRequirementCard }
			}

			setMessages(prev => [...prev, cardPreviewMessage]);
			return true;
		} catch (error) {
			console.error("Error generating requirement card:", error);
			setMessages(prev => [
				...prev.filter(msg => msg.id !== processingMessageId),
				{
					id: Date.now().toString(),
					type: "system",
					content: "抱歉，生成需求卡片时出现了问题。请再试一次。",
					data: { errorType: "card" }
				}
			]);
			return false;
		}
	};

	const handleAnswerPrompt = async (userInput: string) => {
		const userAnswer: Message = {
			id: Date.now().toString(),
			type: "user",
			content: userInput,
		}

		const processingMessage: Message = {
			id: (Date.now() + 1).toString(),
			type: "system",
			content: "正在处理您的回答...",
			loading: true,
		}

		setMessages((prev) => [...prev, userAnswer, processingMessage])
		setIsProcessing(true)
		setConversationContext(prev => ({
			...prev,
			clarification: userInput
		}));

		try {
			await generateAssetRecommendation(processingMessage.id, userInput);
		} finally {
			setIsProcessing(false);
		}
	}

	const handleSelectAPI = (apiId: string) => {
		if (selectedAPIs.includes(apiId)) {
			setSelectedAPIs(prev => prev.filter(id => id !== apiId));
		} else {
			setSelectedAPIs(prev => [...prev, apiId]);
		}
	}

	const handleSelectCodeSnippet = (snippetId: string) => {
		if (selectedCodeSnippets.includes(snippetId)) {
			setSelectedCodeSnippets(prev => prev.filter(id => id !== snippetId));
		} else {
			setSelectedCodeSnippets(prev => [...prev, snippetId]);
		}
	}

	const handleSelectStandard = (standardId: string) => {
		if (selectedStandards.includes(standardId)) {
			setSelectedStandards(prev => prev.filter(id => id !== standardId));
		} else {
			setSelectedStandards(prev => [...prev, standardId]);
		}
	}

	const handleConfirmAssetSelection = async () => {
		const processingMessage: Message = {
			id: Date.now().toString(),
			type: "system",
			content: "正在生成需求卡片...",
			loading: true,
		}

		setMessages(prev => [...prev, processingMessage]);
		setIsProcessing(true);

		try {
			await generateRequirementCard(processingMessage.id);
		} finally {
			setIsProcessing(false);
		}
	}

	const handleSaveAsDraft = () => {
		if (requirementCard) {
			setHasDraft(true);

			const draftMessage: Message = {
				id: Date.now().toString(),
				type: "system",
				content: "已将需求保存为草稿，您可以稍后继续编辑。"
			}

			setMessages(prev => [...prev, draftMessage]);
		}
	}

	const handleEditRequirement = (field: keyof RequirementCard) => {
		if (!requirementCard) return;

		let initialValue = "";
		switch (field) {
			case "name":
				initialValue = requirementCard.name;
				break;
			case "module":
				initialValue = requirementCard.module;
				break;
			case "description":
				initialValue = requirementCard.description;
				break;
			case "assignee":
				initialValue = requirementCard.assignee;
				break;
			case "deadline":
				initialValue = requirementCard.deadline;
				break;
		}

		setEditField(field);
		setEditValue(initialValue);
		setEditDialogOpen(true);
	}

	const handleSaveEdit = () => {
		if (!editField || !requirementCard) return;

		const updatedCard = { ...requirementCard };
		(updatedCard[editField] as string) = editValue;
		setRequirementCard(updatedCard);

		setEditDialogOpen(false);
		setEditField(null);
		setEditValue("");
	}

	const handleGenerateTask = () => {
		const confirmationMessage: Message = {
			id: Date.now().toString(),
			type: "confirmation",
			content: "需求已成功生成！",
			data: { requirementCard }
		}

		setMessages(prev => [...prev, confirmationMessage]);

		setTimeout(() => {
			setSelectedAPIs([]);
			setSelectedCodeSnippets([]);
			setSelectedStandards([]);
			setRequirementCard(null);
			setHasDraft(false);
		}, 2000);
	}

	const handleRetry = async (errorType: string) => {
		const processingMessage: Message = {
			id: Date.now().toString(),
			type: "system",
			content: `正在重新${errorType === "asset" ? "生成资源推荐" : "生成需求卡片"}...`,
			loading: true,
		}

		setMessages(prev => [...prev, processingMessage]);
		setIsProcessing(true);

		try {
			if (errorType === "asset") {
				await generateAssetRecommendation(processingMessage.id);
			} else if (errorType === "card") {
				await generateRequirementCard(processingMessage.id);
			}
		} finally {
			setIsProcessing(false);
		}
	};

	const renderMessage = (message: Message) => {
		switch (message.type) {
			case "user":
				return <p>{message.content}</p>;
			case "system":
				if (message.loading) {
					return (
						<div className="flex items-center space-x-2">
							<Loader2 className="h-4 w-4 animate-spin"/>
							<span>{message.content}</span>
						</div>
					);
				} else if (message.data?.errorType) {
					return (
						<div className="space-y-2">
							<p>{message.content}</p>
							<Button
								size="sm"
								variant="outline"
								className="flex items-center space-x-1"
								onClick={() => handleRetry(message.data.errorType)}
							>
								<RefreshCw className="h-4 w-4"/>
								<span>重试</span>
							</Button>
						</div>
					);
				} else {
					return <p>{message.content}</p>;
				}

			case "intent-recognition":
				return (
					<div className="space-y-2">
						<p>{message.content}</p>
						<div className="flex space-x-2">
							<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
								意图: {message.data.intent}
							</Badge>
							{message.data.keywords.map((keyword: string, index: number) => (
								<Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
									关键词: {keyword}
								</Badge>
							))}
						</div>
					</div>
				);

			case "bullet-prompts":
				return (
					<div className="space-y-2">
						<p>{message.content}</p>
						<ul className="list-disc pl-5 space-y-1">
							{message.data.prompts.map((prompt: string, index: number) => (
								<li key={index}>{prompt}</li>
							))}
						</ul>
						<div className="mt-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => setInput(message.data.exampleAnswer || "我需要在用户管理页面导出用户列表，包含用户ID、姓名、邮箱和注册时间")}
							>
								填充示例回答
							</Button>
						</div>
					</div>
				);

			case "asset-recommendation":
				const keywords =
					message.data?.keywords ||
					(messages.find(m => m.type === "intent-recognition")?.data?.keywords ?? []);
				return (
					<AssetRecommendation
						keywords={keywords}
						selectedAPIs={selectedAPIs}
						selectedCodeSnippets={selectedCodeSnippets}
						selectedStandards={selectedStandards}
						onSelectAPI={handleSelectAPI}
						onSelectCodeSnippet={handleSelectCodeSnippet}
						onSelectStandard={handleSelectStandard}
						onConfirm={handleConfirmAssetSelection}
						onSelectAPIObjects={setSelectedAPIObjects}
						onSelectCodeSnippetObjects={setSelectedCodeSnippetObjects}
						onSelectStandardObjects={setSelectedStandardObjects}
					/>
				);

			case "requirement-card":
				return (
					<div className="space-y-3">
						<p>{message.content}</p>
						<RequirementCardComponent
							card={message.data.card}
							onEdit={handleEditRequirement}
							onSaveAsDraft={handleSaveAsDraft}
							onGenerateTask={handleGenerateTask}
						/>
					</div>
				);

			case "confirmation":
				return (
					<div className="space-y-3">
						<div className="flex items-center space-x-2 text-green-600">
							<CheckCircle2 className="h-5 w-5"/>
							<p className="font-medium">{message.content}</p>
						</div>
						<p className="text-sm">任务已添加到需求池中，您可以在需求管理系统中查看和管理。</p>
						<div className="flex space-x-2">
							<Button size="sm" variant="outline">
								查看需求池
							</Button>
							<Button size="sm" variant="outline">
								开始新需求
							</Button>
						</div>
					</div>
				);

			default:
				return <p>{message.content}</p>;
		}
	}

	if (status === "loading") {
		return (
			<div className="flex flex-col items-center justify-center h-screen">
				<Loader2 className="h-8 w-8 animate-spin mb-4"/>
				<p>正在加载...</p>
			</div>
		)
	}

	if (status === "unauthenticated") {
		return (
			<div className="flex flex-col items-center justify-center h-screen">
				<div className="text-center max-w-md p-6 border rounded-lg shadow-sm">
					<h1 className="text-2xl font-bold mb-4">需要登录</h1>
					<p className="mb-6">您需要登录才能使用需求生成助手功能。</p>
					<Button
						onClick={() => router.push('/api/auth/signin')}
						className="flex items-center gap-2"
					>
						<LogIn className="h-4 w-4"/>
						登录 / 注册
					</Button>
				</div>
			</div>
		)
	}

	// Find the intent recognition data from messages
	const intentData = messages.find(m => m.type === "intent-recognition")?.data || null;

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Main chat area */}
			<div
				className={`flex flex-col ${showSidebar ? "w-2/3" : "w-full"} bg-white transition-all duration-300 ease-in-out`}>
				<header className="p-4 border-b bg-white z-10 flex items-center justify-between shadow-sm">
					<div className="flex items-center">
						<ChevronLeft className="h-5 w-5 mr-2 text-gray-500 hover:text-gray-700 cursor-pointer"
						             onClick={() => router.push('/')}/>
						<h1 className="text-xl font-bold text-gray-800">需求生成助手</h1>
					</div>
					<div className="flex items-center gap-2">
						{session?.user && (
							<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
								{session.user.name || session.user.email}
							</Badge>
						)}
						{isLoadingConcepts && (
							<Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
								<Loader2 className="h-3 w-3 animate-spin mr-1"/> 加载术语库中...
							</Badge>
						)}
						{concepts.length > 0 && !isLoadingConcepts && (
							<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
								已载入 {concepts.length} 条业务术语
							</Badge>
						)}
						{hasDraft && (
							<Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
								<BookmarkPlus className="h-3 w-3 mr-1"/> 草稿已保存
							</Badge>
						)}
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setShowSidebar(!showSidebar)}
							title={showSidebar ? "隐藏信息面板" : "显示信息面板"}
						>
							<AlignJustify className="h-5 w-5"/>
						</Button>
					</div>
				</header>

				<div className="flex-1 overflow-hidden"> {/* Wrapper for ScrollArea */}
					<ScrollArea className="h-full p-4 space-y-4" ref={chatContainerRef}>
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex mb-4 ${message.type === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
							>
								<div
									className={cn(
										"relative max-w-[85%] rounded-lg p-4 shadow-sm",
										message.type === "user" ?
											"bg-primary text-primary-foreground rounded-tr-none" :
											message.type === "requirement-card" || message.type === "asset-recommendation" ?
												"w-full bg-card border" :
												message.type === "intent-recognition" ?
													"bg-blue-50 border border-blue-100 text-gray-800 rounded-tl-none" :
													message.type === "bullet-prompts" ?
														"bg-amber-50 border border-amber-100 text-gray-800 rounded-tl-none" :
														message.type === "confirmation" ?
															"bg-green-50 border border-green-100 text-gray-800 rounded-tl-none" :
															"bg-gray-100 text-gray-800 rounded-tl-none"
									)}
								>
									{renderMessage(message)}
								</div>
							</div>
						))}
					</ScrollArea>
				</div>

				<form onSubmit={handleSubmit}
				      className="p-4 border-t flex space-x-2 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
					<Input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder={
							isProcessing ? "正在处理..." :
								messages.some(m => m.type === "bullet-prompts") ? "回答问题或输入新指令..." :
									"请描述您的需求..."
						}
						className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						disabled={isProcessing}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
								e.preventDefault();
								if (messages.some(m => m.type === "bullet-prompts")) {
									handleAnswerPrompt(input);
								} else {
									handleSubmit(e as unknown as React.FormEvent);
								}
							}
						}}
					/>
					<Button
						type="submit"
						disabled={!input.trim() || isProcessing}
						onClick={(e) => {
							e.preventDefault();
							if (messages.some(m => m.type === "bullet-prompts")) {
								handleAnswerPrompt(input);
							} else {
								handleSubmit(e as unknown as React.FormEvent);
							}
						}}
						className="transition-all duration-200"
					>
						{isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
					</Button>
				</form>
			</div>

			<RequirementInfoPanel
				isOpen={showSidebar}
				onClose={() => setShowSidebar(false)}
				conversationContext={conversationContext}
				intentData={intentData}
				selectedAPIObjects={selectedAPIObjects}
				selectedCodeSnippetObjects={selectedCodeSnippetObjects}
				selectedStandardObjects={selectedStandardObjects}
				requirementCard={requirementCard}
				isProcessing={isProcessing}
				onConfirmAssetSelection={handleConfirmAssetSelection}
				onSaveAsDraft={handleSaveAsDraft}
				onGenerateTask={handleGenerateTask}
			/>

			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editField === 'name' ? '编辑功能名称' :
								editField === 'module' ? '编辑所属模块' :
									editField === 'description' ? '编辑功能说明' :
										editField === 'assignee' ? '指定负责人' :
											'设置计划排期'}
						</DialogTitle>
					</DialogHeader>

					{editField === 'description' ? (
						<Textarea
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							rows={5}
							className="resize-none"
						/>
					) : (
						<Input
							type={editField === 'deadline' ? 'date' : 'text'}
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
						/>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
						<Button onClick={handleSaveEdit}>保存</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
