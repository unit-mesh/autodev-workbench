"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileJson, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeBlock } from "@/components/code/code-block";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProjectConfigForm from './components/ProjectConfigForm';

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

		try {
			// Build prompt for LLM
			const selectedFeatureLabels = metadata.features.map(featureId => {
				// Note: Feature categories would need to be shared or imported
				// For now, keeping the feature mapping logic here or in a shared util
				return featureId; // Simplified for now
			});

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

			let jsonResult = data.text;
			try {
				const jsonMatch = jsonResult.match(/```json\s*([\s\S]*?)\s*```/) ||
					jsonResult.match(/```\s*([\s\S]*?)\s*```/);

				if (jsonMatch) {
					jsonResult = jsonMatch[1].trim();
				}

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
			alert(`配置已保存，ID: ${result.data.id}`);
		} catch (error) {
			console.error('保存配置失败:', error);
			alert('保存配置失败，请稍后重试');
		} finally {
			setIsSaving(false);
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
									<>
										<ScrollArea className="h-full w-full">
											<CodeBlock code={generatedResult} language="json"/>
										</ScrollArea>

										<div className="absolute bottom-4 right-4 flex gap-2">
											<Button
												onClick={handleSaveConfig}
												variant="outline"
												size="sm"
												className="bg-white shadow-md"
												disabled={isSaving}
											>
												{isSaving ? (
													<>
														<Loader2 className="h-3 w-3 animate-spin mr-1" />
														保存中
													</>
												) : (
													<>
														<Save className="h-3 w-3 mr-1" />
														保存配置
													</>
												)}
											</Button>
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
