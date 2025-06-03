"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { vectorDBAPI } from '@/lib/api/vector-db';
import {
  Database,
  Plus,
  Search,
  Filter,
  Star,
  ArrowUpRight,
  Building2,
  FileText,
  Shield,
  PieChart,
  TrendingUp
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

// 为知识库生成首字母头像的组件
const KnowledgeBaseAvatar = ({ title } : { title: string; }) => {
  const initial = title.charAt(0).toUpperCase();
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

// 图标映射
const iconMap = {
  FileText,
  Building2,
  Shield,
  PieChart,
  TrendingUp,
  Database
};

// 渲染图标的辅助函数
const renderIcon = (iconName: keyof typeof iconMap, size = 16) => {
  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent size={size} /> : <Database size={size} />;
};

// 本地知识库类型定义（兼容性）
interface LocalKnowledgeBase {
  id: number;
  title: string;
  description: string;
  type: string;
  size: string;
  vectors: string;
  iconName: keyof typeof iconMap;
  author: {
    name: string;
    handle: string;
    verified?: boolean;
  }
  createdAt?: string;
  updatedAt?: string;
}

export default function VectorDBPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [knowledgeBases, setKnowledgeBases] = useState<LocalKnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取知识库数据
  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await vectorDBAPI.getKnowledgeBases({
        search: searchTerm || undefined,
        type: activeCategory !== 'all' ? activeCategory : undefined,
        page: 1,
        limit: 20
      });

      // 转换 API 响应为本地格式
      const localKnowledgeBases: LocalKnowledgeBase[] = response.data.map(kb => ({
        id: kb.id,
        title: kb.title,
        description: kb.description,
        type: kb.type,
        size: kb.size,
        vectors: kb.vectors,
        iconName: (kb.iconName as keyof typeof iconMap) || 'Database',
        author: {
          name: kb.author.name,
          handle: kb.author.handle,
          verified: kb.author.verified
        },
        createdAt: kb.createdAt,
        updatedAt: kb.updatedAt
      }));

      setKnowledgeBases(localKnowledgeBases);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setKnowledgeBases([]);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  // 搜索和分类变化时重新获取数据
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchKnowledgeBases();
    }, 300); // 防抖处理

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeCategory]);

  return (
    <div className="flex flex-col from-slate-50 to-white min-h-screen px-6 lg:px-10 pb-16">
      {/* 页面标题区域 */}
      <div className="my-8 lg:my-12 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-800 relative inline-block">
          向量知识库
          <div className="absolute -top-4 -right-8 w-12 h-12 text-blue-500 opacity-40 rotate-12">
            <Database size={48} strokeWidth={1} />
          </div>
        </h1>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-5xl mx-auto w-full">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索知识库..."
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
            <span>创建知识库</span>
          </button>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="mb-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-wrap gap-2">
          {['all', 'business', 'compliance', 'risk', 'operation'].map(category => (
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
               category === 'business' ? '业务知识' :
               category === 'compliance' ? '合规规则' :
               category === 'risk' ? '风控规则' : '运营规则'}
            </button>
          ))}
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Shield className="text-red-500" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchKnowledgeBases} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            重试
          </button>
        </div>
      )}

      {/* 知识库卡片网格 */}
      {!loading && !error && knowledgeBases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {knowledgeBases.map((base) => (
            <div
              key={base.id}
              className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200 flex flex-col"
            >
              <div className="aspect-[16/9] relative bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                <div className="absolute inset-0 z-10">
                  <KnowledgeBaseAvatar title={base.title} />
                </div>

                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/70 to-transparent z-20">
                  <h3 className="text-white font-bold text-lg truncate pr-10">{base.title}</h3>
                </div>

                <div className="absolute top-0 right-0 p-2 z-20">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                    <Star size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-grow flex flex-col">
                <p className="text-gray-600 text-sm line-clamp-2 mb-3 flex-grow">
                  {base.description}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <div className="relative h-6 w-6 rounded-full overflow-hidden">
                    <div className="bg-gray-200 text-gray-700 w-full h-full flex items-center justify-center text-xs font-medium">
                      {base.author.name.charAt(0)}
                    </div>
                    {base.author.verified && (
                      <div className="absolute right-0 bottom-0 w-2 h-2 bg-blue-500 rounded-full ring-1 ring-white"></div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">{base.author.name}</span>
                </div>

                <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {renderIcon('Database')}
                      {base.size}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {renderIcon('FileText')}
                      {base.vectors} 向量
                    </span>
                  </div>
                  <Link
                    href={`#kb-${base.id}`}
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
      )}

      {/* 空状态 */}
      {!loading && !error && knowledgeBases.length === 0 && (
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">未找到匹配知识库</h3>
          <p className="text-gray-600">尝试调整搜索条件或创建新的知识库</p>
          <p className="text-gray-600 mb-4">请尝试使用不同的搜索词或浏览全部知识库</p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            查看所有知识库
          </button>
        </div>
      )}

      {/* 创建自定义知识库区域 */}
      <div className="mt-16 max-w-5xl mx-auto w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-900 mb-2">创建您自己的知识库</h2>
          <p className="text-gray-600">
            需要创建新的向量知识库？上传文档、代码或数据，我们将帮助您构建智能化的知识检索系统
          </p>
        </div>
        <button className="whitespace-nowrap px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={18} />
          创建知识库
        </button>
      </div>
    </div>
  );
}
