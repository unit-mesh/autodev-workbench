"use client"

import { useState, useEffect } from "react"
import { CodeEditor } from "@/components/code-editor"
import { ConceptList } from "@/components/concept-list"
import { KnowledgePanel } from "@/components/knowledge-panel"
import { extractConcepts } from "@/lib/concept-extractor"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Code2, Brain, RefreshCw, Zap, BookOpen, FileText } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

const sampleCode = `/**
 * PaymentProcessor handles all payment gateway interactions
 * Related to the Payment Service Architecture (PSA)
 */
class PaymentProcessor {
  /**
   * Process a payment through the payment gateway
   * @param {Transaction} transaction The transaction to process
   * @returns {PaymentResult} The result of the payment attempt
   */
  async processPayment(transaction) {
    // Implementation follows the Stripe Integration Guide
    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: transaction.amount,
      currency: transaction.currency,
    });
    
    return new PaymentResult(paymentIntent);
  }
}`

export default function Concept() {
	const [code, setCode] = useState(sampleCode)
	const [concepts, setConcepts] = useState<string[]>([])
	const [validConcepts, setValidConcepts] = useState<string[]>([])
	const [invalidConcepts, setInvalidConcepts] = useState<{ term: string; reason: string }[]>([])
	const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [knowledgeItems, setKnowledgeItems] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isValidating, setIsValidating] = useState(false)
	const [useAI, setUseAI] = useState(true)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [contextData, setContextData] = useState<any[]>([])
	const [isLoadingContext, setIsLoadingContext] = useState(false)

	// Function to fetch context data
	const fetchContextData = async () => {
		setIsLoadingContext(true)
		try {
			const response = await fetch("/api/context")
			if (response.ok) {
				const data = await response.json()
				setContextData(data)
			} else {
				console.error("Failed to fetch context data")
			}
		} catch (error) {
			console.error("Error fetching context data:", error)
		} finally {
			setIsLoadingContext(false)
		}
	}

	// Fetch context data on component mount
	useEffect(() => {
		fetchContextData()
	}, [])

	const handleExtractConcepts = async () => {
		setIsValidating(true)
		const extractedConcepts = await extractConcepts(code)
		setConcepts(extractedConcepts)
		setSelectedConcept(null)
		setKnowledgeItems([])

		if (useAI && extractedConcepts.length > 0) {
			try {
				const response = await fetch("/api/validate-concepts", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						concepts: extractedConcepts,
						codeContext: code,
					}),
				})

				if (response.ok) {
					const data = await response.json()
					setValidConcepts(data.validConcepts)
					setInvalidConcepts(data.invalidConcepts)
				} else {
					console.error("Failed to validate concepts")
					// If validation fails, treat all as valid
					setValidConcepts(extractedConcepts)
					setInvalidConcepts([])
				}
			} catch (error) {
				console.error("Error validating concepts:", error)
				// If validation fails, treat all as valid
				setValidConcepts(extractedConcepts)
				setInvalidConcepts([])
			} finally {
				setIsValidating(false)
			}
		} else {
			// If AI validation is disabled, treat all as valid
			setValidConcepts(extractedConcepts)
			setInvalidConcepts([])
			setIsValidating(false)
		}
	}

	const handleSelectConcept = async (concept: string) => {
		setSelectedConcept(concept)
		setIsLoading(true)

		try {
			const response = await fetch(`/api/knowledge?concept=${encodeURIComponent(concept)}`)
			const data = await response.json()
			setKnowledgeItems(data)
		} catch (error) {
			console.error("Failed to fetch knowledge items:", error)
			setKnowledgeItems([])
		} finally {
			setIsLoading(false)
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const getLanguageFromContext = (item: any) => {
		if (item.language) return item.language.toLowerCase()
		if (item.path) {
			const extension = item.path.split(".").pop()?.toLowerCase()
			switch (extension) {
				case "js":
					return "javascript"
				case "ts":
					return "typescript"
				case "tsx":
					return "tsx"
				case "jsx":
					return "jsx"
				case "py":
					return "python"
				case "java":
					return "java"
				case "rb":
					return "ruby"
				case "go":
					return "go"
				case "php":
					return "php"
				case "c":
					return "c"
				case "cpp":
					return "cpp"
				case "cs":
					return "csharp"
				case "html":
					return "html"
				case "css":
					return "css"
				case "json":
					return "json"
				case "md":
					return "markdown"
				case "yaml":
				case "yml":
					return "yaml"
				default:
					return "text"
			}
		}
		return "text"
	}

	// Function to extract code blocks from content
	const extractCodeBlock = (content: string) => {
		const codeBlockRegex = /```([a-zA-Z0-9]+)?\s*\n([\s\S]*?)```/g
		const matches = [...content.matchAll(codeBlockRegex)]

		if (matches.length > 0) {
			return matches.map((match) => ({
				language: match[1] || "text",
				code: match[2].trim(),
			}))
		}

		return null
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
			<main className="container mx-auto p-4 py-8">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div>
							<h1
								className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
								Concept Linking MVP
							</h1>
							<p className="text-slate-600 dark:text-slate-400 mt-1">
								Extract, validate, and explore concepts from your code
							</p>
						</div>
						<div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
							<Switch id="use-ai" checked={useAI} onCheckedChange={setUseAI}/>
							<Label htmlFor="use-ai" className="flex items-center gap-1.5 cursor-pointer">
								<Zap className="h-4 w-4 text-amber-500"/>
								<span>AI Validation</span>
							</Label>
						</div>
					</div>

					<div className="grid gap-6">
						<div className="grid gap-6">
							<Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden w-full max-w-[100%]">
								<CardHeader
									className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<FileText className="h-5 w-5 text-purple-500"/>
											<CardTitle className="text-lg">Context</CardTitle>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={fetchContextData}
											disabled={isLoadingContext}
											className="h-8"
										>
											{isLoadingContext ? (
												<Loader2 className="h-3 w-3 animate-spin"/>
											) : (
												<RefreshCw className="h-3 w-3 mr-1"/>
											)}
											{isLoadingContext ? "Loading..." : "Refresh Context"}
										</Button>
									</div>
									<CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
										Available code context for concept validation
									</CardDescription>
								</CardHeader>
								<CardContent className="p-0">
									<div className="max-h-[500px] overflow-y-auto">
										{isLoadingContext ? (
											<div className="flex flex-col items-center justify-center p-8 text-slate-500">
												<Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3"/>
												<p>Loading context data...</p>
											</div>
										) : contextData.length > 0 ? (
											contextData.map((item, index) => {
												const codeBlocks = item.content ? extractCodeBlock(item.content) : null

												return (
													<div
														key={item.id || index}
														className={`border-b border-slate-200 dark:border-slate-700 ${
															index === contextData.length - 1 ? "border-b-0" : ""
														}`}
													>
														<div className="p-3 bg-slate-50 dark:bg-slate-800/50">
															<div className="flex items-center justify-between">
																<div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
																	{item.path || item.source || "Unknown source"}
																</div>
																{item.language && (
																	<Badge variant="outline" className="text-xs">
																		{item.language}
																	</Badge>
																)}
															</div>
															{item.title && <div className="mt-1 font-medium text-sm">{item.title}</div>}
															{item.description && (
																<div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
																	{item.description}
																</div>
															)}
														</div>
														<div className="p-3 bg-white dark:bg-slate-800">
															{codeBlocks ? (
																codeBlocks.map((block, blockIndex) => (
																	<div key={blockIndex} className="mb-3 last:mb-0">
																		<SyntaxHighlighter
																			language={block.language}
																			style={vscDarkPlus}
																			customStyle={{
																				margin: 0,
																				borderRadius: "0.375rem",
																				fontSize: "0.875rem",
																			}}
																		>
																			{block.code}
																		</SyntaxHighlighter>
																	</div>
																))
															) : item.code ? (
																<SyntaxHighlighter
																	language={getLanguageFromContext(item)}
																	style={vscDarkPlus}
																	customStyle={{
																		margin: 0,
																		borderRadius: "0.375rem",
																		fontSize: "0.875rem",
																	}}
																>
																	{item.code}
																</SyntaxHighlighter>
															) : (
																<div className="text-sm whitespace-pre-wrap">
																	{item.content || "No content available"}
																</div>
															)}
														</div>
													</div>
												)
											})
										) : (
											<div className="text-center p-8 text-slate-500">
												<p>No context data available</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="grid grid-cols-2 gap-6">
							<Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
								<CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<Code2 className="h-5 w-5 text-purple-500"/>
											<CardTitle className="text-lg">Code Editor</CardTitle>
										</div>
										<Button
											onClick={handleExtractConcepts}
											className="bg-purple-600 hover:bg-purple-700 text-white"
											disabled={isValidating}
										>
											{isValidating ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
													Processing...
												</>
											) : (
												<>
													<Brain className="mr-2 h-4 w-4"/>
													Extract Concepts
												</>
											)}
										</Button>
									</div>
								</CardHeader>
								<CardContent className="p-4 bg-white dark:bg-slate-800">
									<CodeEditor code={code} onChange={setCode}/>
								</CardContent>
							</Card>


							<div className="space-y-6 grid grid-rows-1">
								<Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
									<CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
										<div className="flex items-center gap-2">
											<Brain className="h-5 w-5 text-indigo-500" />
											<CardTitle className="text-lg">Extracted Concepts</CardTitle>
										</div>
										{concepts.length > 0 && (
											<div className="flex gap-2 mt-2">
												<Badge
													variant="outline"
													className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
												>
													{concepts.length} concepts found
												</Badge>
												{validConcepts.length > 0 && (
													<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
														{validConcepts.length} valid
													</Badge>
												)}
												{invalidConcepts.length > 0 && (
													<Badge
														variant="destructive"
														className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
													>
														{invalidConcepts.length} invalid
													</Badge>
												)}
											</div>
										)}
									</CardHeader>
									<CardContent className="p-0">
										<div className="p-4 bg-white dark:bg-slate-800 max-h-[250px] overflow-y-auto">
											<ConceptList
												concepts={concepts}
												validConcepts={validConcepts}
												invalidConcepts={invalidConcepts}
												selectedConcept={selectedConcept}
												onSelectConcept={handleSelectConcept}
												isValidating={isValidating}
											/>
										</div>
									</CardContent>
								</Card>
								<Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
									<CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<BookOpen className="h-5 w-5 text-indigo-500" />
												<CardTitle className="text-lg">Knowledge Panel</CardTitle>
											</div>
											{selectedConcept && (
												<Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
													{selectedConcept}
												</Badge>
											)}
										</div>
									</CardHeader>
									<CardContent className="p-0">
										<div className="p-4 bg-white dark:bg-slate-800 max-h-[250px] overflow-y-auto">
											<KnowledgePanel concept={selectedConcept} items={knowledgeItems} isLoading={isLoading} />
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
