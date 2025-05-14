"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Book, Network, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface KnowledgeHubProps {
  activeSource: string | null
  onSourceSelect: (sourceId: string | null) => void
}

export default function KnowledgeHub({ activeSource, onSourceSelect }: KnowledgeHubProps) {
  const [activeTab, setActiveTab] = useState("explicit")

  const explicitKnowledge = [
    {
      id: "company-policy",
      title: "公司会议室管理规范",
      type: "document",
      date: "2023-10-15",
      excerpt: "会议室预订需提前24小时，取消需提前4小时...",
    },
    {
      id: "current-system",
      title: "现有会议室管理后台截图",
      type: "image",
      date: "2023-11-20",
      excerpt: "展示了当前系统的会议室列表和筛选功能",
    },
    {
      id: "ieee-29148",
      title: "IEEE 29148 需求工程标准",
      type: "standard",
      date: "2022-01-10",
      excerpt: "软件需求规格说明书的结构和内容指南",
    },
  ]

  const implicitKnowledge = [
    {
      id: "code-insight-1",
      title: "从代码库分析",
      source: "会议室预订API",
      insight: "检测到现有API支持按部门筛选会议室，新系统可能需要保持此功能",
    },
    {
      id: "interview-1",
      title: "专家访谈记录",
      source: "行政部门主管",
      insight: "会议室预订冲突是当前系统的主要问题，新系统应提供更好的冲突检测",
    },
  ]

  const glossaryTerms = [
    { term: "会议室", definition: "公司内用于举行会议的专用空间" },
    { term: "预订时段", definition: "用户预留会议室的特定时间段" },
    { term: "冲突检测", definition: "系统检查并防止多个预订在同一时间段占用同一会议室的机制" },
  ]

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">情境与知识中心</h2>
        <p className="text-xs text-gray-500">管理和浏览项目相关知识</p>
      </div>

      <Tabs defaultValue="explicit" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="explicit">显性知识</TabsTrigger>
          <TabsTrigger value="implicit">隐性知识</TabsTrigger>
        </TabsList>

        <TabsContent value="explicit" className="flex-1 flex flex-col p-0 m-0">
          <div className="p-2 flex justify-end">
            <Button variant="outline" size="sm" className="text-xs">
              <Upload className="h-3 w-3 mr-1" />
              上传文档
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {explicitKnowledge.map((item) => (
                <Card
                  key={item.id}
                  className={cn(
                    "cursor-pointer hover:border-blue-200 transition-colors",
                    activeSource === item.id && "border-blue-500 bg-blue-50",
                  )}
                  onClick={() => onSourceSelect(item.id === activeSource ? null : item.id)}
                >
                  <CardHeader className="p-3 pb-0">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-medium flex items-center">
                        {item.type === "document" && <FileText className="h-3 w-3 mr-1 text-blue-600" />}
                        {item.type === "image" && (
                          <img src="/placeholder.svg?height=12&width=12" className="h-3 w-3 mr-1" alt="" />
                        )}
                        {item.type === "standard" && <Book className="h-3 w-3 mr-1 text-purple-600" />}
                        {item.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] h-4">
                        {item.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <p className="text-xs text-gray-600">{item.excerpt}</p>
                    <p className="text-[10px] text-gray-400 mt-1">更新于: {item.date}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="implicit" className="flex-1 flex flex-col p-0 m-0">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {implicitKnowledge.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:border-blue-200 transition-colors">
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <Badge variant="secondary" className="text-[10px] h-4 w-fit">
                      来源: {item.source}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <p className="text-xs text-gray-600">{item.insight}</p>
                    <div className="flex justify-end mt-1 gap-1">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                        确认
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                        标记相关
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Project Glossary */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">项目词汇表</h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {glossaryTerms.map((item, index) => (
              <div key={index} className="text-xs">
                <span className="font-medium text-gray-800">{item.term}</span>
                <span className="text-gray-500"> - {item.definition}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Knowledge Graph (Simplified) */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">知识图谱浏览器</h3>
          <Button variant="outline" size="sm" className="h-6 text-[10px]">
            <Network className="h-3 w-3 mr-1" />
            查看
          </Button>
        </div>
      </div>
    </div>
  )
}
