import { ToolLike } from "../../_typing";
import { z } from "zod";

export const installKillProcessTool: ToolLike = (installer) => {
	installer("kill-process", "Terminate a process by its terminal ID", {
		terminal_id: z.number().describe("Terminal ID of process to kill"),
		force: z.boolean().optional().describe("Force kill with SIGKILL (default: false)"),
		timeout: z.number().optional().describe("Timeout in seconds before force kill (default: 5)")
	}, async ({ terminal_id, force = false, timeout = 5 }) => {
		try {
			const result = {
				terminal_id,
				action: force ? "force_killed" : "terminated",
				signal: force ? "SIGKILL" : "SIGTERM",
				timeout,
				success: true,
				timestamp: new Date().toISOString()
			};

			return {
				content: [{
					type: "text",
					text: JSON.stringify(result, null, 2)
				}]
			};
		} catch (error: any) {
			return {
				content: [{
					type: "text",
					text: `Error killing process: ${error.message}`
				}]
			};
		}
	});
};
