"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
	ArrowLeft,
	BookOpen,
	ClipboardList,
	Code,
	Database,
	ExternalLink,
	GitBranch,
	Github,
	GitPullRequest,
	Settings,
	Search,
} from "lucide-react"
import { Project } from "@/types/project.type";
import { ProjectEditDialog } from "./project-edit-dialog"
import { CopyCliCommand } from "@/components/CopyCliCommand";
import { GuidelineCreateModal } from "./guideline-create-modal";
import { CodeAnalysisList } from "@/components/code-analysis/code-analysis-list";
import Image from "next/image";
import { Input } from "@/components/ui/input"

export function ProjectDetail({ id }: { id: string }) {
	const [project, setProject] = useState<Project | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false)
	const router = useRouter()

	// Add states for symbol analysis
	const [symbols, setSymbols] = useState<any[]>([]);
	const [symbolSearch, setSymbolSearch] = useState("");
	const [symbolLoading, setSymbolLoading] = useState(false);

	// Function to fetch symbols
	const fetchSymbols = async (query = "") => {
		setSymbolLoading(true);
		try {
			const params = new URLSearchParams();
			if (query) params.append("query", query);
			params.append("projectId", id);

			const response = await fetch(`/api/context/symbol?${params.toString()}`);
			if (response.ok) {
				const data = await response.json();
				setSymbols(data);
			}
		} catch (error) {
			console.error("Error fetching symbols:", error);
		} finally {
			setSymbolLoading(false);
		}
	};

	// Search handler for symbols
	const handleSymbolSearch = () => {
		fetchSymbols(symbolSearch);
	};

	// Fetch symbols when tab changes to symbols
	const handleTabChange = (value: string) => {
		if (value === "symbols" && symbols.length === 0) {
			fetchSymbols();
		}
	};

	useEffect(() => {
		async function fetchProject() {
			try {
				const response = await fetch(`/api/projects/${id}`)
				if (!response.ok) {
					if (response.status === 404) {
						setError("项目不存在")
					} else if (response.status === 403) {
						setError("无权访问此项目")
					} else {
						setError("加载项目失败")
					}
					return
				}

				const data = await response.json()
				setProject(data)
			} catch (error) {
				console.error("Error fetching project:", error)
				setError("加载项目时出错")
			} finally {
				setLoading(false)
			}
		}

		fetchProject()
	}, [id])

	const handleEditSuccess = (updatedProject: Project) => {
		setProject(updatedProject)
	}

	const handleGuidelineCreated = async () => {
		// Refresh project data to show the new guideline
		try {
			const response = await fetch(`/api/projects/${id}`)
			if (response.ok) {
				const data = await response.json()
				setProject(data)
			}
		} catch (error) {
			console.error("Error refreshing project:", error)
		}
	}

	if (loading) {
		return <ProjectDetailSkeleton/>
	}

	if (error || !project) {
		return (
			<div className="flex flex-col items-center justify-center p-12 space-y-4">
				<p className="text-lg text-center text-red-500">{error || "加载项目失败"}</p>
				<Button variant="outline" onClick={() => router.push("/projects")}>
					返回项目列表
				</Button>
			</div>
		)
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Button variant="outline" size="icon" onClick={() => router.push("/projects")}>
						<ArrowLeft className="h-4 w-4"/>
					</Button>
					<div>
						<h1 className="text-3xl font-bold flex items-center">
							{project.name}
							{project.isDefault && (
								<Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">默认</Badge>
							)}
						</h1>
						<p className="text-gray-500 mt-1">
							{project.description || "无项目描述"}
						</p>
					</div>
				</div>
				<div className="flex space-x-2">
					<Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
						<Settings className="h-4 w-4 mr-2"/>
						编辑项目
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>项目信息</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-500">基本信息</h3>
							<div className="flex items-center">
								<ClipboardList className="h-4 w-4 mr-2 text-gray-500"/>
								<span className="text-sm">
                  项目ID: <span
									className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{project.id}</span>
                </span>
							</div>
							<div className="flex items-center">
								<ClipboardList className="h-4 w-4 mr-2 text-gray-500"/>
								<span className="text-sm">
                  创建于 {formatDate(project.createdAt)}
                </span>
							</div>
							<div className="flex items-center">
								<GitBranch className="h-4 w-4 mr-2 text-gray-500"/>
								<span className="text-sm">
                  最后更新 {formatDate(project.updatedAt)}
                </span>
							</div>
							{project.user && (
								<div className="flex items-center">
									<div className="h-5 w-5 rounded-full bg-gray-200 mr-2 overflow-hidden">
										{project.user.image ? (
											<Image
												src={project.user.image}
												alt={project.user.name || "用户"}
												width={20}
												height={20}
												className="h-full w-full object-cover"
											/>
										) : null}
									</div>
									<span className="text-sm">
                    {project.user.name || project.user.email || "未知用户"}
                  </span>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-500">相关链接</h3>
							{project.gitUrl && (
								<div className="flex items-center">
									<Github className="h-4 w-4 mr-2 text-gray-500"/>
									<a
										href={project.gitUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-blue-600 hover:underline truncate"
									>
										{project.gitUrl}
									</a>
								</div>
							)}
							{project.liveUrl && (
								<div className="flex items-center">
									<ExternalLink className="h-4 w-4 mr-2 text-gray-500"/>
									<a
										href={project.liveUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-blue-600 hover:underline truncate"
									>
										{project.liveUrl}
									</a>
								</div>
							)}
							{project.jiraUrl && (
								<div className="flex items-center">
									<ClipboardList className="h-4 w-4 mr-2 text-gray-500"/>
									<a
										href={project.jiraUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-blue-600 hover:underline truncate"
									>
										Jira
									</a>
								</div>
							)}
							{project.jenkinsUrl && (
								<div className="flex items-center">
									<GitPullRequest className="h-4 w-4 mr-2 text-gray-500"/>
									<a
										href={project.jenkinsUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-blue-600 hover:underline truncate"
									>
										Jenkins
									</a>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-500">资源统计</h3>
							<div className="grid grid-cols-2 gap-2">
								<div className="flex items-center bg-gray-50 p-2 rounded">
									<BookOpen className="h-4 w-4 mr-2 text-indigo-500"/>
									<div>
										<p className="text-xs text-gray-500">规范文档</p>
										<p className="text-sm font-medium">{project.guidelines.length}</p>
									</div>
								</div>
								<div className="flex items-center bg-gray-50 p-2 rounded">
									<Code className="h-4 w-4 mr-2 text-blue-500"/>
									<div>
										<p className="text-xs text-gray-500">代码分析</p>
										<p className="text-sm font-medium">{project.codeAnalyses.length}</p>
									</div>
								</div>
								<div className="flex items-center bg-gray-50 p-2 rounded">
									<Database className="h-4 w-4 mr-2 text-green-500"/>
									<div>
										<p className="text-xs text-gray-500">API资源</p>
										<p className="text-sm font-medium">{project.apiResources.length}</p>
									</div>
								</div>
								<div className="flex items-center bg-gray-50 p-2 rounded">
									<BookOpen className="h-4 w-4 mr-2 text-amber-500"/>
									<div>
										<p className="text-xs text-gray-500">概念词典</p>
										<p className="text-sm font-medium">{project.conceptDictionaries.length}</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>项目资源</CardTitle>
						<CardDescription>浏览项目的所有资源</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="guidelines" onValueChange={handleTabChange}>
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="guidelines">规范文档</TabsTrigger>
								<TabsTrigger value="code">代码分析</TabsTrigger>
								<TabsTrigger value="dictionary">概念词典</TabsTrigger>
								<TabsTrigger value="symbols">符号分析</TabsTrigger>
							</TabsList>

							<TabsContent value="guidelines" className="mt-4">
								{project.guidelines.length > 0 ? (
									<div className="space-y-4">
										<div className="flex justify-between items-center">
											<h3 className="text-sm font-medium text-gray-700">规范文档列表</h3>
											<Button size="sm" variant="outline" onClick={() => setIsGuidelineModalOpen(true)}>
												<BookOpen className="h-4 w-4 mr-2"/>
												新建规范
											</Button>
										</div>
										<div className="divide-y">
											{project.guidelines.map((guideline) => (
												<div key={guideline.id} className="py-3">
													<div className="flex items-start justify-between">
														<div>
															<h4 className="font-medium">{guideline.title}</h4>
															<p className="text-sm text-gray-500 mt-1 line-clamp-2">
																{guideline.description || guideline.content.substring(0, 120) + '...'}
															</p>
															<div className="flex items-center space-x-2 mt-2">
																<Badge
																	variant={guideline.status === 'PUBLISHED' ? 'default' : 'secondary'}
																	className="text-xs"
																>
																	{guideline.status === 'PUBLISHED' ? '已发布' :
																		guideline.status === 'DRAFT' ? '草稿' : '已归档'}
																</Badge>
																<Badge variant="outline" className="text-xs">
																	{typeof guideline.category === 'object' ? guideline.category.name || '未分类' : '未分类'}
																</Badge>
																<span className="text-xs text-gray-500">
                                  {new Date(guideline.createdAt).toLocaleDateString()}
                                </span>
															</div>
														</div>
														<Button size="sm" variant="ghost">
															查看
														</Button>
													</div>
												</div>
											))}
										</div>
									</div>
								) : (
									<div
										className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
										<BookOpen className="h-12 w-12 text-gray-300"/>
										<p className="text-center text-gray-500">暂无规范文档</p>
										<Button size="sm" onClick={() => setIsGuidelineModalOpen(true)}>
											创建第一个规范文档
										</Button>
									</div>
								)}
							</TabsContent>

							<TabsContent value="code" className="mt-4">
								{project.codeAnalyses.length > 0 ? (
									<div className="space-y-4">
										<CodeAnalysisList
											codeAnalyses={
												// eslint-disable-next-line @typescript-eslint/no-explicit-any
												project.codeAnalyses as any
											}
											projectId={project.id}
											onRefresh={() => {
												// 刷新项目数据以获取最新的代码分析
												fetch(`/api/projects/${id}`)
													.then(res => res.ok ? res.json() : null)
													.then(data => data && setProject(data))
													.catch(err => console.error("刷新代码分析失败:", err));
											}}
										/>
									</div>
								) : (
									<div
										className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
										<Code className="h-12 w-12 text-gray-300"/>
										<p className="text-center text-gray-500">暂无代码分析</p>
										<CopyCliCommand projectId={project.id}/>
									</div>
								)}
							</TabsContent>

							<TabsContent value="dictionary" className="mt-4">
								{project.conceptDictionaries.length > 0 ? (
									<div className="space-y-4">
										<div className="flex justify-between items-center">
											<h3 className="text-sm font-medium text-gray-700">概念词典列表</h3>
											<Button size="sm" variant="outline">
												<BookOpen className="h-4 w-4 mr-2"/>
												添加词条
											</Button>
										</div>
										<div className="overflow-x-auto">
											<table className="min-w-full divide-y divide-gray-200">
												<thead className="bg-gray-50">
												<tr>
													<th scope="col"
													    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文术语
													</th>
													<th scope="col"
													    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">英文术语
													</th>
													<th scope="col"
													    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文描述
													</th>
													<th scope="col"
													    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作
													</th>
												</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-200">
												{project.conceptDictionaries.map((term) => (
													<tr key={term.id}>
														<td
															className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{term.termChinese}</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{term.termEnglish}</td>
														<td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{term.descChinese}</td>
														<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
															<Button size="sm" variant="ghost">查看</Button>
														</td>
													</tr>
												))}
												</tbody>
											</table>
										</div>
									</div>
								) : (
									<div
										className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
										<BookOpen className="h-12 w-12 text-gray-300"/>
										<p className="text-center text-gray-500">暂无概念词典</p>
									</div>
								)}
							</TabsContent>

							<TabsContent value="symbols" className="mt-4">
								<div className="space-y-4">
									<div className="flex items-center space-x-2">
										<Input
											placeholder="搜索函数或类的摘要..."
											value={symbolSearch}
											onChange={(e) => setSymbolSearch(e.target.value)}
											className="max-w-sm"
										/>
										<Button size="sm" variant="outline" onClick={handleSymbolSearch} disabled={symbolLoading}>
											<Search className="h-4 w-4 mr-2" />
											搜索
										</Button>
									</div>

									{symbolLoading ? (
										<div className="space-y-2">
											<Skeleton className="h-24 w-full" />
											<Skeleton className="h-24 w-full" />
											<Skeleton className="h-24 w-full" />
										</div>
									) : symbols.length > 0 ? (
										<div className="space-y-4">
											{symbols.map((symbol) => (
												<Card key={symbol.id} className="overflow-hidden">
													<CardHeader className="p-4 pb-2">
														<div className="flex justify-between items-start">
															<div>
																<CardTitle className="text-base">
																	{symbol.name}
																</CardTitle>
																<CardDescription className="text-xs font-mono mt-1">
																	{symbol.path}
																</CardDescription>
															</div>
															<Badge variant="outline">
																{symbol.kind === 0 ? "文件" : symbol.kind === 1 ? "类" : symbol.kind === 2 ? "函数" : "其他"}
															</Badge>
														</div>
													</CardHeader>
													<CardContent className="p-4 pt-2">
														{symbol.detail && (
															<div className="space-y-2 mt-2">
																{symbol.detail.classSummary && (
																	<div>
																		<h4 className="text-sm font-medium">类摘要</h4>
																		<p className="text-sm text-gray-600">{symbol.detail.classSummary}</p>
																	</div>
																)}
																{symbol.detail.functionSummary && (
																	<div>
																		<h4 className="text-sm font-medium">函数摘要</h4>
																		<p className="text-sm text-gray-600">{symbol.detail.functionSummary}</p>
																	</div>
																)}
															</div>
														)}
														<div className="text-xs text-gray-400 mt-2">
															更新于: {new Date(symbol.updatedAt).toLocaleString()}
														</div>
													</CardContent>
												</Card>
											))}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
											<Code className="h-12 w-12 text-gray-300" />
											<p className="text-center text-gray-500">暂无符号分析数据</p>
											<CopyCliCommand projectId={project.id} />
										</div>
									)}
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>

			{project && (
				<ProjectEditDialog
					project={project}
					open={isEditDialogOpen}
					onOpenChange={setIsEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}

			{project && (
				<GuidelineCreateModal
					projectId={project.id}
					isOpen={isGuidelineModalOpen}
					onClose={() => setIsGuidelineModalOpen(false)}
					onSuccess={handleGuidelineCreated}
				/>
			)}
		</div>
	)
}

function ProjectDetailSkeleton() {
	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Skeleton className="h-10 w-10 rounded"/>
					<div>
						<Skeleton className="h-8 w-64"/>
						<Skeleton className="h-4 w-96 mt-2"/>
					</div>
				</div>
				<div className="flex space-x-2">
					<Skeleton className="h-10 w-32"/>
					<Skeleton className="h-10 w-32"/>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Skeleton className="h-[600px] lg:col-span-1"/>
				<Skeleton className="h-[600px] lg:col-span-2"/>
			</div>
		</div>
	)
}
