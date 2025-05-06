"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Brain,
  Users,
  Wrench,
  BarChart3,
  BookOpen,
} from 'lucide-react';

const navigationStructure = {
  platform: {
    name: '平台知识',
    icon: Building2,
    items: [
      {
        name: '服务目录 & 所有权',
        items: [
          { name: '服务列表', href: '/platform/services' },
          { name: '所属团队视图', href: '/platform/team-view' },
        ],
      },
      {
        name: 'API 模式与契约',
        items: [
          { name: 'API 浏览器', href: '/platform/api-browser' },
          { name: 'API 合规检查', href: '/platform/api-compliance' },
        ],
      },
      {
        name: '基础设施配置',
        items: [
          { name: 'IaC 模块管理', href: '/platform/iac' },
          { name: '环境模板配置', href: '/platform/environment-templates' },
        ],
      },
      {
        name: 'CI/CD & 黄金路径',
        items: [
          { name: '流水线模板', href: '/platform/pipeline-templates' },
          { name: '项目初始化器', href: '/platform/project-initializer' },
        ],
      },
      {
        name: '知识文档 & 标准',
        items: [
          { name: 'TechDocs 集成', href: '/platform/techdocs' },
          { name: '编码规范中心', href: '/platform/coding-standards' },
        ],
      },
    ],
  },
  aiHub: {
    name: '智能中枢',
    icon: Brain,
    items: [
      { name: '智能体注册与管理', href: '/ai-hub/agents' },
      {
        name: '上下文服务配置',
        items: [
          { name: '服务目录上下文', href: '/ai-hub/context/service-catalog' },
          { name: 'API 契约上下文', href: '/ai-hub/context/api-contracts' },
        ],
      },
      { name: '策略与权限控制', href: '/ai-hub/policies' },
      { name: '向量数据库接入', href: '/ai-hub/vector-db' },
    ],
  },
  workPatterns: {
    name: '工作方式',
    icon: Users,
    items: [
      {
        name: 'Team AI 面板',
        items: [
          { name: '当前团队对话协同空间', href: '/work-patterns/team-ai' },
          { name: '任务自动化记录', href: '/work-patterns/automation-logs' },
        ],
      },
      {
        name: '生命周期问答',
        items: [
          { name: '问答历史', href: '/work-patterns/qa-history' },
          { name: 'CI/CD & 异常问题入口', href: '/work-patterns/issues' },
        ],
      },
      {
        name: '知识导航视图',
        items: [
          { name: '工件追踪关系图', href: '/work-patterns/artifact-tracking' },
          { name: '数字孪生视角', href: '/work-patterns/digital-twin' },
        ],
      },
    ],
  },
  aiTools: {
    name: 'AI 工具',
    icon: Wrench,
    items: [
      {
        name: '低代码设计器',
        items: [
          { name: 'Figma → Code 实验室', href: '/ai-tools/figma-code' },
        ],
      },
      { name: '黄金路径创建器', href: '/ai-tools/golden-path' },
      { name: 'IDE 插件配置', href: '/ai-tools/ide-plugins' },
      { name: 'CLI 工具下载', href: '/ai-tools/cli' },
    ],
  },
  metrics: {
    name: '度量分析',
    icon: BarChart3,
    items: [
      {
        name: 'AI 使用情况',
        items: [
          { name: '响应质量', href: '/metrics/ai-quality' },
          { name: '调用次数', href: '/metrics/ai-usage' },
        ],
      },
      {
        name: '研发生产力',
        items: [
          { name: 'DORA 指标面板', href: '/metrics/dora' },
          { name: 'DevEx 问卷结果', href: '/metrics/devex' },
        ],
      },
      { name: '策略合规报告', href: '/metrics/compliance' },
    ],
  },
  docs: {
    name: '文档中心',
    icon: BookOpen,
    items: [
      { name: '快速开始', href: '/docs/quickstart' },
      { name: '架构概览', href: '/docs/architecture' },
      { name: 'Agent 开发指南', href: '/docs/agent-development' },
      { name: 'API 文档', href: '/docs/api' },
      { name: '常见问题（FAQ）', href: '/docs/faq' },
    ],
  },
};

type NavigationItem = {
  name: string;
  href?: string;
  items?: NavigationItem[];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type NavigationSection = {
  name: string;
  icon: React.ElementType;
  items: NavigationItem[];
};

function NavigationItem({ item, level = 0 }: { item: NavigationItem; level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const hasChildren = item.items && item.items.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center px-3 py-2 text-sm font-medium rounded-md',
          pathname === item.href
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          level > 0 && 'pl-6'
        )}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center flex-1"
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 mr-2" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2" />
            )}
            {item.name}
          </button>
        ) : (
          <Link href={item.href || '#'} className="flex items-center flex-1">
            {item.name}
          </Link>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="mt-1">
          {item.items?.map((child, index) => (
            <NavigationItem key={index} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SideNavigation() {
  // const strings = Object.keys(navigationStructure);
  const strings: string[] = [];
  const initialExpandedState = strings.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialExpandedState);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <nav className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="px-4 py-6">
        {Object.entries(navigationStructure).map(([key, section]) => (
          <div key={key} className="mb-6">
            <div
              className="flex items-center px-3 mb-2 cursor-pointer"
              onClick={() => toggleSection(key)}
            >
              {expandedSections[key] ? (
                <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
              )}
              <section.icon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-sm font-semibold text-gray-900">{section.name}</h3>
            </div>
            {expandedSections[key] && (
              <div className="ml-2">
                {section.items.map((item, index) => (
                  <NavigationItem key={index} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

