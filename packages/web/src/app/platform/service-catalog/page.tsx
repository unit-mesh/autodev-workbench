"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bot, Code, Database, Cloud, Settings } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  category: string
  icon: React.ReactNode
  status: "active" | "beta" | "coming-soon"
}

export default function ServiceCatalog() {
  const [searchQuery, setSearchQuery] = useState("")

  const services: Service[] = [
    {
      id: "1",
      name: "AI 代码生成器",
      description: "使用 AI 自动生成代码，支持多种编程语言和框架",
      category: "ai",
      icon: <Code className="h-6 w-6" />,
      status: "active"
    },
    {
      id: "2",
      name: "智能数据分析",
      description: "AI 驱动的数据分析工具，自动生成洞察和报告",
      category: "ai",
      icon: <Database className="h-6 w-6" />,
      status: "beta"
    },
    {
      id: "3",
      name: "AI 助手集成",
      description: "将 AI 助手集成到您的开发工作流程中",
      category: "ai",
      icon: <Bot className="h-6 w-6" />,
      status: "active"
    },
    {
      id: "4",
      name: "云资源优化",
      description: "AI 驱动的云资源优化和管理",
      category: "cloud",
      icon: <Cloud className="h-6 w-6" />,
      status: "beta"
    },
    {
      id: "5",
      name: "智能配置管理",
      description: "自动化的配置管理和优化",
      category: "platform",
      icon: <Settings className="h-6 w-6" />,
      status: "coming-soon"
    }
  ]

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">服务目录</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索服务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="ai">AI 服务</TabsTrigger>
          <TabsTrigger value="cloud">云服务</TabsTrigger>
          <TabsTrigger value="platform">平台服务</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices
              .filter(service => service.category === "ai")
              .map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="cloud" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices
              .filter(service => service.category === "cloud")
              .map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="platform" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices
              .filter(service => service.category === "platform")
              .map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {service.icon}
            <CardTitle>{service.name}</CardTitle>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            service.status === "active" ? "bg-green-100 text-green-800" :
            service.status === "beta" ? "bg-yellow-100 text-yellow-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {service.status === "active" ? "已上线" :
             service.status === "beta" ? "测试版" : "即将推出"}
          </span>
        </div>
        <CardDescription>{service.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">
          查看详情
        </Button>
      </CardContent>
    </Card>
  )
} 