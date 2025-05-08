"use client"

import React from 'react'
import {
  Activity,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Code2,
  Eye,
  FileSearch,
  GitBranch,
  Heart,
  Lightbulb,
  RefreshCw,
  Shield,
  Target,
  Zap
} from 'lucide-react'

export default function SPAREFramework() {
  return (
    <div className="spare-framework">
      <div className="p-6 rounded-lg mb-8">
        <h3 className="text-2xl font-bold mb-3 text-center text-blue-800">战略性AI驱动研发卓越 (SPARE) 框架</h3>
        <p className="text-center text-slate-600 mb-6">
          全面评估AI增强型研发效能与体验的度量框架，关注真实价值、开发者体验、代码质量与负责任AI实践
        </p>

        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 支柱A */}
            <div className="card border-blue-500 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="icon-circle bg-blue-600 mr-3">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-blue-800">纵向支柱A</h4>
                </div>
              </div>
              <h5 className="text-lg font-medium mb-2">AI赋能与价值实现</h5>
              <p className="text-slate-600 mb-2">评估AI对研发效率、生产力和创新的切实贡献</p>

              <div className="mt-4 bg-white p-4 rounded-lg border border-blue-100">
                <h6 className="font-semibold mb-2 text-blue-700">核心指标类别</h6>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>AI采纳与信任度：</strong>工具使用率、建议接受率、开发者AI信任度</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>AI驱动的效率与生产力：</strong>任务周期时间缩短、重复性工作减少</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>AI对创新的贡献：</strong>AI建议的新颖解决方案、AI改进的创新速度</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>AI辅助质量：</strong>AI输出相关性、连贯性、内容真实性</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 支柱B */}
            <div className="card border-green-500 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="icon-circle bg-green-600 mr-3">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-green-800">纵向支柱B</h4>
                </div>
              </div>
              <h5 className="text-lg font-medium mb-2">协同式开发者体验与心流</h5>
              <p className="text-slate-600 mb-2">创建促进开发者福祉、高效工作流与心流状态的环境</p>

              <div className="mt-4 bg-white p-4 rounded-lg border border-green-100">
                <h6 className="font-semibold mb-2 text-green-700">核心指标类别</h6>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>开发者福祉与敬业度：</strong>满意度、净推荐值、认知负荷、倦怠信号</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>工作流顺畅度与效率：</strong>变更前置时间、部署频率、心流效率</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>AI协作与技能演进：</strong>AI工具融入度、AI技能提升、协作质量</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 支柱C */}
            <div className="card border-purple-500 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="icon-circle bg-purple-600 mr-3">
                    <Code2 className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-purple-800">纵向支柱C</h4>
                </div>
              </div>
              <h5 className="text-lg font-medium mb-2">智能化代码质量与系统韧性</h5>
              <p className="text-slate-600 mb-2">确保AI辅助开发产出高质量、安全且具韧性的软件系统</p>

              <div className="mt-4 bg-white p-4 rounded-lg border border-purple-100">
                <div className="flex justify-between items-center mb-4">
                  <h6 className="font-semibold text-purple-700">核心指标类别</h6>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>AI影响下的代码完整性：</strong>代码流失率、缺陷密度、测试覆盖率</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>系统稳定性与性能：</strong>变更失败率、MTTR、系统可用性</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>主动技术债务管理：</strong>技术债务比率、代码健康度、重构成本</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 横向支柱D */}
          <div className="card border-amber-500 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <div className="icon-circle bg-amber-600 mr-3">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-amber-800">横向支柱D</h4>
              </div>
            </div>
            <h5 className="text-lg font-medium mb-2">负责任AI与风险治理</h5>
            <p className="text-slate-600 mb-2">确保以合乎道德、安全、透明的方式开发和部署研发AI</p>

            <div className="mt-4 bg-white p-4 rounded-lg border border-amber-100">
              <h6 className="font-semibold mb-2 text-amber-700">核心指标类别</h6>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-amber-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>伦理AI与公平性：</strong>偏见检测、公平性指标、可解释性评分</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-amber-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>安全性与合规性：</strong>AI引入漏洞识别、数据隐私遵守、版权保护</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-amber-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>AI模型鲁棒性：</strong>幻觉率、输出一致性、对抗性攻击防御</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 添加链接到洞察页面 */}
        <div className="text-center mt-8">
          <a href="/metrics/insights" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Eye className="h-5 w-5 mr-2" />
            查看SPARE指标可视化与洞察分析
          </a>
        </div>
      </div>
    </div>
  );
};

