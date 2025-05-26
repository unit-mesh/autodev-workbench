"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Code, Loader2, CodeXml } from 'lucide-react'
/// accordion.tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
// alert.tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
// alert-dialog.tsx
import {
	AlertDialog,
	AlertDialogPortal,
	AlertDialogOverlay,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog"
// aspect-ratio.tsx
import { AspectRatio } from "@/components/ui/aspect-ratio"
// avatar.tsx
// badge.tsx
// breadcrumb.tsx
// button.tsx
// calendar.tsx
// card.tsx
// carousel.tsx
// chart.tsx
// checkbox.tsx
// collapsible.tsx
// command.tsx
// context-menu.tsx
// dialog.tsx
// drawer.tsx
// dropdown-menu.tsx
// form.tsx
// hover-card.tsx
// input.tsx
// input-otp.tsx
// label.tsx
// menubar.tsx
// navigation-menu.tsx
// pagination.tsx
// popover.tsx
// progress.tsx
// radio-group.tsx
// resizable.tsx
// scroll-area.tsx
// select.tsx
// separator.tsx
// sheet.tsx
// sidebar.tsx
// skeleton.tsx
// slider.tsx
// sonner.tsx
// spinner.tsx
// switch.tsx
// table.tsx
// tabs.tsx
// textarea.tsx
// toast.tsx
// toaster.tsx
// toggle.tsx
// toggle-group.tsx
// tooltip.tsx
import { extractCodeBlocks } from "@/lib/code-highlight"
import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Message = {
	role: "user" | "assistant" | "system"
	content: string
}

const scope = {
	Accordion, AccordionItem, AccordionTrigger, AccordionContent,
	Alert, AlertTitle, AlertDescription,
	AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger,
	AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle,
	AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
	AspectRatio,
	Button,
	Textarea,
	ScrollArea,
	Input,
	Checkbox,
	Label,
}

const SYSTEM_PROMPT = `You are an expert frontend developer specializing in Reac and modern web development.
Your task is to generate high-quality, working frontend code based on user requests.

- Tech Stack: React, Next.js, TypeScript, Tailwind CSS, Shadcn UI, Lucide icons
- Always provide complete, working code examples that follow best practices.
- Always return one code block so the user can copy it easily.
- Don't include imports and setup code.
- Use React.useState instead of useState for state management.
- Call render() at the end of the code block to display the component.

When generating code, wrap it in markdown code blocks with the appropriate language tag.
For example: \`\`\`jsx
type Props = {
  label: string;
}
const Counter = (props: Props) => {
  const [count, setCount] = React.useState<number>(0)
  return (
    <div>
      <h3 style={{
        background: 'darkslateblue',
        color: 'white',
        padding: 8,
        borderRadius: 4
      }}>
        {props.label}: {count} 🧮
      </h3>
      <button
        onClick={() =>
          setCount(c => c + 1)
        }>
        Increment
      </button>
    </div>
  )
}

// don't call exports
render(<Counter label="Counter" />)
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
							<div className="p-3 border-b">
								<div className="flex items-center space-x-2">
									<CodeXml className="h-5 w-5 text-indigo-500"/>
									<h2 className="text-base font-medium">Code Preview</h2>
								</div>
								<p className="text-xs text-muted-foreground mt-1">Live editor and preview of generated component</p>
							</div>

							<div className="flex-1 overflow-auto p-4">
								<LiveProvider code={generatedCode} noInline scope={scope}>
									<div className="grid grid-cols-2 gap-4 h-full">
										<div className="border rounded-md overflow-hidden shadow-sm">
											<div className="bg-gray-100 p-2 border-b text-xs font-medium">Editor</div>
											<LiveEditor className="font-mono text-sm h-full overflow-auto"/>
										</div>
										<div className="border rounded-md overflow-hidden shadow-sm">
											<div className="bg-gray-100 p-2 border-b text-xs font-medium">Preview</div>
											<div className="p-4 bg-white">
												<LivePreview/>
												<LiveError className="text-red-600 bg-red-50 p-2 mt-2 rounded text-xs" />
											</div>
										</div>
									</div>
								</LiveProvider>
							</div>
						</div>
					</Panel>
				</PanelGroup>
			</div>
		</div>
	)
}
