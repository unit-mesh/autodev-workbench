"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ModelSelector } from "./model-selector"

export function SearchDialog() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = () => {
    if (!query.trim()) return
    setIsSearching(true)
    // 这里可以实现搜索逻辑，调用 AI 模型等
    setTimeout(() => {
      setIsSearching(false)
    }, 1500)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Search className="h-4 w-4 mr-1" />
          <span>搜索</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>智能搜索</DialogTitle>
          <DialogDescription>使用 AI 模型搜索您需要的内容</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Input
            placeholder="输入您的搜索内容..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <ModelSelector />
        </div>
        <DialogFooter>
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? "搜索中..." : "搜索"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
