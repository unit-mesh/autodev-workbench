import { z } from "zod";
import { ToolLike } from "../_typing.js";

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
			keywords: z.string().describe("Keywords to search in the project"),
		},
		async (params) => {
			const { keywords } = params;
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

			const url = `${AUTODEV_HOST}/api/mcp/aggregate/context?keywords=${encodeURIComponent(processedKeywords)}&projectId=${PROJECT_ID}`;

			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(response),
					},
				],
			};
		}
	);
};
