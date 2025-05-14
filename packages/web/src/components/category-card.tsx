import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Rocket, Code, Package, BookOpen, FileCode, CheckCircle } from "lucide-react"

interface CategoryCardProps {
  title: string
  description: string
  icon: string
  href: string
}

export default function CategoryCard({ title, description, icon, href }: CategoryCardProps) {
  return (
    <Link href={href} className="block h-full group">
      <Card className="h-full overflow-hidden border-gray-200 dark:border-gray-800 group-hover:border-blue-300 dark:group-hover:border-blue-700 group-hover:shadow-md transition-all duration-300 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-purple-600/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-lg"></div>
        <CardContent className="p-6 flex items-start space-x-4">
          <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
            {icon === "rocket" && <Rocket className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            {icon === "code" && <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            {icon === "package" && <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            {icon === "book-open" && <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            {icon === "file-code" && <FileCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            {icon === "check-circle" && <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
