"use client"

import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Code,
  Database,
  Globe,
  Settings,
  Server,
  MessageSquare,
  LayoutGrid,
  Copy,
  Wand2,
} from 'lucide-react';

// 模拟API数据
const mockApis = [
  {
    id: 1,
    name: "用户认证API",
    description: "处理用户登录、注册和权限验证的API集合",
    category: "auth",
    version: "v2.1.0",
    endpoint: "/api/auth",
    documentation: "https://docs.example.com/auth",
    usageCount: 128,
    lastUpdated: "2023-09-15",
  },
  {
    id: 2,
    name: "内容管理API",
    description: "提供内容创建、更新、发布的REST接口",
    category: "content",
    version: "v1.5.2",
    endpoint: "/api/content",
    documentation: "https://docs.example.com/content",
    usageCount: 95,
    lastUpdated: "2023-10-02",
  },
  {
    id: 3,
    name: "数据统计API",
    description: "获取系统各类数据统计指标的接口集合",
    category: "analytics",
    version: "v3.0.1",
    endpoint: "/api/stats",
    documentation: "https://docs.example.com/stats",
    usageCount: 76,
    lastUpdated: "2023-08-20",
  },
  {
    id: 4,
    name: "支付处理API",
    description: "处理各类支付请求和交易的安全接口",
    category: "payment",
    version: "v2.3.0",
    endpoint: "/api/payment",
    documentation: "https://docs.example.com/payment",
    usageCount: 64,
    lastUpdated: "2023-09-28",
  },
  {
    id: 5,
    name: "通知服务API",
    description: "发送邮件、短信和应用内通知的API",
    category: "notification",
    version: "v1.2.0",
    endpoint: "/api/notify",
    documentation: "https://docs.example.com/notify",
    usageCount: 112,
    lastUpdated: "2023-10-10",
  },
];

// 模拟组件数据
const mockComponents = [
  {
    id: 1,
    name: "数据表格组件",
    description: "高性能数据表格，支持排序、筛选和分页功能",
    category: "data",
    version: "v3.2.1",
    usageCount: 145,
    lastUpdated: "2023-09-25",
    preview: "https://placeholder.com/300x200",
  },
  {
    id: 2,
    name: "图表可视化组件",
    description: "支持多种数据可视化图表，包括折线图、柱状图和饼图",
    category: "visualization",
    version: "v2.0.3",
    usageCount: 98,
    lastUpdated: "2023-10-05",
    preview: "https://placeholder.com/300x200",
  },
  {
    id: 3,
    name: "表单构建器",
    description: "动态表单构建和验证组件，支持多种输入类型",
    category: "form",
    version: "v1.8.0",
    usageCount: 87,
    lastUpdated: "2023-08-15",
    preview: "https://placeholder.com/300x200",
  },
  {
    id: 4,
    name: "文件上传组件",
    description: "支持拖放、多文件上传和进度显示的组件",
    category: "file",
    version: "v2.4.1",
    usageCount: 76,
    lastUpdated: "2023-09-18",
    preview: "https://placeholder.com/300x200",
  },
  {
    id: 5,
    name: "通知提醒组件",
    description: "可自定义的全局通知、提示和确认对话框组件",
    category: "feedback",
    version: "v1.5.2",
    usageCount: 124,
    lastUpdated: "2023-10-08",
    preview: "https://placeholder.com/300x200",
  },
];

// API分类
const apiCategories = [
  { id: 'all', name: '全部' },
  { id: 'auth', name: '认证与授权' },
  { id: 'content', name: '内容管理' },
  { id: 'analytics', name: '数据分析' },
  { id: 'payment', name: '支付服务' },
  { id: 'notification', name: '通知服务' },
];

// 组件分类
const componentCategories = [
  { id: 'all', name: '全部' },
  { id: 'data', name: '数据展示' },
  { id: 'visualization', name: '数据可视化' },
  { id: 'form', name: '表单控件' },
  { id: 'file', name: '文件处理' },
  { id: 'feedback', name: '反馈组件' },
];

// 图标映射
const categoryIconMap = {
  auth: Settings,
  content: LayoutGrid,
  analytics: Database,
  payment: Globe,
  notification: MessageSquare,
  data: Database,
  visualization: LayoutGrid,
  form: Settings,
  file: Copy,
  feedback: MessageSquare,
  default: Server
};

export default function FrameworkPage() {
  const [activeTab, setActiveTab] = useState<string>("apis");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedApiCategory, setSelectedApiCategory] = useState<string>("all");
  const [selectedComponentCategory, setSelectedComponentCategory] = useState<string>("all");

  // 过滤API数据
  const filteredApis = mockApis.filter((api) => {
    const matchesSearch = api.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         api.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedApiCategory === "all" || api.category === selectedApiCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 过滤组件数据
  const filteredComponents = mockComponents.filter((component) => {
    const matchesSearch = component.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         component.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedComponentCategory === "all" || component.category === selectedComponentCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 获取图标
  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIconMap[category as keyof typeof categoryIconMap] || categoryIconMap.default;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">组件 & API 框架</h1>
        <Button className="flex items-center gap-2" variant="default">
          <Wand2 className="h-4 w-4" />
          <span>AI 生成</span>
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索 API 或组件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {activeTab === "apis" ? (
            <Select value={selectedApiCategory} onValueChange={setSelectedApiCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {apiCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={selectedComponentCategory} onValueChange={setSelectedComponentCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {componentCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="apis" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span>API 市场</span>
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span>组件库</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApis.map((api) => (
              <Card key={api.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {getCategoryIcon(api.category)}
                      <CardTitle className="ml-2 text-xl">{api.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{api.version}</Badge>
                  </div>
                  <CardDescription className="mt-2">{api.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">端点: </span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{api.endpoint}</code>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>使用次数: {api.usageCount}</span>
                      <span>更新时间: {api.lastUpdated}</span>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm" className="mr-2">查看文档</Button>
                      <Button size="sm">集成</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredApis.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无匹配的API</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredComponents.map((component) => (
              <Card key={component.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gray-100 h-48 flex items-center justify-center">
                  <span className="text-gray-400">组件预览</span>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {getCategoryIcon(component.category)}
                      <CardTitle className="ml-2 text-xl">{component.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{component.version}</Badge>
                  </div>
                  <CardDescription className="mt-2">{component.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>使用次数: {component.usageCount}</span>
                      <span>更新时间: {component.lastUpdated}</span>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm" className="mr-2">查看文档</Button>
                      <Button size="sm">使用组件</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredComponents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无匹配的组件</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* AI 生成对话框 */}
      <div className="fixed bottom-8 right-8">
        <Button 
          size="lg"
          className="rounded-full flex items-center gap-2 shadow-lg"
        >
          <Wand2 className="h-5 w-5" />
          <span>AI 助手</span>
        </Button>
      </div>
    </div>
  );
}
