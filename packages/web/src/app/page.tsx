'use client'

import React from 'react'
import { PlatformEngFlow } from "@/app/platformEngFlow";
import { ArrowRight } from 'lucide-react'

export default function Home() {
	return (
		<div className="p-8 space-y-8">
			<div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
				<h2 className="text-2xl font-bold mb-4">欢迎使用 AutoDev 智能研发驾驶舱</h2>
				<p className="mb-6 text-blue-100">
					点击下方按钮，立即开始您的智能研发体验。驾驶舱提供全方位的研发数据可视化、AI辅助分析和智能决策支持。
				</p>
				<a
					href="/cockpit"
					className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
				>
					立即体验驾驶舱 <ArrowRight className="ml-2 h-5 w-5" />
				</a>
			</div>

			<PlatformEngFlow />
		</div>
	)
}

