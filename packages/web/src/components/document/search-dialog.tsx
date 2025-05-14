"use client"

import { useState, useEffect } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { FileText, Code, BookOpen, ArrowRight } from "lucide-react"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  openDocument: (docId: string) => void
}

export function SearchDialog({ open, onOpenChange, openDocument }: SearchDialogProps) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  const searchResults = [
    {
      id: "api-products-list",
      title: "获取产品列表",
      type: "api",
      path: "/api/products",
      excerpt: "此端点返回您账户中的产品列表，支持分页、排序和筛选。",
    },
    {
      id: "guide-authentication",
      title: "认证与授权",
      type: "guide",
      path: "/guides/authentication",
      excerpt: "了解如何使用API密钥和OAuth 2.0进行认证和授权。",
    },
    {
      id: "api-products-get",
      title: "获取单个产品",
      type: "api",
      path: "/api/products/{id}",
      excerpt: "此端点返回指定ID的产品详细信息。",
    },
    {
      id: "tutorial-oauth",
      title: "实现OAuth 2.0",
      type: "tutorial",
      path: "/tutorials/oauth",
      excerpt: "学习如何在您的应用中实现OAuth 2.0授权流程。",
    },
    {
      id: "guide-getting-started",
      title: "入门指南",
      type: "guide",
      path: "/guides/getting-started",
      excerpt: "快速上手我们的API和服务。",
    },
  ]

  const filteredResults = query
    ? searchResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.excerpt.toLowerCase().includes(query.toLowerCase()),
      )
    : searchResults

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-3xl">
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="搜索文档..."
            value={query}
            onValueChange={setQuery}
            className="border-none focus:ring-0"
          />
          <CommandList>
            <CommandEmpty>没有找到相关结果</CommandEmpty>
            <CommandGroup heading="搜索结果">
              {filteredResults.map((result) => (
                <CommandItem
                  key={result.id}
                  className="py-3 cursor-pointer"
                  onSelect={() => {
                    openDocument(result.id)
                    onOpenChange(false)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {result.type === "api" && <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {result.type === "guide" && <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      {result.type === "tutorial" && (
                        <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{result.title}</div>
                      <div className="text-sm text-muted-foreground">{result.path}</div>
                      <div className="text-sm mt-1">{result.excerpt}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 self-center opacity-60" />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
