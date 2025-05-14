export default function DocsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">文档中心</h1>
        <p className="text-gray-600">
          快速开始，架构概览，开发指南，API 文档
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 快速开始 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">快速开始</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">安装指南</h3>
              <p className="text-sm text-gray-600">
                详细的安装步骤和环境配置说明
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">快速入门</h3>
              <p className="text-sm text-gray-600">
                5分钟上手教程，快速了解核心功能
              </p>
            </div>
          </div>
        </div>

        {/* 架构概览 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">架构概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">系统架构</h3>
              <p className="text-sm text-gray-600">
                整体架构设计和核心组件说明
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">技术栈</h3>
              <p className="text-sm text-gray-600">
                使用的主要技术和框架介绍
              </p>
            </div>
          </div>
        </div>

        {/* Agent 开发指南 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent 开发指南</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">开发规范</h3>
              <p className="text-sm text-gray-600">
                Agent 开发的最佳实践和规范
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">示例代码</h3>
              <p className="text-sm text-gray-600">
                常用场景的示例代码和实现方案
              </p>
            </div>
          </div>
        </div>

        {/* API 文档 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API 文档</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">REST API</h3>
              <p className="text-sm text-gray-600">
                详细的 API 接口说明和示例
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">SDK 文档</h3>
              <p className="text-sm text-gray-600">
                各语言 SDK 的使用说明
              </p>
            </div>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">常见问题（FAQ）</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">使用问题</h3>
              <p className="text-sm text-gray-600">
                常见使用问题的解答和解决方案
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">故障排除</h3>
              <p className="text-sm text-gray-600">
                常见故障的排查和解决方法
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 