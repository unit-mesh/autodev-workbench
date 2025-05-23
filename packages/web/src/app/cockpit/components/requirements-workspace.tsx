"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import AwarenessInput from "@/components/shared/awareness-input"
import { Message, useConversationLogic } from "@/hooks/useConversationLogic"
import {
	Loader2,
	CheckCircle2,
	RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import AssetRecommendation from "@/app/ai-tools/requirements/components/asset-recommendation"
import RequirementCardComponent from "@/app/ai-tools/requirements/components/requirement-card"
import EditRequirementDialog from "@/app/ai-tools/requirements/components/edit-requirement-dialog"
import { useRequirementCardActions } from "@/app/ai-tools/requirements/hooks/useRequirementCardActions"

interface RequirementsWorkspaceProps {
	onKeywordsExtracted?: (keywords: string[]) => void
}

export default function RequirementsWorkspace({
	                                              onKeywordsExtracted,
                                              }: RequirementsWorkspaceProps) {
	const [input, setInput] = useState("")
	const chatContainerRef = useRef<HTMLDivElement>(null)

	const {
		messages,
		isProcessing,
		// conversationContext, // Not used in this simplified view
		selectedAPIObjects,
		selectedCodeSnippetObjects,
		selectedStandardObjects,
		selectedAPIs,
		selectedCodeSnippets,
		selectedStandards,
		requirementCard,
		// concepts, // Not used in this simplified view
		// isLoadingConcepts, // Not used in this simplified view
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

	const {
		editDialogOpen,
		setEditDialogOpen,
		editField,
		currentEditValue,
		// hasDraft, // Not used in this simplified view
		handleEditRequirement,
		handleSaveEdit,
		handleSaveAsDraft,
		handleGenerateTask,
	} = useRequirementCardActions({
		requirementCard,
		setRequirementCard,
		resetConversation,
	})

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

	const renderMessage = (message: Message) => {
		switch (message.type) {
			case "user":
				return <p>{message.content}</p>
			case "system":
				if (message.loading) {
					return (
						<div className="flex items-center space-x-2">
							<Loader2 className="h-4 w-4 animate-spin"/>
							<span>{message.content}</span>
						</div>
					)
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
					)
				} else {
					return <p>{message.content}</p>
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
				)

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
				)

			case "asset-recommendation":
				const keywords =
					message.data?.keywords ||
					(messages.find(m => m.type === "intent-recognition")?.data?.keywords ?? [])
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
				)

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
				)

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
				)

			default:
				return <p>{message.content}</p>
		}
	}

	return (
		<div className="flex-1 flex flex-col h-full border-l border-r border-gray-200">
			{/* Header */}
			<div className="px-4 py-2 border-b border-gray-200 bg-white">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-xl font-semibold text-gray-800">自动开发驾驶舱</h1>
						<p className="text-sm text-gray-500">与 AI 助手协作定义、完善和实现您的需求</p>
					</div>
				</div>
			</div>

			<div className="flex-1 flex flex-col overflow-hidden"> {/* Ensure flex-col and overflow-hidden for layout */}
				<ScrollArea className="flex-1 p-4 space-y-4" ref={chatContainerRef}> {/* Ensure flex-1 for ScrollArea */}
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

				<div className="p-4 border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
					<AwarenessInput
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onSend={() => {
							if (messages.some(m => m.type === "bullet-prompts")) {
								handleAnswerSubmit(input)
							} else {
								// Create a dummy event for handleFormSubmit
								const dummyEvent = { preventDefault: () => {} } as React.FormEvent
								handleFormSubmit(dummyEvent)
							}
						}}
						keywordsAnalyze={true} // Retain this functionality
						placeholder={
							isProcessing ? "正在处理..." :
								messages.some(m => m.type === "bullet-prompts") ? "回答问题或输入新指令..." :
									"请描述您的需求..."
						}
						isLoading={isProcessing}
						minHeight="60px"
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
								e.preventDefault()
								if (messages.some(m => m.type === "bullet-prompts")) {
									handleAnswerSubmit(input)
								} else {
									// Create a dummy event for handleFormSubmit
									const dummyEvent = { preventDefault: () => {}, ...e } as unknown as React.FormEvent
									handleFormSubmit(dummyEvent)
								}
							}
						}}
						onKeywordsExtracted={onKeywordsExtracted} // Pass the prop
						systemPrompt="你是一个需求分析助手，请从用户输入中提取关键词，重点关注业务术语和功能需求。"
					/>
				</div>
			</div>

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
