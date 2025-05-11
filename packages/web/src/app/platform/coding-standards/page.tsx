"use client"

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
	Search,
	Book,
	Code,
	FileCode,
	BookOpen,
	X,
	Calendar,
	Info
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const languageIconMap: Record<string, any> = {
	javascript: { icon: FileCode, color: 'text-yellow-500' },
	typescript: { icon: FileCode, color: 'text-blue-500' },
	python: { icon: FileCode, color: 'text-green-500' },
	java: { icon: FileCode, color: 'text-orange-500' },
	csharp: { icon: FileCode, color: 'text-purple-500' },
	go: { icon: FileCode, color: 'text-cyan-500' },
	rust: { icon: FileCode, color: 'text-red-500' },
	html: { icon: Code, color: 'text-orange-600' },
	css: { icon: Code, color: 'text-blue-600' },
	general: { icon: Book, color: 'text-gray-500' },
};

// 模拟编码规范数据
const mockCodingStandards = [
	{
		id: 1,
		title: 'JavaScript 编码规范',
		description: '包含ES6+语法推荐、模块化结构和最佳实践的综合指南',
		language: 'javascript',
		category: 'frontend',
		version: '2.1.0',
		lastUpdated: '2023-06-15',
		popularity: 95,
		content: `
      ## JavaScript 编码规范

      ### 命名约定
      - 使用驼峰命名法(camelCase)命名变量和函数
      - 使用PascalCase命名类和构造函数
      - 使用UPPER_CASE命名常量

      ### 模块化
      - 优先使用ES模块(import/export)
      - 避免全局变量污染
      - 一个模块只做一件事

      ### 异步编程
      - 优先使用async/await而非原始Promise链
      - 正确处理异常捕获
      - 避免回调地狱

      ### 代码格式化
      - 使用2个空格缩进
      - 语句结尾使用分号
      - 最大行长度80-100个字符
    `,
	},
	{
		id: 2,
		title: 'React 组件开发规范',
		description: '面向React组件开发的规范，包含Hooks使用、状态管理和性能优化建议',
		language: 'javascript',
		category: 'frontend',
		version: '3.0.1',
		lastUpdated: '2023-08-20',
		popularity: 89,
		content: `
      ## React 组件开发规范

      ### 组件结构
      - 使用函数组件和Hooks而非类组件
      - 保持组件职责单一
      - 组件文件名与组件名保持一致

      ### Hooks使用
      - 遵循Hooks使用规则(不在条件语句中使用)
      - 使用自定义Hooks抽象共享逻辑
      - 合理使用useMemo和useCallback优化性能

      ### 状态管理
      - 本地状态使用useState
      - 复杂状态考虑使用useReducer
      - 跨组件共享状态使用Context API或状态管理库

      ### 性能优化
      - 使用React.memo包装纯组件
      - 通过key属性优化列表渲染
      - 避免不必要的重渲染
    `,
	},
	// ... 其他编码规范数据保持不变
	{
		id: 3,
		title: 'Python PEP 8 规范指南',
		description: 'Python官方PEP 8编码风格的企业版实践指南，包含自动化工具配置',
		language: 'python',
		category: 'backend',
		version: '1.2.0',
		lastUpdated: '2023-05-05',
		popularity: 92,
		content: `
      ## Python PEP 8 规范指南
      
      ### 代码布局
      - 使用4个空格进行缩进
      - 每行最大长度为79个字符
      - 顶级函数和类定义用两个空行分隔
      - 类中的方法定义用一个空行分隔
      
      ### 导入规范
      - 导入应当分行书写
      - 导入顺序: 标准库、第三方库、本地库
      - 避免使用通配符导入
      
      ### 命名规范
      - 变量名全小写，多单词用下划线连接
      - 类名使用CapWords约定
      - 常量用大写字母，下划线连接
      
      ### 注释规范
      - 使用docstring记录模块、函数、类、方法
      - 使用Google或NumPy风格的文档字符串
      - 注释应该是完整的句子
    `,
	},
	{
		id: 4,
		title: 'TypeScript 类型系统规范',
		description: '如何在大型项目中正确使用TypeScript类型系统的最佳实践',
		language: 'typescript',
		category: 'frontend',
		version: '2.4.0',
		lastUpdated: '2023-07-12',
		popularity: 87,
		content: `
      ## TypeScript 类型系统规范
      
      ### 基本类型定义
      - 尽量避免使用any类型
      - 使用interface定义对象结构
      - 使用type定义联合类型和交叉类型
      
      ### 泛型使用
      - 适当使用泛型提高代码复用性
      - 为泛型参数提供默认类型
      - 使用泛型约束限制参数类型
      
      ### 类型声明文件
      - 为第三方库创建.d.ts声明文件
      - 使用命名空间组织复杂类型
      - 导出必要的类型供外部使用
      
      ### 高级类型技巧
      - 使用Readonly<T>防止对象变异
      - 使用Partial<T>处理部分更新
      - 使用Record<K,T>创建键值对映射
    `,
	},
	{
		id: 5,
		title: 'Java 代码规范',
		description: '基于Google Java Style的企业级Java编码规范，包含命名、格式和注释要求',
		language: 'java',
		category: 'backend',
		version: '4.2.1',
		lastUpdated: '2023-04-02',
		popularity: 84,
		content: `
      ## Java 代码规范
      
      ### 文件结构
      - 每个Java文件只包含一个顶级类
      - 按照package、import、类这样的顺序组织代码
      - 避免超过2000行的源文件
      
      ### 命名约定
      - 类名使用PascalCase
      - 方法和变量使用camelCase
      - 常量使用UPPER_CASE
      
      ### 格式化规则
      - 使用4个空格缩进
      - 大括号总是使用Egyptian风格
      - 每行最多100个字符
      
      ### 编程实践
      - 避免使用原始类型的包装类
      - 优先使用接口而非实现类
      - 正确处理异常而不是简单地捕获
    `,
	},
	{
		id: 6,
		title: 'Go 项目结构指南',
		description: '符合Go语言惯例的项目结构和代码组织指南，包含错误处理最佳实践',
		language: 'go',
		category: 'backend',
		version: '1.5.0',
		lastUpdated: '2023-09-05',
		popularity: 82,
		content: `
      ## Go 项目结构指南
      
      ### 项目布局
      - /cmd 放置主要应用程序入口点
      - /pkg 放置可以被外部应用程序使用的库代码
      - /internal 放置不希望别人导入的私有代码
      
      ### 命名约定
      - 使用短小的、有意义的变量名
      - 接口名应当以-er结尾
      - 避免包名和导入路径中的下划线
      
      ### 错误处理
      - 错误是值，应该被检查和处理
      - 使用errors.Is和errors.As进行错误比较
      - 使用fmt.Errorf和%w包装错误
      
      ### 代码组织
      - 保持包的小型化和聚焦
      - 避免循环依赖
      - 使用依赖注入而非全局变量
    `,
	},
	{
		id: 7,
		title: 'RESTful API 设计规范',
		description: '面向微服务架构的RESTful API设计和版本管理指南',
		language: 'general',
		category: 'architecture',
		version: '3.1.2',
		lastUpdated: '2023-08-10',
		popularity: 91,
		content: `
      ## RESTful API 设计规范
      
      ### 资源命名
      - 使用名词复数形式命名资源集合
      - 使用连字符(-)而非下划线(_)
      - 路径全部使用小写字母
      
      ### HTTP方法使用
      - GET: 获取资源，不应有副作用
      - POST: 创建资源
      - PUT: 全量更新资源
      - PATCH: 部分更新资源
      - DELETE: 删除资源
      
      ### 状态码使用
      - 200: 成功
      - 201: 创建成功
      - 400: 客户端错误
      - 401/403: 未授权/禁止访问
      - 404: 资源不存在
      - 500: 服务器错误
      
      ### 版本管理
      - 在URL中使用版本号 (例如 /api/v1/resources)
      - 使用API网关进行版本路由
      - 保持向后兼容性
    `,
	},
	{
		id: 8,
		title: 'C# 编码规范',
		description: '.NET Core和.NET 5+项目的C#编码风格指南，包含异步编程最佳实践',
		language: 'csharp',
		category: 'backend',
		version: '2.3.0',
		lastUpdated: '2023-06-22',
		popularity: 79,
		content: `
      ## C# 编码规范
      
      ### 命名规范
      - 使用PascalCase命名类型、属性、方法
      - 使用camelCase命名参数和局部变量
      - 接口前缀使用I (例如 IDisposable)
      
      ### 代码组织
      - 使用 #region 组织大型类中的代码
      - 将相关功能放置在同一命名空间中
      - 组织文件夹结构映射命名空间结构
      
      ### 异步编程
      - 方法名称使用Async后缀
      - 使用Task.ConfigureAwait(false)避免上下文切换
      - 正确传播取消令牌
      
      ### LINQ使用
      - 优先使用方法语法而非查询语法
      - 避免在循环中重复执行LINQ查询
      - 使用合适的LINQ方法提高可读性
    `,
	},
	{
		id: 9,
		title: 'CSS/SCSS 样式指南',
		description: '现代CSS架构和SCSS预处理器使用指南，包含组件化样式策略',
		language: 'css',
		category: 'frontend',
		version: '2.0.1',
		lastUpdated: '2023-07-18',
		popularity: 86,
		content: `
      ## CSS/SCSS 样式指南
      
      ### 命名约定
      - 使用BEM (Block-Element-Modifier)命名方法
      - 使用连字符(-)分隔单词
      - 类名使用小写字母
      
      ### SCSS使用规范
      - 保持嵌套深度不超过3层
      - 使用变量管理颜色、字体等
      - 使用mixin复用样式块
      
      ### 样式组织
      - 按组件组织样式文件
      - 使用SCSS模块化导入
      - 避免全局样式污染
      
      ### 性能考量
      - 避免过度特定的选择器
      - 避免使用!important
      - 使用简写属性减少代码量
    `,
	},
	{
		id: 10,
		title: '微前端架构规范',
		description: '企业级微前端应用的架构设计、模块拆分和集成测试指南',
		language: 'general',
		category: 'architecture',
		version: '1.1.0',
		lastUpdated: '2023-09-12',
		popularity: 88,
		content: `
      ## 微前端架构规范
      
      ### 应用拆分原则
      - 按业务领域划分微前端
      - 保持每个微前端自治
      - 定义清晰的应用边界
      
      ### 技术栈选择
      - 主框架使用统一技术栈
      - 子应用可以使用不同技术栈
      - 建立技术栈兼容性策略
      
      ### 集成方式
      - 使用Web Components封装微前端
      - 考虑使用Module Federation
      - 使用适当的路由策略
      
      ### 共享资源管理
      - 维护共享组件库
      - 共享身份认证服务
      - 定义全局状态管理策略
    `,
	},
	{
		id: 11,
		title: 'Rust 安全编码指南',
		description: 'Rust语言内存安全和并发编程的最佳实践，适用于系统级应用开发',
		language: 'rust',
		category: 'systems',
		version: '1.0.2',
		lastUpdated: '2023-08-28',
		popularity: 77,
		content: `
      ## Rust 安全编码指南
      
      ### 所有权和借用
      - 遵循所有权规则避免内存安全问题
      - 优先使用不可变借用
      - 尽量避免使用unsafe代码块
      
      ### 错误处理
      - 使用Result<T, E>处理可恢复错误
      - 对不可恢复错误使用panic!
      - 实现自定义错误类型
      
      ### 并发安全
      - 使用线程安全的数据结构
      - 正确使用互斥锁和读写锁
      - 利用Send和Sync特性确保线程安全
      
      ### 代码组织
      - 使用模块系统组织代码
      - 明确pub可见性
      - 使用Cargo工作空间管理大型项目
    `,
	},
	{
		id: 12,
		title: 'HTML 语义化规范',
		description: '面向可访问性和SEO优化的HTML结构和语义化标签使用指南',
		language: 'html',
		category: 'frontend',
		version: '2.2.0',
		lastUpdated: '2023-05-25',
		popularity: 83,
		content: `
      ## HTML 语义化规范
      
      ### 文档结构
      - 使用HTML5 DOCTYPE
      - 包含适当的meta标签
      - 使用语言属性(lang)
      
      ### 语义化标签
      - 使用<header>, <nav>, <main>, <article>, <section>, <footer>等语义化标签
      - 正确使用标题层级 (h1-h6)
      - 使用<figure>和<figcaption>组合展示图片
      
      ### 可访问性
      - 添加适当的ARIA角色和属性
      - 确保表单元素有关联的标签
      - 提供alt文本给图片
      
      ### SEO优化
      - 使用合适的title和meta description
      - 添加结构化数据 (Schema.org)
      - 确保链接文本有意义
    `,
	},
];

