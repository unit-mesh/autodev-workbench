'use client'

import React, { useState } from 'react'
import { DeveloperCockpit } from "@/components/developer-cockpit"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function Home() {
	const [activeSection, setActiveSection] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<'dashboard' | 'flowchart' | 'platform'>('dashboard')

	const handleSectionClick: (sectionId: React.SetStateAction<string | null>) => void = (sectionId: React.SetStateAction<string | null>) => {
		setActiveSection(sectionId)
		// Here you could add additional logic to navigate, display info, etc.
	}

	return (
		<div className="p-4">
			<div className="mb-4 flex space-x-2">
				<button 
					onClick={() => setActiveTab('dashboard')} 
					className={`px-4 py-2 rounded-md ${activeTab === 'dashboard' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
				>
					开发驾驶舱
				</button>
				<button 
					onClick={() => setActiveTab('flowchart')} 
					className={`px-4 py-2 rounded-md ${activeTab === 'flowchart' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
				>
					平台架构图
				</button>
				<button 
					onClick={() => setActiveTab('platform')} 
					className={`px-4 py-2 rounded-md ${activeTab === 'platform' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
				>
					平台知识
				</button>
			</div>

			{activeTab === 'dashboard' ? (
				<DeveloperCockpit />
			) : activeTab === 'flowchart' ? (
				<div>
					<PlatformEngFlow onClickSection={handleSectionClick} />
					{activeSection && (
						<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full">
							选中: {activeSection}
						</div>
					)}
				</div>
			) : (
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
			)}
		</div>
	)
}

type PlatformEngFlowProps = {
	onClickSection?: (sectionId: string) => void;
}

const PlatformEngFlow = ({ onClickSection }: PlatformEngFlowProps) => {
	const handleSectionClick = (sectionId: string) => {
		if (onClickSection) {
			onClickSection(sectionId)
		}
	}

	const clickableStyle = { cursor: 'pointer' }

	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
			<svg width="1200px" height="482px" viewBox="-100 0 802 482" version="1.1" xmlns="http://www.w3.org/2000/svg"
			     xmlnsXlink="http://www.w3.org/1999/xlink">
				<title>PlatformEngFlow</title>
				<desc>Platform Engineering Flow Diagram</desc>
				<g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
					<g id="sample" transform="translate(1.000000, 1.000000)">
						{/* Main Layer Group */}
						<g id="main-layers">
							<g id="user-touchpoints-container">
								<rect id="Rectangle" stroke="#FFA500" strokeWidth="2" fill="#FFFFFF" fillRule="nonzero" x="5" y="0"
								      width="500" height="120" rx="8"></rect>
								<text id="用户触点-title" fill="#FFA500" fontFamily="PingFangSC-Semibold, PingFang SC" fontSize="18"
								      fontWeight="500">
									<tspan x="37" y="31">用户触点：AI 增强的自服务</tspan>
								</text>
								<text id="--低代码系统，快速-UI/原型构建" fill="#000000" fontFamily="Helvetica" fontSize="14"
								      fontWeight="normal">
									<tspan x="37" y="70">-</tspan>
									<tspan x="45.5517578" y="70" fontFamily="PingFangSC-Regular, PingFang SC">低代码系统，快速</tspan>
									<tspan x="157.551758" y="70"> UI/</tspan>
									<tspan x="179.331055" y="70" fontFamily="PingFangSC-Regular, PingFang SC">原型构建</tspan>
								</text>
								<text id="--AI-赋能模板应用，终端用户产品" fill="#000000" fontFamily="Helvetica" fontSize="14"
								      fontWeight="normal">
									<tspan x="37" y="95">- AI</tspan>
									<tspan x="61.9033203" y="95" fontFamily="PingFangSC-Regular, PingFang SC">赋能模板应用，终端用户产品
									</tspan>
								</text>
              <g onClick={() => handleSectionClick('low-code')} style={clickableStyle}>
                <rect id="Rectangle-lowcode" stroke="#FFA500" fillOpacity="0.2" fill="#FFA500" fillRule="nonzero" x="340" y="62" width="140" height="54" rx="5"></rect>
                <text id="低代码系统-label" fill="#FFA500" fontFamily="PingFangSC-Regular, PingFang SC" fontSize="14" fontWeight="normal">
                    <tspan x="355" y="92">低代码强化生成</tspan>
                </text>
              </g>
              <g onClick={() => handleSectionClick('ai-templates')} style={clickableStyle}>
                <rect id="Rectangle-aitemplate" stroke="#800080" fillOpacity="0.2" fill="#800080" fillRule="nonzero" x="340" y="4" width="140" height="54" rx="5"></rect>
                <text id="AI模板应用-label" fill="#800080" fontFamily="PingFangSC-Regular, PingFang SC" fontSize="14" fontWeight="normal">
                    <tspan x="355" y="36">AI 增强模板生成</tspan>
                </text>
              </g>
							</g>

							<g transform="translate(260.000000, 130.000000)" id="Arrow-1" stroke="#FFD700" strokeWidth="2">
								<path d="M10,0 L10,30 M0,20 L10,30 L20,20"></path>
							</g>

							{/* 中间层 Section Container (no longer clickable itself) */}
							<g id="middle-layer-container" transform="translate(0.000000, 180.000000)">
								<rect id="Rectangle" stroke="#008000" strokeWidth="2" fill="#FFFFFF" fillRule="nonzero" x="5" y="0"
								      width="500" height="120" rx="8"></rect>
								<text id="中间层-title" fill="#008000" fontFamily="PingFangSC-Semibold, PingFang SC" fontSize="18"
								      fontWeight="500">
									<tspan x="29" y="34">中间层：知识与上下文中枢</tspan>
								</text>
								<text id="--连接南向和北向，知识聚合与分发" fill="#000000" fontFamily="Helvetica" fontSize="14"
								      fontWeight="normal">
									<tspan x="32" y="74">-</tspan>
									<tspan x="40.5517578" y="74"
									       fontFamily="PingFangSC-Regular, PingFang SC">连接用户和内部开发者，聚合知识与分发知识
									</tspan>
								</text>
								<text id="--支持问答、DevOps任务协同" fill="#000000" fontFamily="Helvetica" fontSize="14"
								      fontWeight="normal">
									<tspan x="32" y="99">-</tspan>
									<tspan x="40.5517578" y="99" fontFamily="PingFangSC-Regular, PingFang SC">支持问答、</tspan>
									<tspan x="110.551758" y="99">DevOps</tspan>
									<tspan x="161.124023" y="99" fontFamily="PingFangSC-Regular, PingFang SC">任务协同</tspan>
								</text>
								{/* Clickable Knowledge Hub Area */}
              <g onClick={() => handleSectionClick('knowledge-hub')} style={clickableStyle}>
                <rect id="Rectangle-knowledgehub" stroke="#008000" fillOpacity="0.2" fill="#008000" fillRule="nonzero" x="340" y="35" width="140" height="54" rx="5"></rect>
                <text id="知识中枢-label" fill="#008000" fontFamily="PingFangSC-Regular, PingFang SC" fontSize="14" fontWeight="normal">
                    <tspan x="355" y="68">知识与上下文中枢</tspan>
                </text>
              </g>
							</g>

							<g transform="translate(260.000000, 310.000000)" id="Arrow-2" stroke="#FFD700" strokeWidth="2">
								<path d="M10,0 L10,30 M0,20 L10,30 L20,20"></path>
							</g>

							{/* 内部接口 Section Container (no longer clickable itself) */}
							<g id="internal-interface-container" transform="translate(0.000000, 360.000000)">
								<rect id="Rectangle" stroke="#0000FF" strokeWidth="2" fill="#FFFFFF" fillRule="nonzero" x="5" y="0"
								      width="500" height="120" rx="8"></rect>
								<text id="内部接口-title" fill="#0000FF" fontFamily="PingFangSC-Semibold, PingFang SC" fontSize="18"
								      fontWeight="500">
									<tspan x="27" y="26">内部接口：标准化 API 提供上下文</tspan>
								</text>
								<text id="--提供编辑器、代码库等内部-API" fill="#000000" fontFamily="Helvetica" fontSize="14"
								      fontWeight="normal">
									<tspan x="27" y="72">-</tspan>
									<tspan x="35.5517578" y="72" fontFamily="PingFangSC-Regular, PingFang SC">提供编辑器、代码库等内部
									</tspan>
									<tspan x="203.551758" y="72"> API</tspan>
								</text>
								<text id="--平台基础设施与数据处理能力" fill="#000000" fontFamily="Helvetica" fontSize="14"
								      fontWeight="normal">
									<tspan x="27" y="97">-</tspan>
									<tspan x="35.5517578" y="97" fontFamily="PingFangSC-Regular, PingFang SC">平台基础设施与数据处理能力
									</tspan>
								</text>
								{/* Clickable Platform API Area */}
              <g onClick={() => handleSectionClick('standard-api')} style={clickableStyle}>
                <rect id="Rectangle-platformapi" stroke="#0000FF" fillOpacity="0.2" fill="#0000FF" fillRule="nonzero" x="340" y="35" width="140" height="54" rx="5"></rect>
                <text id="平台-API-label" fill="#0000FF" fontFamily="PingFangSC-Regular, PingFang SC" fontSize="14" fontWeight="normal">
                    <tspan x="355" y="68">标准化&#34;智能 API&#34;</tspan>
                </text>
              </g>
							</g>
						</g>

            <g id="ai-governance-container" transform="translate(-280.000000, 0.000000)">
              <rect stroke="#4B0082" strokeWidth="2" fill="#FFFFFF" width="250" height="480" rx="8" />
              <text fill="#4B0082" fontFamily="Helvetica-Bold, Helvetica" fontSize="18" fontWeight="bold">
                <tspan x="57" y="40" fontFamily="PingFangSC-Semibold, PingFang SC" fontWeight="500">智能体治理中枢</tspan>
              </text>
              <line x1="75" y1="50" x2="175" y2="50" stroke="#4B0082" strokeWidth="2" />
              <g transform="translate(32, 78)">
                <text fill="#000000" fontFamily="Helvetica" fontSize="14">
                  <tspan x="0" y="14">- </tspan>
                  <tspan x="8.5" y="14" fontFamily="PingFangSC-Regular, PingFang SC">集中治理策略</tspan>
                  <tspan x="0" y="54">- </tspan>
                  <tspan x="8.5" y="54" fontFamily="PingFangSC-Regular, PingFang SC">权限管理</tspan>
                  <tspan x="0" y="94">- </tspan>
                  <tspan x="8.5" y="94" fontFamily="PingFangSC-Regular, PingFang SC">上下文注入</tspan>
                  <tspan x="0" y="134">- </tspan>
                  <tspan x="8.5" y="134" fontFamily="PingFangSC-Regular, PingFang SC">统一审计</tspan>
                  <tspan x="0" y="174">- </tspan>
                  <tspan x="8.5" y="174" fontFamily="PingFangSC-Regular, PingFang SC">资源编排</tspan>
                </text>
                <g onClick={() => handleSectionClick('idp-governance')} style={clickableStyle}>
                  <rect stroke="#4B0082" fillOpacity="0.2" fill="#4B0082" x="8" y="323" width="188" height="54" rx="5" />
                  <text fill="#4B0082" fontFamily="PingFangSC-Regular, PingFang SC" fontSize="14">
                    <tspan x="35" y="353">IDP 作为智能治理中枢</tspan>
                  </text>
                </g>
              </g>
            </g>

            <g id="ai-metrics-container" transform="translate(540.000000, 0.000000)">
              <rect stroke="#2E8B57" strokeWidth="2" fill="#FFFFFF" width="250" height="480" rx="8" />
              <text fill="#2E8B57" fontFamily="Helvetica-Bold, Helvetica" fontSize="18" fontWeight="bold">
                <tspan x="40" y="40">度量 AI 质量与生产力</tspan>
              </text>
              <line x1="30" y1="50" x2="220" y2="50" stroke="#2E8B57" strokeWidth="2" />
              <g transform="translate(20, 78)">
                <text fill="#000000" fontFamily="Helvetica" fontSize="14">
                  <tspan x="0" y="14">- 模型效果评估</tspan>
                  <tspan x="0" y="54">- 响应速度与准确率</tspan>
                  <tspan x="0" y="94">- 使用频率与覆盖率</tspan>
                  <tspan x="0" y="134">- 生产效率提升指标</tspan>
                </text>
                <g onClick={() => handleSectionClick('ai-metrics')} style={clickableStyle}>
                  <rect stroke="#2E8B57" fillOpacity="0.2" fill="#2E8B57" x="0" y="323" width="210" height="54" rx="5" />
                  <text fill="#2E8B57" fontFamily="PingFangSC-Regular, PingFang SC" fontSize="14">
                    <tspan x="45" y="353">度量改善 AI 生成质量</tspan>
                  </text>
                </g>
              </g>
            </g>

            {/* Connecting Lines */}
						<g id="connecting-lines-left">
							<line x1="-30" y1="56" x2="10" y2="56" id="Connector-1" stroke="#4B0082" strokeWidth="2"
							      strokeDasharray="5,5"></line>
							<line x1="-30" y1="240" x2="10" y2="240" id="Connector-2" stroke="#4B0082" strokeWidth="2"
							      strokeDasharray="5,5"></line>
							<line x1="-30" y1="420" x2="10" y2="420" id="Connector-3" stroke="#4B0082" strokeWidth="2"
							      strokeDasharray="5,5"></line>
						</g>

						<g id="connecting-lines-right">
							<line x1="505" y1="56" x2={"540"} y2="56" id="Connector-4" stroke="#2E8B57" strokeWidth="2"
							      strokeDasharray="5,5"></line>
							<line x1="505" y1="240" x2="540" y2="240" id="Connector-5" stroke="#2E8B57" strokeWidth="2"
							      strokeDasharray="5,5"></line>
							<line x1="505" y1="420" x2="540" y2="420" id="Connector-6" stroke="#2E8B57" strokeWidth="2"
							      strokeDasharray="5,5"></line>
						</g>
					</g>
				</g>
			</svg>
		</div>
	)
}
