import { useState, useEffect, useCallback } from "react"
import { MarkdownCodeBlock } from "@/app/api/_utils/MarkdownCodeBlock"
import { ApiResource, CodeAnalysis, Guideline, ConceptDictionary } from "@/types/project.type"
import { RequirementCard } from "@/app/chat/types/requirement.types"

type MessageType =
	| "user"
	| "system"
	| "intent-recognition"
	| "bullet-prompts"
	| "asset-recommendation"
	| "requirement-card"
	| "confirmation"

interface Message {
	id: string
	type: MessageType
	content: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any
	loading?: boolean
}

const PROMPTS = {
	INTENT_RECOGNITION: `你是一个需求分析助手。请分析用户的需求描述，提取以下信息：
1. 主要意图（用户想要做什么）
2. 关键词（与需求相关的重要术语）。如果用户问的是业务问题，请忽略技术词汇
3. 置信度（你对理解正确的把握程度，0.0-1.0）

参考以下业务术语词典进行分析：
{concepts}

以JSON格式返回结果：
{
  "intent": "主要意图",
  "keywords": ["关键词1", "关键词2"],
  "confidence": 0.95,
  "summary": "对用户需求的简短总结"
}`,

	CLARIFYING_QUESTIONS: `基于用户的需求描述和以下背景信息，生成4-5个澄清问题，以便更好地定义需求：
背景信息：{intentInfo}

同时，生成一个可能的回答示例，作为用户可能如何回答这些问题的参考。

以JSON格式返回结果：
{
  "prompts": [
    "问题1？",
    "问题2？",
    "问题3？",
    "问题4？"
  ],
  "exampleAnswer": "这里是对以上问题的一个可能回答示例，应包含具体、明确的信息"
}`,

	ASSET_RECOMMENDATION: `基于用户的需求和回答，推荐可能有用的资源。
需求：{initialRequirement}
澄清问题的回答：{clarification}

以JSON格式返回三类资源：
{
  "apis": [
    {"id": "api1", "name": "ExcelExportAPI", "description": "Excel导出接口", "example": "示例代码片段"}
  ],
  "codeSnippets": [
    {"id": "code1", "name": "导出功能示例", "language": "TypeScript", "code": "示例代码", "description": "实现Excel导出的代码片段"}
  ],
  "standards": [
    {"id": "std1", "name": "数据导出规范", "description": "公司关于数据导出功能的开发规范"}
  ]
}`,

	REQUIREMENT_CARD: `根据用户需求和选择的资源，生成一个完整的需求卡片。
需求：{initialRequirement}
澄清问题的回答：{clarification}
选择的API：{selectedApis}
选择的代码片段：{selectedCodeSnippets}
选择的标准：{selectedStandards}

以JSON格式返回需求卡片：
{
  "name": "功能名称",
  "module": "所属模块",
  "description": "功能详细描述",
  "apis": [{selectedApis}],
  "codeSnippets": [{selectedCodeSnippets}],
  "guidelines": [{selectedStandards}],
  "assignee": "",
  "deadline": "",
  "status": "draft"
}`
}

interface ConversationContext {
	initialRequirement: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	intentInfo: Record<string, any>
	clarification: string
	conversationId: string
}

interface UseConversationLogicReturn {
	messages: Message[]
	isProcessing: boolean
	conversationContext: ConversationContext
	selectedAPIObjects: ApiResource[]
	selectedCodeSnippetObjects: CodeAnalysis[]
	selectedStandardObjects: Guideline[]
	selectedAPIs: string[]
	selectedCodeSnippets: string[]
	selectedStandards: string[]
	requirementCard: RequirementCard | null
	concepts: ConceptDictionary[]
	isLoadingConcepts: boolean
	handleSubmit: (input: string) => Promise<void>
	handleAnswerPrompt: (userInput: string) => Promise<void>
	handleSelectAPI: (apiId: string) => void
	handleSelectCodeSnippet: (snippetId: string) => void
	handleSelectStandard: (standardId: string) => void
	handleConfirmAssetSelection: () => Promise<void>
	handleRetry: (errorType: string) => Promise<void>
	setSelectedAPIObjects: (apis: ApiResource[]) => void
	setSelectedCodeSnippetObjects: (codes: CodeAnalysis[]) => void
	setSelectedStandardObjects: (standards: Guideline[]) => void
	setRequirementCard: (card: RequirementCard | null) => void
	resetConversation: () => void
}

