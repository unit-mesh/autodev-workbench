"use client"

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
	Search,
	Book,
	Code,
	FileCode,
	BookOpen,
	X,
	Calendar,
	Info,
	Plus,
	Edit,
	Loader2,
	Database
} from 'lucide-react';
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { toast } from 'sonner';

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
	kotlin: { icon: FileCode, color: 'text-purple-700' },
	general: { icon: Book, color: 'text-gray-500' },
};

// 编码规范状态枚举
enum StandardStatus {
  DRAFT = "草稿",
  PUBLISHED = "已发布",
  ARCHIVED = "已归档",
}

// 服务器端状态映射
const statusMapping = {
  "草稿": "DRAFT",
  "已发布": "PUBLISHED",
  "已归档": "ARCHIVED"
};

// 反向状态映射
const reverseStatusMapping = {
  "DRAFT": "草稿",
  "PUBLISHED": "已发布",
  "ARCHIVED": "已归档"
};

// 架构规范分类
const architectureCategories = [
  {
    title: "技术架构规范",
    value: "technical",
    children: [
      { title: "技术栈规范", value: "tech-stack" },
      { title: "数据库选型规范", value: "database-selection" },
      { title: "缓存使用规范", value: "caching" },
    ],
  },
  {
    title: "应用架构规范",
    value: "application",
    children: [
      { title: "分层架构规范", value: "layered-architecture" },
      { title: "模块化规范", value: "modularization" },
      { title: "微服务边界划分规范", value: "microservice-boundaries" },
    ],
  },
  {
    title: "数据架构规范",
    value: "data",
    children: [
      { title: "数据库设计规范", value: "database-design" },
      { title: "数据字典规范", value: "data-dictionary" },
      { title: "数据模型标准", value: "data-model" },
    ],
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

// 规范的类型定义
interface Standard {
  id: number;
  title: string;
  description: string;
  language: string;
  category: string | { subcategory: string };
  version: string;
  lastUpdated: string | Date;
  popularity: number;
  content: string;
  status?: string;
}

// 规范详情弹窗组件
interface StandardDetailModalProps {
	standard: Standard | null;
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

// 规范编辑/添加弹窗组件
interface StandardEditModalProps {
	standard: Standard | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (standard: any) => void;
}

const StandardEditModal: React.FC<StandardEditModalProps> = ({ standard, isOpen, onClose, onSave }) => {
	const [formData, setFormData] = useState({
		id: 0,
		title: '',
		description: '',
		language: 'general',
		category: 'frontend',
		version: '1.0.0',
		status: StandardStatus.DRAFT,
		content: '',
	});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (standard) {
			setFormData({
				id: standard.id,
				title: standard.title,
				description: standard.description || '',
				language: standard.language,
				category: typeof standard.category === 'string' ? standard.category : 'frontend',
				version: standard.version,
				status: reverseStatusMapping[standard.status as keyof typeof reverseStatusMapping] as StandardStatus || StandardStatus.PUBLISHED,
				content: standard.content,
			});
		} else {
			setFormData({
				id: 0, // 后端会生成ID
				title: '',
				description: '',
				language: 'general',
				category: 'frontend',
				version: '1.0.0',
				status: StandardStatus.DRAFT,
				content: '',
			});
		}
	}, [standard, isOpen]);

	const handleChange = (field: string, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		try {
			setLoading(true);
			const data = {
				...formData,
				status: statusMapping[formData.status as keyof typeof statusMapping],
				category: { subcategory: formData.category }, // 转换为后端需要的格式
			};
			
			await onSave(data);
			toast.success(standard ? '规范已更新' : '新规范已创建');
		} catch (error) {
			console.error('保存失败:', error);
			toast.error('保存失败，请重试');
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
				<div className="flex justify-between items-center p-6 border-b">
					<div className="flex items-center">
						<h2 className="text-2xl font-bold text-gray-900">
							{standard ? '编辑规范' : '添加规范'}
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 focus:outline-none"
					>
						<X size={24}/>
					</button>
				</div>

				<div className="p-6 overflow-y-auto flex-grow">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								标题
							</label>
							<input
								type="text"
								value={formData.title}
								onChange={(e) => handleChange('title', e.target.value)}
								className="w-full p-2 border border-gray-300 rounded-md"
								placeholder="规范标题"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								描述
							</label>
							<input
								type="text"
								value={formData.description}
								onChange={(e) => handleChange('description', e.target.value)}
								className="w-full p-2 border border-gray-300 rounded-md"
								placeholder="简短描述"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								语言
							</label>
							<select
								value={formData.language}
								onChange={(e) => handleChange('language', e.target.value)}
								className="w-full p-2 border border-gray-300 rounded-md"
							>
								{Object.keys(languageIconMap).map(lang => (
									<option key={lang} value={lang}>
										{lang.charAt(0).toUpperCase() + lang.slice(1)}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								类别
							</label>
							<select
								value={formData.category}
								onChange={(e) => handleChange('category', e.target.value)}
								className="w-full p-2 border border-gray-300 rounded-md"
							>
								{categories.filter(cat => cat.id !== 'all').map(category => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								版本
							</label>
							<input
								type="text"
								value={formData.version}
								onChange={(e) => handleChange('version', e.target.value)}
								className="w-full p-2 border border-gray-300 rounded-md"
								placeholder="1.0.0"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								状态
							</label>
							<select
								value={formData.status}
								onChange={(e) => handleChange('status', e.target.value as StandardStatus)}
								className="w-full p-2 border border-gray-300 rounded-md"
							>
								{Object.values(StandardStatus).map(status => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							内容 (Markdown 格式)
						</label>
						<div className="border border-gray-300 rounded-md overflow-hidden">
							<CodeMirror
								value={formData.content}
								height="500px"
								extensions={[markdown()]}
								onChange={(value) => handleChange('content', value)}
								className="text-sm"
							/>
						</div>
					</div>

					<div className="flex justify-end space-x-3 p-6 border-t">
						<button
							onClick={onClose}
							className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
							disabled={loading}
						>
							取消
						</button>
						<button
							onClick={handleSubmit}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
							disabled={loading}
						>
							{loading && <Loader2 size={16} className="mr-2 animate-spin" />}
							保存
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default function CodingStandardsPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [activeCategory, setActiveCategory] = useState('all');
	const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [standards, setStandards] = useState<Standard[]>([]);
	const [isAdminMode, setIsAdminMode] = useState(false);
	const [loading, setLoading] = useState(false);
	const [initLoading, setInitLoading] = useState(false);

	// 获取规范列表
	const fetchStandards = async () => {
		try {
			setLoading(true);
			const response = await fetch('/api/guideline');
			if (!response.ok) {
				throw new Error('获取规范失败');
			}
			const data = await response.json();
			
			// 转换数据格式以匹配前端需要的结构
			const formattedData = data.map((item: any) => ({
				id: item.id,
				title: item.title,
				description: item.description || '',
				language: item.language || 'general',
				category: typeof item.category === 'string' ? JSON.parse(item.category) : item.category,
				version: item.version || '1.0.0',
				lastUpdated: new Date(item.lastUpdated || item.updatedAt).toISOString().split('T')[0],
				popularity: item.popularity || 0,
				content: item.content,
				status: item.status
			}));
			
			setStandards(formattedData);
		} catch (error) {
			console.error('获取规范失败:', error);
			toast.error('获取规范列表失败');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStandards();
	}, []);

	// 打开规范详情弹窗
	const openStandardDetail = (standard: Standard) => {
		setSelectedStandard(standard);
		setIsDetailModalOpen(true);
	};

	// 关闭规范详情弹窗
	const closeStandardDetail = () => {
		setIsDetailModalOpen(false);
	};

	// 打开规范编辑弹窗
	const openEditModal = (standard: Standard | null = null) => {
		setSelectedStandard(standard);
		setIsEditModalOpen(true);
	};

	// 关闭规范编辑弹窗
	const closeEditModal = () => {
		setIsEditModalOpen(false);
	};

	// 保存规范
	const handleSaveStandard = async (standardData: any) => {
		try {
			// 确保 category 是字符串化的 JSON (Vercel Postgres 需要)
			if (typeof standardData.category === 'object') {
				standardData.category = JSON.stringify(standardData.category);
			}
			
			let response;
			if (selectedStandard?.id) {
				// 更新现有规范
				response = await fetch(`/api/guideline/${selectedStandard.id}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(standardData),
				});
			} else {
				// 添加新规范
				response = await fetch('/api/guideline', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(standardData),
				});
			}

			if (!response.ok) {
				throw new Error('保存规范失败');
			}

			// 重新获取规范列表
			await fetchStandards();
			closeEditModal();
		} catch (error) {
			console.error('保存规范失败:', error);
			throw error;
		}
	};

	// 初始化数据库和示例数据
	const handleInitializeDB = async () => {
		try {
			setInitLoading(true);
			const response = await fetch('/api/setup');
			if (!response.ok) {
				throw new Error('初始化数据库失败');
			}
			const data = await response.json();
			toast.success(data.message);
			
			// 重新获取规范列表
			await fetchStandards();
		} catch (error) {
			console.error('初始化数据库失败:', error);
			toast.error('初始化数据库失败');
		} finally {
			setInitLoading(false);
		}
	};

	// 筛选后的编码规范
	const filteredStandards = standards.filter(standard => {
		const matchesSearch =
			standard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(standard.description && standard.description.toLowerCase().includes(searchTerm.toLowerCase()));
		
		let categoryToMatch;
		if (typeof standard.category === 'string') {
			categoryToMatch = standard.category;
		} else if (standard.category && typeof standard.category === 'object') {
			categoryToMatch = (standard.category as { subcategory: string }).subcategory;
		}
		
		const matchesCategory = activeCategory === 'all' || categoryToMatch === activeCategory;
		return matchesSearch && matchesCategory;
	});

	return (
		<div className="flex flex-col from-slate-50 to-white min-h-screen">
			{/* 页面标题区域 */}
			<div className="my-8 lg:my-12 max-w-6xl mx-auto text-center">
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

			{/* 搜索、筛选和管理操作区域 */}
			<div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-6xl mx-auto w-full">
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
				<div className="flex gap-2">
					<button
						onClick={() => setIsAdminMode(!isAdminMode)}
						className={cn(
							"px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
							isAdminMode 
								? "bg-green-600 text-white"
								: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
						)}
					>
						{isAdminMode ? "退出管理" : "进入管理"}
					</button>
					{isAdminMode && (
						<>
							<button
								onClick={() => openEditModal()}
								className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-blue-600 text-white flex items-center gap-1"
							>
								<Plus size={16} />
								添加规范
							</button>
							<button
								onClick={handleInitializeDB}
								disabled={initLoading}
								className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-purple-600 text-white flex items-center gap-1"
							>
								{initLoading ? (
									<Loader2 size={16} className="mr-1 animate-spin" />
								) : (
									<Database size={16} className="mr-1" />
								)}
								初始化示例
							</button>
						</>
					)}
				</div>
			</div>

			{/* 编码规范列表 */}
			{loading ? (
				<div className="flex justify-center items-center py-20">
					<Loader2 size={40} className="text-blue-600 animate-spin" />
					<span className="ml-3 text-lg text-gray-600">加载规范中...</span>
				</div>
			) : (
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
											{typeof standard.lastUpdated === 'string' ? standard.lastUpdated : new Date(standard.lastUpdated).toISOString().split('T')[0]}
										</div>

										{isAdminMode && (
											<button
												onClick={() => openEditModal(standard)}
												className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
											>
												<Edit size={14} className="mr-1" />
												编辑
											</button>
										)}
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
			)}

			{/* 无结果提示 */}
			{!loading && filteredStandards.length === 0 && (
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

			{/* 规范编辑弹窗 */}
			<StandardEditModal
				standard={selectedStandard}
				isOpen={isEditModalOpen}
				onClose={closeEditModal}
				onSave={handleSaveStandard}
			/>
		</div>
	);
}
