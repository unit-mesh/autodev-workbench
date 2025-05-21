"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Code } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { toast } from "@/hooks/use-toast"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import GenifyMarkdownRender from "@/components/markdown/GenifyMarkdownRender"

export interface CodeAnalysisItem {
	id: string
	title?: string
	path: string
	language?: string
	code?: string
	content?: string
	description?: string
	createdAt: string
}

interface CodeAnalysisListProps {
	codeAnalyses: CodeAnalysisItem[]
	projectId: string
	onRefresh?: () => void
}

export function CodeAnalysisList({ codeAnalyses, projectId, onRefresh }: CodeAnalysisListProps) {
	const [generatingIds, setGeneratingIds] = useState<string[]>([])

	// Function to generate analysis for a specific code item
	const handleGenerateAnalysis = async (id: string) => {
		setGeneratingIds((prev) => [...prev, id])
		try {
			const response = await fetch("/api/context/code/actions/semantic", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, projectId })
			})

			if (response.ok) {
				toast({
					title: "成功",
					description: "AI分析成功",
					variant: "default"
				})

				if (onRefresh) {
					onRefresh()
				}
			} else {
				toast({
					title: "错误",
					description: "AI分析失败",
					variant: "destructive"
				})
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			toast({
				title: "错误",
				description: "AI分析出错: " + error,
				variant: "destructive"
			})
		} finally {
			setGeneratingIds((prev) => prev.filter(_id => _id !== id))
		}
	}

	const extractCodeBlock = (content: string) => {
		if (!content) return null

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

	if (codeAnalyses.length === 0) {
		return (
			<div
				className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
				<Code className="h-12 w-12 text-gray-300"/>
				<p className="text-center text-gray-500">暂无代码分析</p>
			</div>
		)
	}

	return (
		<div className="border rounded-lg overflow-hidden">
			<div className="divide-y divide-gray-200">
				{codeAnalyses.map((item) => {
					const codeBlocks = item.content ? extractCodeBlock(item.content) : null
					const displayTitle = item.title || item.path || "Unknown source"

					return (
						<div key={item.id} className="p-4 bg-white hover:bg-gray-50">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-start">
										<FileText className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0"/>
										<div className="ml-2 flex-1">
											<div className="flex items-center justify-between">
												<h3 className="font-medium text-sm text-slate-700 break-all mr-2">
													{displayTitle}
												</h3>

												<div className="flex items-center space-x-2 flex-shrink-0">
													{(codeBlocks || item.code || item.content) && (
														<Dialog>
															<DialogTrigger asChild>
																<Button variant="ghost" className="text-blue-600 p-0 h-auto">
																	<Code className="h-3.5 w-3.5 mr-1"/>
																	查看代码
																</Button>
															</DialogTrigger>
															<DialogContent className="max-w-7xl max-h-[80vh] overflow-hidden">
																<DialogHeader>
																	<DialogTitle>{displayTitle}</DialogTitle>
																</DialogHeader>
																<div className="overflow-y-auto max-h-[calc(80vh-100px)]">
																	{codeBlocks ? (
																		codeBlocks.map((block, blockIndex) => (
																			<div key={blockIndex} className="mb-3 last:mb-0 overflow-x-auto">
																				<SyntaxHighlighter
																					language={block.language}
																					style={vscDarkPlus}
																					customStyle={{
																						fontSize: "0.875rem",
																						maxHeight: "400px",
																						overflow: "auto",
																					}}
																				>
																					{block.code}
																				</SyntaxHighlighter>
																			</div>
																		))
																	) : item.code ? (
																		<SyntaxHighlighter
																			language={item.language || "text"}
																			style={vscDarkPlus}
																			customStyle={{
																				margin: 0,
																				borderRadius: "0.375rem",
																				fontSize: "0.875rem",
																				maxHeight: "400px",
																				overflow: "auto",
																			}}
																		>
																			{item.code}
																		</SyntaxHighlighter>
																	) : (
																		<div className="overflow-y-auto max-h-[400px]">
																			{item.content ? (
																				<GenifyMarkdownRender content={item.content}/>
																			) : (
																				<div className="text-sm text-slate-500 italic">无可用内容</div>
																			)}
																		</div>
																	)}
																</div>
															</DialogContent>
														</Dialog>
													)}

													{!item.description && (
														<Button
															variant="outline"
															size="sm"
															className="ml-2 h-7 px-2 flex-shrink-0"
															disabled={generatingIds.includes(item.id)}
															onClick={(e) => {
																e.stopPropagation();
																handleGenerateAnalysis(item.id);
															}}
														>
															{generatingIds.includes(item.id) ? (
																<Loader2 className="h-3 w-3 animate-spin mr-1"/>
															) : null}
															{generatingIds.includes(item.id) ? "分析中..." : "AI分析"}
														</Button>
													)}
												</div>
											</div>

											{item.description ? (
												<div className="text-sm text-slate-600 mt-1">
													<p className="line-clamp-2">{item.description}</p>
												</div>
											) : (
												<div className="flex items-center space-x-2 mt-1">
													{item.language && (
														<Badge variant="outline" className="text-xs">
															{item.language}
														</Badge>
													)}
													<span className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
