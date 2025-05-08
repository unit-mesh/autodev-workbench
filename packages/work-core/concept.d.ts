// --------------- Core Enums ---------------

export enum ConceptSourceType {
	COMMENT = 'COMMENT',
	CLASS_NAME = 'CLASS_NAME',
	METHOD_NAME = 'METHOD_NAME',
	IDENTIFIER = 'IDENTIFIER',
	STRING_LITERAL = 'STRING_LITERAL', // Added for completeness
	OTHER = 'OTHER',
}

export enum KnowledgeAssetSourceSystem {
	JIRA = 'JIRA',
	CONFLUENCE = 'CONFLUENCE',
	OTHER = 'OTHER', // For future extensibility
}

export enum KnowledgeAssetType {
	JIRA_ISSUE = 'JIRA_ISSUE',
	JIRA_EPIC = 'JIRA_EPIC',
	JIRA_COMMENT = 'JIRA_COMMENT', // Potentially linking to specific comments
	CONFLUENCE_PAGE = 'CONFLUENCE_PAGE',
	CONFLUENCE_COMMENT = 'CONFLUENCE_COMMENT', // Potentially linking to specific comments
	GENERIC_WEB_PAGE = 'GENERIC_WEB_PAGE', // For other types of links
}

export enum ConceptLinkType {
	MANUAL_USER_CREATED = 'MANUAL_USER_CREATED',
	AI_SUGGESTED_HIGH_CONFIDENCE = 'AI_SUGGESTED_HIGH_CONFIDENCE',
	AI_SUGGESTED_MEDIUM_CONFIDENCE = 'AI_SUGGESTED_MEDIUM_CONFIDENCE',
	AI_SUGGESTED_LOW_CONFIDENCE = 'AI_SUGGESTED_LOW_CONFIDENCE',
	IMPLICIT_SEMANTIC_MATCH = 'IMPLICIT_SEMANTIC_MATCH',
}

// --------------- Base Interfaces ---------------

export interface BaseDomainEntity {
	id: string; // UUID or database-generated ID
	createdAt: Date;
	updatedAt: Date;
}

// --------------- Source Code Related Models ---------------

export interface SourceCodeLocation {
	filePath: string;
	startLine: number;
	endLine?: number; // For multi-line concepts
	startColumn?: number;
	endColumn?: number;
}

export interface SourceCodeConcept extends BaseDomainEntity {
	term: string; // The extracted concept, e.g., "AuthNService"
	normalizedTerm?: string; // Lowercased or stemmed version for matching
	type: ConceptSourceType;
	location: SourceCodeLocation;
	contextSnippet?: string; // A small snippet of code around the concept
	language?: string; // e.g., 'typescript', 'java', 'python'
	projectId?: string; // Foreign key to a Project entity
	embedding?: number[]; // Optional: for semantic search (Phase 2/3)
	tags?: string[]; // Optional: additional tags for categorization
}

// --------------- Knowledge Asset Related Models ---------------

export interface KnowledgeAsset extends BaseDomainEntity {
	externalId: string; // ID from the source system (e.g., Jira issue key, Confluence page ID)
	title: string;
	url: string;
	summary?: string;
	sourceSystem: KnowledgeAssetSourceSystem;
	assetType: KnowledgeAssetType;
	lastFetchedAt: Date; // When the data was last synced from the external source
	tags?: string[];
	embedding?: number[]; // Optional: for semantic search on knowledge assets (Phase 2/3)
	rawSourceData?: Record<string, any>; // To store the original payload from the source API
}

// Specific Knowledge Asset types

export interface JiraIssueDetails {
	status: string;
	issueType: string; // e.g., 'Bug', 'Story', 'Task'
	priority?: string;
	assignee?: {
		displayName: string;
		emailAddress?: string;
		accountId?: string;
	};
	reporter?: {
		displayName: string;
		emailAddress?: string;
		accountId?: string;
	};
	labels?: string[];
	components?: string[];
	fixVersions?: string[];
	epicKey?: string; // Link to an Epic
	parentKey?: string; // If it's a sub-task
	resolution?: string;
	createdInJira: Date;
	updatedInJira: Date;
}

