import React, { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle2, Copy } from "lucide-react"
import { ApiResource } from "@/types/project.type"

interface Standard {
  id: string
  name: string
  version: string
  description: string
  url?: string
  selected?: boolean
}

interface CodeSnippet {
  id: string
  name: string
  description: string
  language: string
  code: string
  selected?: boolean
}

interface AssetRecommendationProps {
  keywords: string[]
  selectedAPIs: string[]
  selectedCodeSnippets: string[]
  selectedStandards: string[]
  onSelectAPI: (apiId: string) => void
  onSelectCodeSnippet: (snippetId: string) => void
  onSelectStandard: (standardId: string) => void
  onConfirm: () => void
}

const mockCodeSnippets: CodeSnippet[] = [
  // ...与原 codeSnippets 相同...
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
  // ...existing code...
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
// ...existing code...
export default ExportButton;`
  }
]

const mockStandards: Standard[] = [
  // ...与原 standards 相同...
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

export default function AssetRecommendation(props: AssetRecommendationProps) {
  const {
    keywords,
    selectedAPIs,
    selectedCodeSnippets,
    selectedStandards,
    onSelectAPI,
    onSelectCodeSnippet,
    onSelectStandard,
    onConfirm,
  } = props

  const [apis, setApis] = useState<ApiResource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // 获取 API 资源
  useEffect(() => {
    const fetchApis = async () => {
      setIsLoading(true)
      setApiError(null)
      try {
        const response = await fetch('/api/context/api')
        if (!response.ok) throw new Error(`Failed to fetch APIs: ${response.status}`)
        const data: ApiResource[] = await response.json()
        setApis(data)
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Unknown error occurred")
        setApis([
          {
            id: "default-api",
            className: "ExportService",
            methodName: "exportToExcel",
            packageName: "默认包",
            supplyType: "默认",
            sourceHttpMethod: "POST",
            sourceUrl: "/api/export"
          } as ApiResource
        ])
      } finally {
        setIsLoading(false)
      }
    }
    fetchApis()
  }, [])

  // 搜索过滤
  const filterByKeywords = <T extends { name?: string; description?: string; sourceUrl?: string }>(items: T[]) => {
    if (!keywords?.length && !search) return items
    const allKeywords = [...(keywords || []), ...(search ? [search] : [])]
    return items.filter(item =>
      allKeywords.some(kw =>
        (item.name && item.name.includes(kw)) ||
        (item.description && item.description.includes(kw)) ||
        (item.sourceUrl && item.sourceUrl.includes(kw))
      )
    )
  }

  const filteredApis = filterByKeywords(apis)
  const filteredCodeSnippets = filterByKeywords(mockCodeSnippets)
  const filteredStandards = filterByKeywords(mockStandards)

  return (
    <div className="space-y-4">
      <p>根据您的需求，我找到了以下可能有用的资源：</p>
      <div className="flex gap-2">
        <input
          className="border px-2 py-1 rounded text-sm"
          placeholder="搜索资源"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {keywords && keywords.length > 0 && (
          <div className="flex gap-1">
            {keywords.map((kw, i) => (
              <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{kw}</Badge>
            ))}
          </div>
        )}
      </div>
      <Tabs defaultValue="apis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="apis">API ({filteredApis.length})</TabsTrigger>
          <TabsTrigger value="code">代码片段 ({filteredCodeSnippets.length})</TabsTrigger>
          <TabsTrigger value="standards">规范 ({filteredStandards.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="apis" className="mt-2 space-y-2">
          {isLoading ? <div>加载中...</div> : apiError ? <div className="text-red-500">{apiError}</div> :
            filteredApis.map((api: ApiResource) => (
              <Card key={api.id} className="overflow-hidden">
                <CardHeader className="py-2 px-3 bg-muted/50 flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`h-4 w-4 ${selectedAPIs.includes(api.id) ? 'text-green-500' : 'text-gray-300'}`} />
                    <CardTitle className="text-sm font-medium">{api.sourceHttpMethod} {api.sourceUrl}</CardTitle>
                  </div>
                  <Checkbox
                    checked={selectedAPIs.includes(api.id)}
                    onCheckedChange={() => onSelectAPI(api.id)}
                  />
                </CardHeader>
                <CardContent className="p-3 text-sm">
                  <p>{api.className} {api.packageName}</p>
                </CardContent>
              </Card>
            ))
          }
        </TabsContent>
        <TabsContent value="code" className="mt-2 space-y-2">
          {filteredCodeSnippets.map((snippet: CodeSnippet) => (
            <Card key={snippet.id} className="overflow-hidden">
              <CardHeader className="py-2 px-3 bg-muted/50 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className={`h-4 w-4 ${selectedCodeSnippets.includes(snippet.id) ? 'text-green-500' : 'text-gray-300'}`} />
                  <CardTitle className="text-sm font-medium">{snippet.name}</CardTitle>
                </div>
                <Checkbox
                  checked={selectedCodeSnippets.includes(snippet.id)}
                  onCheckedChange={() => onSelectCodeSnippet(snippet.id)}
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
          {filteredStandards.map((standard: Standard) => (
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
                  onCheckedChange={() => onSelectStandard(standard.id)}
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
        <Button onClick={onConfirm}>
          确认选择
        </Button>
        <Button variant="outline">
          忽略推荐
        </Button>
      </div>
    </div>
  )
}
