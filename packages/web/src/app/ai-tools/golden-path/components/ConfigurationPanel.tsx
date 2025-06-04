import React from 'react';
import { ProjectMetadata } from '../types';
import ProjectConfigForm from './ProjectConfigForm';

interface ConfigurationPanelProps {
	metadata: ProjectMetadata;
	onMetadataChange: (metadata: ProjectMetadata) => void;
	onGenerate: () => void;
	isLoading: boolean;
}

export function ConfigurationPanel({
	metadata,
	onMetadataChange,
	onGenerate,
	isLoading
}: ConfigurationPanelProps) {
	return (
		<ProjectConfigForm
			metadata={metadata}
			onMetadataChange={onMetadataChange}
			onGenerate={onGenerate}
			isLoading={isLoading}
		/>
	);
}
