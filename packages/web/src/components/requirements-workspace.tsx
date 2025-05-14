"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, MessageSquare, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface RequirementsWorkspaceProps {
  currentRequirement: string
  setCurrentRequirement: (value: string) => void
  conversation: Array<{ role: string; content: string }>
  documentContent: Array<{ id: string; type: string; content: string }>
  onSendMessage: (message: string) => void
  onDocumentEdit: (id: string, newContent: string) => void
}

export default function RequirementsWorkspace({
  currentRequirement,
  setCurrentRequirement,
  conversation,
  documentContent,
  onSendMessage,
  onDocumentEdit,
}: RequirementsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("conversation")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
      <div className="p-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-800">需求工程工作区</h1>
        <p className="text-sm text-gray-500">与 AI 助手协作定义和完善您的需求</p>
      </div>

      {/* Initial Intent Input */}
      {conversation.length === 0 && (
        <div className="p-6 bg-white">
          <div className="mb-2 text-sm font-medium text-gray-700">请用一句话描述您的核心需求或意图</div>
          <div className="flex gap-2">
            <Textarea
              placeholder="例如：我需要一个能让用户在线预订会议室的系统"
              value={currentRequirement}
              onChange={(e) => setCurrentRequirement(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 resize-none"
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />
              发送
            </Button>
          </div>
        </div>
      )}

      {/* Tabs for Conversation and Document */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
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

        {/* Conversation Tab */}
        <TabsContent value="conversation" className="flex-1 flex flex-col p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "mb-4 max-w-[80%] rounded-lg p-4",
                  message.role === "user" ? "ml-auto bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-800",
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {conversation.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <Textarea
                  placeholder="输入您的回复..."
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 resize-none"
                />
                <Button onClick={handleSend}>
                  <Send className="h-4 w-4 mr-2" />
                  发送
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Document Tab */}
        <TabsContent value="document" className="flex-1 p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            {documentContent.map((section) => (
              <Card key={section.id} id={section.id} className="mb-4">
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
