"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  Brain,
  Wrench,
  BarChart3,
  BookOpen,
} from 'lucide-react';

const navigationItems = [
  {
    section: '平台知识',
    icon: Building2,
    items: [
      { name: '服务目录', href: '/platform/service-catalog' },
      { name: '平台上下文', href: '/platform/context' },
      { name: '组件 & APIs', href: '/platform/framework' },
      { name: '技术文档', href: '/platform/techdocs' },
      { name: '规范中心', href: '/platform/coding-standards' },
    ],
  },
  {
    section: '智能中枢',
    icon: Brain,
    items: [
      { name: '智能体', href: '/ai-hub/agents' },
      { name: '项目规则', href: '/ai-hub/rules' },
      { name: '向量知识库', href: '/ai-hub/vector-db' },
    ],
  },
  {
    section: 'AI 工具',
    icon: Wrench,
    items: [
      { name: '后端应用生成', href: '/ai-tools/golden-path' },
      { name: '前端 UI 页面', href: '/ai-tools/frontend' },
    ],
  },
  {
    section: '度量分析',
    icon: BarChart3,
    items: [
      { name: '洞察分析', href: '/metrics/insights' },
    ],
  },
  {
    section: '文档中心',
    icon: BookOpen,
    items: [
      { name: '快速开始', href: '/docs/quickstart' },
      { name: 'API 文档', href: '/docs/api' },
      { name: '常见问题（FAQ）', href: '/docs/faq' },
    ],
  },
];

export function SideNavigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="px-4 py-6">
        {navigationItems.map((section, sectionIndex) => {
          const isSectionActive = section.items.some(item => pathname === item.href);

          return (
            <div key={sectionIndex} className="mb-6">
              <div className={cn(
                "flex items-center px-3 mb-2",
                isSectionActive && "text-blue-800"
              )}>
                <section.icon className={cn(
                  "h-5 w-5 mr-2",
                  isSectionActive ? "text-gray-700" : "text-gray-500"
                )} />
                <h3 className={cn(
                  "text-md font-semibold",
                  isSectionActive ? "text-blue-800" : "text-gray-600"
                )}>{section.section}</h3>
              </div>
              <div className="ml-2">
                {section.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md',
                      pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

