"use client"

import React, { useState } from "react"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import CodeMirror from "@uiw/react-codemirror"
import { markdown } from "@codemirror/lang-markdown"

const statusMapping = {
  "草稿": "DRAFT",
  "已发布": "PUBLISHED",
  "已归档": "ARCHIVED"
};

enum GuidelineStatus {
  DRAFT = "草稿",
  PUBLISHED = "已发布",
  ARCHIVED = "已归档",
}

export interface GuidelineCreateModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GuidelineCreateModal: React.FC<GuidelineCreateModalProps> = ({ projectId, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'frontend',
    status: GuidelineStatus.DRAFT,
    content: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Convert to API format
      const apiData = {
        ...formData,
        projectId: projectId,
        status: statusMapping[formData.status as keyof typeof statusMapping],
        category: JSON.stringify({ subcategory: formData.category }),
      };

      const response = await fetch('/api/guideline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error('创建规范失败');
      }

      toast.success('规范文档已成功创建');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('创建规范失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              创建规范文档
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={24}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="规范标题"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="简短描述"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类别
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="frontend">前端</option>
                <option value="backend">后端</option>
                <option value="architecture">架构</option>
                <option value="systems">系统开发</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as GuidelineStatus)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {Object.values(GuidelineStatus).map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容 (Markdown 格式)
            </label>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <CodeMirror
                value={formData.content}
                height="400px"
                extensions={[markdown()]}
                onChange={(value) => handleChange('content', value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
              创建
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
