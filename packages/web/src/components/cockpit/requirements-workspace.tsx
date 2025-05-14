"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import InputWithSend from "@/components/shared/input-with-send"
import GenifyMarkdownRender from "@/components/markdown/GenifyMarkdownRender";

// Default example requirement with rich context
const DEFAULT_REQUIREMENT = "我需要一个会议室预订系统，支持用户通过手机查看可用会议室，预订会议时段，设置会议提醒，并能邀请其他参会者。系统需要防止会议室冲突，并提供简单的管理界面。";

interface RequirementsWorkspaceProps {
  currentRequirement: string
  setCurrentRequirement: (value: string) => void
  conversation: Array<{ role: string; content: string }>
  documentContent: Array<{ id: string; type: string; content: string }>
  onSendMessage: (message: string) => void
  onDocumentEdit: (id: string, newContent: string) => void
  onUpdateDocument?: () => void
  onCheckQuality?: () => void
  isLoading?: boolean
  isDocumentUpdating?: boolean
  isQualityChecking?: boolean
}

export default function RequirementsWorkspace({
  currentRequirement,
  setCurrentRequirement,
  conversation,
  documentContent,
  onSendMessage,
  onDocumentEdit,
  onUpdateDocument,
  onCheckQuality,
  isLoading = false,
  isDocumentUpdating = false,
  isQualityChecking = false,
}: RequirementsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("conversation")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Set default requirement if empty and conversation is empty
  useEffect(() => {
    if (conversation.length === 0 && !currentRequirement) {
      setCurrentRequirement(DEFAULT_REQUIREMENT);
    }
  }, [conversation.length, currentRequirement, setCurrentRequirement]);

  useEffect(() => {
    if (messagesEndRef.current && activeTab === "conversation") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversation, activeTab])

  const handleSend = () => {
    if (currentRequirement.trim()) {
      onSendMessage(currentRequirement)
      setCurrentRequirement("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.altKey) {
        // Alt+Enter 换行，不做处理
        return
      } else if (!e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }
  }

  const analyzeRequirement = async () => {
    if (!currentRequirement.trim()) return

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: '你是一个需求分析专家。请分析用户输入的需求，提取关键信息，并给出更完整、结构化的需求陈述。' },
            { role: 'user', content: `请分析并扩展以下需求：${currentRequirement}` }
          ]
        })
      })

      const data = await response.json()
      if (data.text) {
        setCurrentRequirement(data.text)
      }
    } catch (error) {
      console.error('Error analyzing requirement:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const startEditing = (id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }

  const saveEdit = () => {
    if (editingId) {
      onDocumentEdit(editingId, editContent)
      setEditingId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full border-l border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-800">自动开发驾驶舱</h1>
        <p className="text-sm text-gray-500">与 AI 助手协作定义、完善和实现您的需求</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-auto">
        <TabsList className="mx-4 mt-2 justify-start">
          <TabsTrigger value="conversation" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            对话流
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            需求文档
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation" className="flex-1 flex flex-col p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            {conversation.length === 0 && (
              <div className="flex justify-center items-center h-40 text-gray-500">
                <div className="text-center">
                  <p className="mb-2">请在下方输入您的需求描述开始对话</p>
                  <p className="text-xs">提示：使用清晰、具体的语言描述您的需求</p>
                </div>
              </div>
            )}

            {conversation.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "mb-4 max-w-[80%] rounded-lg p-4",
                  message.role === "user" ? "ml-auto bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-800",
                )}
              >
                <div className="whitespace-pre-wrap">
                  <GenifyMarkdownRender content={message.content} />
                </div>
                {message.role === "assistant" && index === conversation.length - 1 && (
                  <div className="flex gap-2 justify-end mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onUpdateDocument}
                      disabled={isDocumentUpdating}
                      className="flex items-center"
                    >
                      {isDocumentUpdating ? (
                        <>
                          <span className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"/>
                          更新中...
                        </>
                      ) : (
                        <>
                          <FileText className="h-3 w-3 mr-1" />
                          生成需求文档
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCheckQuality}
                      disabled={isQualityChecking || (documentContent && documentContent.length === 0)}
                      className="flex items-center"
                    >
                      {isQualityChecking ? (
                        <>
                          <span className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"/>
                          检查中...
                        </>
                      ) : (
                        <>
                          <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v15"/>
                            <path d="M13.9 17.25 16 15.5l2.1 1.75"/>
                            <path d="m16 15.5-4.6 3.86L9 18"/>
                          </svg>
                          质量检查
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className={conversation.length === 0 ? "mb-2 text-sm font-medium text-gray-700" : "hidden"}>
              请描述您的核心需求或意图
            </div>
            <InputWithSend
              value={currentRequirement}
              onChange={(e) => setCurrentRequirement(e.target.value)}
              onSend={handleSend}
              keywordsAnalyze={true}
              onAnalyze={analyzeRequirement}
              isLoading={isLoading}
              isAnalyzing={isAnalyzing}
              minHeight={conversation.length === 0 ? "100px" : "80px"} // 首次输入框高一些
              onKeyDown={handleKeyDown}
              placeholder={conversation.length === 0
                ? "例如：我需要一个会议室预订系统，支持用户通过手机查看可用会议室，预订会议时段，设置会议提醒，并能邀请其他参会者。系统需要防止会议室冲突，并提供简单的管理界面。"
                : "输入您的回复..."}
            />
          </div>
        </TabsContent>

        {/* Document Tab */}
        <TabsContent value="document" className="flex-1 p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            {documentContent && documentContent.map((section) => (
              <Card key={section.id} id={section.id} className="mb-4 py-0">
                <CardContent className="p-4">
                  {editingId === section.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingId(null)}>
                          取消
                        </Button>
                        <Button onClick={saveEdit}>保存</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, "<br>") }} />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => startEditing(section.id, section.content)}>
                          编辑
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

