"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  Brain,
  Wrench,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

const navigationItems = [
  {
    name: 'AI 工具',
    icon: Wrench,
    items: [
      { name: '需求转换', href: '/ai-tools/requirements' },
      { name: '自动开发驾驶舱', href: '/cockpit' },
      { name: '后端应用生成', href: '/ai-tools/golden-path' },
      { name: '前端 UI 页面', href: '/ai-tools/frontend' },
    ],
  },
  {
    name: '知识中枢',
    icon: Brain,
    items: [
      { name: '平台上下文', href: '/knowledge/context' },
      { name: '知识链接', href: '/knowledge/concept-linking' },
    ],
  },
  {
    name: '平台知识',
    icon: Building2,
    items: [
      { name: '服务目录', href: '/platform/service-catalog' },
      { name: '组件 & APIs', href: '/platform/framework' },
      { name: '技术文档', href: '/platform/tech-docs' },
      { name: '规范中心', href: '/platform/guideline' },
    ],
  },
  {
    name: '智能中枢',
    icon: Brain,
    items: [
      { name: '智能体', href: '/ai-hub/agents' },
      { name: '项目规则', href: '/ai-hub/rules' },
      { name: '向量知识库', href: '/ai-hub/vector-db' },
    ],
  },
  {
    name: '度量分析',
    icon: BarChart3,
    items: [
      { name: '洞察分析', href: '/metrics/insights' },
    ],
  },
  {
    name: '文档中心',
    icon: BookOpen,
    items: [
      { name: '快速开始', href: '/docs/quickstart' },
      { name: 'API 文档', href: '/docs/api' },
    ],
  },
];

export function SideNavigation() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [expandedSection, setExpandedSection] = useState<number | null | -1>(-1);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    if (!collapsed) {
      setExpandedSection(null);
    } else {
      // 展开侧边栏时将所有菜单项展开
      setExpandedSection(-1);
    }
  };

  const toggleSection = (index: number) => {
    if (collapsed) {
      setCollapsed(false);
      setExpandedSection(index);
    } else {
      // 如果所有菜单都展开（-1），点击某个菜单后只显示该菜单
      if (expandedSection === -1) {
        setExpandedSection(index);
      }
      // 如果当前点击的菜单已展开，则全部展开
      else if (expandedSection === index) {
        setExpandedSection(-1);
      }
      // 否则展开点击的菜单
      else {
        setExpandedSection(index);
      }
    }
  };

  return (
    <nav className={cn(
      "bg-white border-r border-gray-200 h-screen overflow-y-auto flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-48"
    )}>
      <div className="flex-1 px-2 py-6">
        {navigationItems.map((section, sectionIndex) => {
          const isSectionActive = section.items.some(item => pathname === item.href);
          // 当 expandedSection 为 -1 时，所有菜单展开，或者当前菜单被选中
          const isExpanded = expandedSection === -1 || expandedSection === sectionIndex;

          return (
            <div key={sectionIndex} className="mb-4">
              <div
                className={cn(
                  "flex items-center px-3 py-2 rounded-md cursor-pointer",
                  isSectionActive ? "bg-gray-100 text-blue-800" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => toggleSection(sectionIndex)}
              >
                <section.icon className={cn(
                  "h-5 w-5",
                  isSectionActive ? "text-blue-700" : "text-gray-500"
                )} />

                {!collapsed && (
                  <>
                    <h3 className={cn(
                      "text-sm font-medium ml-2 flex-1",
                      isSectionActive ? "text-blue-800" : "text-gray-600"
                    )}>
                      {section.name}
                    </h3>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </>
                )}
              </div>

              {!collapsed && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {section &&section.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      href={item.href}
                      className={cn(
                        'block px-3 py-2 text-sm font-medium rounded-md',
                        pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={toggleSidebar}
        className="mx-auto mb-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </nav>
  );
}

