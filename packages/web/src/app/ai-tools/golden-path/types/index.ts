export interface ProjectMetadata {
	name: string;
	description: string;
	type: string;
	language: string;
	framework: string;
	features: string[];
}

export interface FrameworkItem {
	value: string;
	label: string;
	legacy?: boolean;
}

export interface FeatureCategory {
	title: string;
	description: string;
	features: FeatureItem[];
}

export interface FeatureItem {
	id: string;
	label: string;
	description: string;
}

export interface ProjectType {
	value: string;
	label: string;
}

export interface Language {
	value: string;
	label: string;
}

export interface ProjectConfig {
	projectConfig: {
		name: string;
		description: string;
		type: string;
		language: string;
		framework: string;
	};
	features: string[];
	structure: {
		directories: string[];
		files: string[];
	};
	dependencies: Record<string, string>;
	configurations: Record<string, string[]>;
}

export interface GenerationState {
	isLoading: boolean;
	generatedResult: string;
	isSaving: boolean;
	savedConfigId: string;
	dialogOpen: boolean;
}
