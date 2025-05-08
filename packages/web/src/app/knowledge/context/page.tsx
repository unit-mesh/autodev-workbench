"use client"

import React, { useState } from 'react';
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
  Calendar,
  FileText,
  Bug,
  GitBranch,
  Server,
  RefreshCw,
  Database,
  BookOpen,
} from 'lucide-react';

// 模拟平台数据
const platformData = [
  {
    id: 1,
    name: "Jira",
    description: "任务和项目管理平台",
    category: "project-management",
    icon: Calendar,
    aiCapabilities: [
      "自动任务分类与优先级排序",
      "智能工作量估算",
      "基于历史数据的交付日期预测"
    ],
    context: "负责任务跟踪、项目管理和敏捷开发流程",
    integrations: ["Confluence", "Bitbucket", "Jenkins"],
    apiEndpoint: "/api/jira",
    documentation: "https://docs.example.com/jira",
  },
  {
    id: 2,
    name: "Confluence",
    description: "团队协作与知识管理平台",
    category: "documentation",
    icon: FileText,
    aiCapabilities: [
      "内容智能分类与标签",
      "相关文档推荐",
      "文档质量与完整性评估"
    ],
    context: "团队知识库、设计文档和技术规范的中央存储",
    integrations: ["Jira", "Slack", "Microsoft Teams"],
    apiEndpoint: "/api/confluence",
    documentation: "https://docs.example.com/confluence",
  },
  {
    id: 3,
    name: "测试平台",
    description: "自动化测试管理系统",
    category: "testing",
    icon: Bug,
    aiCapabilities: [
      "测试用例自动生成",
      "缺陷根因分析",
      "测试覆盖率优化建议"
    ],
    context: "管理测试用例、执行自动化测试并追踪测试结果",
    integrations: ["Jira", "Jenkins", "Selenium"],
    apiEndpoint: "/api/test-platform",
    documentation: "https://docs.example.com/test-platform",
  },
  {
    id: 4,
    name: "Git仓库服务",
    description: "代码版本控制与协作平台",
    category: "source-control",
    icon: GitBranch,
    aiCapabilities: [
      "代码审查辅助",
      "代码质量分析",
      "潜在问题及安全漏洞检测"
    ],
    context: "源代码管理、版本控制和代码审查",
    integrations: ["Jenkins", "Jira", "SonarQube"],
    apiEndpoint: "/api/git",
    documentation: "https://docs.example.com/git",
  },
  {
    id: 5,
    name: "CI/CD管道",
    description: "持续集成与持续部署平台",
    category: "deployment",
    icon: RefreshCw,
    aiCapabilities: [
      "构建失败原因分析",
      "部署风险评估",
      "性能瓶颈识别"
    ],
    context: "自动构建、测试和部署应用程序",
    integrations: ["Git", "Docker", "Kubernetes", "测试平台"],
    apiEndpoint: "/api/cicd",
    documentation: "https://docs.example.com/cicd",
  },
  {
    id: 6,
    name: "API网关",
    description: "API管理与监控平台",
    category: "infrastructure",
    icon: Server,
    aiCapabilities: [
      "API使用模式分析",
      "API性能优化建议",
      "异常流量检测"
    ],
    context: "管理、监控和保护API调用",
    integrations: ["监控系统", "日志分析", "身份验证服务"],
    apiEndpoint: "/api/gateway",
    documentation: "https://docs.example.com/api-gateway",
  },
  {
    id: 7,
    name: "知识库",
    description: "企业内部知识管理系统",
    category: "documentation",
    icon: BookOpen,
    aiCapabilities: [
      "智能搜索与问答",
      "知识图谱构建",
      "内容推荐"
    ],
    context: "存储和组织企业知识、最佳实践和解决方案",
    integrations: ["Confluence", "Teams", "Slack"],
    apiEndpoint: "/api/knowledge-base",
    documentation: "https://docs.example.com/knowledge-base",
  },
  {
    id: 8,
    name: "监控系统",
    description: "应用与基础设施监控平台",
    category: "infrastructure",
    icon: Database,
    aiCapabilities: [
      "异常检测与根因分析",
      "预测性告警",
      "资源使用优化建议"
    ],
    context: "实时监控应用程序性能和基础设施健康状况",
    integrations: ["日志系统", "CI/CD管道", "通知系统"],
    apiEndpoint: "/api/monitoring",
    documentation: "https://docs.example.com/monitoring",
  },
];

// 平台分类
const platformCategories = [
  { id: 'all', name: '全部平台' },
  { id: 'project-management', name: '项目管理' },
  { id: 'documentation', name: '文档与知识' },
  { id: 'testing', name: '测试工具' },
  { id: 'source-control', name: '源代码管理' },
  { id: 'deployment', name: '部署工具' },
  { id: 'infrastructure', name: '基础设施' },
];

export default function PlatformContextPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // 过滤平台
  const filteredPlatforms = platformData.filter(platform => {
    const matchesSearch = platform.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         platform.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || platform.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">平台上下文</h1>
          <p className="text-gray-500 mt-2">
            查看内部所有平台、AI能力与上下文信息，支持跨平台集成与智能工作流
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="搜索平台..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {platformCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <Card key={platform.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-md">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>{platform.name}</CardTitle>
                    <CardDescription>{platform.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">平台上下文</h4>
                  <p className="text-sm">{platform.context}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">AI 能力</h4>
                  <ul className="space-y-1">
                    {platform.aiCapabilities.map((capability, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 mr-2"></span>
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">集成平台</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {platform.integrations.map((integration, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="text-xs">
                    查看API文档
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    访问平台
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredPlatforms.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">没有找到匹配的平台</h3>
          <p className="text-gray-500 mt-2">尝试更改搜索条件或选择不同的分类</p>
        </div>
      )}
    </div>
  );
}
