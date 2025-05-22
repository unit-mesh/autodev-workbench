export interface Project {
	id: string
	name: string
	description: string | null
	gitUrl: string
	liveUrl: string | null
	jiraUrl: string | null
	jenkinsUrl: string | null
	createdAt: string
	updatedAt: string
	isDefault: boolean
	isPublic: boolean
	guidelines: Array<{
		id: number
		title: string
		description: string | null
		content: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
		category: any
		language: string
		status: string
		createdAt: string
	}>
	codeAnalyses: Array<{
		id: string
		title: string | null
		description: string | null
		language: string | null
		path: string
		content: string
		createdAt: string
	}>
	conceptDictionaries: Array<{
		id: string
		termChinese: string
		termEnglish: string
		descChinese: string
		descEnglish: string
	}>
	apiResources: Array<{
		id: string
		sourceUrl: string
		sourceHttpMethod: string
		packageName: string
		className: string
		methodName: string
	}>
	user: {
		name: string | null
		email: string | null
		image: string | null
	} | null
}

export type SymbolAnalysis = {
	id: string
	name: string
	kind: string
	path: string | null
	identifiedConcepts: string[]
	detail: {
		totalSymbols?: number; // Added for clarity
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any
	} | null
	createdAt: string
	updatedAt: string
	projectId: string | null
	project: Project
}

export type ApiResource = {
	id: string;
	systemId?: string;
	sourceUrl: string;
	sourceHttpMethod: string;
	packageName: string;
	className: string;
	methodName: string;
	supplyType: string;
}

export interface ConceptDictionary {
	id: string
	termChinese: string
	termEnglish: string
	descChinese: string
	descEnglish: string
	projectId: string | null
	createdAt: string
	updatedAt: string
}

export interface Guideline {
	id: string
	title: string
	description: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	category: any
	content: string
	language: string
	version: string
	lastUpdated: string
	popularity: number
	status: string
	createdBy: string
	createdAt: string
	updatedAt: string
}

export type CodeAnalysis = {
	id: string
	title: string | null
	description: string | null
	language: string | null
	path: string
	content: string
	source: string | null
	createdAt: string
	updatedAt: string
	projectId: string | null
	project: Project | null
}
