"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileJson, Save, Copy, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeBlock } from "@/components/code/code-block";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProjectConfigForm from './components/ProjectConfigForm';
// 假设有 Dialog 组件
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ProjectMetadata {
	name: string;
	description: string;
	type: string;
	language: string;
	framework: string;
	features: string[];
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
		language: 'java',
		framework: 'spring3',
		features: [],
	});

	const [isLoading, setIsLoading] = useState(false);
	const [generatedResult, setGeneratedResult] = useState<string>('');
	const [isSaving, setIsSaving] = useState(false);
	const [savedConfigId, setSavedConfigId] = useState<string>('');
	const [dialogOpen, setDialogOpen] = useState(false);

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

	const allFrameworks = Object.values(frameworks).flat();
	const currentFrameworkLabel = allFrameworks.find(f => f.value === metadata.framework)?.label || '';

	const handleGenerate = () => {
		setIsLoading(true);

		// 构建项目配置 JSON，基于用户填写的表单数据
		const frameworkInfo = allFrameworks.find(f => f.value === metadata.framework);
		const isLegacy = frameworkInfo?.legacy === true;

		const projectConfig = {
			projectConfig: {
				name: metadata.name,
				description: metadata.description || "No description provided",
				type: metadata.type,
				language: metadata.language,
				framework: metadata.framework,
				frameworkLabel: frameworkInfo?.label || '',
				isLegacy: isLegacy
			},
			features: metadata.features,
			structure: generateProjectStructure(metadata),
			dependencies: generateDependencies(metadata),
			configurations: generateConfigurations(metadata)
		};

		// 模拟异步操作以保持 UI 一致性
		setTimeout(() => {
			const jsonResult = JSON.stringify(projectConfig, null, 2);
			setGeneratedResult(jsonResult);
			setIsLoading(false);
		}, 500);
	};

	// 根据项目配置生成项目结构
	const generateProjectStructure = (config: ProjectMetadata) => {
		const directories: string[] = [];
		const files: string[] = [];

		// 基础文件
		files.push("README.md", ".gitignore");

		// 根据语言和框架添加特定结构
		if (config.language === 'java' || config.language === 'kotlin') {
			directories.push(
				"src/main/java",
				"src/main/resources",
				"src/test/java",
				"src/test/resources"
			);
			files.push("pom.xml");
			
			if (config.framework.startsWith('spring')) {
				files.push("src/main/resources/application.yml");
			}
		}
		
		if (config.language === 'typescript') {
			directories.push("src", "dist", "node_modules");
			files.push("package.json", "tsconfig.json");
			
			if (config.framework === 'next') {
				directories.push("pages", "components", "public");
				files.push("next.config.js");
			}
		}

		if (config.language === 'python') {
			directories.push("src", "tests", "docs");
			files.push("requirements.txt", "setup.py");
		}

		// Docker 支持
		if (config.features.includes('docker')) {
			files.push("Dockerfile", "docker-compose.yml");
		}

		return { directories, files };
	};

	// 根据项目配置生成依赖项
	const generateDependencies = (config: ProjectMetadata) => {
		const deps: Record<string, string> = {};

		if (config.language === 'java' && config.framework.startsWith('spring')) {
			deps["spring-boot-starter"] = config.framework === 'spring3' ? "3.x" : "2.x";
			deps["spring-boot-starter-web"] = "Web MVC support";

			if (config.features.includes('database')) {
				deps["spring-boot-starter-data-jpa"] = "JPA database support";
			}

			if (config.features.includes('auth')) {
				deps["spring-boot-starter-security"] = "Security framework";
			}
		}

		return deps;
	};

	// 根据项目配置生成配置文件
	const generateConfigurations = (config: ProjectMetadata) => {
		const configs: Record<string, string[]> = {};

		if (config.language === 'java' && config.framework.startsWith('spring')) {
			if (config.features.includes('database')) {
				configs["application.yml"] = [
					"spring:",
					"  datasource:",
					"    url: jdbc:postgresql://localhost:5432/${DB_NAME:myapp}",
					"    username: ${DB_USERNAME:admin}",
					"    password: ${DB_PASSWORD:password}",
					"    driver-class-name: org.postgresql.Driver",
					"  jpa:",
					"    hibernate:",
					"      ddl-auto: update",
					"    show-sql: true"
				];
			}
			
			configs["application.properties"] = [
				"server.port=8080",
				"management.endpoints.web.exposure.include=health,info,metrics"
			];
		}

		if (config.features.includes('docker')) {
			if (config.language === 'java') {
				configs["Dockerfile"] = [
					"FROM openjdk:17-jdk-slim",
					"COPY target/*.jar app.jar",
					"EXPOSE 8080",
					"ENTRYPOINT [\"java\", \"-jar\", \"/app.jar\"]"
				];
			}
		}

		return configs;
	};

	const handleSaveConfig = async () => {
		if (!generatedResult || !metadata.name) {
			alert('请先生成配置并确保项目名称不为空');
			return;
		}

		setIsSaving(true);
		try {
			const response = await fetch('/api/golden-path', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: metadata.name,
					description: metadata.description,
					metadata: metadata,
					config: JSON.parse(generatedResult),
				}),
			});

			if (!response.ok) {
				throw new Error('保存失败');
			}

			const result = await response.json();
			setSavedConfigId(result.data.id);
			alert(`配置已保存，ID: ${result.data.id}`);
		} catch (error) {
			console.error('保存配置失败:', error);
			alert('保存配置失败，请稍后重试');
		} finally {
			setIsSaving(false);
		}
	};

	const getCliCommand = () => {
		if (!savedConfigId) return '';
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.autodev.work';
		return `npx @autodev/backend-generator add ${baseUrl}/api/golden-path/${savedConfigId}`;
	};

	const copyCliCommand = () => {
		const command = getCliCommand();
		if (command) {
			navigator.clipboard.writeText(command)
				.then(() => {
					alert("CLI 命令已复制到剪贴板");
				})
				.catch(err => {
					console.error("无法复制到剪贴板: ", err);
				});
		}
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

	const handleDownloadJson = () => {
		const blob = new Blob([generatedResult], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${metadata.name || 'project-config'}.json`;
		a.click();
		URL.revokeObjectURL(url);
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
					{/* 右上角三个 Icon Button */}
					<Button
						variant="ghost"
						size="icon"
						disabled={!generatedResult}
						onClick={() => setDialogOpen(true)}
						title="下载/CLI"
					>
						<Download className="h-5 w-5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						disabled={!generatedResult}
						onClick={copyToClipboard}
						title="复制 JSON"
					>
						<Copy className="h-5 w-5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						disabled={!generatedResult || isSaving}
						onClick={handleSaveConfig}
						title="保存配置"
					>
						{isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
					</Button>
					{isLoading && (
						<div className="flex items-center space-x-2 text-sm text-muted-foreground ml-2">
							<Loader2 className="h-3 w-3 animate-spin"/>
							<span>生成中...</span>
						</div>
					)}
				</div>
			</header>

			{/* 弹窗 Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>下载配置或使用 CLI</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								handleDownloadJson();
								setDialogOpen(false);
							}}
							disabled={!generatedResult}
						>
							<Download className="h-4 w-4 mr-2" />
							下载 JSON 配置
						</Button>
						{savedConfigId && (
							<div>
								<div className="flex items-center mb-2">
									<span className="text-sm font-medium text-gray-700">CLI 命令</span>
									<Button
										variant="ghost"
										size="icon"
										className="ml-2"
										onClick={() => {
											copyCliCommand();
											setDialogOpen(false);
										}}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
								<code className="block text-xs text-gray-600 font-mono break-all bg-gray-100 rounded p-2">
									{getCliCommand()}
								</code>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button variant="secondary" onClick={() => setDialogOpen(false)}>
							关闭
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="flex-1 overflow-hidden">
				<PanelGroup direction="horizontal" className="h-full">
					{/* Configuration Panel */}
					<Panel id="config-panel" defaultSize={50} minSize={30}>
						<ProjectConfigForm
							metadata={metadata}
							onMetadataChange={setMetadata}
							onGenerate={handleGenerate}
							isLoading={isLoading}
						/>
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
									<ScrollArea className="h-full w-full">
										<CodeBlock code={generatedResult} language="json"/>
									</ScrollArea>
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