export const useConversationLogic = (): UseConversationLogicReturn => {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "welcome",
			type: "system",
			content: "欢迎使用需求生成助手！请描述您的需求，例如：'我想加一个导出 Excel 的功能'",
		},
	])
	const [selectedAPIs, setSelectedAPIs] = useState<string[]>([])
	const [selectedCodeSnippets, setSelectedCodeSnippets] = useState<string[]>([])
	const [selectedStandards, setSelectedStandards] = useState<string[]>([])
	const [selectedAPIObjects, setSelectedAPIObjects] = useState<ApiResource[]>([])
	const [selectedCodeSnippetObjects, setSelectedCodeSnippetObjects] = useState<CodeAnalysis[]>([])
	const [selectedStandardObjects, setSelectedStandardObjects] = useState<Guideline[]>([])
	const [isProcessing, setIsProcessing] = useState(false)
	const [requirementCard, setRequirementCard] = useState<RequirementCard | null>(null)
	const [concepts, setConcepts] = useState<ConceptDictionary[]>([])
	const [isLoadingConcepts, setIsLoadingConcepts] = useState(false)
	const [conversationContext, setConversationContext] = useState<ConversationContext>({
		initialRequirement: "",
		intentInfo: {},
		clarification: "",
		conversationId: "",
	})

	useEffect(() => {
		const fetchConcepts = async () => {
			setIsLoadingConcepts(true)
			try {
				const response = await fetch("/api/concepts")
				if (response.ok) {
					const data = await response.json()
					setConcepts(data)
				} else {
					console.error("Failed to fetch concepts:", response.statusText)
				}
			} catch (error) {
				console.error("Error fetching concepts:", error)
			} finally {
				setIsLoadingConcepts(false)
			}
		}

		fetchConcepts()
	}, [])

	const getIntentRecognitionPrompt = useCallback(() => {
		return PROMPTS.INTENT_RECOGNITION.replace(
			"{concepts}",
			JSON.stringify(concepts)
		)
	}, [concepts])

	const callChatAPI = useCallback(async (userPrompt: string, systemPrompt: string) => {
		console.log("Calling chat API with prompt:", userPrompt, systemPrompt)
		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: userPrompt }
					],
					conversationId: conversationContext.conversationId || undefined
				})
			});

			const data = await response.json();

			if (data.conversationId && !conversationContext.conversationId) {
				setConversationContext(prev => ({
					...prev,
					conversationId: data.conversationId
				}));
			}

			return data.text;
		} catch (error) {
			console.error("Error calling chat API:", error);
			return "抱歉，处理您的请求时出现错误。";
		}
	}, [conversationContext.conversationId])

	const parseJsonResponse = useCallback((text: string) => {
		try {
			const blocks = MarkdownCodeBlock.from(text).filter(it => it.language === "json");
			let jsonStr = blocks.length > 0 ? blocks[0].code : text;
			if (jsonStr == undefined) {
				jsonStr = text
			}
			return JSON.parse(jsonStr);
		} catch (error) {
			console.error("Error parsing JSON response:", error);
			console.log("Raw text:", text);
			return null;
		}
	}, [])

	const generateAssetRecommendation = useCallback(async (processingMessageId: string, userInput?: string) => {
		try {
			const clarification = userInput ? userInput : conversationContext.clarification || "";
			if (!clarification) {
				throw new Error("缺少用户输入");
			}

			const assetPrompt = PROMPTS.ASSET_RECOMMENDATION
				.replace("{initialRequirement}", conversationContext.initialRequirement)
				.replace("{clarification}", clarification);

			const assetResponse = await callChatAPI(clarification, assetPrompt);
			const assetData = parseJsonResponse(assetResponse);

			if (!assetData) {
				throw new Error("无法生成资源推荐");
			}

			setMessages(prev => prev.filter(msg => msg.id !== processingMessageId));
			const assetMessage: Message = {
				id: Date.now().toString(),
				type: "asset-recommendation",
				content: "根据您的需求，我找到了以下可能有用的资源：",
				data: assetData
			}

			setMessages(prev => [...prev, assetMessage]);
			return true;
		} catch (error) {
			console.error("Error during asset recommendation:", error);
			setMessages(prev => [
				...prev.filter(msg => msg.id !== processingMessageId),
				{
					id: Date.now().toString(),
					type: "system",
					content: "抱歉，生成资源推荐时出现了问题。请再试一次。",
					data: { errorType: "asset" }
				}
			]);
			return false;
		}
	}, [conversationContext, callChatAPI, parseJsonResponse])

	const generateRequirementCard = useCallback(async (processingMessageId: string) => {
		try {
			const cardPrompt = PROMPTS.REQUIREMENT_CARD
				.replace("{initialRequirement}", conversationContext.initialRequirement)
				.replace("{clarification}", conversationContext.clarification)
				.replace("{selectedApis}", selectedAPIObjects.map((api: ApiResource) => {
					return `name: ${api.packageName}.${api.className}.${api.methodName}\nurl: ${api.sourceHttpMethod} ${api.sourceUrl}}`;
				}).join(","))
				.replace("{selectedCodeSnippets}", selectedCodeSnippetObjects.map((code: CodeAnalysis) => {
					return `name: ${code.title}\ndescription: ${code.description}\ncode: ${code.content}`;
				}).join("\n"))
				.replace("{selectedStandards}", JSON.stringify(selectedStandardObjects));

			const cardResponse = await callChatAPI(
				`生成需求卡片: ${conversationContext.initialRequirement}`,
				cardPrompt
			);

			const cardData = parseJsonResponse(cardResponse);

			if (!cardData) {
				throw new Error("无法生成需求卡片");
			}

			const newRequirementCard: RequirementCard = {
				...cardData,
				apis: selectedAPIObjects,
				codeSnippets: selectedCodeSnippetObjects,
				guidelines: selectedStandardObjects,
				status: "draft"
			};

			setRequirementCard(newRequirementCard);
			setMessages(prev => prev.filter(msg => msg.id !== processingMessageId));

			const cardPreviewMessage: Message = {
				id: Date.now().toString(),
				type: "requirement-card",
				content: "已为您生成需求卡片预览：",
				data: { card: newRequirementCard }
			}

			setMessages(prev => [...prev, cardPreviewMessage]);
			return true;
		} catch (error) {
			console.error("Error generating requirement card:", error);
			setMessages(prev => [
				...prev.filter(msg => msg.id !== processingMessageId),
				{
					id: Date.now().toString(),
					type: "system",
					content: "抱歉，生成需求卡片时出现了问题。请再试一次。",
					data: { errorType: "card" }
				}
			]);
			return false;
		}
	}, [conversationContext, selectedAPIObjects, selectedCodeSnippetObjects, selectedStandardObjects, callChatAPI, parseJsonResponse])

	const handleSubmit = useCallback(async (input: string) => {
		if (!input.trim() || isProcessing) return

		const userMessage: Message = {
			id: Date.now().toString(),
			type: "user",
			content: input,
		}

		const processingMessage: Message = {
			id: (Date.now() + 1).toString(),
			type: "system",
			content: "正在分析您的需求...",
			loading: true,
		}

		setMessages((prev) => [...prev, userMessage, processingMessage])
		setIsProcessing(true)

		setConversationContext(prev => ({
			...prev,
			initialRequirement: input
		}))

		try {
			const intentPrompt = getIntentRecognitionPrompt()
			const intentResponse = await callChatAPI(input, intentPrompt);
			const intentData = parseJsonResponse(intentResponse);

			if (!intentData) {
				throw new Error("无法解析意图识别结果");
			}

			setConversationContext(prev => ({
				...prev,
				intentInfo: intentData
			}));

			setMessages((prev) => prev.filter((msg) => msg.id !== processingMessage.id));

			const intentMessage: Message = {
				id: Date.now().toString(),
				type: "intent-recognition",
				content: intentData.summary || `我理解您需要${intentData.intent}。`,
				data: intentData
			}

			setMessages(prev => [...prev, intentMessage]);

			const promptSystemMessage = PROMPTS.CLARIFYING_QUESTIONS.replace(
				"{intentInfo}",
				JSON.stringify(intentData)
			);

			const questionsResponse = await callChatAPI(input, promptSystemMessage);
			const questionsData = parseJsonResponse(questionsResponse);

			if (!questionsData || !questionsData.prompts) {
				throw new Error("无法生成澄清问题");
			}

			const promptMessage: Message = {
				id: Date.now().toString(),
				type: "bullet-prompts",
				content: "为了更好地定义这个需求，请告诉我：",
				data: questionsData
			}

			setMessages(prev => [...prev, promptMessage]);
		} catch (error) {
			console.error("Error during intent recognition:", error);
			setMessages(prev => [
				...prev.filter(msg => msg.id !== processingMessage.id),
				{
					id: Date.now().toString(),
					type: "system",
					content: "抱歉，处理您的需求时出现了问题。请再试一次。"
				}
			]);
		} finally {
			setIsProcessing(false);
		}
	}, [isProcessing, getIntentRecognitionPrompt, callChatAPI, parseJsonResponse])

	const handleAnswerPrompt = useCallback(async (userInput: string) => {
		const userAnswer: Message = {
			id: Date.now().toString(),
			type: "user",
			content: userInput,
		}

		const processingMessage: Message = {
			id: (Date.now() + 1).toString(),
			type: "system",
			content: "正在处理您的回答...",
			loading: true,
		}

		setMessages((prev) => [...prev, userAnswer, processingMessage])
		setIsProcessing(true)
		setConversationContext(prev => ({
			...prev,
			clarification: userInput
		}));

		try {
			await generateAssetRecommendation(processingMessage.id, userInput);
		} finally {
			setIsProcessing(false);
		}
	}, [generateAssetRecommendation])

	const handleSelectAPI = useCallback((apiId: string) => {
		if (selectedAPIs.includes(apiId)) {
			setSelectedAPIs(prev => prev.filter(id => id !== apiId));
		} else {
			setSelectedAPIs(prev => [...prev, apiId]);
		}
	}, [selectedAPIs])

	const handleSelectCodeSnippet = useCallback((snippetId: string) => {
		if (selectedCodeSnippets.includes(snippetId)) {
			setSelectedCodeSnippets(prev => prev.filter(id => id !== snippetId));
		} else {
			setSelectedCodeSnippets(prev => [...prev, snippetId]);
		}
	}, [selectedCodeSnippets])

	const handleSelectStandard = useCallback((standardId: string) => {
		if (selectedStandards.includes(standardId)) {
			setSelectedStandards(prev => prev.filter(id => id !== standardId));
		} else {
			setSelectedStandards(prev => [...prev, standardId]);
		}
	}, [selectedStandards])

	const handleConfirmAssetSelection = useCallback(async () => {
		const processingMessage: Message = {
			id: Date.now().toString(),
			type: "system",
			content: "正在生成需求卡片...",
			loading: true,
		}

		setMessages(prev => [...prev, processingMessage]);
		setIsProcessing(true);

		try {
			await generateRequirementCard(processingMessage.id);
		} finally {
			setIsProcessing(false);
		}
	}, [generateRequirementCard])

	const handleRetry = useCallback(async (errorType: string) => {
		const processingMessage: Message = {
			id: Date.now().toString(),
			type: "system",
			content: `正在重新${errorType === "asset" ? "生成资源推荐" : "生成需求卡片"}...`,
			loading: true,
		}

		setMessages(prev => [...prev, processingMessage]);
		setIsProcessing(true);

		try {
			if (errorType === "asset") {
				await generateAssetRecommendation(processingMessage.id);
			} else if (errorType === "card") {
				await generateRequirementCard(processingMessage.id);
			}
		} finally {
			setIsProcessing(false);
		}
	}, [generateAssetRecommendation, generateRequirementCard])

	const resetConversation = useCallback(() => {
		setMessages([
			{
				id: "welcome",
				type: "system",
				content: "欢迎使用需求生成助手！请描述您的需求，例如：'我想加一个导出 Excel 的功能'",
			},
		])
		setSelectedAPIs([])
		setSelectedCodeSnippets([])
		setSelectedStandards([])
		setSelectedAPIObjects([])
		setSelectedCodeSnippetObjects([])
		setSelectedStandardObjects([])
		setRequirementCard(null)
		setConversationContext({
			initialRequirement: "",
			intentInfo: {},
			clarification: "",
			conversationId: "",
		})
	}, [])

	return {
		messages,
		isProcessing,
		conversationContext,
		selectedAPIObjects,
		selectedCodeSnippetObjects,
		selectedStandardObjects,
		selectedAPIs,
		selectedCodeSnippets,
		selectedStandards,
		requirementCard,
		concepts,
		isLoadingConcepts,
		handleSubmit,
		handleAnswerPrompt,
		handleSelectAPI,
		handleSelectCodeSnippet,
		handleSelectStandard,
		handleConfirmAssetSelection,
		handleRetry,
		setSelectedAPIObjects,
		setSelectedCodeSnippetObjects,
		setSelectedStandardObjects,
		setRequirementCard,
		resetConversation,
	}
}
