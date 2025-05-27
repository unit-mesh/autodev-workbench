import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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

interface ProjectBasicInfoProps {
	metadata: ProjectMetadata;
	setMetadata: React.Dispatch<React.SetStateAction<ProjectMetadata>>;
	isLoading: boolean;
	handleAutoGenerateName: () => Promise<void>;
	projectTypes: { value: string; label: string }[];
	languages: { value: string; label: string }[];
	frameworks: Record<string, FrameworkItem[]>;
	currentFrameworkLabel: string;
}

export default function ProjectBasicInfo({
	                                         metadata,
	                                         setMetadata,
	                                         isLoading,
	                                         handleAutoGenerateName,
	                                         projectTypes,
	                                         languages,
	                                         frameworks,
                                         }: ProjectBasicInfoProps) {
	return (
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
		</div>
	);
}
