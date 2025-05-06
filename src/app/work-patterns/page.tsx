export default function WorkPatternsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">工作方式</h1>
        <p className="text-gray-600">
          Team AI 面板，生命周期问答，知识导航视图
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Team AI 面板 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team AI 面板</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">当前团队对话协同空间</h3>
              <p className="text-sm text-gray-600">
                实时协作的团队对话空间，支持多轮对话和上下文保持
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">任务自动化记录</h3>
              <p className="text-sm text-gray-600">
                记录和追踪 AI 辅助完成的任务和自动化流程
              </p>
            </div>
          </div>
        </div>

        {/* 生命周期问答 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">生命周期问答</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">问答历史</h3>
              <p className="text-sm text-gray-600">
                查看历史问答记录，支持按项目、时间等维度筛选
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">CI/CD & 异常问题入口</h3>
              <p className="text-sm text-gray-600">
                快速定位和解决 CI/CD 流程中的异常问题
              </p>
            </div>
          </div>
        </div>

        {/* 知识导航视图 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">知识导航视图</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">工件追踪关系图</h3>
              <p className="text-sm text-gray-600">
                可视化展示代码、文档、配置等工件之间的关联关系
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">数字孪生视角</h3>
              <p className="text-sm text-gray-600">
                系统架构和运行状态的实时数字映射
              </p>
            </div>
          </div>
        </div>

        {/* 工作流模板 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">工作流模板</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">常用工作流</h3>
              <p className="text-sm text-gray-600">
                预定义的工作流模板，支持快速启动常见任务
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">自定义工作流</h3>
              <p className="text-sm text-gray-600">
                创建和管理团队特定的工作流程
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 