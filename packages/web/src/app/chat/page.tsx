"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ChevronLeft, Check, Loader2, Edit, Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ApiResource, Guideline } from "@/types/project.type"
import AssetRecommendation from "@/components/asset-recommendation"

// 定义消息类型
type MessageType =
  | "user"
  | "system"
  | "intent-recognition"
  | "bullet-prompts"
  | "asset-recommendation"
  | "requirement-card"
  | "confirmation"

// 定义消息结构
interface Message {
  id: string
  type: MessageType
  content: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  loading?: boolean
}

interface CodeSnippet {
  id: string
  name: string
  description: string
  language: string
  code: string
  selected?: boolean
}

interface RequirementCard {
  name: string
  module: string
  description: string
  apis: ApiResource[]
  codeSnippets: CodeSnippet[]
  guidelines: Guideline[]
  assignee: string
  deadline: string
  status: "draft" | "pending" | "approved"
}

export default function Chat() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content: "欢迎使用需求生成助手！请描述您的需求，例如：'我想加一个导出 Excel 的功能'",
    },
  ])
  const [selectedAPIs, setSelectedAPIs] = useState<string[]>([])
  const [selectedCodeSnippets, setSelectedCodeSnippets] = useState<string[]>([])
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [requirementCard, setRequirementCard] = useState<RequirementCard | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editField, setEditField] = useState<keyof RequirementCard | null>(null)
  const [editValue, setEditValue] = useState("")
  const [hasDraft, setHasDraft] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 自动滚动到底部
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // 处理用户输入提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    }

    // 添加系统处理消息
    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "system",
      content: "正在分析您的需求...",
      loading: true,
    }

    setMessages((prev) => [...prev, userMessage, processingMessage])
    setInput("")
    setIsProcessing(true)

    // 模拟处理延迟
    setTimeout(() => {
      // 移除加载消息
      setMessages((prev) => prev.filter((msg) => msg.id !== processingMessage.id))

      // 意图识别消息
      const intentMessage: Message = {
        id: Date.now().toString(),
        type: "intent-recognition",
        content: "我理解您需要添加导出Excel的功能。",
        data: {
          intent: "数据导出",
          keywords: ["导出", "Excel"],
          confidence: 0.92
        }
      }

      // 添加引导问题
      const promptMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bullet-prompts",
        content: "为了更好地定义这个需求，请告诉我：",
        data: {
          prompts: [
            "您需要从哪个页面或模块导出数据？",
            "导出的数据包含哪些字段或内容？",
            "是否需要支持筛选条件？",
            "对导出文件格式有什么特殊要求？"
          ]
        }
      }

      setMessages((prev) => [...prev, intentMessage, promptMessage])
      setIsProcessing(false)
    }, 1500)
  }

  // 处理问题回答
  const handleAnswerPrompt = (userInput: string) => {
    // 添加用户回答
    const userAnswer: Message = {
      id: Date.now().toString(),
      type: "user",
      content: userInput,
    }

    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "system",
      content: "正在处理您的回答...",
      loading: true,
    }

    setMessages((prev) => [...prev, userAnswer, processingMessage])
    setIsProcessing(true)

    // 模拟处理延迟
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== processingMessage.id))
      const assetMessage: Message = {
        id: Date.now().toString(),
        type: "asset-recommendation",
        content: "根据您的需求，我找到了以下可能有用的资源：",
        data: {
          // apis: apis,
          // codeSnippets: codeSnippets,
          // standards: standards
        }
      }

      setMessages((prev) => [...prev, assetMessage])
      setIsProcessing(false)
    }, 1500)
  }

  // 处理API选择
  const handleSelectAPI = (apiId: string) => {
    if (selectedAPIs.includes(apiId)) {
      setSelectedAPIs(prev => prev.filter(id => id !== apiId));
    } else {
      setSelectedAPIs(prev => [...prev, apiId]);
    }
  }

  // 处理代码片段选择
  const handleSelectCodeSnippet = (snippetId: string) => {
    if (selectedCodeSnippets.includes(snippetId)) {
      setSelectedCodeSnippets(prev => prev.filter(id => id !== snippetId));
    } else {
      setSelectedCodeSnippets(prev => [...prev, snippetId]);
    }
  }

  // 处理规范选择
  const handleSelectStandard = (standardId: string) => {
    if (selectedStandards.includes(standardId)) {
      setSelectedStandards(prev => prev.filter(id => id !== standardId));
    } else {
      setSelectedStandards(prev => [...prev, standardId]);
    }
  }

  // 确认资产选择
  const handleConfirmAssetSelection = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedApiObjects: any[] = []; // apis.filter(api => selectedAPIs.includes(api.id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedCodeObjects: any[] = []; // codeSnippets.filter(code => selectedCodeSnippets.includes(code.id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedStandardObjects: any[] = []; // standards.filter(std => selectedStandards.includes(std.id));

    const newRequirementCard: RequirementCard = {
      name: "导出Excel功能",
      module: "数据管理",
      description: "添加导出Excel功能，支持数据筛选和自定义列",
      apis: selectedApiObjects,
      codeSnippets: selectedCodeObjects,
      guidelines: selectedStandardObjects,
      assignee: "",
      deadline: "",
      status: "draft"
    };

    setRequirementCard(newRequirementCard);

    // 添加卡片预览消息
    const cardPreviewMessage: Message = {
      id: Date.now().toString(),
      type: "requirement-card",
      content: "已为您生成需求卡片预览：",
      data: { card: newRequirementCard }
    }

    setMessages(prev => [...prev, cardPreviewMessage]);
  }

  // 处理保存为草稿
  const handleSaveAsDraft = () => {
    if (requirementCard) {
      // 实际应用中这里会调用API保存到后端
      setHasDraft(true);

      const draftMessage: Message = {
        id: Date.now().toString(),
        type: "system",
        content: "已将需求保存为草稿，您可以稍后继续编辑。"
      }

      setMessages(prev => [...prev, draftMessage]);
    }
  }

  // 处理编辑需求卡片
  const handleEditRequirement = (field: keyof RequirementCard) => {
    if (!requirementCard) return;

    let initialValue = "";
    if (field === "name") initialValue = requirementCard.name;
    else if (field === "module") initialValue = requirementCard.module;
    else if (field === "description") initialValue = requirementCard.description;
    else if (field === "assignee") initialValue = requirementCard.assignee;
    else if (field === "deadline") initialValue = requirementCard.deadline;

    setEditField(field);
    setEditValue(initialValue);
    setEditDialogOpen(true);
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editField || !requirementCard) return;

    const updatedCard = { ...requirementCard };
    (updatedCard[editField] as string) = editValue;
    setRequirementCard(updatedCard);

    setEditDialogOpen(false);
    setEditField(null);
    setEditValue("");
  }

  // 处理生成任务
  const handleGenerateTask = () => {
    // 添加确认消息
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      type: "confirmation",
      content: "需求已成功生成！",
      data: { requirementCard }
    }

    setMessages(prev => [...prev, confirmationMessage]);

    // 清空状态，准备新的对话
    setTimeout(() => {
      setSelectedAPIs([]);
      setSelectedCodeSnippets([]);
      setSelectedStandards([]);
      setRequirementCard(null);
      setHasDraft(false);
    }, 2000);
  }

  // 渲染消息
  const renderMessage = (message: Message) => {
    switch (message.type) {
      case "user":
        return <p>{message.content}</p>;

      case "system":
        return message.loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{message.content}</span>
          </div>
        ) : (
          <p>{message.content}</p>
        );

      case "intent-recognition":
        return (
          <div className="space-y-2">
            <p>{message.content}</p>
            <div className="flex space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                意图: {message.data.intent}
              </Badge>
              {message.data.keywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  关键词: {keyword}
                </Badge>
              ))}
            </div>
          </div>
        );

      case "bullet-prompts":
        return (
          <div className="space-y-2">
            <p>{message.content}</p>
            <ul className="list-disc pl-5 space-y-1">
              {message.data.prompts.map((prompt: string, index: number) => (
                <li key={index}>{prompt}</li>
              ))}
            </ul>
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInput("我需要在用户管理页面导出用户列表，包含用户ID、姓名、邮箱和注册时间")}
              >
                填充示例回答
              </Button>
            </div>
          </div>
        );

      case "asset-recommendation":
        const keywords =
          message.data?.keywords ||
          (messages.find(m => m.type === "intent-recognition")?.data?.keywords ?? []);
        return (
          <AssetRecommendation
            keywords={keywords}
            selectedAPIs={selectedAPIs}
            selectedCodeSnippets={selectedCodeSnippets}
            selectedStandards={selectedStandards}
            onSelectAPI={handleSelectAPI}
            onSelectCodeSnippet={handleSelectCodeSnippet}
            onSelectStandard={handleSelectStandard}
            onConfirm={handleConfirmAssetSelection}
          />
        );

      case "requirement-card":
        return (
          <div className="space-y-3">
            <p>{message.content}</p>
            <Card className="border-2 border-muted">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">需求卡片</CardTitle>
                  <Badge variant={message.data.card.status === "draft" ? "outline" : "default"}>
                    {message.data.card.status === "draft" ? "草稿" : "待确认"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">功能名称</Label>
                      <Button variant="ghost" size="icon" onClick={() => handleEditRequirement('name')}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2 bg-muted/40 rounded text-sm">
                      {message.data.card.name || <span className="text-muted-foreground">待补充</span>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">所属模块</Label>
                      <Button variant="ghost" size="icon" onClick={() => handleEditRequirement('module')}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2 bg-muted/40 rounded text-sm">
                      {message.data.card.module || <span className="text-muted-foreground">待补充</span>}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">功能说明</Label>
                    <Button variant="ghost" size="icon" onClick={() => handleEditRequirement('description')}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="p-2 bg-muted/40 rounded text-sm">
                    {message.data.card.description || <span className="text-muted-foreground">待补充</span>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">关联API</Label>
                  {message.data.card.apis.length > 0 ? (
                    <div className="p-2 bg-muted/40 rounded text-sm">
                      <ul className="list-disc pl-5 space-y-1">
                        {message.data.card.apis.map((api: ApiResource) => (
                          <li key={api.id}>{api.sourceUrl}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-2 bg-muted/40 rounded text-sm text-muted-foreground">无关联API</div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">关联代码片段</Label>
                  {message.data.card.codeSnippets.length > 0 ? (
                    <div className="p-2 bg-muted/40 rounded text-sm">
                      <ul className="list-disc pl-5 space-y-1">
                        {message.data.card.codeSnippets.map((snippet: CodeSnippet) => (
                          <li key={snippet.id}>{snippet.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-2 bg-muted/40 rounded text-sm text-muted-foreground">无关联代码片段</div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">遵循规范</Label>
                  {message.data.card.standards.length > 0 ? (
                    <div className="p-2 bg-muted/40 rounded text-sm">
                      <ul className="list-disc pl-5 space-y-1">
                        {message.data.card.standards.map((guideline: Guideline) => (
                          <li key={guideline.id}>
                            {guideline.title} {guideline.version}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-2 bg-muted/40 rounded text-sm text-muted-foreground">无关联规范</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">负责人</Label>
                      <Button variant="ghost" size="icon" onClick={() => handleEditRequirement('assignee')}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2 bg-muted/40 rounded text-sm">
                      {message.data.card.assignee || <span className="text-muted-foreground">待分配</span>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">计划排期</Label>
                      <Button variant="ghost" size="icon" onClick={() => handleEditRequirement('deadline')}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2 bg-muted/40 rounded text-sm">
                      {message.data.card.deadline || <span className="text-muted-foreground">待排期</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex justify-between w-full">
                  <Button variant="outline" onClick={handleSaveAsDraft}>
                    <Save className="h-4 w-4 mr-2" />
                    保存为草稿
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => handleEditRequirement('name')}>
                      修改信息
                    </Button>
                    <Button onClick={handleGenerateTask}>
                      <Check className="h-4 w-4 mr-2" />
                      生成任务
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        );

      case "confirmation":
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">{message.content}</p>
            </div>
            <p className="text-sm">任务已添加到需求池中，您可以在需求管理系统中查看和管理。</p>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                查看需求池
              </Button>
              <Button size="sm" variant="outline">
                开始新需求
              </Button>
            </div>
          </div>
        );

      default:
        return <p>{message.content}</p>;
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <header className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <ChevronLeft className="h-5 w-5 mr-2" />
          <h1 className="text-xl font-bold">需求生成助手</h1>
        </div>
        {hasDraft && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            草稿已保存
          </Badge>
        )}
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4" ref={chatContainerRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.type === "user" ? "bg-primary text-primary-foreground" : 
                message.type === "requirement-card" || message.type === "asset-recommendation" ? "w-full bg-card" : 
                "bg-muted"
              }`}
            >
              {renderMessage(message)}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t flex space-x-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isProcessing ? "正在处理..." :
            messages.some(m => m.type === "bullet-prompts") ? "回答问题或输入新指令..." :
            "请描述您的需求..."
          }
          className="flex-1"
          disabled={isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
              e.preventDefault();
              if (messages.some(m => m.type === "bullet-prompts")) {
                handleAnswerPrompt(input);
              } else {
                handleSubmit(e as unknown as React.FormEvent);
              }
            }
          }}
        />
        <Button
          type="submit"
          disabled={!input.trim() || isProcessing}
          onClick={(e) => {
            e.preventDefault();
            if (messages.some(m => m.type === "bullet-prompts")) {
              handleAnswerPrompt(input);
            } else {
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editField === 'name' ? '编辑功能名称' :
               editField === 'module' ? '编辑所属模块' :
               editField === 'description' ? '编辑功能说明' :
               editField === 'assignee' ? '指定负责人' :
               '设置计划排期'}
            </DialogTitle>
          </DialogHeader>

          {editField === 'description' ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={5}
              className="resize-none"
            />
          ) : (
            <Input
              type={editField === 'deadline' ? 'date' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
