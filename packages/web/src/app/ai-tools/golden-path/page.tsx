"use client"

import React, { useState, KeyboardEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeBlock } from "@/components/code/code-block";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
	const [activeTab, setActiveTab] = useState('config');
	const [aiPrompt, setAiPrompt] = useState('我需要一个带有用户认证、MySQL 数据库和 REST API 的微服务系统，主要用于客户订单管理');
	const [isAiProcessing, setIsAiProcessing] = useState(false);
	const [aiSuggested, setAiSuggested] = useState(false);

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
		setActiveTab('result');

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
					setAiSuggested(true);
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
		<div className="px-8 py-8">
			<h1 className="text-3xl font-bold mb-2">后端应用生成</h1>
			<p className="text-muted-foreground mb-6">基于 AI 生成符合最佳实践的项目配置</p>

			{/* AI Project Description Input */}
			<Card className="mb-8 gap-2">
				<CardHeader className="pb-0">
					<CardTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary"/>
						AI 项目描述
					</CardTitle>
					<CardDescription className="mt-0">
						用自然语言描述你的项目，AI 将帮助你自动配置项目设置 (按 Enter 发送，Alt+Enter 换行)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="relative">
						<Textarea
							value={aiPrompt}
							onChange={(e) => setAiPrompt(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="例如：我需要一个带有用户认证、MySQL 数据库和 REST API 的微服务系统，主要用于客户订单管理..."
							className="pr-12 resize-none"
							rows={3}
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

					{aiSuggested && (
						<Alert className="mt-3">
							<AlertTitle className="text-sm font-medium">AI 已生成项目建议</AlertTitle>
							<AlertDescription className="text-xs">
								AI 已根据你的描述自动配置了项目设置。你可以在下方进一步调整这些设置。
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="mb-4">
					<TabsTrigger value="config">配置项目</TabsTrigger>
					<TabsTrigger value="result" disabled={!generatedResult && !isLoading}>查看结果</TabsTrigger>
				</TabsList>

				<TabsContent value="config">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>项目基本信息</CardTitle>
								<CardDescription>定义你的项目核心属性</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label htmlFor="name">项目名称</Label>
									<div className="flex gap-2 mt-1">
										<Input
											id="name"
											value={metadata.name}
											onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
											placeholder="my-awesome-project"
											className="flex-1"
										/>
										<Button
											variant="outline"
											size="sm"
											onClick={handleAutoGenerateName}
											disabled={isLoading}
										>
											自动
										</Button>
									</div>
								</div>

								<div>
									<Label htmlFor="description">项目描述</Label>
									<Textarea
										id="description"
										value={metadata.description}
										onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
										placeholder="简要描述你的项目功能和目标"
										className="mt-1"
										rows={3}
									/>
								</div>

								<div>
									<Label>项目类型</Label>
									<Select
										value={metadata.type}
										onValueChange={(value) => setMetadata({ ...metadata, type: value })}
									>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="选择项目类型"/>
										</SelectTrigger>
										<SelectContent>
											{projectTypes.map((type) => (
												<SelectItem key={type.value} value={type.value}>
													{type.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label>编程语言</Label>
									<Select
										value={metadata.language}
										onValueChange={(value) => {
											const newFramework = frameworks[value as keyof typeof frameworks]?.[0]?.value || '';
											setMetadata({ ...metadata, language: value, framework: newFramework });
										}}
									>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="选择编程语言"/>
										</SelectTrigger>
										<SelectContent>
											{languages.map((lang) => (
												<SelectItem key={lang.value} value={lang.value}>
													{lang.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label>框架</Label>
									<Select
										value={metadata.framework}
										onValueChange={(value) => setMetadata({ ...metadata, framework: value })}
									>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="选择框架"/>
										</SelectTrigger>
										<SelectContent>
											{frameworks[metadata.language as keyof typeof frameworks]?.map((framework) => (
												<SelectItem key={framework.value} value={framework.value} className={
													framework.legacy ? "text-amber-500 flex items-center gap-1" : ""
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
							</CardContent>
						</Card>

						<Card className="col-span-2">
							<CardHeader>
								<CardTitle>功能特性</CardTitle>
								<CardDescription>选择需要包含的组件和功能</CardDescription>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-[450px] pr-4">
									<div className="space-y-6">
										{featureCategories.map((category) => (
											<div key={category.title} className="space-y-3">
												<h3 className="text-lg font-medium">{category.title}</h3>
												<p className="text-sm text-muted-foreground">{category.description}</p>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
													{category.features.map((feature) => (
														<div key={feature.id} className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50">
															<Checkbox
																id={feature.id}
																checked={metadata.features.includes(feature.id)}
																onCheckedChange={(checked) =>
																	handleFeatureToggle(feature.id, checked === true)
																}
																className="mt-1"
															/>
															<div>
																<Label
																	htmlFor={feature.id}
																	className="font-medium cursor-pointer"
																>
																	{feature.label}
																</Label>
																<p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
															</div>
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					</div>

					<div className="mt-8 flex justify-center">
						<Button
							size="lg"
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
								"生成项目模板"
							)}
						</Button>
					</div>
				</TabsContent>

				<TabsContent value="result">
					<Card>
						<CardHeader>
							<CardTitle>项目配置 JSON</CardTitle>
							<CardDescription>
								{metadata.name} ({metadata.language} / {currentFrameworkLabel})
								{allFrameworks.find(f => f.value === metadata.framework)?.legacy && (
									<span
										className="ml-2 text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded">
										Legacy
									</span>
								)}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="flex flex-col items-center justify-center py-12">
									<Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/>
									<p className="text-muted-foreground">生成项目配置中，这可能需要一点时间...</p>
								</div>
							) : (
								<>
									<ScrollArea className="h-[600px] w-full">
										<CodeBlock code={generatedResult} language="json"/>
									</ScrollArea>
								</>
							)}
						</CardContent>
					</Card>

					<div className="mt-6 flex justify-center gap-4">
						<Button variant="outline" onClick={() => setActiveTab('config')}>
							返回配置
						</Button>
						<Button
							onClick={copyToClipboard}
							disabled={isLoading || !generatedResult}
						>
							复制 JSON 配置
						</Button>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

