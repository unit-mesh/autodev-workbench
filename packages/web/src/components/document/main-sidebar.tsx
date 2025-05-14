"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, Search, Star, BookOpen, Code, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MainSidebarProps {
  isOpen: boolean
  closeSidebar: () => void
  openDocument: (docId: string) => void
  currentDocId: string | null
}

export function MainSidebar({ isOpen, closeSidebar, openDocument, currentDocId }: MainSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    api: true,
    guides: false,
    tutorials: false,
  })

  // 当文档ID变化时，自动展开相应的部分
  useEffect(() => {
    if (currentDocId?.startsWith("api-")) {
      setExpandedItems((prev) => ({ ...prev, api: true }))
    } else if (currentDocId?.startsWith("guide-")) {
      setExpandedItems((prev) => ({ ...prev, guides: true }))
    } else if (currentDocId?.startsWith("tutorial-")) {
      setExpandedItems((prev) => ({ ...prev, tutorials: true }))
    }
  }, [currentDocId])

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 left-0 z-30 flex h-full w-72 flex-col border-r bg-background pt-16 lg:static lg:z-auto lg:w-64 transition-all duration-300 animate-in slide-in-from-left">
      <div className="absolute right-2 top-2 lg:hidden">
        <Button variant="ghost" size="icon" onClick={closeSidebar}>
          <X className="h-5 w-5" />
          <span className="sr-only">关闭侧边栏</span>
        </Button>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="搜索文档..." className="pl-8 bg-background" />
        </div>
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="grid grid-cols-2 mx-4 my-4">
          <TabsTrigger value="browse">浏览</TabsTrigger>
          <TabsTrigger value="favorites">收藏</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="m-0">
          <ScrollArea className="h-[calc(100vh-140px)] lg:h-[calc(100vh-160px)]">
            <div className="p-4 pt-0">
              <div className="mb-4">
                <div
                  className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 px-2 rounded-md transition-colors"
                  onClick={() => toggleExpand("api")}
                >
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">API参考</span>
                  </div>
                  {expandedItems["api"] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>

                {expandedItems["api"] && (
                  <div className="ml-6 border-l pl-4 space-y-2 animate-in slide-in-from-left-2 duration-200">
                    <div className="py-1">
                      <div className="flex items-center justify-between cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                        <span className="text-sm font-medium">认证</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="py-1">
                      <div className="flex items-center justify-between cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                        <span className="text-sm font-medium">用户</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="py-1 cursor-pointer" onClick={() => openDocument("api-products")}>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            currentDocId === "api-products" && "text-blue-600 dark:text-blue-400",
                          )}
                        >
                          产品
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <div className="ml-4 mt-1 space-y-1">
                        <div
                          className={cn(
                            "text-sm py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer",
                            currentDocId === "api-products-list" && "text-blue-600 dark:text-blue-400",
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            openDocument("api-products-list")
                          }}
                        >
                          获取产品列表
                        </div>
                        <div
                          className={cn(
                            "text-sm py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer",
                            currentDocId === "api-products-get" && "text-blue-600 dark:text-blue-400",
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            openDocument("api-products-get")
                          }}
                        >
                          获取单个产品
                        </div>
                        <div
                          className={cn(
                            "text-sm py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer",
                            currentDocId === "api-products-create" && "text-blue-600 dark:text-blue-400",
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            openDocument("api-products-create")
                          }}
                        >
                          创建产品
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <div className="flex items-center justify-between cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                        <span className="text-sm font-medium">订单</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div
                  className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 px-2 rounded-md transition-colors"
                  onClick={() => toggleExpand("guides")}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium">指南</span>
                  </div>
                  {expandedItems["guides"] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>

                {expandedItems["guides"] && (
                  <div className="ml-6 border-l pl-4 space-y-2 animate-in slide-in-from-left-2 duration-200">
                    <div
                      className={cn(
                        "py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer",
                        currentDocId === "guide-getting-started" && "text-blue-600 dark:text-blue-400",
                      )}
                      onClick={() => openDocument("guide-getting-started")}
                    >
                      <span className="text-sm">入门指南</span>
                    </div>
                    <div
                      className={cn(
                        "py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer",
                        currentDocId === "guide-authentication" && "text-blue-600 dark:text-blue-400",
                      )}
                      onClick={() => openDocument("guide-authentication")}
                    >
                      <span className="text-sm">认证与授权</span>
                    </div>
                    <div className="py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                      <span className="text-sm">错误处理</span>
                    </div>
                    <div className="py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                      <span className="text-sm">最佳实践</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div
                  className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 px-2 rounded-md transition-colors"
                  onClick={() => toggleExpand("tutorials")}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium">教程</span>
                  </div>
                  {expandedItems["tutorials"] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>

                {expandedItems["tutorials"] && (
                  <div className="ml-6 border-l pl-4 space-y-2 animate-in slide-in-from-left-2 duration-200">
                    <div className="py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                      <span className="text-sm">构建第一个应用</span>
                    </div>
                    <div className="py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                      <span className="text-sm">集成支付功能</span>
                    </div>
                    <div className="py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                      <span className="text-sm">实现OAuth 2.0</span>
                      <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800">
                        新
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="favorites" className="m-0">
          <ScrollArea className="h-[calc(100vh-140px)] lg:h-[calc(100vh-160px)]">
            <div className="p-4 pt-0">
              <div className="space-y-4">
                <div
                  className="flex items-center gap-2 py-2 hover:bg-muted/50 px-2 rounded-md transition-colors hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  onClick={() => openDocument("api-products-list")}
                >
                  <Star className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-sm font-medium">获取产品列表</div>
                    <div className="text-xs text-muted-foreground">API参考 / 产品</div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 py-2 hover:bg-muted/50 px-2 rounded-md transition-colors hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  onClick={() => openDocument("guide-authentication")}
                >
                  <Star className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-sm font-medium">认证与授权</div>
                    <div className="text-xs text-muted-foreground">指南</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2 hover:bg-muted/50 px-2 rounded-md transition-colors hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                  <Star className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-sm font-medium">实现OAuth 2.0</div>
                    <div className="text-xs text-muted-foreground">教程</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                <p>收藏文档以便快速访问</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
