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

	const handleGenerate = async () => {
		setIsLoading(true);

		// 首先需要将前端的 type 映射到后端期望的类型
		const mapProjectType = (frontendType: string) => {
			switch (frontendType) {
				case 'web':
				case 'api':
					return 'monolith';
				case 'microservice':
					return 'microservice';
				case 'library':
				case 'cli':
					return 'library';
				default:
					return 'monolith';
			}
		};

		try {
			// Build prompt for LLM
			const mappedType = mapProjectType(metadata.type);

			const frameworkInfo = allFrameworks.find(f => f.value === metadata.framework);
			const frameworkLabel = frameworkInfo?.label || '';
			const isLegacy = frameworkInfo?.legacy === true;
			const frameworkDescription = isLegacy ?
				`${frameworkLabel} (Legacy version)` : frameworkLabel;

			const prompt = `
Generate a JSON configuration for a ${frameworkDescription} ${mappedType} application named "${metadata.name}".
Description: ${metadata.description || "No description provided"}
Programming Language: ${metadata.language}
Required Features: ${metadata.features.join(', ') || "No specific features selected"}
${isLegacy ? "Note: This is using a legacy version of the framework which may have different dependencies and configurations." : ""}

IMPORTANT: You must return a JSON object that exactly matches this schema structure:

{
  "projectConfig": {
    "name": "${metadata.name}",
    "description": "${metadata.description || "No description provided"}",
    "type": "${mappedType}",
    "language": "${metadata.language}",
    "framework": "${metadata.framework}"
  },
  "features": [
    // Array of selected feature IDs as strings
    // Use these exact feature IDs: ${metadata.features.join(', ')}
  ],
  "structure": {
    "directories": [
      // Array of directory paths as strings (e.g., "src/main/java", "src/test/java")
    ],
    "files": [
      // Array of file paths as strings (e.g., "pom.xml", "README.md")
    ]
  },
  "dependencies": {
    // Object with dependency names as keys and versions as string values
    // Example: "spring-boot-starter": "3.2.0"
  },
  "configurations": {
    // Object with configuration file names as keys and arrays of configuration lines as values
    // Example: "application.yml": ["server:", "  port: 8080"]
  }
}

For the selected features (${metadata.features.join(', ') || 'none'}), include appropriate:
1. Project structure directories and files
2. Dependencies with specific versions
3. Configuration files with proper content lines

Examples for common features:
- "database": Add JPA dependencies, database configuration in application.yml
- "auth": Add security dependencies, security configuration
- "docker": Add Dockerfile and docker-compose.yml files
- "api-docs": Add OpenAPI/Swagger dependencies and configuration

Return ONLY the JSON object without any explanation, comments, or markdown formatting.
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
							content: "You are an expert software architect. Generate project configurations that strictly follow the provided JSON schema. Return only valid JSON without any explanation, comments, or markdown formatting. Ensure all field types match the schema exactly."
						},
						{ role: "user", content: prompt }
					],
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate response");
			}

			const data = await response.json();

			let jsonResult = data.text;

			// 清理和验证 JSON 响应
			try {
				// 移除可能的 markdown 格式
				const jsonMatch = jsonResult.match(/```json\s*([\s\S]*?)\s*```/) ||
					jsonResult.match(/```\s*([\s\S]*?)\s*```/);

				if (jsonMatch) {
					jsonResult = jsonMatch[1].trim();
				}

				// 验证 JSON 格式
				const parsedConfig = JSON.parse(jsonResult);

				// 基本验证，确保必需字段存在
				if (!parsedConfig.projectConfig || !parsedConfig.features ||
				    !parsedConfig.structure || !parsedConfig.dependencies ||
				    !parsedConfig.configurations) {
					throw new Error("Missing required fields in generated configuration");
				}

				// 确保 type 字段符合后端期望
				if (!['microservice', 'monolith', 'library'].includes(parsedConfig.projectConfig.type)) {
					parsedConfig.projectConfig.type = mappedType;
				}

				jsonResult = JSON.stringify(parsedConfig, null, 2);
			} catch (e) {
				console.error("Invalid JSON in response", e);
				// 如果解析失败，提供一个基本的配置模板
				const fallbackConfig = {
					projectConfig: {
						name: metadata.name,
						description: metadata.description || "No description provided",
						type: mappedType,
						language: metadata.language,
						framework: metadata.framework
					},
					features: metadata.features,
					structure: {
						directories: ["src"],
						files: ["README.md", ".gitignore"]
					},
					dependencies: {},
					configurations: {}
				};
				jsonResult = JSON.stringify(fallbackConfig, null, 2);
			}

			setGeneratedResult(jsonResult);
		} catch (error) {
			console.error("Error generating project:", error);
			setGeneratedResult("抱歉，生成项目配置时出现错误。请稍后重试。");
		} finally {
			setIsLoading(false);
		}
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
