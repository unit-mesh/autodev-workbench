"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import AwarenessInput from "@/components/shared/awareness-input"
import { Message, useConversation } from "@/hooks/use-conversation"
import {
	Loader2,
	CheckCircle2,
	RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import AssetRecommendation from "@/app/ai-tools/requirements/components/asset-recommendation"
import RequirementCardComponent from "@/app/ai-tools/requirements/components/requirement-card"
import EditRequirementDialog from "@/app/ai-tools/requirements/components/edit-requirement-dialog"
import { useRequirementCard } from "@/app/ai-tools/requirements/use-requirement-card"

interface RequirementsWorkspaceProps {
	currentRequirement: string
	setCurrentRequirement: (value: string) => void
	conversation: Array<{ role: string; content: string }>
	documentContent: Array<{ id: string; type: string; content: string }>
	onSendMessage: (message: string) => void
	onDocumentEdit: (id: string, newContent: string) => void
	onUpdateDocument?: () => void
	onCheckQuality?: () => void
	onKeywordsExtracted?: (keywords: string[]) => void // 添加新属性
	isLoading?: boolean
	isDocumentUpdating?: boolean
	isQualityChecking?: boolean
}

export default function RequirementsWorkspace({
	currentRequirement,
	setCurrentRequirement,
	documentContent,
	onSendMessage,
	onUpdateDocument,
	onCheckQuality,
	onKeywordsExtracted,
	isLoading: externalIsLoading,
	isDocumentUpdating,
	isQualityChecking,
}: RequirementsWorkspaceProps) {
	const [input, setInput] = useState("")
	const chatContainerRef = useRef<HTMLDivElement>(null)

	const {
		messages,
		isProcessing,
		selectedAPIs,
		selectedCodeSnippets,
		selectedStandards,
		requirementCard,
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
	} = useConversation()

	const {
		editDialogOpen,
		setEditDialogOpen,
		editField,
		currentEditValue,
		handleEditRequirement,
		handleSaveEdit,
		handleSaveAsDraft,
		handleGenerateTask,
	} = useRequirementCard({
		requirementCard,
		setRequirementCard,
		resetConversation,
	})

	useEffect(() => {
		if (requirementCard?.name && requirementCard.name !== currentRequirement) {
			setCurrentRequirement(requirementCard.name);
		}
	}, [requirementCard, setCurrentRequirement, currentRequirement]);

	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
		}
	}, [messages])

	// Add this useEffect to handle keyword extraction
	useEffect(() => {
		const intentMessage = messages.find(m => m.type === "intent-recognition");
		if (intentMessage && onKeywordsExtracted) {
			if (intentMessage.data.keywords.length > 0) {
				onKeywordsExtracted(intentMessage.data.keywords);
			}
		}
	}, [messages, onKeywordsExtracted]);

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isProcessing) return

		onSendMessage(input);
		await handleSubmit(input)
		setInput("")
	}

	const handleAnswerSubmit = async (userInput: string) => {
		onSendMessage(userInput);
		await handleAnswerPrompt(userInput)
		setInput("")
	}

	const handleQualityCheck = () => {
		if (onCheckQuality) {
			onCheckQuality();
		}
	};

	const handleUpdateDoc = () => {
		if (onUpdateDocument) {
			onUpdateDocument();
		}
	};

	const isLoading = externalIsLoading || isProcessing;

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
				// Remove the direct function call that was here
				// if (onKeywordsExtracted) {
				//     onKeywordsExtracted(message.data.keywords)
				// }
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
							onGenerateAiPrompt={handleSaveAsDraft}
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
					<div className="flex space-x-2">
						{documentContent.length > 0 && (
							<>
								<Button
									size="sm"
									variant="outline"
									onClick={handleUpdateDoc}
									disabled={isDocumentUpdating}
								>
									{isDocumentUpdating ? '更新中...' : '更新文档'}
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={handleQualityCheck}
									disabled={isQualityChecking}
								>
									{isQualityChecking ? '检查中...' : '质量检查'}
								</Button>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Chat messages area */}
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

			{/* Input area - moved to be a direct child of the main flex-col container */}
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
					keywordsAnalyze={false} // Retain this functionality
					placeholder={
						isLoading ? "正在处理..." :
							messages.some(m => m.type === "bullet-prompts") ? "回答问题或输入新指令..." :
								"请描述您的需求..."
					}
					isLoading={isLoading}
					minHeight="60px"
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
							e.preventDefault()
							if (messages.some(m => m.type === "bullet-prompts")) {
								handleAnswerSubmit(input)
							} else {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-expect-error
								const dummyEvent = { preventDefault: () => {}, ...e } as unknown as React.FormEvent
								handleFormSubmit(dummyEvent)
							}
						}
					}}
					systemPrompt="你是一个需求分析助手，请从用户输入中提取关键词，重点关注业务术语和功能需求。"
				/>
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
