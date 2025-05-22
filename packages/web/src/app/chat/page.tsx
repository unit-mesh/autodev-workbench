"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Copy, ChevronLeft, Check, Loader2, Edit, Save, FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

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

// API 结构
interface API {
  id: string
  name: string
  description: string
  method?: string
  url?: string
  params?: {
    name: string
    type: string
    required: boolean
    description: string
  }[]
  response?: string
  code?: string
  selected?: boolean
}

// API Resource 结构 (来自数据库)
interface ApiResource {
  id: string
  sourceUrl: string
  sourceHttpMethod: string
  packageName: string
  className: string
  methodName: string
  supplyType: string
}

// 规范结构
interface Standard {
  id: string
  name: string
  version: string
  description: string
  url?: string
  selected?: boolean
}

// 代码片段结构
interface CodeSnippet {
  id: string
  name: string
  description: string
  language: string
  code: string
  selected?: boolean
}

// 需求卡片结构
interface RequirementCard {
  name: string
  module: string
  description: string
  apis: API[]
  codeSnippets: CodeSnippet[]
  standards: Standard[]
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
  const [apis, setApis] = useState<API[]>([])
  const [isLoadingApis, setIsLoadingApis] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 从数据库获取API数据
  useEffect(() => {
    const fetchApis = async () => {
      setIsLoadingApis(true)
      setApiError(null)

      try {
        const response = await fetch('/api/context/api')

        if (!response.ok) {
          throw new Error(`Failed to fetch APIs: ${response.status}`)
        }

        const data: ApiResource[] = await response.json()

        // 转换API数据格式
        const formattedApis = data.map(apiResource => transformApiResource(apiResource))
        setApis(formattedApis)
      } catch (error) {
        console.error("Error fetching APIs:", error)
        setApiError(error instanceof Error ? error.message : "Unknown error occurred")
        // 如果API获取失败，设置一些默认数据以便UI可以正常工作
        setApis([
          {
            id: "default-api",
            name: "ExportService.exportToExcel",
            description: "导出数据到Excel文件 (默认数据)",
            method: "POST",
            url: "/api/export"
          }
        ])
      } finally {
        setIsLoadingApis(false)
      }
    }

    fetchApis()
  }, [])

  const transformApiResource = (apiResource: ApiResource): API => {
    return {
      id: apiResource.id,
      name: `${apiResource.className}.${apiResource.methodName}`,
      description: `${apiResource.packageName} 包中的API，供应类型: ${apiResource.supplyType}`,
      method: apiResource.sourceHttpMethod,
      url: apiResource.sourceUrl,
    }
  }

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // 模拟代码片段数据
  const codeSnippets: CodeSnippet[] = [
    {
      id: "code1",
      name: "ExcelJS 导出实现",
      description: "使用ExcelJS库实现Excel导出，支持样式和多Sheet",
      language: "javascript",
      code: `// 后端Excel导出实现 (Node.js)
const ExcelJS = require('exceljs');

async function generateExcel(data, options = {}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(options.sheetName || 'Sheet1');
  
  // 设置表头
  const columns = options.columns || Object.keys(data[0]).reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {});
  
  const headerRow = Object.values(columns);
  sheet.addRow(headerRow);
  
  // 添加数据行
  data.forEach(item => {
    const rowValues = Object.keys(columns).map(key => item[key]);
    sheet.addRow(rowValues);
  });
  
  // 设置样式
  sheet.getRow(1).font = { bold: true };
  
  // 生成文件并返回
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateExcel };`
    },
    {
      id: "code2",
      name: "React导出按钮组件",
      description: "可复用的React导出按钮组件，支持加载状态和错误处理",
      language: "jsx",
      code: `import React, { useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';

const ExportButton = ({ getData, filename = 'export.xlsx', buttonText = '导出数据' }) => {
  const [loading, setLoading] = useState(false);
  
  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await getData();
      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, filename })
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const result = await response.json();
      
      // 触发下载
      const link = document.createElement('a');
      link.href = result.fileUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出错误:', error);
      message.error('导出失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Tooltip title="导出当前数据为Excel文件">
      <Button 
        type="primary" 
        icon={loading ? <LoadingOutlined /> : <DownloadOutlined />}
        loading={loading}
        onClick={handleExport}
      >
        {buttonText}
      </Button>
    </Tooltip>
  );
};

export default ExportButton;`
    }
  ];

