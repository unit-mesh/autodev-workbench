import { z } from "zod";
import { ToolLike } from "../../_typing";
import { GlobalProcessManager } from "./global-process-manager";

export const installKillProcessTool: ToolLike = (installer) => {
	installer("kill-process", "Terminate a specific process by its terminal ID", {
		terminal_id: z.number().describe("Process terminal ID to terminate"),
	}, async ({ terminal_id }) => {
		try {
			const manager = GlobalProcessManager.getInstance();
			const process = manager.getProcess(terminal_id);

			if (!process) {
				return {
					content: [{
						type: "text",
						text: `Error: Process with terminal_id ${terminal_id} not found`
					}]
				};
			}

			const success = manager.killProcess(terminal_id);
			const processStatus = process.getSummary();

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						terminal_id,
						success,
						process_summary: processStatus
					}, null, 2)
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