export interface JiraIssueAsset extends KnowledgeAsset {
	assetType: KnowledgeAssetType.JIRA_ISSUE | KnowledgeAssetType.JIRA_EPIC | KnowledgeAssetType.JIRA_COMMENT;
	jira: JiraIssueDetails;
	// For JIRA_COMMENT, externalId might be commentId and we'd need issueId
	parentIssueExternalId?: string; // If this asset is a comment on an issue
}

export interface ConfluencePageDetails {
	spaceKey: string;
	version: number;
	author?: {
		displayName: string;
		username?: string;
		accountId?: string;
	};
	lastModifiedInConfluence: Date;
	createdInConfluence: Date;
	labels?: string[];
	parentPageId?: string; // Confluence ID of the parent page
}

export interface ConfluencePageAsset extends KnowledgeAsset {
	assetType: KnowledgeAssetType.CONFLUENCE_PAGE | KnowledgeAssetType.CONFLUENCE_COMMENT;
	confluence: ConfluencePageDetails;
	// For CONFLUENCE_COMMENT, externalId might be commentId and we'd need pageId
	parentPageExternalId?: string; // If this asset is a comment on a page
}

// --------------- Link Model ---------------

export interface ConceptLink extends BaseDomainEntity {
	sourceCodeConceptId: string; // FK to SourceCodeConcept.id
	knowledgeAssetId: string; // FK to KnowledgeAsset.id
	relevanceScore?: number; // (0.0 to 1.0) - Provided by AI or calculation
	linkType: ConceptLinkType;
	userId?: string; // Optional: if a user manually created or verified the link (FK to User)
	notes?: string; // Optional: user notes about this specific link
	isValid: boolean; // To help with the "living links" problem
	lastValidatedAt?: Date;
	validationAttempts?: number;
}

// --------------- Supporting Models (Optional but Recommended) ---------------

export interface Project extends BaseDomainEntity {
	name: string;
	repositoryUrl?: string;
	description?: string;
	// Configuration for concept linking within this project
	linkedJiraProjects?: string[]; // Array of Jira project keys
	linkedConfluenceSpaces?: string[]; // Array of Confluence space keys
	conceptExtractionSettings?: Record<string, any>; // e.g., ignored terms, custom dictionaries
}

export interface User extends BaseDomainEntity {
	username: string;
	email?: string;
	// Preferences related to concept linking
	preferences?: {
		showAISuggestionsBelowConfidence?: number;
		defaultLinkView?: 'summary' | 'full';
	};
	// API tokens or OAuth credentials for accessing Jira/Confluence on behalf of the user
	// These should be stored securely, e.g., encrypted or in a separate vault service
	externalCredentials?: Array<{
		system: KnowledgeAssetSourceSystem;
		accessToken: string; // Encrypted
		refreshToken?: string; // Encrypted
		expiresAt?: Date;
		scopes?: string[];
	}>;
}

// --------------- API Request/Response Snippets (Illustrative) ---------------

// Example: Request to find links for a concept
export interface FindLinksForConceptRequest {
	term: string;
	filePath: string;
	projectId?: string;
	language?: string;
	contextLines?: string[]; // Lines of code surrounding the term for better context
}

export interface FindLinksResponse {
	sourceConcept?: SourceCodeConcept; // The concept as identified/stored by the backend
	links: Array<{
		linkDetails: ConceptLink;
		knowledgeAsset: KnowledgeAsset; // Could be JiraIssueAsset or ConfluencePageAsset
	}>;
}

// Example: Request to create a manual link
export interface CreateManualLinkRequest {
	sourceCodeConcept: { // Can be partial data to identify or create a new concept
		term: string;
		type: ConceptSourceType;
		location: SourceCodeLocation;
		projectId?: string;
		language?: string;
	};
	knowledgeAssetUrl: string; // User provides URL, backend resolves to an asset
	notes?: string;
}
