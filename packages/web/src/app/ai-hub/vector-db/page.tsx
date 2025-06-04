"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { KnowledgeBase, KnowledgeBaseListResponse } from '@/types/vector-db';
import {
  Database,
  Plus,
  Search,
  Building2,
  FileText,
  Shield,
  PieChart,
  TrendingUp,
  Loader2
} from 'lucide-react';

// 图标映射
const iconMap = {
  FileText,
  Building2,
  Shield,
  PieChart,
  TrendingUp,
  Database
};

// 颜色组合
const colorCombinations = [
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-indigo-500', text: 'text-white' },
  { bg: 'bg-purple-500', text: 'text-white' },
  { bg: 'bg-pink-500', text: 'text-white' },
  { bg: 'bg-red-500', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-green-500', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' },
];

// 知识库头像组件
const KnowledgeBaseAvatar = ({ title }: { title: string }) => {
  const initial = title.charAt(0).toUpperCase();
  const colorIndex = initial.charCodeAt(0) % colorCombinations.length;
  const { bg, text } = colorCombinations[colorIndex];

  return (
    <div className={cn(
      "w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0",
      bg,
      text
    )}>
      {initial}
    </div>
  );
};

// 知识库卡片组件
const KnowledgeBaseCard = ({ base }: { base: KnowledgeBase }) => {
  const IconComponent = iconMap[base.iconName as keyof typeof iconMap] || Database;

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200 flex flex-col">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <KnowledgeBaseAvatar title={base.title} />
          <div className="flex-1 min-w-0">
            <Link href={`/ai-hub/vector-db/${base.id}`} className="block group-hover:text-blue-600 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{base.title}</h3>
            </Link>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{base.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <IconComponent className="w-3 h-3 mr-1" />
            {base.type}
          </div>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {base.size}
          </div>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {base.vectors} 向量
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
              <img 
                src={base.author.avatar} 
                alt={base.author.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://via.placeholder.com/24';
                }}
              />
            </div>
            <span className="ml-2 text-xs text-gray-500">{base.author.name}</span>
          </div>
        </div>
      </div>

      <Link href={`/ai-hub/vector-db/${base.id}`} className="absolute inset-0">
        <span className="sr-only">查看详情</span>
      </Link>
    </div>
  );
};

export default function VectorDBPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取知识库列表
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vector-db');
        
        if (!response.ok) {
          throw new Error(`Error fetching knowledge bases: ${response.status}`);
        }
        
        const data: KnowledgeBaseListResponse = await response.json();
        setKnowledgeBases(data.data);
      } catch (err) {
        console.error('Failed to fetch knowledge bases:', err);
        setError(err instanceof Error ? err.message : '获取知识库列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledgeBases();
  }, []);

  // 搜索筛选
  const filteredBases = knowledgeBases.filter(base =>
    base.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    base.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-500">加载知识库...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium text-red-800 mb-2">获取知识库失败</h3>
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-6 lg:px-10 pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-8 border-b border-gray-200 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知识库</h1>
          <p className="mt-1 text-gray-500">浏览和搜索向量化知识库，连接到您的AI应用</p>
        </div>
        <Link 
          href="/ai-hub/vector-db/create" 
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          创建知识库
        </Link>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="搜索知识库..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredBases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Database className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">未找到知识库</h3>
          <p className="mt-1 text-gray-500">尝试其他搜索词或创建新的知识库</p>
          <Link 
            href="/ai-hub/vector-db/create" 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
          >
            <Plus className="mr-2 h-4 w-4" />
            创建知识库
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBases.map((base) => (
            <KnowledgeBaseCard key={base.id} base={base} />
          ))}
        </div>
      )}
    </div>
  );
}