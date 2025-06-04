import { useState, useCallback } from 'react';
import { ProjectMetadata } from '../types';
import { DEFAULT_PROJECT_METADATA, FRAMEWORKS } from '../constants';

export function useProjectConfig() {
	const [metadata, setMetadata] = useState<ProjectMetadata>(DEFAULT_PROJECT_METADATA);

	const updateMetadata = useCallback((updates: Partial<ProjectMetadata>) => {
		setMetadata(prev => {
			const newMetadata = { ...prev, ...updates };
			
			// Auto-update framework when language changes
			if (updates.language && updates.language !== prev.language) {
				const availableFrameworks = FRAMEWORKS[updates.language];
				if (availableFrameworks && availableFrameworks.length > 0) {
					newMetadata.framework = availableFrameworks[0].value;
				}
			}
			
			return newMetadata;
		});
	}, []);

	const resetMetadata = useCallback(() => {
		setMetadata(DEFAULT_PROJECT_METADATA);
	}, []);

	return {
		metadata,
		updateMetadata,
		resetMetadata,
		setMetadata
	};
}
