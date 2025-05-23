"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
	Send,
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
import RequirementCardComponent from "./components/requirement-card"
import { RequirementCard, EditableRequirementCardField } from "./types/requirement.types"
import { ScrollArea } from "@/components/ui/scroll-area"
import RequirementInfoPanel from "./components/requirement-info-panel"
import AwarenessInput from "@/components/shared/awareness-input"
import { useConversationLogic } from "@/hooks/useConversationLogic"
import EditRequirementDialog from "./components/edit-requirement-dialog"

export default function ChatPage() {
	const { data: session, status } = useSession()
	const router = useRouter()
	const [input, setInput] = useState("")
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [editField, setEditField] = useState<EditableRequirementCardField | null>(null)
	const [currentEditValue, setCurrentEditValue] = useState("")
	const [hasDraft, setHasDraft] = useState(false)
	const chatContainerRef = useRef<HTMLDivElement>(null)
	const [showSidebar, setShowSidebar] = useState(true)

	const {
		messages,
		isProcessing,
		conversationContext,
		selectedAPIObjects,
		selectedCodeSnippetObjects,
		selectedStandardObjects,
		selectedAPIs,
		selectedCodeSnippets,
		selectedStandards,
		requirementCard,
		concepts,
		isLoadingConcepts,
		handleSubmit,
		handleAnswerPrompt,
		handleSelectAPI,
		handleSelectCodeSnippet,
		handleSelectStandard,
		handleConfirmAssetSelection,
		handleRetry,
		setSelectedAPIObjects,
		setSelectedCodeSnippetObjects,
		setSelectedStandardObjects,
		setRequirementCard,
		resetConversation,
	} = useConversationLogic()

	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
		}
	}, [messages])

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isProcessing) return

		await handleSubmit(input)
		setInput("")
	}

	const handleAnswerSubmit = async (userInput: string) => {
		await handleAnswerPrompt(userInput)
		setInput("")
	}

	const handleSaveAsDraft = () => {
		if (requirementCard) {
			setHasDraft(true);

			// Create draft message will be handled in parent component if needed
		}
	}

	const handleEditRequirement = (field: EditableRequirementCardField) => {
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
		setCurrentEditValue(initialValue);
		setEditDialogOpen(true);
	}

	const handleSaveEdit = (newValue: string) => {
		if (!editField || !requirementCard) return;

		const updatedCard = { ...requirementCard };
		// The type assertion here is safe because editField is now EditableRequirementCardField,
		// all of which are keys of RequirementCard that hold string values.
		(updatedCard[editField] as string) = newValue;
		setRequirementCard(updatedCard);

		setEditDialogOpen(false);
		setEditField(null);
		setCurrentEditValue("");
	}

	const handleGenerateTask = () => {
		// Handle task generation
		setTimeout(() => {
			resetConversation();
			setHasDraft(false);
		}, 2000);
	}

	const handleKeywordsExtracted = (keywords: string[]) => {
		console.log("提取到的关键词:", keywords)
		// 可以在这里处理提取到的关键词，比如保存到状态中
	}

	const renderMessage = (message: any) => {
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

	const intentData = messages.find(m => m.type === "intent-recognition")?.data || null;

	return (
		<div className="flex h-screen bg-gray-50">
			<div
				className={`flex flex-col ${showSidebar ? "w-2/3" : "w-full"} bg-white transition-all duration-300 ease-in-out`}>
				<header className="p-4 border-b bg-white z-10 flex items-center justify-between shadow-sm">
					<div className="flex items-center">
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

				<div className="flex-1 overflow-hidden">
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

				<div className="p-4 border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
					<AwarenessInput
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onSend={() => {
							if (messages.some(m => m.type === "bullet-prompts")) {
								handleAnswerSubmit(input);
							} else {
								handleFormSubmit(new Event('submit') as unknown as React.FormEvent);
							}
						}}
						keywordsAnalyze={false}
						placeholder={
							isProcessing ? "正在处理..." :
								messages.some(m => m.type === "bullet-prompts") ? "回答问题或输入新指令..." :
									"请描述您的需求..."
						}
						isLoading={isProcessing}
						minHeight="60px"
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
								e.preventDefault();
								if (messages.some(m => m.type === "bullet-prompts")) {
									handleAnswerSubmit(input);
								} else {
									handleFormSubmit(e as unknown as React.FormEvent);
								}
							}
						}}
						onKeywordsExtracted={handleKeywordsExtracted}
						systemPrompt="你是一个需求分析助手，请从用户输入中提取关键词，重点关注业务术语和功能需求。"
					/>
				</div>
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

			<EditRequirementDialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				field={editField}
				initialValue={currentEditValue}
				onSave={handleSaveEdit}
			/>
		</div>
	)
}
