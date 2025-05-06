"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Package,
  Plus,
  Search,
  Filter,
  Terminal,
  Star,
  ArrowUpRight,
  Server,
  GitBranch,
  Database,
  Shield
} from 'lucide-react';

// 预定义的颜色组合（背景色和文字色）
const colorCombinations = [
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-indigo-500', text: 'text-white' },
  { bg: 'bg-purple-500', text: 'text-white' },
  { bg: 'bg-pink-500', text: 'text-white' },
  { bg: 'bg-red-500', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-yellow-500', text: 'text-black' },
  { bg: 'bg-green-500', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-cyan-500', text: 'text-white' },
];

// 为工具生成首字母头像的组件
const ToolInitialAvatar = ({ title } : { title: string; }) => {
  const initial = title.charAt(0).toUpperCase();

  // 使用名称的首字母的 charCode 作为颜色选择的基础，确保同一工具总是获得相同颜色
  const colorIndex = initial.charCodeAt(0) % colorCombinations.length;
  const { bg, text } = colorCombinations[colorIndex];

  return (
    <div className={cn(
      "flex items-center justify-center w-full h-full",
      bg,
      text,
      "font-bold text-4xl"
    )}>
      {initial}
    </div>
  );
};

// 模拟智能体数据 - 实际项目中可能从API获取
const mockAgents = [
  {
    id: 1,
    title: 'GitLab Agent',
    description: '自动化管理代码仓库、合并请求和CI/CD管道的智能智能体',
    type: 'devops',
    image: '/images/agents/gitlab.jpg',
  },
  {
    id: 2,
    title: 'Jira Agent',
    description: '管理任务、敏捷开发流程和项目跟踪',
    type: 'devops',
    image: '/images/agents/jira.jpg',
  },
  {
    id: 3,
    title: 'Docker Agent',
    description: '帮助创建、部署和管理容器化应用程序',
    type: 'development',
    image: '/images/agents/docker.jpg',
  },
  {
    id: 4,
    title: 'Postman Agent',
    description: 'API测试和开发助手，简化API管理流程',
    type: 'development',
    image: '/images/agents/postman.jpg',
  },
  {
    id: 5,
    title: 'Jenkins Agent',
    description: '自动化构建、测试和部署流程',
    type: 'devops',
    author: {
      name: 'Jenkins',
      handle: '@jenkins',
      avatar: '/images/avatars/jenkins.png',
      verified: true
    },
    image: '/images/agents/jenkins.jpg',
  },
  {
    id: 6,
    title: 'Kubernetes Agent',
    description: '简化容器编排和管理，自动处理扩缩容和部署',
    type: 'devops',
    author: {
      name: 'K8s',
      handle: '@kubernetes',
      avatar: '/images/avatars/kubernetes.png',
      verified: true
    },
    image: '/images/agents/kubernetes.jpg',
  },
  {
    id: 7,
    title: 'Grafana Agent',
    description: '数据可视化和监控解决方案，自动生成仪表板',
    type: 'monitoring',
    image: '/images/agents/grafana.jpg',
  },
  {
    id: 8,
    title: 'SonarQube Agent',
    description: '代码质量和安全性分析，提供改进建议',
    type: 'security',
    image: '/images/agents/sonarqube.jpg',
  },
];

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // 筛选后的智能体
  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || agent.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col bg-gradient-to-b from-slate-50 to-white min-h-screen px-6 lg:px-10 pb-16">
      {/* 页面标题区域 */}
      <div className="my-8 lg:my-12 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-800 relative inline-block">
          开发工具智能体
          <div className="absolute -top-4 -right-8 w-12 h-12 text-blue-500 opacity-40 rotate-12">
            <Terminal size={48} strokeWidth={1} />
          </div>
        </h1>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-5xl mx-auto w-full">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索智能体..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            <span>筛选</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            <span>创建智能体</span>
          </button>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="mb-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-wrap gap-2">
          {['all', 'devops', 'development', 'monitoring', 'security', 'internal'].map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                activeCategory === category
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-gray-100 text-gray-700 border border-transparent hover:bg-gray-200"
              )}
            >
              {category === 'all' ? '全部' :
               category === 'devops' ? 'DevOps工具' :
               category === 'development' ? '开发工具' :
               category === 'monitoring' ? '监控工具' :
               category === 'security' ? '安全工具' : '内部工具'}
            </button>
          ))}
        </div>
      </div>

      {/* 智能体卡片网格 - 使用首字母图标代替图片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200 flex flex-col"
          >
            <div className="aspect-[16/9] relative bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
              {/* 使用首字母组件替代图片 */}
              <div className="absolute inset-0 z-10">
                <ToolInitialAvatar title={agent.title} />
              </div>

              {/* 工具名称覆盖在首字母上 */}
              <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/70 to-transparent z-20">
                <h3 className="text-white font-bold text-lg truncate pr-10">{agent.title}</h3>
              </div>

              <div className="absolute top-0 right-0 p-2 z-20">
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                  <Star size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-grow flex flex-col">
              <p className="text-gray-600 text-sm line-clamp-2 mb-3 flex-grow">
                {agent.description || '这个智能体帮助自动化开发和部署流程，提高团队工作效率。'}
              </p>

              {agent.author && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative h-6 w-6 rounded-full overflow-hidden">
                    {/* 作者头像也可以使用首字母替代 */}
                    <div className={`bg-gray-200 text-gray-700 w-full h-full flex items-center justify-center text-xs font-medium`}>
                      {agent.author.name.charAt(0)}
                    </div>
                    {agent.author.verified && (
                      <div className="absolute right-0 bottom-0 w-2 h-2 bg-blue-500 rounded-full ring-1 ring-white"></div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">{agent.author.name}</span>
                </div>
              )}

              <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  {agent.type === 'devops' ? <GitBranch size={14} /> :
                   agent.type === 'development' ? <Package size={14} /> :
                   agent.type === 'monitoring' ? <Server size={14} /> :
                   agent.type === 'security' ? <Shield size={14} /> :
                   <Database size={14} />}
                  {agent.type === 'devops' ? 'DevOps工具' :
                   agent.type === 'development' ? '开发工具' :
                   agent.type === 'monitoring' ? '监控工具' :
                   agent.type === 'security' ? '安全工具' : '内部工具'}
                </span>
                <Link
                  href={`#agent-${agent.id}`}
                  className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
                >
                  查看详情
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">未找到匹配智能体</h3>
          <p className="text-gray-600 mb-4">请尝试使用不同的搜索词或浏览全部智能体</p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            查看所有智能体
          </button>
        </div>
      )}

      {/* 创建自定义智能体区域 */}
      <div className="mt-16 max-w-5xl mx-auto w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-900 mb-2">创建您自己的工具智能体</h2>
          <p className="text-gray-600">
            需要集成更多工具？创建自定义智能体以自动化您的开发流程并提高团队效率
          </p>
        </div>
        <button className="whitespace-nowrap px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={18} />
          创建自定义智能体
        </button>
      </div>
    </div>
  );
}
