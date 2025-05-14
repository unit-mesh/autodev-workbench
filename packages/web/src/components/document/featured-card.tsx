import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Clock } from "lucide-react"
import Link from "next/link"

interface FeaturedCardProps {
  title: string
  description: string
  date: string
  badge?: string
  href: string
}

export default function FeaturedCard({ title, description, date, badge, href }: FeaturedCardProps) {
  return (
    <Link href={href} className="block h-full group">
      <Card className="h-full overflow-hidden border-gray-200 dark:border-gray-800 group-hover:border-blue-300 dark:group-hover:border-blue-700 group-hover:shadow-md transition-all duration-300 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-purple-600/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-lg"></div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
            {badge && (
              <Badge
                variant="secondary"
                className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {date}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
