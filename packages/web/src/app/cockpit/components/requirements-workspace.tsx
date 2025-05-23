"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, FileText, Code, Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import AwarenessInput from "@/components/shared/awareness-input"
import GenifyMarkdownRender from "@/components/markdown/GenifyMarkdownRender";

const DEFAULT_REQUIREMENT = "我需要一个会议室预订系统，支持用户通过手机查看可用会议室，预订会议时段，设置会议提醒，并能邀请其他参会者。系统需要防止会议室冲突，并提供简单的管理界面。";

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
	                                              conversation,
	                                              documentContent,
	                                              onSendMessage,
	                                              onDocumentEdit,
	                                              onUpdateDocument,
	                                              onCheckQuality,
	                                              onKeywordsExtracted, // 添加新属性
	                                              isLoading = false,
	                                              isDocumentUpdating = false,
	                                              isQualityChecking = false,
                                              }: RequirementsWorkspaceProps) {
	const [activeTab, setActiveTab] = useState<"conversation" | "document" | "vibeCoding" | "diagnosis">("conversation")
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editContent, setEditContent] = useState("")
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const [isInitialized, setIsInitialized] = useState(false) // 添加初始化标志

	// 只在组件首次加载时设置默认值，而不是在每次currentRequirement变为空时
	useEffect(() => {
		if (!isInitialized && conversation.length === 0 && !currentRequirement) {
			setCurrentRequirement(DEFAULT_REQUIREMENT);
			setIsInitialized(true);
		}
	}, [conversation.length, currentRequirement, setCurrentRequirement, isInitialized]);

	useEffect(() => {
		if (messagesEndRef.current && activeTab === "conversation") {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
		}
	}, [conversation, activeTab])

	const handleSend = () => {
		if (currentRequirement.trim()) {
			onSendMessage(currentRequirement.trim())
			setCurrentRequirement("")
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
			e.preventDefault()
			handleSend()
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCurrentRequirement(e.target.value)
	}

	const analyzeRequirement = async () => {
		if (!currentRequirement.trim()) return

		setIsAnalyzing(true)
		try {
			const response = await fetch('/api/requirements/enrich', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					text: currentRequirement,
					systemPrompt: '你是一个需求分析专家，善于丰富需求上下文和完善需求细节，同时保持原始需求的核心意图。'
				})
			})

			const data = await response.json()
			if (data.success && data.text) {
				setCurrentRequirement(data.text)
			}
		} catch (error) {
			console.error('Error enriching requirement:', error)
		} finally {
			setIsAnalyzing(false)
		}
	}

	const startEditing = (id: string, content: string) => {
		setEditingId(id)
		setEditContent(content)
	}

	const saveEdit = () => {
		if (editingId) {
			onDocumentEdit(editingId, editContent)
			setEditingId(null)
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
					<div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
						<div
							className={`flex items-center px-3 py-1.5 rounded cursor-pointer ${activeTab === "conversation" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
							onClick={() => setActiveTab("conversation")}
						>
							<MessageSquare className="h-4 w-4 mr-2"/>
							<span className="text-sm font-medium">对话流</span>
						</div>
						<div
							className={`flex items-center px-3 py-1.5 rounded cursor-pointer ${activeTab === "document" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
							onClick={() => setActiveTab("document")}
						>
							<FileText className="h-4 w-4 mr-2"/>
							<span className="text-sm font-medium">需求文档</span>
						</div>
						<div
							className={`flex items-center px-3 py-1.5 rounded cursor-pointer ${activeTab === "vibeCoding" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
							onClick={() => setActiveTab("vibeCoding")}
						>
							<Code className="h-4 w-4 mr-2"/>
							<span className="text-sm font-medium">Vibe Coding</span>
						</div>
						<div
							className={`flex items-center px-3 py-1.5 rounded cursor-pointer ${activeTab === "diagnosis" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
							onClick={() => setActiveTab("diagnosis")}
						>
							<Search className="h-4 w-4 mr-2"/>
							<span className="text-sm font-medium">问题诊断</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flex-1 relative">
				<div className={`absolute inset-0 flex flex-col ${activeTab === "conversation" ? "block" : "hidden"}`}>
					<div className="flex-1 overflow-hidden">
						<ScrollArea className="h-full">
							<div className="p-4">
								{conversation.length === 0 && (
									<div className="flex justify-center items-center h-40 text-gray-500">
										<div className="text-center">
											<p className="mb-2">请在下方输入您的需求开始对话</p>
											<p className="text-xs">提示：使用清晰、具体的语言描述您的需求</p>
										</div>
									</div>
								)}

								{conversation.map((message, index) => (
									<div
										key={index}
										className={cn(
											"mb-4 max-w-[80%] rounded-lg p-4",
											message.role === "user" ? "ml-auto bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-800",
										)}
									>
										<div>
											<GenifyMarkdownRender content={message.content}/>
										</div>
										{message.role === "assistant" && index === conversation.length - 1 && (
											<div className="flex gap-2 justify-end mt-3">
												<Button variant="outline" size="sm" className="flex items-center"
													onClick={onUpdateDocument}
													disabled={isDocumentUpdating}
												>
													{isDocumentUpdating ? (
														<>
															<span
																className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"/>
															更新中...
														</>
													) : (
														<>
															<FileText className="h-3 w-3 mr-1"/>
															生成需求文档
														</>
													)}
												</Button>
												<Button variant="outline" size="sm" className="flex items-center"
													onClick={onCheckQuality}
													disabled={isQualityChecking || (documentContent && documentContent.length === 0)}
												>
													{isQualityChecking ? (
														<>
															<span
																className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"/>
															检查中...
														</>
													) : (
														<>
															<svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" width="24"
															     height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
															     strokeLinecap="round" strokeLinejoin="round">
																<path d="M10 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v15"/>
																<path d="M13.9 17.25 16 15.5l2.1 1.75"/>
																<path d="m16 15.5-4.6 3.86L9 18"/>
															</svg>
															质量检查
														</>
													)}
												</Button>
											</div>
										)}
									</div>
								))}
								<div ref={messagesEndRef} className="h-4"></div>
							</div>
						</ScrollArea>
					</div>

					<div className="p-4 border-t border-gray-200 bg-white">
						<div className={conversation.length === 0 ? "mb-2 text-sm font-medium text-gray-700" : "hidden"}>
							请描述您的核心需求或意图
						</div>
						<AwarenessInput
							value={currentRequirement}
							onChange={handleInputChange}
							onSend={handleSend}
							keywordsAnalyze={true}
							onAnalyze={analyzeRequirement}
							isLoading={isLoading}
							isAnalyzing={isAnalyzing}
							minHeight={conversation.length === 0 ? "100px" : "80px"}
							onKeyDown={handleKeyDown}
							onKeywordsExtracted={onKeywordsExtracted}
							placeholder={conversation.length === 0
								? "例如：我需要一个会议室预订系统，支持用户通过手机查看可用会议室，预订会议时段，设置会议提醒，并能邀请其他参会者。系统需要防止会议室冲突，并提供简单的管理界面。"
								: "输入您的回复..."}
						/>
					</div>
				</div>

				<div className={`absolute inset-0 ${activeTab === "document" ? "block" : "hidden"}`}>
					<div className="h-full">
						<ScrollArea className="h-full p-4">
							{documentContent && documentContent.length === 0 ? (
								<div className="flex justify-center items-center h-40 text-gray-500">
									<div className="text-center">
										<p className="mb-2">暂无需求文档</p>
										<p className="text-xs">在对话中点击&#34;生成需求文档&#34;按钮来创建</p>
									</div>
								</div>
							) : (
								documentContent && documentContent.map((section) => (
									<Card key={section.id} id={section.id} className="mb-4 py-0">
										<CardContent className="p-4">
											{editingId === section.id ? (
												<div className="space-y-3">
													<div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
														<div className="text-sm font-medium text-blue-600 flex items-center">
															<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none"
															     viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
																<path strokeLinecap="round" strokeLinejoin="round"
																      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
															</svg>
															编辑文档内容
														</div>
														<div className="flex gap-2">
															<Button variant="outline" size="sm" onClick={() => setEditingId(null)}
															        className="hover:bg-gray-100">
																取消
															</Button>
															<Button size="sm" onClick={saveEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
																保存修改
															</Button>
														</div>
													</div>
													<Textarea
														value={editContent}
														onChange={(e) => setEditContent(e.target.value)}
														className="min-h-[250px] font-mono text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
														placeholder="在此编辑需求文档内容..."
													/>
												</div>
											) : (
												<div className="space-y-3">
													<div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
														<div className="text-sm font-medium text-gray-700 flex items-center">
															<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none"
															     viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
																<path strokeLinecap="round" strokeLinejoin="round"
																      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
															</svg>
															需求文档
														</div>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => startEditing(section.id, section.content)}
															className="flex items-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
														>
															<svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none"
															     viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
																<path strokeLinecap="round" strokeLinejoin="round"
																      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
															</svg>
															编辑
														</Button>
													</div>
													<div
														className="prose prose-sm max-w-none bg-white rounded-md p-3 border border-gray-100 shadow-sm">
														<GenifyMarkdownRender content={section.content}/>
													</div>
												</div>
											)}
										</CardContent>
									</Card>
								))
							)}
						</ScrollArea>
					</div>
				</div>

				{/* Vibe Coding Tab */}
				<div className={`absolute inset-0 ${activeTab === "vibeCoding" ? "block" : "hidden"}`}>
					<div className="h-full">
						<ScrollArea className="h-full p-4">
							<div className="flex justify-center items-center h-40 text-gray-500">
								<div className="text-center">
									<p className="mb-2">Vibe Coding 功能</p>
									<p className="text-xs">根据需求自动生成代码风格和架构建议</p>
								</div>
							</div>
							<Card className="mb-4 py-0">
								<CardContent className="p-4">
									<div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
										<div className="text-sm font-medium text-gray-700 flex items-center">
											<Code className="h-4 w-4 mr-1.5" />
											代码风格与架构推荐
										</div>
									</div>
									<div className="prose prose-sm max-w-none bg-white rounded-md p-3 border border-gray-100 shadow-sm">
										<p>基于当前需求分析，系统将为你生成 AI 编程的提示词。</p>
									</div>
								</CardContent>
							</Card>
						</ScrollArea>
					</div>
				</div>

				{/* Problem Diagnosis Tab */}
				<div className={`absolute inset-0 ${activeTab === "diagnosis" ? "block" : "hidden"}`}>
					<div className="h-full">
						<ScrollArea className="h-full p-4">
							<div className="flex justify-center items-center h-40 text-gray-500">
								<div className="text-center">
									<p className="mb-2">问题诊断功能</p>
									<p className="text-xs">识别需求中的潜在问题和风险</p>
								</div>
							</div>
							<Card className="mb-4 py-0">
								<CardContent className="p-4">
									<div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
										<div className="text-sm font-medium text-gray-700 flex items-center">
											<Search className="h-4 w-4 mr-1.5" />
											需求问题诊断报告
										</div>
									</div>
									<div className="prose prose-sm max-w-none bg-white rounded-md p-3 border border-gray-100 shadow-sm">
										<p>系统将分析当前需求，识别潜在的问题、不一致或模糊点，并提供改进建议。</p>
									</div>
								</CardContent>
							</Card>
						</ScrollArea>
					</div>
				</div>
			</div>
		</div>
	)
}
