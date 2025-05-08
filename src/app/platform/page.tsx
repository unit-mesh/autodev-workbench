import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PlatformPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">平台知识</h1>
          <p className="text-gray-500 mt-2">
            统一管理服务目录、API 契约、基础设施配置等平台核心能力，提升研发效能和团队协作
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 平台上下文 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">平台上下文</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">平台信息</h3>
              <p className="text-sm text-gray-600">
                查看内部所有平台、AI能力与上下文信息，支持跨平台集成与智能工作流
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">平台集成</h3>
              <p className="text-sm text-gray-600">
                连接和管理不同平台之间的关系，实现数据和功能的无缝集成
              </p>
            </div>
          </div>
          <div className="mt-4 text-right">
            <Link href="/platform/context" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              查看平台上下文 <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* 组件 & API 框架 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">组件 & API 框架</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">API 市场</h3>
              <p className="text-sm text-gray-600">
                浏览和搜索所有 API 定义，支持 OpenAPI 规范
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">组件库</h3>
              <p className="text-sm text-gray-600">
                管理和使用预定义的UI组件和功能模块
              </p>
            </div>
          </div>
          <div className="mt-4 text-right">
            <Link href="/platform/framework" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              访问组件 & API 框架 <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* 技术文档中心 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">技术文档中心</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">生成项目文档</h3>
              <p className="text-sm text-gray-600">
                从代码仓库或文档URL自动生成项目文档
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">文档规范</h3>
              <p className="text-sm text-gray-600">
                读取第三方文档，生成文档规范和最佳实践
              </p>
            </div>
          </div>
          <div className="mt-4 text-right">
            <Link href="/platform/techdocs" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              前往技术文档中心 <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* 规范中心 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">规范中心</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">编码规范</h3>
              <p className="text-sm text-gray-600">
                集中管理和维护企业级软件开发的编码规范，提升代码质量
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">最佳实践</h3>
              <p className="text-sm text-gray-600">
                为不同编程语言和框架提供标准化的最佳实践指南
              </p>
            </div>
          </div>
          <div className="mt-4 text-right">
            <Link href="/platform/coding-standards" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              访问规范中心 <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
