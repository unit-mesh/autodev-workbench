import { Metadata } from "next"
import { ProjectDetail } from "@/components/projects/project-detail"
import { use } from "react";

export const metadata: Metadata = {
	title: "项目详情 | AutoDev",
	description: "查看项目的详细信息和资源",
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);

	return (
		<div className="container mx-auto py-8">
			<ProjectDetail id={id}/>
		</div>
	)
}
