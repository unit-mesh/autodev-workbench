import { Metadata } from "next"
import { ProjectsList } from "@/components/projects/projects-list"

export const metadata: Metadata = {
  title: "我的项目 | AutoDev",
  description: "查看和管理您的项目",
}

export default function ProjectsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">我的项目</h1>
      </div>
      <ProjectsList />
    </div>
  )
}
