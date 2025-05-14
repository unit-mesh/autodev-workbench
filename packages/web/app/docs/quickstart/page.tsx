"use client"

import React from 'react';
import { ArrowRight, Terminal, Code, BookOpen, BarChart3, Package } from 'lucide-react';

export default function QuickStartPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">快速开始指南</h1>

      <div className="space-y-8">
        {/* 项目概述 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">项目概述</h2>
          <p className="text-gray-600 mb-4">
            AutoDev Workbench 是一个为开发团队提供统一平台的解决方案，旨在通过 AI 技术提升开发效率和质量。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <Code className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-medium">AI 驱动开发</h3>
              </div>
              <p className="text-sm text-gray-600">利用先进的 AI 工具和模型辅助编码、调试和问题解决</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-medium">知识管理</h3>
              </div>
              <p className="text-sm text-gray-600">集中管理和组织开发知识、模式和最佳实践</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-medium">工作流自动化</h3>
              </div>
              <p className="text-sm text-gray-600">通过智能自动化和模式识别简化开发流程</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-medium">组件市场</h3>
              </div>
              <p className="text-sm text-gray-600">访问可重用组件和库的市场，加速开发</p>
            </div>
          </div>
        </section>

        {/* 技术栈 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">技术栈</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="space-y-2">
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>前端：Next.js with TypeScript</span>
              </li>
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>UI 框架：Tailwind CSS</span>
              </li>
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>状态管理：React Context</span>
              </li>
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>AI 集成：多种 AI 模型和 API</span>
              </li>
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>认证：NextAuth.js</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 开始使用 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">开始使用</h2>
          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Terminal className="h-5 w-5 mr-2" />
              <span className="font-mono">运行开发服务器</span>
            </div>
            <div className="space-y-2">
              <p className="text-gray-300">使用以下任一命令启动开发服务器：</p>
              <pre className="bg-gray-800 p-2 rounded">
                <code>npm run dev</code>
              </pre>
              <pre className="bg-gray-800 p-2 rounded">
                <code>yarn dev</code>
              </pre>
              <pre className="bg-gray-800 p-2 rounded">
                <code>pnpm dev</code>
              </pre>
              <pre className="bg-gray-800 p-2 rounded">
                <code>bun dev</code>
              </pre>
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            启动后，在浏览器中打开 <a href="http://localhost:3000" className="text-blue-600 hover:underline">http://localhost:3000</a> 查看结果。
          </p>
        </section>

        {/* 学习资源 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">学习资源</h2>
          <div className="space-y-4">
            <a href="https://nextjs.org/docs" className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium text-blue-600">Next.js 文档</h3>
              <p className="text-sm text-gray-600">了解 Next.js 的特性和 API</p>
            </a>
            <a href="https://nextjs.org/learn" className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium text-blue-600">Next.js 教程</h3>
              <p className="text-sm text-gray-600">交互式 Next.js 教程</p>
            </a>
            <a href="https://github.com/vercel/next.js" className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium text-blue-600">Next.js GitHub 仓库</h3>
              <p className="text-sm text-gray-600">欢迎提供反馈和贡献</p>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
