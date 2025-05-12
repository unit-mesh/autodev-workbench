"use client"

import { useState } from "react"
import RequirementsWorkspace from "@/components/cockpit/requirements-workspace"
import KnowledgeHub from "@/components/cockpit/knowledge-hub"
import AIAssistantPanel from "@/components/cockpit/ai-assistant-panel"

// export default function Home() {
// 	return (
// 		<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
// 			<main className="min-h-screen bg-gray-50">
// 				<RequirementsEngineeringSystem />
// 			</main>
// 		</ThemeProvider>
// 	)
// }

export default function Home() {
	const [currentRequirement, setCurrentRequirement] = useState("")
	const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([])
	const [documentContent, setDocumentContent] = useState<Array<{ id: string; type: string; content: string }>>([])
	const [activeKnowledgeSource, setActiveKnowledgeSource] = useState<string | null>(null)
	const [qualityAlerts, setQualityAlerts] = useState<
		Array<{ id: string; type: string; message: string; relatedReqId: string }>
	>([])

	const handleSendMessage = (message: string) => {
		// Add user message to conversation
		const newConversation = [...conversation, { role: "user", content: message }]
		setConversation(newConversation)

		// Simulate AI response
		setTimeout(() => {
			let aiResponse = ""

			if (newConversation.length === 1) {
				aiResponse =
					"感谢您的初始需求。为了更好地理解会议室预订系统的需求，我需要了解一些细节：\n\n1. 用户需要看到哪些会议室信息（如容量、设备）？\n2. 预订时段是否有特殊规则（如最小/最大时长）？\n3. 是否需要集成日历功能？"

				// Add initial requirement to document
				setDocumentContent([
					{
						id: "intro-1",
						type: "introduction",
						content: "## 1. 引言\n\n### 1.1 目的\n本文档旨在定义在线会议室预订系统的需求。",
					},
					{
						id: "fr-1",
						type: "functional",
						content: "## 2. 功能需求\n\n### 2.1 会议室预订\nFR1: 系统应允许用户查看可用会议室列表。",
					},
				])

				// Add quality alert
				setQualityAlerts([
					{
						id: "qa-1",
						type: "ambiguity",
						message: "'可用会议室列表'不够明确，需要定义显示哪些信息。",
						relatedReqId: "fr-1",
					},
				])

				// Highlight knowledge source
				setActiveKnowledgeSource("company-policy")
			} else if (newConversation.length === 3) {
				aiResponse =
					"非常感谢您提供的信息。根据您的回答，我已经更新了需求文档。我注意到您提到了需要显示会议室的容量和设备信息，这对于用户选择合适的会议室非常重要。\n\n您是否还需要系统支持会议室预订的审批流程？"

				// Update document content
				setDocumentContent((prev) => {
					const updated = [...prev]
					const frIndex = updated.findIndex((item) => item.id === "fr-1")
					if (frIndex !== -1) {
						updated[frIndex] = {
							...updated[frIndex],
							content:
								"## 2. 功能需求\n\n### 2.1 会议室预订\nFR1: 系统应允许用户查看可用会议室列表，包含会议室名称、容量、可用设备和位置信息。\nFR2: 用户应能按时间段、容量和设备筛选会议室。\nFR3: 系统应支持用户预订会议室，并指定预订时间段（最短30分钟，最长8小时）。",
						}
					}
					return updated
				})

				// Update quality alerts
				setQualityAlerts([
					{
						id: "qa-2",
						type: "testability",
						message: "FR2需要明确筛选条件的组合方式（AND/OR）。",
						relatedReqId: "fr-1",
					},
				])
			}

			if (aiResponse) {
				setConversation((prev) => [...prev, { role: "assistant", content: aiResponse }])
			}
		}, 1000)
	}

	const handleDocumentEdit = (id: string, newContent: string) => {
		setDocumentContent((prev) => prev.map((item) => (item.id === id ? { ...item, content: newContent } : item)))

		// Simulate quality check on edit
		if (newContent.includes("快速响应")) {
			setQualityAlerts((prev) => [
				...prev,
				{
					id: `qa-${Date.now()}`,
					type: "testability",
					message: "'快速响应'定义不明确，建议量化为具体时间。",
					relatedReqId: id,
				},
			])
		}
	}

	return (
		<div className="flex h-screen overflow-hidden">
			{/* Left Panel: Knowledge Hub */}
			<KnowledgeHub activeSource={activeKnowledgeSource} onSourceSelect={setActiveKnowledgeSource} />

			{/* Center Panel: Main Workspace */}
			<RequirementsWorkspace
				currentRequirement={currentRequirement}
				setCurrentRequirement={setCurrentRequirement}
				conversation={conversation}
				documentContent={documentContent}
				onSendMessage={handleSendMessage}
				onDocumentEdit={handleDocumentEdit}
			/>

			{/* Right Panel: AI Assistant */}
			<AIAssistantPanel
				qualityAlerts={qualityAlerts}
				onAlertClick={(reqId) => {
					// Scroll to requirement in document
					document.getElementById(reqId)?.scrollIntoView({ behavior: "smooth" })
				}}
			/>
		</div>
	)
}
