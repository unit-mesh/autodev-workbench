import { Metadata } from "next"
import { ProjectDetail } from "@/components/projects/project-detail"

export const metadata: Metadata = {
  title: "项目详情 | AutoDev",
  description: "查看项目的详细信息和资源",
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8">
      <ProjectDetail id={params.id} />
    </div>
  )
}
