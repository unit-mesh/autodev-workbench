export default function AIHubPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">智能中枢</h1>
        <p className="text-gray-600">
          智能体注册与管理，上下文服务配置，策略与权限控制
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 智能体注册与管理 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">智能体注册与管理</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">智能体列表</h3>
              <p className="text-sm text-gray-600">
                查看和管理所有已注册的 AI 智能体，包括状态、能力和使用情况
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">智能体配置</h3>
              <p className="text-sm text-gray-600">
                配置智能体的行为、权限和资源限制
              </p>
            </div>
          </div>
        </div>

        {/* 上下文服务配置 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">上下文服务配置</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">服务目录上下文</h3>
              <p className="text-sm text-gray-600">
                配置智能体访问服务目录的上下文信息
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">API 契约上下文</h3>
              <p className="text-sm text-gray-600">
                配置智能体访问 API 契约的上下文信息
              </p>
            </div>
          </div>
        </div>

        {/* 策略与权限控制 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">策略与权限控制</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">访问策略</h3>
              <p className="text-sm text-gray-600">
                定义智能体访问不同资源的策略和规则
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">权限管理</h3>
              <p className="text-sm text-gray-600">
                管理智能体的权限和访问控制
              </p>
            </div>
          </div>
        </div>

        {/* 向量数据库接入 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">向量数据库接入</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">数据库配置</h3>
              <p className="text-sm text-gray-600">
                配置向量数据库连接和索引设置
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">数据同步</h3>
              <p className="text-sm text-gray-600">
                管理知识库数据的同步和更新
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 