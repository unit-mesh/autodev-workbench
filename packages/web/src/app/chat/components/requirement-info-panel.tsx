import React from "react";
import { X, SaveAll, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RequirementCard } from "./requirement-card";
import { ApiResource, CodeAnalysis, Guideline } from "@/types/project.type";

interface RequirementInfoPanelProps {
	isOpen: boolean;
	onClose: () => void;
	conversationContext: {
		initialRequirement: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		intentInfo: any; // Consider defining a more specific type
		clarification: string;
		conversationId: string;
	};
	intentData: {
		intent: string;
		keywords: string[];
		summary: string;
		confidence: number;
	} | null;
	selectedAPIObjects: ApiResource[];
	selectedCodeSnippetObjects: CodeAnalysis[];
	selectedStandardObjects: Guideline[];
	requirementCard: RequirementCard | null;
	isProcessing: boolean;
	onConfirmAssetSelection: () => void;
	onSaveAsDraft: () => void;
	onGenerateTask: () => void;
}

const RequirementInfoPanel: React.FC<RequirementInfoPanelProps> = ({
	isOpen,
	onClose,
	conversationContext,
	intentData,
	selectedAPIObjects,
	selectedCodeSnippetObjects,
	selectedStandardObjects,
	requirementCard,
	isProcessing,
	onConfirmAssetSelection,
	onSaveAsDraft,
	onGenerateTask,
}) => {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="w-1/3 border-l bg-gray-50 flex flex-col h-full transition-all duration-300 ease-in-out">
			<div className="p-4 border-b bg-white flex justify-between items-center">
				<h2 className="font-semibold text-gray-800">需求信息面板</h2>
				<Button variant="ghost" size="icon" onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="flex-1 overflow-hidden"> {/* Wrapper for ScrollArea */}
				<ScrollArea className="h-full p-4">
					<Tabs defaultValue="requirement">
						<TabsList className="grid grid-cols-3 mb-4">
							<TabsTrigger value="requirement">需求信息</TabsTrigger>
							<TabsTrigger value="assets">已选资源</TabsTrigger>
							<TabsTrigger value="card">需求卡片</TabsTrigger>
						</TabsList>

						<TabsContent value="requirement" className="space-y-4">
							{conversationContext.initialRequirement ? (
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">原始需求</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-gray-600">{conversationContext.initialRequirement}</p>
									</CardContent>
								</Card>
							) : (
								<Card className="border-dashed">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">原始需求</CardTitle>
										<CardDescription>尚未输入需求</CardDescription>
									</CardHeader>
								</Card>
							)}

							{intentData && (
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">需求分析</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="flex justify-between items-center">
											<span className="text-xs font-medium text-gray-500">意图:</span>
											<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
												{intentData.intent}
											</Badge>
										</div>

										<div>
											<span className="text-xs font-medium text-gray-500 block mb-1">关键词:</span>
											<div className="flex flex-wrap gap-1">
												{intentData.keywords.map((keyword: string, idx: number) => (
													<Badge key={idx} variant="outline"
														className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-none">
														{keyword}
													</Badge>
												))}
											</div>
										</div>

										<div className="pt-1">
											<span className="text-xs font-medium text-gray-500 block mb-1">总结:</span>
											<p className="text-sm text-gray-600">{intentData.summary}</p>
										</div>

										<div className="flex items-center pt-1">
											<span className="text-xs font-medium text-gray-500 mr-1">置信度:</span>
											<div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
												<div
													className="h-full bg-green-500 rounded-full"
													style={{ width: `${intentData.confidence * 100}%` }}
												></div>
											</div>
											<span className="text-xs ml-2">{Math.round(intentData.confidence * 100)}%</span>
										</div>
									</CardContent>
								</Card>
							)}

							{conversationContext.clarification && (
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">需求澄清</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-gray-600">{conversationContext.clarification}</p>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						<TabsContent value="assets" className="space-y-4">
							<div className="space-y-3">
								<h3 className="text-sm font-medium text-gray-700">已选API ({selectedAPIObjects.length})</h3>
								{selectedAPIObjects.length > 0 ? (
									<div className="space-y-2">
										{selectedAPIObjects.map((api, index) => (
											<div key={index} className="p-2 bg-white rounded border text-sm">
												<div className="font-medium">{api.packageName}.{api.className}.{api.methodName}</div>
												<div className="text-xs text-gray-500 mt-1">{api.sourceHttpMethod} {api.sourceUrl}</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-gray-500 italic">尚未选择API</p>
								)}

								<Separator className="my-3" />

								<h3 className="text-sm font-medium text-gray-700">已选代码片段
									({selectedCodeSnippetObjects.length})</h3>
								{selectedCodeSnippetObjects.length > 0 ? (
									<div className="space-y-2">
										{selectedCodeSnippetObjects.map((snippet, index) => (
											<div key={index} className="p-2 bg-white rounded border text-sm">
												<div className="font-medium">{snippet.title}</div>
												<div className="text-xs text-gray-500 mt-1">{snippet.description}</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-gray-500 italic">尚未选择代码片段</p>
								)}

								<Separator className="my-3" />

								<h3 className="text-sm font-medium text-gray-700">已选规范 ({selectedStandardObjects.length})</h3>
								{selectedStandardObjects.length > 0 ? (
									<div className="space-y-2">
										{selectedStandardObjects.map((standard, index) => (
											<div key={index} className="p-2 bg-white rounded border text-sm">
												<div className="font-medium">{standard.title}</div>
												<div className="text-xs text-gray-500 mt-1">{standard.description}</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-gray-500 italic">尚未选择规范</p>
								)}

								{(selectedAPIObjects.length > 0 || selectedCodeSnippetObjects.length > 0 || selectedStandardObjects.length > 0) && (
									<div className="pt-2">
										<Button
											className="w-full"
											onClick={onConfirmAssetSelection}
											disabled={isProcessing}
										>
											<SaveAll className="h-4 w-4 mr-2" />
											生成需求卡片
										</Button>
									</div>
								)}
							</div>
						</TabsContent>

						<TabsContent value="card">
							{requirementCard ? (
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">需求卡片预览</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<div>
											<span className="text-xs font-medium text-gray-500">功能名称:</span>
											<p className="text-sm font-medium">{requirementCard.name}</p>
										</div>

										<div>
											<span className="text-xs font-medium text-gray-500">所属模块:</span>
											<p className="text-sm">{requirementCard.module}</p>
										</div>

										<div>
											<span className="text-xs font-medium text-gray-500">功能描述:</span>
											<p className="text-sm text-gray-600 mt-1">{requirementCard.description}</p>
										</div>

										<div className="flex gap-2 pt-2">
											<Button
												size="sm"
												variant="outline"
												className="flex-1"
												onClick={onSaveAsDraft}
											>
												<BookmarkPlus className="h-4 w-4 mr-1" />
												保存草稿
											</Button>
											<Button
												size="sm"
												className="flex-1"
												onClick={onGenerateTask}
											>
												<CheckCircle2 className="h-4 w-4 mr-1" />
												确认生成
											</Button>
										</div>
									</CardContent>
								</Card>
							) : (
								<Card className="border-dashed">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">需求卡片</CardTitle>
										<CardDescription>尚未生成需求卡片</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-gray-500">
											请选择所需资源并点击&#34;生成需求卡片&#34;按钮来创建需求卡片
										</p>
									</CardContent>
								</Card>
							)}
						</TabsContent>
					</Tabs>
				</ScrollArea>
			</div>
		</div>
	);
};

export default RequirementInfoPanel;
