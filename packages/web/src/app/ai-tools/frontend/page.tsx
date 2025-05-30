"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Code, CodeXml, Loader2, Send, Eye, FileCode, Copy, RotateCcw } from 'lucide-react'
import { extractCodeBlocks } from "@/lib/code-highlight"
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { uiScope } from "@/lib/ui-scope";
import { Badge } from "@/components/ui/badge"

type Message = {
	role: "user" | "assistant" | "system"
	content: string
}

const SYSTEM_PROMPT = `You are an expert frontend developer specializing in React and modern web development.
Your task is to generate high-quality, working frontend code based on user requests.

- Tech Stack: React, Next.js, TypeScript, Tailwind CSS, Shadcn UI, Lucide icons
- Always provide complete, working code examples that follow best practices.
- Always return one code block so the user can copy it easily.
- Don't include imports and setup code.
- Use React.useState instead of useState for state management.
- Call render() at the end of the code block to display the component.
- Available UI components: All shadcn/ui components are available in scope
- Available icons: Lucide icons are available (e.g., Send, Code, Loader2, CodeXml)

When generating code, wrap it in markdown code blocks with the appropriate language tag.

Example structure:
\`\`\`jsx
const MyComponent = () => {
  const [state, setState] = React.useState(initialValue)
  
  return (
    <div className="p-4">
      {/* Your component JSX here */}
      <Button onClick={() => setState(newValue)}>
        Click me
      </Button>
    </div>
  )
}

render(<MyComponent />)
\`\`\`
`

