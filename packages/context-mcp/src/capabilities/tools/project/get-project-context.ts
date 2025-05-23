import { z } from "zod";
import { ToolLike } from "../_typing.js";
import { logApiInteraction } from "../../../utils/request-logger.js";

let AUTODEV_HOST = "https://www.autodev.work";
if (process.env.AUTODEV_HOST) {
	AUTODEV_HOST = process.env.AUTODEV_HOST;
}

let PROJECT_ID = "";
if (process.env.PROJECT_ID) {
	PROJECT_ID = process.env.PROJECT_ID;
} else {
	console.warn(
		"Warning: PROJECT_ID is not set. Defaulting to an empty string."
	);
}

export const installGetProjectContextTool: ToolLike = (installer) => {
	installer(
		"get-project-context",
		"Get additional context of current use task and project, which will help you to understand the project better. " +
		"Include the related documentation, standards, code context and api design and other information. Everything you need" +
		" to know about the project if you need more context and also ask for the project context.",
		{
			keywords: z.string().describe("Keywords to search in the project, should be in array or comma/space separated string"),
		},
		async (params) => {
			let { keywords } = params;
			if (keywords.trim().startsWith('"') && keywords.trim().endsWith('"')) {
				keywords = keywords.trim().slice(1, -1);
			}

			let processedKeywords = keywords;
			if (keywords.trim().startsWith('[') && keywords.trim().endsWith(']')) {
				try {
					const keywordsArray = JSON.parse(keywords);
					if (Array.isArray(keywordsArray)) {
						processedKeywords = keywordsArray.join(',');
					}
				} catch (e) {
					console.warn("Failed to parse keywords as JSON array, using as-is");
				}
			}
			// Handle space-separated string (convert to comma-separated)
			else if (keywords.includes(' ') && !keywords.includes(',')) {
				processedKeywords = keywords.split(/\s+/).filter(Boolean).join(',');
			}
			// For comma-separated strings, we can use them directly

			const url = `${AUTODEV_HOST}/api/mcp/aggregate/context?keywords=${encodeURIComponent(processedKeywords)}&projectId=${PROJECT_ID}`;

			try {
				const response = await fetch(url, { method: "GET" });
				const value = await response.json();

				logApiInteraction(
					url,
					{ keywords: processedKeywords, projectId: PROJECT_ID },
					value
				);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(value),
							url: url,
						},
					],
				};
			} catch (error) {
				console.error("Error fetching project context:", error);
				logApiInteraction(url,
					{ keywords: processedKeywords, projectId: PROJECT_ID },
					{ error: error }
				);
				throw error;
			}
		}
	);
};
