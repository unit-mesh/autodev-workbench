"use client"

import React from 'react'
import {
  Activity,
  ArrowRight,
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

export default function SPAREInsights() {
  return (
    <div className="spare-insights">
      <div className="p-6 rounded-lg mb-8">
        <h4 className="text-xl font-semibold mb-3 text-center text-blue-700">SPARE指标可视化与洞察分析</h4>
        <p className="text-slate-600 mb-4 text-center">多维度展示框架各支柱绩效，揭示指标关联性，提供数据驱动的改进建议</p>

        {/* 强化的过滤与视图控制 */}
        <div className="flex flex-wrap justify-between items-center mb-6 bg-blue-50 p-3 rounded-lg">
          <div className="flex flex-wrap gap-2 mb-2 md:mb-0">
            <div>
              <label className="block text-xs text-blue-700 mb-1">团队/范围</label>
              <select className="text-sm border border-blue-200 rounded px-2 py-1 bg-white text-blue-700 w-32">
                <option value="all">所有团队</option>
                <option value="frontend">前端团队</option>
                <option value="backend">后端团队</option>
                <option value="ml">机器学习团队</option>
                <option value="platform">平台团队</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">时间范围</label>
              <select className="text-sm border border-blue-200 rounded px-2 py-1 bg-white text-blue-700 w-32">
                <option value="quarter">季度视图</option>
                <option value="month">月度视图</option>
                <option value="week">周视图</option>
                <option value="ytd">年度至今</option>
                <option value="custom">自定义...</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">指标类别</label>
              <select className="text-sm border border-blue-200 rounded px-2 py-1 bg-white text-blue-700 w-32">
                <option value="all">所有指标</option>
                <option value="adoption">AI采纳与信任</option>
                <option value="productivity">效率与生产力</option>
                <option value="wellbeing">开发者福祉</option>
                <option value="quality">代码质量</option>
                <option value="security">安全与合规</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">比较基准</label>
              <select className="text-sm border border-blue-200 rounded px-2 py-1 bg-white text-blue-700 w-32">
                <option value="previous">上一期间</option>
                <option value="baseline">AI实施前基线</option>
                <option value="target">目标值</option>
                <option value="industry">行业基准</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="text-sm border border-blue-200 rounded px-3 py-1 bg-white text-blue-700 flex items-center hover:bg-blue-50">
              <RefreshCw className="h-4 w-4 mr-1" />
              更新数据
            </button>
            <button className="text-sm border border-green-200 rounded px-3 py-1 bg-white text-green-700 flex items-center hover:bg-green-50">
              <FileSearch className="h-4 w-4 mr-1" />
              导出报告
            </button>
          </div>
        </div>

        {/* 支柱得分卡视图 */}
        <div className="mb-6">
          <h5 className="text-lg font-medium mb-3 text-blue-700">SPARE支柱得分 - 整体健康状况</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* 支柱A得分卡 */}
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 relative">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <h6 className="font-semibold text-blue-700">AI赋能与价值实现</h6>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-bold text-blue-600">78<span className="text-sm font-normal">/100</span></span>
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  较上季 +6
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">AI采纳率</span>
                    <span className="font-medium text-blue-700">86%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '86%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">AI建议接受率</span>
                    <span className="font-medium text-blue-700">72%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '72%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">开发者AI信任度</span>
                    <span className="font-medium text-blue-700">75%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 支柱B得分卡 */}
            <div className="bg-green-50 rounded-lg border border-green-100 p-4 relative">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <Heart className="h-5 w-5 text-green-600" />
                </div>
                <h6 className="font-semibold text-green-700">开发者体验与心流</h6>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-bold text-green-600">81<span className="text-sm font-normal">/100</span></span>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  较上季 +3
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">开发者满意度</span>
                    <span className="font-medium text-green-700">84%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-1.5">
                    <div className="bg-green-600 h-1.5 rounded-full" style={{width: '84%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">工作流顺畅度</span>
                    <span className="font-medium text-green-700">79%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-1.5">
                    <div className="bg-green-600 h-1.5 rounded-full" style={{width: '79%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">认知负荷减少</span>
                    <span className="font-medium text-green-700">74%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-1.5">
                    <div className="bg-green-600 h-1.5 rounded-full" style={{width: '74%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 支柱C得分卡 */}
            <div className="bg-purple-50 rounded-lg border border-purple-100 p-4 relative">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <Code2 className="h-5 w-5 text-purple-600" />
                </div>
                <h6 className="font-semibold text-purple-700">代码质量与系统韧性</h6>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-bold text-purple-600">73<span className="text-sm font-normal">/100</span></span>
                <span className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  较上季 +8
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">代码流失率</span>
                    <span className="font-medium text-purple-700">8.2%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-1.5">
                    <div className="bg-purple-600 h-1.5 rounded-full" style={{width: '91.8%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">测试覆盖率</span>
                    <span className="font-medium text-purple-700">85%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-1.5">
                    <div className="bg-purple-600 h-1.5 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">缺陷密度</span>
                    <span className="font-medium text-purple-700">低</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-1.5">
                    <div className="bg-purple-600 h-1.5 rounded-full" style={{width: '82%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 支柱D得分卡 */}
            <div className="bg-amber-50 rounded-lg border border-amber-100 p-4 relative">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <h6 className="font-semibold text-amber-700">负责任AI与风险治理</h6>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-bold text-amber-600">86<span className="text-sm font-normal">/100</span></span>
                <span className="text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  较上季 +4
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">偏见检测通过率</span>
                    <span className="font-medium text-amber-700">98%</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-1.5">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">安全合规指数</span>
                    <span className="font-medium text-amber-700">92%</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-1.5">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{width: '92%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">AI模型幻觉率</span>
                    <span className="font-medium text-amber-700">3.5%</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-1.5">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{width: '96.5%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 多维度趋势图表 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* DORA指标趋势图 */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h6 className="font-medium text-slate-700">DORA核心指标趋势</h6>
              <div className="flex gap-1">
                <button className="text-xs py-0.5 px-2 rounded bg-blue-100 text-blue-700">前置时间</button>
                <button className="text-xs py-0.5 px-2 rounded bg-slate-100 text-slate-500">部署频率</button>
                <button className="text-xs py-0.5 px-2 rounded bg-slate-100 text-slate-500">失败率</button>
                <button className="text-xs py-0.5 px-2 rounded bg-slate-100 text-slate-500">恢复时间</button>
              </div>
            </div>

            {/* 模拟趋势图 */}
            <div className="h-64 flex flex-col justify-end">
              <div className="flex-grow relative border-b border-l border-slate-300">
                {/* 模拟折线图 */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,50 L10,45 L20,48 L30,40 L40,35 L50,30 L60,25 L70,20 L80,18 L90,15 L100,12"
                        fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <path d="M0,50 L10,45 L20,48 L30,40 L40,35 L50,30 L60,25 L70,20 L80,18 L90,15 L100,12"
                        fill="url(#blue-gradient)" strokeWidth="0" opacity="0.2" />
                </svg>
                <defs>
                  <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y轴标签 */}
                <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-xs text-slate-500">
                  <span>0天</span>
                  <span>4天</span>
                  <span>8天</span>
                  <span>12天</span>
                </div>
              </div>
              {/* X轴标签 */}
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Q1</span>
                <span>Q2</span>
                <span>Q3</span>
                <span>Q4</span>
                <span>Q1</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-center text-slate-500 flex justify-between items-center">
              <span className="text-green-600 font-medium flex items-center">
                <ArrowRight className="h-3 w-3 mr-1" />
                较AI引入前降低76%
              </span>
              <span className="italic">趋势预测: 持续改善</span>
            </div>
          </div>

          {/* 关键AI指标雷达图 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 w-90 h-90">
            <h6 className="font-medium text-blue-700 mb-3">AI价值实现 - 雷达分析</h6>

            {/* 模拟雷达图 */}
            <div className="h-64 flex items-center justify-center relative">
              <div className="w-56 h-56 rounded-full border border-blue-200 absolute"></div>
              <div className="w-40 h-40 rounded-full border border-blue-200 absolute"></div>
              <div className="w-24 h-24 rounded-full border border-blue-200 absolute"></div>

              {/* 雷达线条 */}
              <div className="absolute w-56 h-1 bg-blue-100 transform rotate-0"></div>
              <div className="absolute w-56 h-1 bg-blue-100 transform rotate-45"></div>
              <div className="absolute w-56 h-1 bg-blue-100 transform rotate-90"></div>
              <div className="absolute w-56 h-1 bg-blue-100 transform rotate-135"></div>

              {/* 雷达数据多边形 (模拟) */}
              <div className="absolute inset-0">
                <svg viewBox="-100 -100 200 200" className="w-56 h-56 relative" style={{ left: "16%" }}>
                  <polygon points="0,-80 76,25 47,77 -47,77 -76,25"
                           fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth="2" />
                </svg>
              </div>

              {/* 雷达标签 */}
              <div className="absolute -top-4 text-xs text-blue-700 font-medium">采纳率</div>
              <div className="absolute top-6 right-2 text-xs text-blue-700 font-medium">生产力提升</div>
              <div className="absolute bottom-6 right-2 text-xs text-blue-700 font-medium">创新贡献</div>
              <div className="absolute bottom-6 left-2 text-xs text-blue-700 font-medium">代码质量</div>
              <div className="absolute top-6 left-2 text-xs text-blue-700 font-medium">开发者信任</div>
            </div>

            <div className="text-xs text-center text-slate-500">
              <div className="flex justify-center gap-4 mt-2">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 opacity-50 mr-1"></div>
                  当前状态
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 border border-blue-500 mr-1"></div>
                  目标状态
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 指标关联分析 */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
          <h5 className="text-lg font-medium mb-3 text-slate-700">指标关联分析与业务影响</h5>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className=''>
              <tr className="bg-slate-100">
                <th className="py-2 px-3 text-left font-medium text-slate-700">SPARE指标</th>
                <th className="py-2 px-3 text-left font-medium text-slate-700">当前值</th>
                <th className="py-2 px-3 text-left font-medium text-slate-700">变化</th>
                <th className="py-2 px-3 text-left font-medium text-slate-700">主要业务影响</th>
                <th className="py-2 px-3 text-left font-medium text-slate-700">相关联指标</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-100">
                <td className="py-2 px-3 font-medium text-blue-700">AI建议接受率</td>
                <td className="py-2 px-3">72%</td>
                <td className="py-2 px-3 text-green-600 flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1" />+8%
                </td>
                <td className="py-2 px-3">上市时间缩短18%</td>
                <td className="py-2 px-3">
                  <div className="flex items-center space-x-1">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">代码流失率</span>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">开发者满意度</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-100">
                <td className="py-2 px-3 font-medium text-purple-700">AI代码流失率</td>
                <td className="py-2 px-3">8.2%</td>
                <td className="py-2 px-3 text-green-600 flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1" />-3.6%
                </td>
                <td className="py-2 px-3">产品质量提升12%</td>
                <td className="py-2 px-3">
                  <div className="flex items-center space-x-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">AI建议接受率</span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">AI模型幻觉率</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-100">
                <td className="py-2 px-3 font-medium text-green-700">开发者满意度</td>
                <td className="py-2 px-3">84%</td>
                <td className="py-2 px-3 text-green-600 flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1" />+5%
                </td>
                <td className="py-2 px-3">保留率提升15%</td>
                <td className="py-2 px-3">
                  <div className="flex items-center space-x-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">认知负荷</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">变更前置时间</span>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* AI生成的洞察 - 增强版 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border border-blue-200 mb-6">
          <div className="flex items-start mb-4">
            <div className="bg-white p-2 rounded-lg shadow mr-3">
              <Lightbulb className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h6 className="font-semibold text-blue-800 mb-1">AI生成的战略洞察</h6>
              <p className="text-slate-700 mb-3">
                根据多维度SPARE指标分析，我们发现三个关键改进机会：
              </p>
            </div>
          </div>

          <div className="space-y-4 pl-12">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
              <h6 className="font-medium text-blue-700 mb-1 flex items-center">
                <Target className="h-4 w-4 mr-2 text-blue-600" />
                AI建议采纳与代码质量的关联
              </h6>
              <p className="text-sm text-slate-600 mb-2">
                数据表明，AI建议接受率与代码流失率之间存在负相关 (-0.72)。当AI建议接受率超过 xx% 时，代码流失率倾向于增加，表明可能需要更严格的质量审查机制。
              </p>
              <div className="flex space-x-2">
                <button className="text-xs border border-blue-200 rounded px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  查看详细分析
                </button>
                <button className="text-xs border border-blue-200 rounded px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  改进建议
                </button>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
              <h6 className="font-medium text-green-700 mb-1 flex items-center">
                <Heart className="h-4 w-4 mr-2 text-green-600" />
                开发者体验改进机会
              </h6>
              <p className="text-sm text-slate-600 mb-2">
                复杂模块中AI采纳率较低(xx%)，但对应的开发者满意度也较低。调研数据显示，针对复杂逻辑的AI建议质量是主要痛点。改进AI对复杂业务逻辑的理解能显著提升开发者体验。
              </p>
              <div className="flex space-x-2">
                <button className="text-xs border border-green-200 rounded px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  查看详细分析
                </button>
                <button className="text-xs border border-green-200 rounded px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  改进建议
                </button>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
              <h6 className="font-medium text-amber-700 mb-1 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-amber-600" />
                AI安全与风险优化
              </h6>
              <p className="text-sm text-slate-600 mb-2">
                在安全关键模块中发现的AI生成漏洞比例(3.8%)高于平均水平(1.2%)。建议为安全关键组件添加专门的AI代码审查流程，并调整模型设置，优先考虑安全性。
              </p>
              <div className="flex space-x-2">
                <button className="text-xs border border-amber-200 rounded px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                  查看详细分析
                </button>
                <button className="text-xs border border-amber-200 rounded px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                  改进建议
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 分析视角选择器 */}
        <div className="border-t border-blue-100 pt-4 flex flex-wrap justify-between items-center">
          <h6 className="font-semibold text-blue-700 mb-2 md:mb-0">分析视角</h6>
          <div className="flex flex-wrap gap-2">
            <button className="text-sm border border-blue-200 rounded px-3 py-1 bg-blue-50 text-blue-700 flex items-center hover:bg-blue-100">
              <Eye className="h-4 w-4 mr-1" />
              四大支柱视角
            </button>
            <button className="text-sm border border-green-200 rounded px-3 py-1 bg-white text-green-700 flex items-center hover:bg-green-50">
              <Activity className="h-4 w-4 mr-1" />
              业务成果视角
            </button>
            <button className="text-sm border border-purple-200 rounded px-3 py-1 bg-white text-purple-700 flex items-center hover:bg-purple-50">
              <GitBranch className="h-4 w-4 mr-1" />
              团队对比视角
            </button>
            <button className="text-sm border border-amber-200 rounded px-3 py-1 bg-white text-amber-700 flex items-center hover:bg-amber-50">
              <Shield className="h-4 w-4 mr-1" />
              风险治理视角
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
