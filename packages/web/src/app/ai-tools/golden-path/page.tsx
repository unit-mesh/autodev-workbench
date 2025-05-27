"use client"

import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Send, FileJson } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeBlock } from "@/components/code/code-block";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface ProjectMetadata {
	name: string;
	description: string;
	type: string;
	language: string;
	framework: string;
	features: string[];
}

interface FeatureCategory {
	title: string;
	description: string;
	features: FeatureItem[];
}

interface FeatureItem {
	id: string;
	label: string;
	description: string;
}

interface FrameworkItem {
	value: string;
	label: string;
	legacy?: boolean;
}

export default function GoldenPathPage() {
	const [metadata, setMetadata] = useState<ProjectMetadata>({
		name: '',
		description: '',
		type: 'web',
		language: 'java', // Default is now Java
		framework: 'spring', // Default framework for Java
		features: [],
	});

	const [isLoading, setIsLoading] = useState(false);
	const [generatedResult, setGeneratedResult] = useState<string>('');
	const [aiPrompt, setAiPrompt] = useState('我需要一个带有用户认证、MySQL 数据库和 REST API 的微服务系统，主要用于客户订单管理');
	const [isAiProcessing, setIsAiProcessing] = useState(false);

	const projectTypes = [
		{ value: 'web', label: 'Web 应用' },
		{ value: 'api', label: 'API 服务' },
		{ value: 'microservice', label: '微服务' },
		{ value: 'cli', label: '命令行工具' },
		{ value: 'library', label: '库/包' },
	];

	const languages = [
		{ value: 'java', label: 'Java' },
		{ value: 'kotlin', label: 'Kotlin' },
		{ value: 'typescript', label: 'TypeScript' },
		{ value: 'python', label: 'Python' },
		{ value: 'go', label: 'Go' },
	];

	const frameworks: Record<string, FrameworkItem[]> = {
		java: [
			{ value: 'spring3', label: 'Spring Boot 3.x' },
			{ value: 'spring2', label: 'Spring Boot 2.x', legacy: true },
			{ value: 'quarkus', label: 'Quarkus' },
			{ value: 'micronaut', label: 'Micronaut' },
		],
		kotlin: [
			{ value: 'spring3', label: 'Spring Boot 3.x' },
			{ value: 'spring2', label: 'Spring Boot 2.x', legacy: true },
			{ value: 'ktor', label: 'Ktor' },
		],
		typescript: [
			{ value: 'next', label: 'Next.js' },
			{ value: 'express', label: 'Express' },
			{ value: 'nestjs', label: 'NestJS' },
		],
		python: [
			{ value: 'fastapi', label: 'FastAPI' },
			{ value: 'django', label: 'Django' },
			{ value: 'flask', label: 'Flask' },
		],
		go: [
			{ value: 'gin', label: 'Gin' },
			{ value: 'echo', label: 'Echo' },
			{ value: 'fiber', label: 'Fiber' },
		],
	};

	const featureCategories: FeatureCategory[] = [
		{
			title: "基础后端组件",
			description: "构建应用程序核心功能所需的基础组件",
			features: [
				{ id: 'auth', label: '认证授权', description: '包含 JWT、OAuth2、RBAC 等认证与授权能力' },
				{ id: 'database', label: '数据库集成', description: '集成关系型数据库及 ORM 框架' },
				{ id: 'nosql', label: 'NoSQL 数据库', description: '集成非关系型数据库如 MongoDB、Redis' },
				{ id: 'api-docs', label: 'API 文档', description: '自动生成 Swagger/OpenAPI 文档' },
				{ id: 'validation', label: '数据验证', description: '请求参数验证和业务规则校验' },
				{ id: 'cache', label: '缓存系统', description: '本地缓存和分布式缓存方案' },
				{ id: 'messaging', label: '消息队列', description: '集成 Kafka、RabbitMQ 等消息中间件' },
			]
		},
		{
			title: "PaaS 组件",
			description: "云平台相关的功能组件",
			features: [
				{ id: 'service-discovery', label: '服务发现', description: '集成服务注册与发现组件' },
				{ id: 'config-server', label: '配置中心', description: '外部集中化配置管理' },
				{ id: 'api-gateway', label: 'API 网关', description: '请求路由、限流、认证等网关功能' },
				{ id: 'distributed-tracing', label: '分布式追踪', description: '请求追踪和链路分析' },
				{ id: 'cloud-storage', label: '云存储', description: '对象存储、文件系统集成' },
				{ id: 'serverless', label: 'Serverless', description: '无服务器函数即服务能力' },
			]
		},
		{
			title: "DevOps 工具",
			description: "持续集成、部署和运维相关功能",
			features: [
				{ id: 'docker', label: 'Docker 支持', description: 'Dockerfile 和容器化配置' },
				{ id: 'kubernetes', label: 'Kubernetes 配置', description: 'K8s 部署清单和配置' },
				{ id: 'ci-cd', label: 'CI/CD 流水线', description: '持续集成和部署配置' },
				{ id: 'testing', label: '测试框架', description: '单元测试、集成测试和性能测试' },
				{ id: 'logging', label: '日志系统', description: '结构化日志和聚合方案' },
				{ id: 'monitoring', label: '监控指标', description: '应用监控和健康检查' },
				{ id: 'chaos-engineering', label: '混沌工程', description: '故障注入和弹性测试工具' },
			]
		}
	];

	const allFrameworks = Object.values(frameworks).flat();
	const currentFrameworkLabel = allFrameworks.find(f => f.value === metadata.framework)?.label || '';

	const handleGenerate = async () => {
		setIsLoading(true);

		try {
			// Build prompt for LLM
			const selectedFeatureLabels = metadata.features.map(featureId => {
				const category = featureCategories.find(cat =>
					cat.features.some(f => f.id === featureId)
				);
				const feature = category?.features.find(f => f.id === featureId);
				return feature?.label || featureId;
			});

			// Get framework details including version info for the prompt
			const frameworkInfo = allFrameworks.find(f => f.value === metadata.framework);
			const frameworkLabel = frameworkInfo?.label || '';
			const isLegacy = frameworkInfo?.legacy === true;
			const frameworkDescription = isLegacy ?
				`${frameworkLabel} (Legacy version)` : frameworkLabel;

			const prompt = `
Generate a JSON configuration for a ${frameworkDescription} ${metadata.type} application named "${metadata.name}".
Description: ${metadata.description || "No description provided"}
Programming Language: ${metadata.language}
Required Features: ${selectedFeatureLabels.join(', ') || "No specific features selected"}
${isLegacy ? "Note: This is using a legacy version of the framework which may have different dependencies and configurations." : ""}

Please provide a JSON configuration with the following structure:
{
  "projectConfig": {
    "name": "${metadata.name}",
    "description": "${metadata.description}",
    "type": "${metadata.type}",
    "language": "${metadata.language}",
    "framework": "${metadata.framework}"
  },
  "features": [
    // Array of selected feature IDs
  ],
  "structure": {
    // Key directories and files in the project structure
  },
  "dependencies": {
    // Key dependencies needed for the project
    // If using Spring Boot, specify appropriate version-specific dependencies
  },
  "configurations": {
    // Configuration files content or snippets
  }
}

Only return the JSON object without any explanation or markdown. Ensure the JSON is valid and well-formatted.
      `.trim();

			// Call your LLM API here
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: [
						{
							role: "system",
							content: "You are an expert software architect specializing in creating project configurations. Provide a detailed JSON configuration for the project based on the user's requirements. Only return the JSON object without any explanation or markdown."
						},
						{ role: "user", content: prompt }
					],
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate response");
			}

			const data = await response.json();

			// Extract JSON from response if needed
			let jsonResult = data.text;
			try {
				// Try to extract JSON if wrapped in code blocks
				const jsonMatch = jsonResult.match(/```json\s*([\s\S]*?)\s*```/) ||
					jsonResult.match(/```\s*([\s\S]*?)\s*```/);

				if (jsonMatch) {
					jsonResult = jsonMatch[1].trim();
				}

				// Validate JSON by parsing it
				JSON.parse(jsonResult);
			} catch (e) {
				console.error("Invalid JSON in response", e);
			}

			setGeneratedResult(jsonResult);
		} catch (error) {
			console.error("Error generating project:", error);
			setGeneratedResult("抱歉，生成项目配置时出现错误。请稍后重试。");
		} finally {
			setIsLoading(false);
		}
	};

	const handleFeatureToggle = (featureId: string, checked: boolean) => {
		const newFeatures = checked
			? [...metadata.features, featureId]
			: metadata.features.filter((f) => f !== featureId);
		setMetadata({ ...metadata, features: newFeatures });
	};

	const handleAutoGenerateName = async () => {
		if (metadata.name) return; // Skip if user already entered a name

		setIsLoading(true);
		try {
			// Call LLM to suggest a project name based on selected features
			const selectedFeatures = metadata.features.map(featureId => {
				const category = featureCategories.find(cat =>
					cat.features.some(f => f.id === featureId)
				);
				const feature = category?.features.find(f => f.id === featureId);
				return feature?.label || featureId;
			});

			const prompt = `
Suggest a creative project name for a ${metadata.type} application built with ${metadata.language} and ${currentFrameworkLabel}.
The application includes these features: ${selectedFeatures.join(', ') || "basic features"}.
Please respond with just the project name in kebab-case (lowercase with hyphens).
      `.trim();

			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: [
						{
							role: "system",
							content: "You are a creative naming assistant. When asked to generate a project name, provide only the name in kebab-case without any explanation or additional text."
						},
						{ role: "user", content: prompt }
					],
				}),
			});

			if (response.ok) {
				const data = await response.json();
				// Clean up the response to get just the name
				const suggestedName = data.text.replace(/["`']/g, '').trim();
				setMetadata({ ...metadata, name: suggestedName });
			}
		} catch (error) {
			console.error("Error generating name suggestion:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAiSuggest = async () => {
		if (!aiPrompt.trim()) return;

		setIsAiProcessing(true);

		try {
			const prompt = `
Based on this project description: "${aiPrompt}", please analyze and suggest appropriate settings for a new project.
Respond with a JSON object containing these fields:
- name: A suitable project name in kebab-case
- description: A clear project description based on the input
- type: One of these project types: web, api, microservice, cli, library
- language: Recommended programming language (java, kotlin, typescript, python, go)
- framework: Appropriate framework for the selected language. 
  For Java/Kotlin, specify "spring3" for Spring Boot 3.x (current) or "spring2" for Spring Boot 2.x (legacy) if needed.

- features: Array of feature IDs to include (from this list: auth, database, nosql, api-docs, validation, cache, messaging, service-discovery, config-server, api-gateway, distributed-tracing, cloud-storage, serverless, docker, kubernetes, ci-cd, testing, logging, monitoring, chaos-engineering)

Provide only the JSON object without any additional text or explanations.
      `.trim();

			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: [
						{
							role: "system",
							content: "You are an expert software architect specializing in creating project templates. Analyze the user's project description and provide appropriate project settings in JSON format."
						},
						{ role: "user", content: prompt }
					],
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate suggestions");
			}

			const data = await response.json();

			try {
				const jsonMatch = data.text.match(/```json\s*([\s\S]*?)\s*```/) ||
					data.text.match(/```\s*([\s\S]*?)\s*```/) ||
					[null, data.text];
				const jsonString = jsonMatch[1].trim();
				const suggestions = JSON.parse(jsonString);

				// Validate suggestions and apply them
				if (suggestions) {
					const newMetadata = { ...metadata };

					if (suggestions.name) newMetadata.name = suggestions.name;
					if (suggestions.description) newMetadata.description = suggestions.description;
					if (suggestions.type && projectTypes.some(t => t.value === suggestions.type)) {
						newMetadata.type = suggestions.type;
					}
					if (suggestions.language && languages.some(l => l.value === suggestions.language)) {
						newMetadata.language = suggestions.language;
						// Also update framework to match the language
						const frameworksForLanguage = frameworks[suggestions.language as keyof typeof frameworks] || [];
						if (frameworksForLanguage.length > 0) {
							if (suggestions.framework && frameworksForLanguage.some(f => f.value === suggestions.framework)) {
								newMetadata.framework = suggestions.framework;
							} else {
								newMetadata.framework = frameworksForLanguage[0].value;
							}
						}
					}

					// Handle features - validate each one exists
					if (suggestions.features && Array.isArray(suggestions.features)) {
						const validFeatures = suggestions.features.filter((featureId: string) =>
							featureCategories.some(category =>
								category.features.some(feature => feature.id === featureId)
							)
						);
						newMetadata.features = validFeatures;
					}

					setMetadata(newMetadata);
				}
			} catch (parseError) {
				console.error("Error parsing suggestion JSON:", parseError);
			}
		} catch (error) {
			console.error("Error generating suggestions:", error);
		} finally {
			setIsAiProcessing(false);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.altKey && !isAiProcessing && aiPrompt.trim()) {
			e.preventDefault();
			handleAiSuggest();
		}
		// Allow Alt+Enter for new line
	};

	const copyToClipboard = () => {
		navigator.clipboard.writeText(generatedResult)
			.then(() => {
				alert("JSON 配置已复制到剪贴板");
			})
			.catch(err => {
				console.error("无法复制到剪贴板: ", err);
			});
	};

	return (
		<div className="flex flex-col h-screen bg-gray-50">
			<header className="p-4 border-b bg-white z-10 flex items-center justify-between shadow-sm">
				<div className="flex items-center">
					<h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
						后端应用生成
					</h1>
				</div>
				<div className="flex items-center gap-2">
					{isLoading && (
						<div className="flex items-center space-x-2 text-sm text-muted-foreground">
							<Loader2 className="h-3 w-3 animate-spin"/>
							<span>生成中...</span>
						</div>
					)}
				</div>
			</header>

			<div className="flex-1 overflow-hidden">
				<PanelGroup direction="horizontal" className="h-full">
					{/* Configuration Panel */}
					<Panel id="config-panel" defaultSize={50} minSize={30}>
						<div className="flex flex-col h-full bg-white border-r">
							<ScrollArea className="flex-1">
								<div className="p-4 space-y-4">
									{/* AI Project Description Input */}
									<div className="mb-2">
										<div className="mb-1">
											<Label className="text-sm flex items-center gap-1">
												<Sparkles className="h-4 w-4 text-blue-500"/>
												AI 项目描述
											</Label>
											<p className="text-xs text-muted-foreground">
												用自然语言描述你的项目 (按 Enter 发送，Alt+Enter 换行)
											</p>
										</div>
										<div className="relative">
											<Textarea
												value={aiPrompt}
												onChange={(e) => setAiPrompt(e.target.value)}
												onKeyDown={handleKeyDown}
												placeholder="例如：我需要一个带有用户认证、MySQL 数据库和 REST API 的微服务系统..."
												className="pr-12 resize-none text-sm"
												rows={2}
												disabled={isAiProcessing}
											/>
											<Button
												className="absolute right-2 bottom-2"
												size="icon"
												variant="ghost"
												onClick={handleAiSuggest}
												disabled={isAiProcessing || !aiPrompt.trim()}
											>
												{isAiProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
											</Button>
										</div>
									</div>

									{/* Project Basic Info - More Compact Layout */}
									<div className="space-y-4">
										{/* Name and Description in one row with different widths */}
										<div className="flex gap-3">
											<div className="w-2/5">
												<Label htmlFor="name" className="text-xs">项目名称</Label>
												<div className="flex gap-1 mt-1">
													<Input
														id="name"
														value={metadata.name}
														onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
														placeholder="my-awesome-project"
														className="flex-1 text-sm h-9"
													/>
													<Button
														variant="outline"
														size="sm"
														onClick={handleAutoGenerateName}
														disabled={isLoading}
														className="text-xs h-9 whitespace-nowrap"
													>
														自动
													</Button>
												</div>
											</div>

											<div className="flex-1">
												<Label htmlFor="description" className="text-xs">项目描述</Label>
												<Textarea
													id="description"
													value={metadata.description}
													onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
													placeholder="简要描述你的项目功能和目标"
													className="mt-1 text-sm resize-none"
													rows={1}
												/>
											</div>
										</div>

										{/* Type, Language, Framework in one row */}
										<div className="flex gap-3">
											<div className="flex-1">
												<Label className="text-xs">项目类型</Label>
												<Select
													value={metadata.type}
													onValueChange={(value) => setMetadata({ ...metadata, type: value })}
												>
													<SelectTrigger className="mt-1 text-sm h-9">
														<SelectValue placeholder="选择项目类型"/>
													</SelectTrigger>
													<SelectContent>
														{projectTypes.map((type) => (
															<SelectItem key={type.value} value={type.value} className="text-sm">
																{type.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<div className="flex-1">
												<Label className="text-xs">编程语言</Label>
												<Select
													value={metadata.language}
													onValueChange={(value) => {
														const newFramework = frameworks[value as keyof typeof frameworks]?.[0]?.value || '';
														setMetadata({ ...metadata, language: value, framework: newFramework });
													}}
												>
													<SelectTrigger className="mt-1 text-sm h-9">
														<SelectValue placeholder="选择编程语言"/>
													</SelectTrigger>
													<SelectContent>
														{languages.map((lang) => (
															<SelectItem key={lang.value} value={lang.value} className="text-sm">
																{lang.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<div className="flex-1">
												<Label className="text-xs">框架</Label>
												<Select
													value={metadata.framework}
													onValueChange={(value) => setMetadata({ ...metadata, framework: value })}
												>
													<SelectTrigger className="mt-1 text-sm h-9">
														<SelectValue placeholder="选择框架"/>
													</SelectTrigger>
													<SelectContent>
														{frameworks[metadata.language as keyof typeof frameworks]?.map((framework) => (
															<SelectItem key={framework.value} value={framework.value} className={
																framework.legacy ? "text-amber-500 flex items-center gap-1 text-sm" : "text-sm"
															}>
																{framework.label}
																{framework.legacy && (
																	<span
																		className="ml-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded">
																		Legacy
																	</span>
																)}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>

										{/* Feature Selection - More compact categories */}
										<div className="pt-1">
											<h3 className="text-sm font-medium mb-2">功能特性</h3>

											{featureCategories.map((category) => (
												<div key={category.title} className="space-y-1 border rounded-md p-2 mb-3">
													<div className="flex justify-between items-start">
														<div>
															<h4 className="text-xs font-medium">{category.title}</h4>
															<p className="text-xs text-muted-foreground">{category.description}</p>
														</div>
													</div>
													<div className="grid grid-cols-3 gap-x-2 gap-y-1 mt-1">
														{category.features.map((feature) => (
															<div key={feature.id} className="flex items-start space-x-2 p-1 rounded hover:bg-muted/50">
																<Checkbox
																	id={feature.id}
																	checked={metadata.features.includes(feature.id)}
																	onCheckedChange={(checked) =>
																		handleFeatureToggle(feature.id, checked === true)
																	}
																	className="mt-0.5"
																/>
																<div>
																	<Label
																		htmlFor={feature.id}
																		className="text-xs font-medium cursor-pointer"
																	>
																		{feature.label}
																	</Label>
																	<p className="text-[10px] text-muted-foreground leading-tight">{feature.description}</p>
																</div>
															</div>
														))}
													</div>
												</div>
											))}
										</div>

										<div className="flex justify-center pt-2 pb-6">
											<Button
												onClick={handleGenerate}
												disabled={!metadata.name || !metadata.framework || isLoading}
												className="px-8"
											>
												{isLoading ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
														生成中...
													</>
												) : (
													"生成项目配置"
												)}
											</Button>
										</div>
									</div>
								</div>
							</ScrollArea>
						</div>
					</Panel>

					<PanelResizeHandle
						className="w-1 hover:w-2 bg-gray-200 hover:bg-blue-400 transition-all duration-150 relative group"
					>
						<div
							className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded group-hover:bg-blue-600"></div>
					</PanelResizeHandle>

					{/* Result Panel */}
					<Panel id="result-panel" defaultSize={50} minSize={30}>
						<div className="flex flex-col h-full bg-white border-l">
							<div className="p-3 border-b">
								<div className="flex items-center space-x-2">
									<FileJson className="h-5 w-5 text-blue-500"/>
									<h2 className="text-base font-medium">配置预览</h2>
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									{metadata.name ?
										`${metadata.name} (${metadata.language} / ${currentFrameworkLabel})` :
										"生成的项目配置将显示在这里"
									}
									{allFrameworks.find(f => f.value === metadata.framework)?.legacy && (
										<span
											className="ml-2 text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded">
											Legacy
										</span>
									)}
								</p>
							</div>

							<div className="flex-1 overflow-hidden p-4">
								{isLoading ? (
									<div className="flex flex-col items-center justify-center h-full">
										<Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4"/>
										<p className="text-muted-foreground">生成项目配置中，这可能需要一点时间...</p>
									</div>
								) : generatedResult ? (
									<>
										<ScrollArea className="h-full w-full">
											<CodeBlock code={generatedResult} language="json"/>
										</ScrollArea>

										<div className="absolute bottom-4 right-4">
											<Button
												onClick={copyToClipboard}
												variant="outline"
												size="sm"
												className="bg-white shadow-md"
											>
												复制 JSON
											</Button>
										</div>
									</>
								) : (
									<div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
										<FileJson size={48} className="mb-4 text-blue-200"/>
										<p className="text-sm">填写项目信息并点击&#34;生成项目配置&#34;按钮</p>
										<p className="text-xs mt-2">配置生成后将显示在此处</p>
									</div>
								)}
							</div>
						</div>
					</Panel>
				</PanelGroup>
			</div>
		</div>
	);
}
