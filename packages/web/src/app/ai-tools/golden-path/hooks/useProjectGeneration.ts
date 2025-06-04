import { useState, useCallback } from 'react';
import { ProjectMetadata } from '../types';
import { projectGenerationService } from '../services/projectGenerationService';

export function useProjectGeneration(metadata: ProjectMetadata) {
	const [isLoading, setIsLoading] = useState(false);
	const [generatedResult, setGeneratedResult] = useState<string>('');
	const [isSaving, setIsSaving] = useState(false);
	const [savedConfigId, setSavedConfigId] = useState<string>('');
	const [dialogOpen, setDialogOpen] = useState(false);

	const handleGenerate = useCallback(async () => {
		if (!metadata.name || !metadata.framework) {
			alert('请填写项目名称并选择框架');
			return;
		}

		setIsLoading(true);
		try {
			const result = await projectGenerationService.generateProject(metadata);
			setGeneratedResult(result);
		} catch (error) {
			console.error('Error generating project:', error);
			setGeneratedResult('抱歉，生成项目配置时出现错误。请稍后重试。');
		} finally {
			setIsLoading(false);
		}
	}, [metadata]);

	const handleSaveConfig = useCallback(async () => {
		if (!generatedResult || !metadata.name) {
			alert('请先生成配置并确保项目名称不为空');
			return;
		}

		setIsSaving(true);
		try {
			const configId = await projectGenerationService.saveConfig(metadata, generatedResult);
			setSavedConfigId(configId);
			alert(`配置已保存，ID: ${configId}`);
		} catch (error) {
			console.error('保存配置失败:', error);
			alert('保存配置失败，请稍后重试');
		} finally {
			setIsSaving(false);
		}
	}, [generatedResult, metadata]);

	const copyToClipboard = useCallback(() => {
		if (!generatedResult) return;
		
		navigator.clipboard.writeText(generatedResult)
			.then(() => {
				alert("JSON 配置已复制到剪贴板");
			})
			.catch(err => {
				console.error("无法复制到剪贴板: ", err);
			});
	}, [generatedResult]);

	const handleDownloadJson = useCallback(() => {
		if (!generatedResult) return;
		
		const blob = new Blob([generatedResult], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${metadata.name || 'project-config'}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}, [generatedResult, metadata.name]);

	const getCliCommand = useCallback(() => {
		if (!savedConfigId) return '';
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autodev.work';
		return `npx @autodev/backend-generator add ${baseUrl}/api/golden-path/${savedConfigId}`;
	}, [savedConfigId]);

	const getCurlCommand = useCallback(() => {
		if (!savedConfigId) return '';
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autodev.work';
		return `curl --proto '=https' --tlsv1.2 -sSf ${baseUrl}/api/install-script/${savedConfigId} | sh`;
	}, [savedConfigId]);

	const copyCliCommand = useCallback(() => {
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
	}, [getCliCommand]);

	const copyCurlCommand = useCallback(() => {
		const command = getCurlCommand();
		if (command) {
			navigator.clipboard.writeText(command)
				.then(() => {
					alert("Curl 安装命令已复制到剪贴板");
				})
				.catch(err => {
					console.error("无法复制到剪贴板: ", err);
				});
		}
	}, [getCurlCommand]);

	return {
		isLoading,
		generatedResult,
		isSaving,
		savedConfigId,
		dialogOpen,
		setDialogOpen,
		handleGenerate,
		handleSaveConfig,
		copyToClipboard,
		handleDownloadJson,
		getCliCommand,
		getCurlCommand,
		copyCliCommand,
		copyCurlCommand
	};
}
