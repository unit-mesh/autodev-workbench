"use client"

import { useState } from "react"
import { EventSourceParserStream } from 'eventsource-parser/stream'
import RequirementsWorkspace from "@/components/cockpit/requirements-workspace"
import KnowledgeHub from "@/components/cockpit/knowledge-hub"
import AIAssistantPanel from "@/components/cockpit/ai-assistant-panel"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

export default function Home() {
	const [currentRequirement, setCurrentRequirement] = useState("")
	const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([])
	const [documentContent, setDocumentContent] = useState<Array<{ id: string; type: string; content: string }>>([])
	const [activeKnowledgeSource, setActiveKnowledgeSource] = useState<string | null>(null)
	const [qualityAlerts, setQualityAlerts] = useState<
		Array<{ id: string; type: string; message: string; relatedReqId: string }>
	>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isDocumentUpdating, setIsDocumentUpdating] = useState(false)
	const [isQualityChecking, setIsQualityChecking] = useState(false)
	const [conversationId, setConversationId] = useState<string | null>(null)

	// 为需求对话添加系统提示词
	const requirementSystemPrompt =
		"你是一位专业的需求分析师，专门帮助用户分析和完善软件需求。" +
		"你的任务是通过提问帮助用户明确需求，并将讨论内容整理为结构化的需求文档。" +
		"回答时，你需要：\n" +
		"1. 提出有价值的问题，帮助用户思考需求的各个方面\n" +
		"2. 根据对话内容，自动识别并提取关键需求点\n" +
		"3. 保持专业、友好的态度，引导用户考虑完整的需求场景\n" +
		"如果用户的需求描述不够清晰，请主动询问细节。"

	const handleSendMessage = async (message: string) => {
		const newConversation = [...conversation, { role: "user", content: message }]
		setConversation(newConversation)
		setIsLoading(true)

		try {
			let messages = newConversation
			if (conversation.length === 0) {
				messages = [
					{ role: "system", content: requirementSystemPrompt },
					...newConversation
				]
			}

			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: messages,
					conversationId,
					stream: true
				})
			})

			if (!response.ok) {
				throw new Error("获取 AI 回复失败")
			}

			let aiResponse = ''

			const eventStream = response.body!
				.pipeThrough(new TextDecoderStream())
				.pipeThrough(new EventSourceParserStream())

			for await (const { id, data } of eventStream) {
				if (data === "[DONE]")  break

				if (!conversationId && id) {
					setConversationId(id)
				}

				aiResponse += JSON.parse(data).text

				setConversation(prev => {
					const lastMessage = prev[prev.length - 1]
					if (lastMessage && lastMessage.role === "assistant") {
						return [...prev.slice(0, -1), { ...lastMessage, content: aiResponse }]
					}
					return [...prev, { role: "assistant", content: aiResponse }]
				})
			}

			handleAIResponse(aiResponse, newConversation.length)
		} catch (error) {
			console.error("获取 AI 回复时出错:", error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleAIResponse = async (aiResponse: string, messageCount: number) => {
		try {
			// 第一次对话，创建初始文档
			if (messageCount === 1) {
				// 提取可能的需求点
				const response = await fetch("/api/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						messages: [
							{
								role: "system",
								content: "你是需求分析专家，请从用户的对话中提取关键需求，并生成需求文档结构。"
							},
							{
								role: "user",
								content: `根据以下对话，生成初始需求文档结构：\n\n${aiResponse}`
							}
						]
					})
				});

				if (response.ok) {
					const { conversationId, text } = await response.json() as { text: string; conversationId: string };
					setDocumentContent((prev) => {
						return [...prev, { id: conversationId, type: "", content: text }];
					})
					setActiveKnowledgeSource("company-policy");
				}
			}
			// 注意：后续对话不再自动更新文档和执行质量检查
		} catch (error) {
			console.error("处理 AI 响应时出错:", error);
		}
	}

	// 执行需求质量检查
	const performQualityCheck = async () => {
		// 如果没有文档内容，则不执行检查
		if (documentContent.length === 0) return;

		setIsQualityChecking(true)
		try {
			// 准备需求文档内容
			const documentForAnalysis = documentContent.map(item => item.content).join("\n\n")

			// 调用专用的需求分析 API
			const response = await fetch("/api/analyze-requirements", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ document: documentForAnalysis })
			})

			if (!response.ok) {
				throw new Error("质量检查 API 调用失败")
			}

			const data = await response.json()

			// 如果返回了质量问题，更新质量警报
			if (data.qualityIssues && Array.isArray(data.qualityIssues)) {
				setQualityAlerts(data.qualityIssues)
			} else if (data.error) {
				console.error("质量检查 API 返回错误:", data.error)
			}
		} catch (error) {
			console.error("质量检查时出错:", error)
		} finally {
			setIsQualityChecking(false)
		}
	}

	const handleDocumentEdit = (id: string, newContent: string) => {
		setDocumentContent((prev) => prev.map((item) => (item.id === id ? { ...item, content: newContent } : item)))

		// 注意：不再自动执行质量检查，改为用户手动触发
	}

	// 手动更新文档
	const handleUpdateDocument = async () => {
		if (conversation.length <= 1) return;

		setIsDocumentUpdating(true);
		try {
			// 获取最新的AI回复
			const lastAIResponse = conversation
				.filter(msg => msg.role === "assistant")
				.pop()?.content || "";

			// 提取并处理更新后的需求
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [
						{
							role: "system",
							content: "你是需求文档编辑专家，请根据最新对话更新需求文档。"
						},
						{
							role: "user",
							content: `现有需求文档：\n\n${documentContent.map(doc => doc.content).join('\n\n')}\n\n` +
								`用户最新对话：\n\n${lastAIResponse}\n\n` +
								`请提供更新后的功能需求部分内容，保持原有格式，但融合新信息。`
						}
					]
				})
			});

			if (response.ok) {
				const data = await response.json();

				// 解析 AI 返回的需求文档内容
				const updatedRequirements = data.text || "## 2. 功能需求\n\n### 2.1 基本功能\n系统应提供基础功能。";

				// 更新文档内容（仅更新功能需求部分）
				setDocumentContent((prev) => {
					const updated = [...prev];
					const frIndex = updated.findIndex((item) => item.id === "fr-1");
					if (frIndex !== -1) {
						updated[frIndex] = {
							...updated[frIndex],
							content: updatedRequirements.trim(),
						};
					}
					return updated;
				});
			}
		} catch (error) {
			console.error("更新文档时出错:", error);
		} finally {
			setIsDocumentUpdating(false);
		}
	};

	// 手动执行质量检查
	const handleQualityCheck = async () => {
		if (documentContent.length === 0) return;

		setIsQualityChecking(true);
		try {
			await performQualityCheck();
		} catch (error) {
			console.error("执行质量检查时出错:", error);
		} finally {
			setIsQualityChecking(false);
		}
	};

	return (
		<div className="flex h-screen overflow-hidden">
			<PanelGroup direction="horizontal">
				{/* Left Panel: Knowledge Hub */}
				<Panel id="knowledge-hub" defaultSize={20} minSize={15}>
					<KnowledgeHub activeSource={activeKnowledgeSource} onSourceSelect={setActiveKnowledgeSource}/>
				</Panel>

				<PanelResizeHandle
					className="w-1 hover:w-2 bg-gray-200 hover:bg-blue-400 transition-all duration-150 relative group"
				>
					<div
						className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded group-hover:bg-blue-600"></div>
				</PanelResizeHandle>

				{/* Center Panel: Main Workspace */}
				<Panel id="requirements-workspace" defaultSize={55} minSize={30}>
					<RequirementsWorkspace
						currentRequirement={currentRequirement}
						setCurrentRequirement={setCurrentRequirement}
						conversation={conversation}
						documentContent={documentContent}
						onSendMessage={handleSendMessage}
						onDocumentEdit={handleDocumentEdit}
						onUpdateDocument={handleUpdateDocument}
						onCheckQuality={handleQualityCheck}
						isLoading={isLoading}
						isDocumentUpdating={isDocumentUpdating}
						isQualityChecking={isQualityChecking}
					/>
				</Panel>

				<PanelResizeHandle
					className="w-1 hover:w-2 bg-gray-200 hover:bg-blue-400 transition-all duration-150 relative group"
				>
					<div
						className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded group-hover:bg-blue-600"></div>
				</PanelResizeHandle>

				{/* Right Panel: AI Assistant */}
				<Panel id="ai-assistant" defaultSize={25} minSize={15}>
					<AIAssistantPanel
						qualityAlerts={qualityAlerts}
						onAlertClick={(reqId) => {
							// Scroll to requirement in document
							document.getElementById(reqId)?.scrollIntoView({ behavior: "smooth" })
						}}
					/>
				</Panel>
			</PanelGroup>
		</div>
	)
}