// 类别列表
const categories = [
	{ id: 'all', name: '全部' },
	{ id: 'frontend', name: '前端' },
	{ id: 'backend', name: '后端' },
	{ id: 'architecture', name: '架构' },
	{ id: 'systems', name: '系统开发' },
];

// 规范详情弹窗组件
interface StandardDetailModalProps {
	standard: typeof mockCodingStandards[0] | null;
	isOpen: boolean;
	onClose: () => void;
}

const StandardDetailModal: React.FC<StandardDetailModalProps> = ({ standard, isOpen, onClose }) => {
	if (!isOpen || !standard) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				<div className="flex justify-between items-center p-6 border-b">
					<div className="flex items-center">
						<h2 className="text-2xl font-bold text-gray-900">{standard.title}</h2>
						<span className="ml-3 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              {standard.language}
            </span>
						<span className="ml-2 text-sm text-gray-500">v{standard.version}</span>
					</div>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 focus:outline-none"
					>
						<X size={24}/>
					</button>
				</div>

				<div className="p-6 overflow-y-auto flex-grow">
					<div className="flex items-center text-sm text-gray-500 mb-6">
						<Calendar size={16} className="mr-1"/>
						最后更新于: {standard.lastUpdated}
					</div>

					<div className="prose max-w-none">
						<div dangerouslySetInnerHTML={{
							__html: standard.content
								.replace(/^#{1,6}\s+(.*?)$/gm, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
								.replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
								.replace(/<li/g, '<li class="my-1"')
								.split('\n\n').join('<br />')
						}}/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default function CodingStandardsPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [activeCategory, setActiveCategory] = useState('all');
	const [selectedStandard, setSelectedStandard] = useState<typeof mockCodingStandards[0] | null>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

	// 打开规范详情弹窗
	const openStandardDetail = (standard: typeof mockCodingStandards[0]) => {
		setSelectedStandard(standard);
		setIsDetailModalOpen(true);
	};

	// 关闭规范详情弹窗
	const closeStandardDetail = () => {
		setIsDetailModalOpen(false);
	};

	// 筛选后的编码规范
	const filteredStandards = mockCodingStandards.filter(standard => {
		const matchesSearch =
			standard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			standard.description.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = activeCategory === 'all' || standard.category === activeCategory;
		return matchesSearch && matchesCategory;
	});

	return (
		<div className="flex flex-col from-slate-50 to-white min-h-screen">
			{/* 页面标题区域 */}
			<div className="my-8 lg:my-12 max-w-4xl mx-auto text-center">
				<h1 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-800 relative inline-block">
					规范中心
					<div className="absolute -top-4 -right-8 w-12 h-12 text-blue-500 opacity-40 rotate-12">
						<BookOpen size={48} strokeWidth={1}/>
					</div>
				</h1>
				<p className="text-xl text-slate-600 max-w-3xl mx-auto">
					集中管理和维护企业级软件开发的编码规范，提升代码质量与团队协作效率
				</p>
			</div>

			{/* 搜索和筛选区域 */}
			<div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-5xl mx-auto w-full">
				<div className="relative flex-grow">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
					<input
						type="text"
						placeholder="搜索编码规范..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
				<div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
					{categories.map(category => (
						<button
							key={category.id}
							onClick={() => setActiveCategory(category.id)}
							className={cn(
								"px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
								activeCategory === category.id
									? "bg-blue-600 text-white"
									: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
							)}
						>
							{category.name}
						</button>
					))}
				</div>
			</div>

			{/* 编码规范列表 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
				{filteredStandards.map(standard => {
					const LanguageIcon = languageIconMap[standard.language]?.icon || Book;
					const languageColor = languageIconMap[standard.language]?.color || 'text-gray-500';

					return (
						<div
							key={standard.id}
							className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
						>
							<div className="p-6">
								<div className="flex justify-between items-start mb-4">
									<div className={cn("p-2 rounded-lg bg-gray-100", languageColor)}>
										<LanguageIcon size={22}/>
									</div>
									<div className="flex items-center">
										<span className="text-sm text-gray-500 mr-3">v{standard.version}</span>
										<span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      {standard.language}
                    </span>
									</div>
								</div>

								<h3 className="text-xl font-bold text-gray-900 mb-2">{standard.title}</h3>
								<p className="text-gray-600 text-sm mb-4 line-clamp-2">{standard.description}</p>

								<div className="flex justify-between items-center mt-4">
									<div className="text-sm text-gray-500 flex items-center">
										<Calendar size={16} className="mr-1.5"/>
										{standard.lastUpdated}
									</div>
								</div>
							</div>

							<div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
								<button
									onClick={() => openStandardDetail(standard)}
									className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center"
								>
									<Info size={16} className="mr-1.5"/>
									查看详情
								</button>
							</div>
						</div>
					);
				})}
			</div>

			{/* 无结果提示 */}
			{filteredStandards.length === 0 && (
				<div className="text-center py-10">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
						<Book size={32} className="text-gray-400"/>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">未找到符合条件的编码规范</h3>
					<p className="text-gray-500 max-w-md mx-auto">
						尝试调整搜索条件或浏览其他类别的规范
					</p>
				</div>
			)}

			{/* 规范详情弹窗 */}
			<StandardDetailModal
				standard={selectedStandard}
				isOpen={isDetailModalOpen}
				onClose={closeStandardDetail}
			/>
		</div>
	);
}