  // 模拟规范数据
  const standards: Standard[] = [
    {
      id: "std1",
      name: "数据导出安全规范",
      version: "v2.0",
      description: "规定了数据导出的安全要求，包括敏感字段脱敏、访问控制、导出大小限制等。",
      url: "https://standards.example.com/data-export-security",
    },
    {
      id: "std2",
      name: "文件下载接口规范",
      version: "v1.5",
      description: "定义了文件下载API的设计标准，包括鉴权、限流、日志记录等规范。",
      url: "https://standards.example.com/file-download-api",
    },
    {
      id: "std3",
      name: "前端UI交互规范",
      version: "v3.2",
      description: "规定了导出功能的UI设计和交互流程，包括按钮位置、加载状态展示、成功/失败反馈等。",
      url: "https://standards.example.com/ui-guidelines",
    },
  ]

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
          apis: apis,
          codeSnippets: codeSnippets,
          standards: standards
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
    // 生成需求卡片预览
    const selectedApiObjects = apis.filter(api => selectedAPIs.includes(api.id));
    const selectedCodeObjects = codeSnippets.filter(code => selectedCodeSnippets.includes(code.id));
    const selectedStandardObjects = standards.filter(std => selectedStandards.includes(std.id));

    const newRequirementCard: RequirementCard = {
      name: "导出Excel功能",
      module: "数据管理",
      description: "添加导出Excel功能，支持数据筛选和自定义列",
      apis: selectedApiObjects,
      codeSnippets: selectedCodeObjects,
      standards: selectedStandardObjects,
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
        return (
          <div className="space-y-4">
            <p>{message.content}</p>

            <Tabs defaultValue="apis" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="apis">API ({message.data.apis.length})</TabsTrigger>
                <TabsTrigger value="code">代码片段 ({message.data.codeSnippets.length})</TabsTrigger>
                <TabsTrigger value="standards">规范 ({message.data.standards.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="apis" className="mt-2 space-y-2">
                {message.data.apis.map((api: API) => (
                  <Card key={api.id} className="overflow-hidden">
                    <CardHeader className="py-2 px-3 bg-muted/50 flex flex-row items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className={`h-4 w-4 ${selectedAPIs.includes(api.id) ? 'text-green-500' : 'text-gray-300'}`} />
                        <CardTitle className="text-sm font-medium">{api.name}</CardTitle>
                      </div>
                      <Checkbox
                        checked={selectedAPIs.includes(api.id)}
                        onCheckedChange={() => handleSelectAPI(api.id)}
                      />
                    </CardHeader>
                    <CardContent className="p-3 text-sm">
                      <p>{api.description}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">{api.method}</span> {api.url}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="code" className="mt-2 space-y-2">
                {message.data.codeSnippets.map((snippet: CodeSnippet) => (
                  <Card key={snippet.id} className="overflow-hidden">
                    <CardHeader className="py-2 px-3 bg-muted/50 flex flex-row items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className={`h-4 w-4 ${selectedCodeSnippets.includes(snippet.id) ? 'text-green-500' : 'text-gray-300'}`} />
                        <CardTitle className="text-sm font-medium">{snippet.name}</CardTitle>
                      </div>
                      <Checkbox
                        checked={selectedCodeSnippets.includes(snippet.id)}
                        onCheckedChange={() => handleSelectCodeSnippet(snippet.id)}
                      />
                    </CardHeader>
                    <CardContent className="p-3 text-sm">
                      <p>{snippet.description}</p>
                      <div className="mt-2 text-xs bg-zinc-900 text-zinc-100 p-2 rounded font-mono overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                          <span>{snippet.language}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 text-zinc-400 hover:text-zinc-100"
                            onClick={() => navigator.clipboard.writeText(snippet.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          <pre>{snippet.code.split('\n').slice(0, 5).join('\n') + (snippet.code.split('\n').length > 5 ? '\n...' : '')}</pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="standards" className="mt-2 space-y-2">
                {message.data.standards.map((standard: Standard) => (
                  <Card key={standard.id} className="overflow-hidden">
                    <CardHeader className="py-2 px-3 bg-muted/50 flex flex-row items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className={`h-4 w-4 ${selectedStandards.includes(standard.id) ? 'text-green-500' : 'text-gray-300'}`} />
                        <CardTitle className="text-sm font-medium">
                          {standard.name} <span className="text-xs font-normal">{standard.version}</span>
                        </CardTitle>
                      </div>
                      <Checkbox
                        checked={selectedStandards.includes(standard.id)}
                        onCheckedChange={() => handleSelectStandard(standard.id)}
                      />
                    </CardHeader>
                    <CardContent className="p-3 text-sm">
                      <p>{standard.description}</p>
                      {standard.url && (
                        <a
                          href={standard.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-xs text-blue-600 hover:underline flex items-center"
                        >
                          <FileText className="h-3 w-3 mr-1" /> 查看完整规范
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            <div className="flex space-x-2">
              <Button onClick={handleConfirmAssetSelection}>
                确认选择
              </Button>
              <Button variant="outline">
                忽略推荐
              </Button>
            </div>
          </div>
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
                        {message.data.card.apis.map((api: API) => (
                          <li key={api.id}>{api.name}</li>
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
                        {message.data.card.standards.map((standard: Standard) => (
                          <li key={standard.id}>
                            {standard.name} {standard.version}
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
