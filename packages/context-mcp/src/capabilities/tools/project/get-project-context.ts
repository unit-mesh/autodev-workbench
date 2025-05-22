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
		"Get additional context of current project, which will help you to understand the project better. Include the " +
		"related documentation, standards, code context and api design and other information.",
		{
			keywords: z.array(z.string()).describe("Keywords to search for"),
		},
		async (params) => {
			const { keywords } = params;
			const url = `${AUTODEV_HOST}/api/mcp/aggregate/context?keywords=${keywords.join(
				","
			)}&projectId=${PROJECT_ID}`;

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
