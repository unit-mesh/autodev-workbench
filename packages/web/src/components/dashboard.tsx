"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Clock,
  Star,
  Bookmark,
  TrendingUp,
  AlertCircle,
  FileText,
  Code,
  BookOpen,
  Plus,
  Grip,
  MoreHorizontal,
  Rocket,
  CheckCircle,
  FileCode,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

interface DashboardProps {
  openDocument: (docId: string) => void
}

export function Dashboard({ openDocument }: DashboardProps) {
  const [widgets, setWidgets] = useState([
    { id: "recent", title: "最近访问", type: "recent", size: "medium" },
    { id: "favorites", title: "收藏文档", type: "favorites", size: "medium" },
    { id: "updates", title: "最新更新", type: "updates", size: "medium" },
    { id: "popular", title: "热门文档", type: "popular", size: "medium" },
    { id: "activity", title: "活动摘要", type: "activity", size: "large" },
  ])

  const isTablet = useMediaQuery("(min-width: 768px)")
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((widget) => widget.id !== id))
  }

  return (
    <ScrollArea className="h-[calc(100vh-64px)]">
      <div className="container py-6 md:py-8 lg:py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            开发者驾驶舱
          </h1>
          <p className="text-muted-foreground">个性化的技术文档中心，助您高效开发</p>
        </div>

        <Tabs defaultValue="all">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="api">API参考</TabsTrigger>
              <TabsTrigger value="guides">指南</TabsTrigger>
              <TabsTrigger value="tutorials">教程</TabsTrigger>
            </TabsList>

            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span>添加小部件</span>
            </Button>
          </div>

          <TabsContent value="all" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {widgets.map((widget) => (
                <Card
                  key={widget.id}
                  className={cn(
                    "shadow-sm hover:shadow-md transition-shadow border-muted hover:border-muted/80",
                    widget.size === "large" && (isDesktop ? "lg:col-span-2" : ""),
                    "group hover:translate-y-[-2px] transition-all duration-300",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {widget.type === "recent" && <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                        {widget.type === "favorites" && <Star className="h-5 w-5 text-amber-500" />}
                        {widget.type === "updates" && (
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                        {widget.type === "popular" && (
                          <Bookmark className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        )}
                        {widget.type === "activity" && (
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        {widget.title}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Grip className="h-4 w-4" />
                          <span className="sr-only">移动</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">更多选项</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>刷新</DropdownMenuItem>
                            <DropdownMenuItem>设置</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => removeWidget(widget.id)}>移除</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardDescription>
                      {widget.type === "recent" && "您最近访问的文档"}
                      {widget.type === "favorites" && "您收藏的文档"}
                      {widget.type === "updates" && "最近更新的文档"}
                      {widget.type === "popular" && "团队中热门文档"}
                      {widget.type === "activity" && "最近的活动和通知"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {widget.type === "recent" && (
                      <div className="space-y-4">
                        <div
                          className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                          onClick={() => openDocument("api-products-list")}
                        >
                          <div className="mt-0.5">
                            <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">获取产品列表</div>
                            <div className="text-xs text-muted-foreground">API参考 / 产品</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>10分钟前</span>
                            </div>
                          </div>
                        </div>
                        <div
                          className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                          onClick={() => openDocument("guide-authentication")}
                        >
                          <div className="mt-0.5">
                            <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">认证与授权</div>
                            <div className="text-xs text-muted-foreground">指南</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>1小时前</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                          <div className="mt-0.5">
                            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">实现OAuth 2.0</div>
                            <div className="text-xs text-muted-foreground">教程</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>昨天</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {widget.type === "favorites" && (
                      <div className="space-y-4">
                        <div
                          className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                          onClick={() => openDocument("api-products-list")}
                        >
                          <div className="mt-0.5">
                            <Star className="h-4 w-4 text-amber-500" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">获取产品列表</div>
                            <div className="text-xs text-muted-foreground">API参考 / 产品</div>
                          </div>
                        </div>
                        <div
                          className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                          onClick={() => openDocument("guide-authentication")}
                        >
                          <div className="mt-0.5">
                            <Star className="h-4 w-4 text-amber-500" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">认证与授权</div>
                            <div className="text-xs text-muted-foreground">指南</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                          <div className="mt-0.5">
                            <Star className="h-4 w-4 text-amber-500" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">实现OAuth 2.0</div>
                            <div className="text-xs text-muted-foreground">教程</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {widget.type === "updates" && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                          <div className="mt-0.5">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">用户认证API更新到v2.5</div>
                            <div className="text-xs text-muted-foreground">API参考 / 认证</div>
                            <div className="text-xs text-muted-foreground mt-1">10分钟前</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                          <div className="mt-0.5">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">新增OAuth 2.0教程</div>
                            <div className="text-xs text-muted-foreground">教程</div>
                            <div className="text-xs text-muted-foreground mt-1">昨天</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                          <div className="mt-0.5">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">更新错误处理最佳实践</div>
                            <div className="text-xs text-muted-foreground">指南 / 最佳实践</div>
                            <div className="text-xs text-muted-foreground mt-1">2天前</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {widget.type === "popular" && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium">
                            1
                          </div>
                          <div>
                            <div className="font-medium text-sm">认证与授权</div>
                            <div className="text-xs text-muted-foreground">指南</div>
                            <div className="text-xs text-muted-foreground mt-1">120次访问</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium">
                            2
                          </div>
                          <div>
                            <div className="font-medium text-sm">获取产品列表</div>
                            <div className="text-xs text-muted-foreground">API参考 / 产品</div>
                            <div className="text-xs text-muted-foreground mt-1">98次访问</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium">
                            3
                          </div>
                          <div>
                            <div className="font-medium text-sm">实现OAuth 2.0</div>
                            <div className="text-xs text-muted-foreground">教程</div>
                            <div className="text-xs text-muted-foreground mt-1">76次访问</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {widget.type === "activity" && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          </div>
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">API文档已更新</span> - 用户认证API已更新到v2.5版本
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">10分钟前</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          </div>
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">李明</span> 回复了您关于OAuth集成的问题
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">1小时前</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                          </div>
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">新教程已发布</span> - 查看"使用GraphQL API的最佳实践"
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">昨天</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                          </div>
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">您的API密钥将在7天后过期</span> - 请及时更新
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">2天前</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                          </div>
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">系统维护通知</span> - 本周六 02:00-04:00 API服务将进行维护
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">3天前</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full justify-center">
                      查看全部
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                推荐内容
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="shadow-sm hover:shadow-md transition-shadow border-muted hover:border-muted/80 hover:translate-y-[-2px] transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800">
                        新手指南
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Star className="h-4 w-4" />
                        <span className="sr-only">收藏</span>
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">API集成快速入门</CardTitle>
                    <CardDescription>学习如何在15分钟内完成API集成</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      本指南将帮助您快速了解如何在应用中集成我们的API，包括认证、基本请求和错误处理。
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" size="sm" className="w-full">
                      <Rocket className="h-4 w-4 mr-2" />
                      开始学习
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-muted hover:border-muted/80 hover:translate-y-[-2px] transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800">
                        最佳实践
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Star className="h-4 w-4" />
                        <span className="sr-only">收藏</span>
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">API性能优化指南</CardTitle>
                    <CardDescription>提高API调用效率的关键技巧</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      了解如何通过批处理、缓存和并发控制等技术优化API调用，提升应用性能。
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" size="sm" className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      查看指南
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-muted hover:border-muted/80 hover:translate-y-[-2px] transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800">
                        视频教程
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Star className="h-4 w-4" />
                        <span className="sr-only">收藏</span>
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">WebHook集成实战</CardTitle>
                    <CardDescription>通过视频学习WebHook的配置与使用</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      这个视频教程将带您一步步实现WebHook集成，包括配置、测试和常见问题排查。
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileCode className="h-4 w-4 mr-2" />
                      观看视频
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api" className="m-0">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">API参考标签内容</h3>
              <p className="text-muted-foreground">此处将显示API参考相关的小部件和内容</p>
            </div>
          </TabsContent>

          <TabsContent value="guides" className="m-0">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">指南标签内容</h3>
              <p className="text-muted-foreground">此处将显示指南相关的小部件和内容</p>
            </div>
          </TabsContent>

          <TabsContent value="tutorials" className="m-0">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">教程标签内容</h3>
              <p className="text-muted-foreground">此处将显示教程相关的小部件和内容</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}