export default function AIFrontendGenerator() {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [generatedCode, setGeneratedCode] = useState<string>(`
class Example extends React.Component {
  render() {
    return <strong>Hello World!</strong>;
  }
}

render(<Example />)
	`)
	const [conversationId, setConversationId] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<"editor" | "preview">("preview")
	const [hasError, setHasError] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim()) return

		const userMessage = { role: "user" as const, content: input }
		setMessages((prev) => [...prev, userMessage])
		setInput("")
		setIsLoading(true)

		try {
			let msgList = [...messages, userMessage];
			if (msgList.length > 0 && msgList[0].role !== "system") {
				msgList = [
					{
						role: "system",
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
			}
		} catch (error) {
			console.error("Error generating response:", error)
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

	const copyCode = () => {
		navigator.clipboard.writeText(generatedCode)
			.then(() => {
				console.log("Code copied to clipboard")
			})
			.catch(err => {
				console.error("Failed to copy code: ", err)
			})
	}

	const resetCode = () => {
		setGeneratedCode(`
class Example extends React.Component {
  render() {
    return <strong>Hello World!</strong>;
  }
}

render(<Example />)
		`)
		setHasError(false)
	}

	// 键盘快捷键
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl/Cmd + K: 切换 tab
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault()
				setActiveTab(prev => prev === "editor" ? "preview" : "editor")
			}
			// Ctrl/Cmd + C: 复制代码 (当焦点不在输入框时)
			if ((e.ctrlKey || e.metaKey) && e.key === 'c' && activeTab === "preview") {
				const activeElement = document.activeElement
				if (activeElement?.tagName !== 'TEXTAREA' && activeElement?.tagName !== 'INPUT') {
					e.preventDefault()
					copyCode()
				}
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [activeTab, generatedCode])

	return (
		<div className="flex flex-col h-screen bg-gray-50">
			<header className="p-4 border-b bg-white z-10 flex items-center justify-between shadow-sm">
				<div className="flex items-center">
					<h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
						前端 UI 生成
					</h1>
				</div>
				<div className="flex items-center gap-2">
					{isLoading && (
						<div className="flex items-center space-x-2 text-sm text-muted-foreground">
							<Loader2 className="h-3 w-3 animate-spin"/>
							<span>生成代码中...</span>
						</div>
					)}
					<div className="hidden md:flex items-center text-xs text-muted-foreground space-x-2">
						<kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+K</kbd>
						<span>切换视图</span>
					</div>
				</div>
			</header>

			<div className="flex-1 overflow-hidden">
				<PanelGroup direction="horizontal" className="h-full">
					{/* Chat Section */}
					<Panel id="chat-panel" defaultSize={35} minSize={25}>
						<div className="flex flex-col h-full bg-white border-r">
							<div className="p-3 border-b">
								<div className="flex items-center space-x-2">
									<Code className="h-5 w-5 text-indigo-500"/>
									<h2 className="text-base font-medium">Chat with AI</h2>
								</div>
								<p className="text-xs text-muted-foreground mt-1">Describe the component you want to create</p>
							</div>

							<div className="flex-1 overflow-hidden">
								<ScrollArea className="h-full p-3">
									{messages.length === 0 ? (
										<div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
											<CodeXml size={48} className="mb-4 text-indigo-300"/>
											<p className="text-sm">Start a conversation with the AI to generate frontend code.</p>
											<p className="text-xs mt-2">Try: &#34;Create a sign-up form with email and password fields&#34;</p>
										</div>
									) : (
										<div className="space-y-4">
											{messages.map((message, index) => (
												<div key={index}
													className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
													<div
														className={`max-w-[85%] rounded-lg p-3 ${
															message.role === "user" 
															? "bg-primary text-primary-foreground rounded-tr-none" 
															: "bg-gray-100 text-gray-800 rounded-tl-none"
														}`}
													>
														{message.content}
													</div>
												</div>
											))}
											{isLoading && (
												<div className="flex justify-start">
													<div className="max-w-[85%] rounded-lg p-3 bg-gray-100">
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

							<div className="p-3 border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
								<form onSubmit={handleSubmit} className="w-full flex space-x-2">
									<Textarea
										placeholder="Describe the component you want to create..."
										value={input}
										onChange={(e) => setInput(e.target.value)}
										className="flex-grow resize-none min-h-[60px]"
										disabled={isLoading}
										onKeyDown={(e) => {
											if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
												e.preventDefault();
												handleSubmit(e);
											}
										}}
									/>
									<Button
										type="submit"
										size="icon"
										className="self-end h-10 w-10"
										disabled={isLoading || !input.trim()}
									>
										<Send size={18}/>
									</Button>
								</form>
							</div>
						</div>
					</Panel>

					<PanelResizeHandle
						className="w-1 hover:w-2 bg-gray-200 hover:bg-indigo-400 transition-all duration-150 relative group"
					>
						<div
							className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded group-hover:bg-indigo-600"></div>
					</PanelResizeHandle>

					{/* Preview Section */}
					<Panel id="preview-panel" defaultSize={65} minSize={40}>
						<div className="flex flex-col h-full bg-white border-l">
							<div className="border-b">
								<div className="flex items-center justify-between p-3">
									<div className="flex items-center space-x-2">
										<CodeXml className="h-5 w-5 text-indigo-500"/>
										<h2 className="text-base font-medium">Code Preview</h2>
										{hasError && (
											<Badge variant="destructive" className="text-xs">
												Error
											</Badge>
										)}
									</div>
									<div className="flex items-center space-x-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={resetCode}
											className="h-8 px-2"
											title="Reset to default"
										>
											<RotateCcw className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={copyCode}
											className="h-8 px-2"
											title="Copy code"
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								</div>
								
								<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "editor" | "preview")} className="w-full">
									<TabsList className="grid w-full grid-cols-2 rounded-none border-t bg-gray-50">
										<TabsTrigger 
											value="preview" 
											className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-none transition-all duration-200"
										>
											<Eye className="h-4 w-4" />
											<span className="hidden sm:inline">Preview</span>
											<span className="sm:hidden">预览</span>
										</TabsTrigger>
										<TabsTrigger 
											value="editor"
											className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-none transition-all duration-200"
										>
											<FileCode className="h-4 w-4" />
											<span className="hidden sm:inline">Editor</span>
											<span className="sm:hidden">编辑</span>
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>

							<div className="flex-1 overflow-hidden">
								<LiveProvider code={generatedCode} noInline scope={uiScope}>
									<Tabs value={activeTab} className="h-full">
										<TabsContent value="preview" className="h-full m-0 p-0">
											<div className="h-full flex flex-col">
												<div className="flex-1 p-2 sm:p-4 bg-white overflow-auto">
													<div className="h-full flex items-start justify-center py-8">
														<div className="w-full max-w-4xl px-2">
															<LivePreview />
														</div>
													</div>
												</div>
											</div>
										</TabsContent>
										
										<TabsContent value="editor" className="h-full m-0 p-0">
											<div className="h-full flex flex-col">
												<div className="flex-1 overflow-hidden">
													<LiveEditor 
														className="h-full font-mono text-sm"
														style={{
															minHeight: 'calc(100% - 1px)',
															backgroundColor: '#fafafa',
															fontSize: '14px',
														}}
													/>
												</div>
											</div>
										</TabsContent>
										
										{/* 共享的错误显示区域 */}
										<LiveError 
											className="text-red-600 bg-red-50 p-3 border-t text-sm font-mono whitespace-pre-wrap max-h-32 overflow-auto empty:hidden"
										/>
									</Tabs>
								</LiveProvider>
							</div>
						</div>
					</Panel>
				</PanelGroup>
			</div>
		</div>
	)
}