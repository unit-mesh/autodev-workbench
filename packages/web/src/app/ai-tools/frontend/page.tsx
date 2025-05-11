"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Code, Eye, Loader2 } from 'lucide-react'
import { CodeBlock } from "@/components/code-block"
import { CodePreview } from "@/components/code-preview"
import { extractCodeBlocks } from "@/lib/code-highlight"

type Message = {
	role: "user" | "assistant" | "system"
	content: string
}


const SYSTEM_PROMPT = `You are an expert frontend developer specializing in React, Next.js, and modern web development.
Your task is to generate high-quality, working frontend code based on user requests.
Always provide complete, working code examples that follow best practices.
When generating code, wrap it in markdown code blocks with the appropriate language tag.
For example: \`\`\`jsx
// Your code here
\`\`\`
`

export default function AIFrontendGenerator() {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [generatedCode, setGeneratedCode] = useState<string>("")
	const [codeLanguage, setCodeLanguage] = useState<string>("jsx")
	const [activeTab, setActiveTab] = useState<string>("preview")
	const [conversationId, setConversationId] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim()) return

		// Add user message
		const userMessage = { role: "user" as const, content: input }
		setMessages((prev) => [...prev, userMessage])
		setInput("")
		setIsLoading(true)

		try {
			let msgList = [...messages, userMessage];
			if (messages.length > 0 && messages[0].role !== "system") {
				msgList = [
          {
            role: "system" as const,
            content: SYSTEM_PROMPT,
          },
          ...msgList,
        ]
			}

			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: msgList,
					conversationId,
				}),
			})

			if (!response.ok) {
				throw new Error("Failed to generate response")
			}

			const data = await response.json()

			// Save conversation ID if it's new
			if (!conversationId && data.conversationId) {
				setConversationId(data.conversationId)
			}

			// Add assistant message
			const assistantMessage = {
				role: "assistant" as const,
				content: data.text,
			}
			setMessages((prev) => [...prev, assistantMessage])

			// Extract code blocks
			const codeBlocks = extractCodeBlocks(data.text)
			if (codeBlocks.length > 0) {
				const codeBlock = codeBlocks[codeBlocks.length - 1]
				setGeneratedCode(codeBlock.code)
				setCodeLanguage(codeBlock.language)
			}
		} catch (error) {
			console.error("Error generating response:", error)
			// Add error message
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: "Sorry, there was an error generating a response. Please try again.",
				},
			])
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="h-full from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
			<main className="container mx-auto p-4 py-8">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div>
							<h1
								className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
								前端 UI 生成
							</h1>
							<p className="text-slate-600 dark:text-slate-400 mt-1">
								Chat with AI to generate frontend code, preview it in real-time
							</p>
						</div>
					</div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Chat Section */}
							<div className="flex flex-col border rounded-lg shadow-sm bg-background">
								<div className="p-4 border-b">
									<h2 className="text-lg font-semibold">Chat with AI</h2>
									<p className="text-sm text-muted-foreground">Describe the frontend component you want to create</p>
								</div>
								<div className="flex-grow overflow-hidden p-4">
									<ScrollArea className="h-[600px] pr-4">
										{messages.length === 0 ? (
											<div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
												<Code size={48} className="mb-4"/>
												<p>Start a conversation with the AI to generate frontend code.</p>
												<p className="text-sm mt-2">Try: &#34;Create a sign-up form with email and password fields&#34;</p>
											</div>
										) : (
											<div className="space-y-4">
												{messages.map((message, index) => (
													<div key={index}
													     className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
														<div
															className={`max-w-[80%] rounded-lg p-3 ${
																message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
															}`}
														>
															{message.content}
														</div>
													</div>
												))}
												{isLoading && (
													<div className="flex justify-start">
														<div className="max-w-[80%] rounded-lg p-3 bg-muted">
															<div className="flex items-center space-x-2">
																<Loader2 size={16} className="animate-spin"/>
																<span>Generating code...</span>
															</div>
														</div>
													</div>
												)}
											</div>
										)}
									</ScrollArea>
									</div>
								<div className="p-4 border-t">
									<form onSubmit={handleSubmit} className="w-full flex space-x-2">
										<Textarea
											placeholder="Describe the component you want to create..."
											value={input}
											onChange={(e) => setInput(e.target.value)}
											className="flex-grow resize-none"
											rows={2}
											disabled={isLoading}
										/>
										<Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
											<Send size={18}/>
										</Button>
									</form>
									</div>
							</div>

							{/* Preview/Code Section */}
							<div className="flex flex-col border rounded-lg shadow-sm bg-background">
								<div className="p-4">
									<Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
										<div className="flex justify-between items-center">
											<h2 className="text-lg font-semibold">Output</h2>
											<TabsList>
												<TabsTrigger value="preview" className="flex items-center gap-1">
													<Eye size={16}/>
													Preview
												</TabsTrigger>
												<TabsTrigger value="code" className="flex items-center gap-1">
													<Code size={16}/>
													Code
												</TabsTrigger>
											</TabsList>
										</div>

										<TabsContent value="preview" className="mt-4">
											<div className="overflow-hidden">
												{generatedCode ? (
													<CodePreview code={generatedCode} language={codeLanguage}/>
												) : (
													<div
														className="flex flex-col items-center justify-center h-full text-center text-gray-500 border rounded-md p-4">
														<Eye size={48} className="mb-4"/>
														<p>Component preview will appear here</p>
														<p className="text-sm mt-2">Start a conversation with the AI to generate content</p>
													</div>
												)}
											</div>
										</TabsContent>

										<TabsContent value="code" className="mt-4">
											<div className="overflow-hidden">
												{generatedCode ? (
													<ScrollArea className="h-full">
														<CodeBlock code={generatedCode} language={codeLanguage}/>
													</ScrollArea>
												) : (
													<div
														className="flex flex-col items-center justify-center h-full text-center text-gray-500 border rounded-md p-4">
														<Code size={48} className="mb-4"/>
														<p>Generated code will appear here</p>
														<p className="text-sm mt-2">Start a conversation with the AI to generate content</p>
													</div>
												)}
											</div>
										</TabsContent>
									</Tabs>
									</div>
							</div>
						</div>
				</div>
			</main>
		</div>
	)
}

