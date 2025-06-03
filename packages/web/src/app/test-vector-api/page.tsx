"use client"

import React, { useState } from 'react';
import { vectorDBAPI } from '@/lib/api/vector-db';
import type { KnowledgeBase, VectorSearchResult } from '@/types/vector-db';
import { Search, Database, Loader2 } from 'lucide-react';

export default function TestVectorAPIPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 测试获取知识库列表
  const testGetKnowledgeBases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vectorDBAPI.getKnowledgeBases({
        page: 1,
        limit: 10
      });
      setKnowledgeBases(response.data);
      console.log('知识库列表:', response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取知识库失败');
      console.error('获取知识库失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 测试搜索功能
  const testSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await vectorDBAPI.searchVectors({
        query: searchQuery,
        limit: 5,
        threshold: 0.7
      });
      setSearchResults(response.results);
      console.log('搜索结果:', response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
      console.error('搜索失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 测试创建知识库
  const testCreateKnowledgeBase = async () => {
    try {
      setLoading(true);
      setError(null);
      const newKB = await vectorDBAPI.createKnowledgeBase({
        title: `测试知识库 ${Date.now()}`,
        description: '这是一个通过 API 创建的测试知识库',
        type: 'business',
        iconName: 'Database'
      });
      console.log('创建的知识库:', newKB);
      // 重新获取列表
      await testGetKnowledgeBases();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建知识库失败');
      console.error('创建知识库失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Database className="text-blue-500" />
          向量知识库 API 测试
        </h1>
        <p className="text-gray-600">
          测试向量知识库的 API 接口功能
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">错误: {error}</p>
        </div>
      )}

      {/* API 测试按钮 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={testGetKnowledgeBases}
          disabled={loading}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
          获取知识库列表
        </button>
        
        <button
          onClick={testCreateKnowledgeBase}
          disabled={loading}
          className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          创建测试知识库
        </button>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入搜索关键词..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && testSearch()}
          />
          <button
            onClick={testSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* 知识库列表 */}
      {knowledgeBases.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">知识库列表 ({knowledgeBases.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledgeBases.map((kb) => (
              <div key={kb.id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{kb.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{kb.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>类型: {kb.type}</span>
                  <span>大小: {kb.size}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>向量: {kb.vectors}</span>
                  <span>作者: {kb.author.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            搜索结果 "{searchQuery}" ({searchResults.length})
          </h2>
          <div className="space-y-4">
            {searchResults.map((result) => (
              <div key={result.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-500">
                    相似度: {(result.similarity * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">
                    来源: {result.metadata.source}
                  </span>
                </div>
                <p className="text-gray-800">{result.content}</p>
                <div className="mt-2 text-xs text-gray-500">
                  章节: {result.metadata.chapter} | 页码: {result.metadata.page}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API 文档 */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API 端点</h2>
        <div className="space-y-2 text-sm">
          <div><code className="bg-gray-200 px-2 py-1 rounded">GET /api/vector-db</code> - 获取知识库列表</div>
          <div><code className="bg-gray-200 px-2 py-1 rounded">POST /api/vector-db</code> - 创建知识库</div>
          <div><code className="bg-gray-200 px-2 py-1 rounded">POST /api/vector-db/search</code> - 向量搜索</div>
        </div>
      </div>
    </div>
  );
}