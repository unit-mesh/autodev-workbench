export default function MetricsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">度量分析</h1>
        <p className="text-gray-600">
          AI 使用情况，研发生产力，策略合规报告
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* AI 使用情况 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI 使用情况</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">响应质量</h3>
              <p className="text-sm text-gray-600">
                分析 AI 响应的质量和准确性，包括用户反馈和评分
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">调用次数</h3>
              <p className="text-sm text-gray-600">
                统计 AI 服务的调用频率和使用模式
              </p>
            </div>
          </div>
        </div>

        {/* 研发生产力 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">研发生产力</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">DORA 指标面板</h3>
              <p className="text-sm text-gray-600">
                展示部署频率、变更前置时间、变更失败率、平均恢复时间等指标
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">DevEx 问卷结果</h3>
              <p className="text-sm text-gray-600">
                开发者体验调查结果和分析报告
              </p>
            </div>
          </div>
        </div>

        {/* 策略合规报告 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">策略合规报告</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">合规检查</h3>
              <p className="text-sm text-gray-600">
                检查代码和配置是否符合组织策略和规范
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">安全审计</h3>
              <p className="text-sm text-gray-600">
                安全漏洞扫描和风险评估报告
              </p>
            </div>
          </div>
        </div>

        {/* 趋势分析 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">趋势分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">团队效能趋势</h3>
              <p className="text-sm text-gray-600">
                分析团队效能指标的变化趋势
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">AI 使用趋势</h3>
              <p className="text-sm text-gray-600">
                追踪 AI 工具使用情况的变化趋势
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 