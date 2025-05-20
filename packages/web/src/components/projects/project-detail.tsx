"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Settings } from "lucide-react"
import { Project } from "@/types/project.type";
import { ProjectEditDialog } from "./project-edit-dialog"
import { GuidelineCreateModal } from "./guideline-create-modal";
import { ProjectInfo } from "./project-info"
import { ProjectResources } from "./project-resources"

export function ProjectDetail({ id }: { id: string }) {
	const [project, setProject] = useState<Project | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false)
	const router = useRouter()

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [symbols, setSymbols] = useState<any[]>([]);
	const [symbolSearch, setSymbolSearch] = useState("");
	const [symbolLoading, setSymbolLoading] = useState(false);

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

	const refreshProjectData = async () => {
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
				<ProjectInfo project={project} symbols={symbols} />

				<ProjectResources
					project={project}
					symbols={symbols}
					symbolSearch={symbolSearch}
					symbolLoading={symbolLoading}
					setSymbolSearch={setSymbolSearch}
					fetchSymbols={fetchSymbols}
					refreshProject={refreshProjectData}
					onOpenGuidelineModal={() => setIsGuidelineModalOpen(true)}
				/>
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
