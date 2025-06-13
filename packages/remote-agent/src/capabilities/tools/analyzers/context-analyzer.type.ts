// 类型定义
export interface ProjectInfo {
	name: string;
	type: string;
	version: string;
	description: string;
	project_files: ProjectFile[];
	has_readme: boolean;
	has_license: boolean;
	has_changelog: boolean;
}

export interface ProjectFile {
	name: string;
	size: number;
	modified: string;
}

export interface WorkflowAnalysis {
	cicd_platforms: string[];
	workflow_files: WorkflowFile[];
	npm_scripts: string[];
	has_docker: boolean;
	has_makefile: boolean;
	automation_score: number;
}

export interface WorkflowFile {
	type: string;
	path: string;
	size?: number;
	modified?: string;
	files?: number;
}

export interface ArchitectureAnalysis {
	patterns: {
		monorepo: boolean;
		microservices: boolean;
		mvc: boolean;
		component_based: boolean;
		layered: boolean;
	};
	directory_structure: string[];
	complexity_score: number;
	detailed_structure?: any;
}

export interface GitAnalysis {
	is_git_repo: boolean;
	has_gitignore?: boolean;
	has_git_hooks?: boolean;
	note?: string;
}

export interface DependenciesAnalysis {
	has_dependencies: boolean;
	production_deps?: number;
	dev_deps?: number;
	peer_deps?: number;
	total_deps?: number;
	error?: string;
}
