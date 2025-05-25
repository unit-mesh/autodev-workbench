"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface TableOfContentsProps {
  className?: string
  items: Array<{
    id: string
    label: string
  }>
}

export default function TableOfContents({ className, items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "0px 0px -80% 0px" },
    )

    items.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      items.forEach((item) => {
        const element = document.getElementById(item.id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [items])

  return (
    <div className={cn("space-y-4", className)}>
      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">On This Page</div>
      <nav className="space-y-1">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "block text-sm py-1 transition-colors border-l-2 pl-3 -ml-0.5",
              activeId === item.id
                ? "text-blue-700 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-300 border-transparent hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800",
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
