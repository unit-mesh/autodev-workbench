"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Send, ThumbsUp, ThumbsDown, Sparkles, MessageSquare, Lightbulb, Search, Code, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface AIAssistantProps {
  closeAssistant: () => void
  currentDocId: string | null
  isTablet: boolean
}

export function AIAssistant({ closeAssistant, currentDocId, isTablet }: AIAssistantProps) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content: "👋 你好！我是你的AI助手，可以帮助你查找文档、解答问题或提供代码示例。有什么我可以帮你的吗？",
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = () => {
    if (input.trim()) {
      // 添加用户消息
      setMessages((prev) => [...prev, { role: "user", content: input }])
      setInput("")

      // 模拟AI正在输入
      setIsTyping(true)

      // 模拟AI响应
      setTimeout(() => {
        setIsTyping(false)

        let response = ""
        if (input.toLowerCase().includes("oauth") || input.toLowerCase().includes("认证")) {
          response =
            "OAuth 2.0是一个授权框架，允许第三方应用获得对HTTP服务的有限访问权限。\n\n我们的API支持以下OAuth 2.0授权流程：\n\n1. 授权码流程（推荐）\n2. 客户端凭证流程\n3. 密码凭证流程\n\n你可以在[认证与授权](/guide-authentication)文档中找到详细的实现指南和示例代码。"
        } else if (input.toLowerCase().includes("产品") || input.toLowerCase().includes("api")) {
          response =
            "我们的产品API允许你管理产品目录，包括创建、更新、查询和删除产品。\n\n主要端点包括：\n\n- `GET /v1/products` - 获取产品列表\n- `GET /v1/products/{id}` - 获取单个产品\n- `POST /v1/products` - 创建产品\n- `PUT /v1/products/{id}` - 更新产品\n- `DELETE /v1/products/{id}` - 删除产品\n\n你需要查看具体哪个端点的文档吗？"
        } else if (input.toLowerCase().includes("错误") || input.toLowerCase().includes("问题")) {
          response =
            "常见的API错误状态码包括：\n\n- `401` - 认证错误，API密钥无效或已过期\n- `403` - 权限错误，没有访问资源的权限\n- `404` - 资源不存在\n- `422` - 参数验证错误\n- `429` - 请求过多，超出API速率限制\n\n如果你遇到特定的错误，可以提供错误代码和详细信息，我会帮你解决。"
        } else {
          response =
            "感谢你的问题！我可以帮你查找相关文档或提供更多信息。你可以问我关于API使用、认证方法、错误处理或任何技术问题。如果你需要特定的代码示例，也可以告诉我你使用的编程语言。"
        }

        setMessages((prev) => [...prev, { role: "assistant", content: response }])
      }, 1500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-30 bg-background border-l shadow-lg flex flex-col pt-16 transition-all duration-300",
        isTablet ? "w-80 md:w-96" : "w-full",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          AI助手
        </h2>
        <Button variant="ghost" size="icon" onClick={closeAssistant}>
          <X className="h-5 w-5" />
          <span className="sr-only">关闭</span>
        </Button>
      </div>

      <Tabs defaultValue="chat">
        <TabsList className="grid grid-cols-3 mx-4 my-2">
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>对话</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-1">
            <Lightbulb className="h-4 w-4" />
            <span>建议</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-1">
            <Search className="h-4 w-4" />
            <span>搜索</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="m-0 flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === "user" ? "bg-blue-600 text-white" : "bg-muted",
                    )}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                    {message.role === "assistant" && (
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ThumbsUp className="h-3 w-3" />
                          <span className="sr-only">有帮助</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ThumbsDown className="h-3 w-3" />
                          <span className="sr-only">没帮助</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce delay-75"></div>
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="输入你的问题..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px] resize-none"
              />
              <Button className="self-end" onClick={handleSend} disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
                <span className="sr-only">发送</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI助手可能会产生不准确的信息。请验证重要内容。
            </p>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="m-0 flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="text-sm font-medium mb-2">推荐内容</div>

              <div className="border rounded-lg p-3 hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-start gap-2">
                  <Code className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-sm">API认证指南</div>
                    <p className="text-xs text-muted-foreground mt-1">了解如何使用API密钥和OAuth 2.0进行认证</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium text-sm">错误处理最佳实践</div>
                    <p className="text-xs text-muted-foreground mt-1">学习如何优雅地处理API错误和异常情况</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-start gap-2">
                  <Code className="h-4 w-4 mt-0.5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="font-medium text-sm">分页与筛选技巧</div>
                    <p className="text-xs text-muted-foreground mt-1">如何高效地使用API的分页和筛选功能</p>
                  </div>
                </div>
              </div>

              <div className="text-sm font-medium mt-6 mb-2">常见问题</div>

              <div className="space-y-2">
                <div
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  onClick={() => {
                    setInput("如何使用OAuth 2.0认证？")
                    setMessages((prev) => [...prev, { role: "user", content: "如何使用OAuth 2.0认证？" }])

                    // 模拟AI正在输入
                    setIsTyping(true)

                    // 模拟AI响应
                    setTimeout(() => {
                      setIsTyping(false)
                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content:
                            "OAuth 2.0是一个授权框架，允许第三方应用获得对HTTP服务的有限访问权限。\n\n我们的API支持以下OAuth 2.0授权流程：\n\n1. 授权码流程（推荐）\n2. 客户端凭证流程\n3. 密码凭证流程\n\n你可以在[认证与授权](/guide-authentication)文档中找到详细的实现指南和示例代码。",
                        },
                      ])
                    }, 1500)
                  }}
                >
                  如何使用OAuth 2.0认证？
                </div>
                <div
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  onClick={() => {
                    setInput("API速率限制是多少？")
                    setMessages((prev) => [...prev, { role: "user", content: "API速率限制是多少？" }])

                    // 模拟AI正在输入
                    setIsTyping(true)

                    // 模拟AI响应
                    setTimeout(() => {
                      setIsTyping(false)
                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content:
                            "我们的API速率限制根据您的账户类型而有所不同：\n\n- 免费账户：每分钟60个请求，每天1000个请求\n- 标准账户：每分钟300个请求，每天10,000个请求\n- 企业账户：每分钟3000个请求，每天无限制\n\n如果您超出限制，API将返回429状态码。您可以在响应头中查看剩余的请求配额：\n\n- X-RateLimit-Limit：当前时间窗口允许的请求数\n- X-RateLimit-Remaining：当前时间窗口剩余的请求数\n- X-RateLimit-Reset：重置计数器的时间（Unix时间戳）",
                        },
                      ])
                    }, 1500)
                  }}
                >
                  API速率限制是多少？
                </div>
                <div
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  onClick={() => {
                    setInput("如何处理API错误？")
                    setMessages((prev) => [...prev, { role: "user", content: "如何处理API错误？" }])

                    // 模拟AI正在输入
                    setIsTyping(true)

                    // 模拟AI响应
                    setTimeout(() => {
                      setIsTyping(false)
                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content:
                            '处理API错误的最佳实践：\n\n1. 始终检查HTTP状态码\n2. 解析错误响应中的详细信息\n3. 实现指数退避重试机制\n4. 记录错误详情以便调试\n\n我们的API在错误响应中返回统一的JSON格式：\n\n```json\n{\n  "error": {\n    "code": "invalid_request",\n    "message": "参数验证失败",\n    "details": [\n      {\n        "field": "email",\n        "message": "无效的邮箱格式"\n      }\n    ]\n  }\n}\n```\n\n您可以在[错误处理](/guide-error-handling)文档中找到更多信息和示例代码。',
                        },
                      ])
                    }, 1500)
                  }}
                >
                  如何处理API错误？
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="search" className="m-0 flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索文档..."
                className="w-full pl-8 pr-4 py-2 text-sm rounded-md border bg-background"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>输入关键词搜索文档</p>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
