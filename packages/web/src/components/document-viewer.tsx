"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ChevronRight,
  Star,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Share,
  Printer,
  Code,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

interface DocumentViewerProps {
  documentId: string | null
}

export function DocumentViewer({ documentId }: DocumentViewerProps) {
  const [copied, setCopied] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null)
  const [isStarred, setIsStarred] = useState(false)
  const isTablet = useMediaQuery("(min-width: 768px)")
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const copyCode = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const giveFeedback = (type: "up" | "down") => {
    setFeedbackGiven(type)
  }

  const toggleStar = () => {
    setIsStarred(!isStarred)
  }

  // 这里根据documentId加载不同的文档内容
  // 在实际应用中，这里应该从API或状态管理中获取文档数据

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-background/95 backdrop-blur border-b px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap pb-2 md:pb-0 scrollbar-thin">
            <span className="hover:text-foreground cursor-pointer">API参考</span>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="hover:text-foreground cursor-pointer">产品</span>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="text-foreground font-medium">获取产品列表</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleStar}>
              <Star className={cn("h-4 w-4", isStarred ? "fill-amber-500 text-amber-500" : "")} />
              <span className="sr-only">收藏</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share className="h-4 w-4" />
              <span className="sr-only">分享</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Printer className="h-4 w-4" />
              <span className="sr-only">打印</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">GET</Badge>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/v1/products</code>
            </div>

            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              获取产品列表
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                <span>API参考</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>更新于 2025-05-10</span>
              </div>
            </div>

            <p className="text-lg mb-6">此端点返回您账户中的产品列表，支持分页、排序和筛选。</p>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4" id="request-parameters">
                请求参数
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">参数名</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">类型</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">必填</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">limit</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">integer</code>
                      </td>
                      <td className="py-3 px-4 align-top">否</td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">每页返回的产品数量，范围1-100，默认为20。</p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">page</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">integer</code>
                      </td>
                      <td className="py-3 px-4 align-top">否</td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">页码，从1开始，默认为1。</p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">sort</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">string</code>
                      </td>
                      <td className="py-3 px-4 align-top">否</td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">排序字段，可选值：name, created_at, updated_at，默认为created_at。</p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">order</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">string</code>
                      </td>
                      <td className="py-3 px-4 align-top">否</td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">排序方向，可选值：asc, desc，默认为desc。</p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">category</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">string</code>
                      </td>
                      <td className="py-3 px-4 align-top">否</td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">按产品类别筛选。</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4" id="response">
                响应
              </h2>
              <p className="mb-4">返回产品对象的数组，包含分页信息。</p>

              <Tabs defaultValue="json">
                <TabsList className="mb-4">
                  <TabsTrigger value="json">JSON响应</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>

                <TabsContent value="json" className="mt-0">
                  <div className="relative rounded-lg overflow-hidden bg-gray-950 text-gray-50 shadow-md group">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
                      <span className="text-xs font-medium text-gray-400">JSON</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-50 hover:bg-gray-800 transition-colors"
                        onClick={copyCode}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">复制代码</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <pre className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                        <code className="text-sm font-mono">
                          {`{
  "data": [
    {
      "id": "prod_1234567890",
      "name": "高级会员套餐",
      "description": "包含所有高级功能的会员套餐",
      "price": 99.99,
      "currency": "CNY",
      "category": "subscription",
      "created_at": "2025-05-01T08:30:00Z",
      "updated_at": "2025-05-05T10:15:00Z"
    },
    {
      "id": "prod_0987654321",
      "name": "标准会员套餐",
      "description": "包含基本功能的会员套餐",
      "price": 49.99,
      "currency": "CNY",
      "category": "subscription",
      "created_at": "2025-04-15T14:20:00Z",
      "updated_at": "2025-04-20T09:45:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}`}
                        </code>
                      </pre>
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none"></div>
                  </div>
                </TabsContent>

                <TabsContent value="curl" className="mt-0">
                  <div className="relative rounded-lg overflow-hidden bg-gray-950 text-gray-50 shadow-md group">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
                      <span className="text-xs font-medium text-gray-400">cURL</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-50 hover:bg-gray-800 transition-colors"
                        onClick={copyCode}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">复制代码</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <pre className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                        <code className="text-sm font-mono">
                          {`curl https://api.example.com/v1/products \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -G \\
  -d limit=20 \\
  -d page=1 \\
  -d sort=created_at \\
  -d order=desc`}
                        </code>
                      </pre>
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none"></div>
                  </div>
                </TabsContent>

                <TabsContent value="python" className="mt-0">
                  <div className="relative rounded-lg overflow-hidden bg-gray-950 text-gray-50 shadow-md group">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
                      <span className="text-xs font-medium text-gray-400">Python</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-50 hover:bg-gray-800 transition-colors"
                        onClick={copyCode}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">复制代码</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <pre className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                        <code className="text-sm font-mono">
                          {`import requests

url = "https://api.example.com/v1/products"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
params = {
    "limit": 20,
    "page": 1,
    "sort": "created_at",
    "order": "desc"
}

response = requests.get(url, headers=headers, params=params)
products = response.json()

for product in products["data"]:
    print(f"{product['name']} - {product['price']} {product['currency']}")`}
                        </code>
                      </pre>
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none"></div>
                  </div>
                </TabsContent>

                <TabsContent value="javascript" className="mt-0">
                  <div className="relative rounded-lg overflow-hidden bg-gray-950 text-gray-50 shadow-md group">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
                      <span className="text-xs font-medium text-gray-400">JavaScript</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-50 hover:bg-gray-800 transition-colors"
                        onClick={copyCode}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">复制代码</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <pre className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                        <code className="text-sm font-mono">
                          {`const fetchProducts = async () => {
  const params = new URLSearchParams({
    limit: '20',
    page: '1',
    sort: 'created_at',
    order: 'desc'
  });
  
  const response = await fetch(\`https://api.example.com/v1/products?\${params}\`, {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });
  
  const data = await response.json();
  
  data.data.forEach(product => {
    console.log(\`\${product.name} - \${product.price} \${product.currency}\`);
  });
};

fetchProducts();`}
                        </code>
                      </pre>
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none"></div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4" id="errors">
                错误处理
              </h2>
              <p className="mb-4">此端点可能返回以下错误：</p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">状态码</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">401</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">认证错误，API密钥无效或已过期。</p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">403</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">权限错误，您的API密钥没有访问此资源的权限。</p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">422</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">参数验证错误，请检查您提供的参数是否符合要求。</p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">429</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">请求过多，您已超出API速率限制。</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    编辑此页面
                  </Button>
                  <Button variant="outline" size="sm">
                    报告问题
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">此页面对您有帮助吗？</span>
                  <Button
                    variant={feedbackGiven === "up" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => giveFeedback("up")}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    有帮助
                  </Button>
                  <Button
                    variant={feedbackGiven === "down" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => giveFeedback("down")}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    没帮助
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {isDesktop && (
        <div className="hidden lg:block w-64 border-l h-full overflow-auto">
          <div className="p-4 border-b">
            <h3 className="font-medium text-sm">本页内容</h3>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              <li>
                <a
                  href="#request-parameters"
                  className="block text-sm py-1 border-l-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 pl-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  请求参数
                </a>
              </li>
              <li>
                <a
                  href="#response"
                  className="block text-sm py-1 border-l-2 border-blue-600 dark:border-blue-400 pl-3 text-blue-600 dark:text-blue-400 font-medium"
                >
                  响应
                </a>
              </li>
              <li>
                <a
                  href="#errors"
                  className="block text-sm py-1 border-l-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 pl-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  错误处理
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  )
}
