"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import AssetRecommendation from "@/app/chat/components/asset-recommendation"
import RequirementCardComponent, { RequirementCard } from "./components/requirement-card"

type MessageType =
  | "user"
  | "system"
  | "intent-recognition"
  | "bullet-prompts"
  | "asset-recommendation"
  | "requirement-card"
  | "confirmation"

interface Message {
  id: string
  type: MessageType
  content: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  loading?: boolean
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
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    }

    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "system",
      content: "正在分析您的需求...",
      loading: true,
    }

    setMessages((prev) => [...prev, userMessage, processingMessage])
    setInput("")
    setIsProcessing(true)

    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== processingMessage.id))

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

    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== processingMessage.id))
      const assetMessage: Message = {
        id: Date.now().toString(),
        type: "asset-recommendation",
        content: "根据您的需求，我找到了以下可能有用的资源：",
        data: {}
      }

      setMessages((prev) => [...prev, assetMessage])
      setIsProcessing(false)
    }, 1500)
  }

  const handleSelectAPI = (apiId: string) => {
    if (selectedAPIs.includes(apiId)) {
      setSelectedAPIs(prev => prev.filter(id => id !== apiId));
    } else {
      setSelectedAPIs(prev => [...prev, apiId]);
    }
  }

  const handleSelectCodeSnippet = (snippetId: string) => {
    if (selectedCodeSnippets.includes(snippetId)) {
      setSelectedCodeSnippets(prev => prev.filter(id => id !== snippetId));
    } else {
      setSelectedCodeSnippets(prev => [...prev, snippetId]);
    }
  }

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

    const cardPreviewMessage: Message = {
      id: Date.now().toString(),
      type: "requirement-card",
      content: "已为您生成需求卡片预览：",
      data: { card: newRequirementCard }
    }

    setMessages(prev => [...prev, cardPreviewMessage]);
  }

  const handleSaveAsDraft = () => {
    if (requirementCard) {
      setHasDraft(true);

      const draftMessage: Message = {
        id: Date.now().toString(),
        type: "system",
        content: "已将需求保存为草稿，您可以稍后继续编辑。"
      }

      setMessages(prev => [...prev, draftMessage]);
    }
  }

  const handleEditRequirement = (field: keyof RequirementCard) => {
    if (!requirementCard) return;

    let initialValue = "";
    switch (field) {
      case "name":
        initialValue = requirementCard.name;
        break;
      case "module":
        initialValue = requirementCard.module;
        break;
      case "description":
        initialValue = requirementCard.description;
        break;
      case "assignee":
        initialValue = requirementCard.assignee;
        break;
      case "deadline":
        initialValue = requirementCard.deadline;
        break;
    }

    setEditField(field);
    setEditValue(initialValue);
    setEditDialogOpen(true);
  }

  const handleSaveEdit = () => {
    if (!editField || !requirementCard) return;

    const updatedCard = { ...requirementCard };
    (updatedCard[editField] as string) = editValue;
    setRequirementCard(updatedCard);

    setEditDialogOpen(false);
    setEditField(null);
    setEditValue("");
  }

  const handleGenerateTask = () => {
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
            <RequirementCardComponent
              card={message.data.card}
              onEdit={handleEditRequirement}
              onSaveAsDraft={handleSaveAsDraft}
              onGenerateTask={handleGenerateTask}
            />
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
