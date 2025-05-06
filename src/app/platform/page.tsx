export default function PlatformPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">平台知识</h1>
        <p className="text-gray-600">
          统一管理服务目录、API 契约、基础设施配置等平台核心能力
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 服务目录 & 所有权 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">服务目录 & 所有权</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">服务列表</h3>
              <p className="text-sm text-gray-600">
                查看和管理所有已注册的服务，包括服务状态、负责人和依赖关系
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">所属团队视图</h3>
              <p className="text-sm text-gray-600">
                按团队组织服务视图，清晰展示服务所有权和团队职责
              </p>
            </div>
          </div>
        </div>

        {/* API 模式与契约 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API 模式与契约</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">API 浏览器</h3>
              <p className="text-sm text-gray-600">
                浏览和搜索所有 API 定义，支持 OpenAPI 规范
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">API 合规检查</h3>
              <p className="text-sm text-gray-600">
                检查 API 是否符合组织规范和最佳实践
              </p>
            </div>
          </div>
        </div>

        {/* 基础设施配置 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">基础设施配置</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">IaC 模块管理</h3>
              <p className="text-sm text-gray-600">
                管理基础设施即代码模块，支持 Terraform、Pulumi 等
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">环境模板配置</h3>
              <p className="text-sm text-gray-600">
                创建和管理不同环境的配置模板
              </p>
            </div>
          </div>
        </div>

        {/* CI/CD & 黄金路径 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">CI/CD & 黄金路径</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">流水线模板</h3>
              <p className="text-sm text-gray-600">
                预定义的 CI/CD 流水线模板，支持多种构建和部署场景
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">项目初始化器</h3>
              <p className="text-sm text-gray-600">
                快速创建符合组织标准的新项目
              </p>
            </div>
          </div>
        </div>

        {/* 知识文档 & 标准 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">知识文档 & 标准</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">TechDocs 集成</h3>
              <p className="text-sm text-gray-600">
                技术文档管理系统，支持 Markdown 和版本控制
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">编码规范中心</h3>
              <p className="text-sm text-gray-600">
                统一的编码规范和最佳实践指南
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 