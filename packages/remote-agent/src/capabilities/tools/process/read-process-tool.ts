import { z } from "zod";
import { ToolLike } from "../../_typing";
import { GlobalProcessManager } from "./global-process-manager";

export const installReadProcessTool: ToolLike = (installer) => {
	installer("read-process", "Read output from a specific process", {
		terminal_id: z.number().describe("Process terminal ID to read from"),
		wait: z.boolean().describe("Wait for new output if process still running"),
		max_wait_seconds: z.number().describe("Maximum time to wait for output")
	}, async ({ terminal_id, wait, max_wait_seconds }) => {
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

			if (wait && process.getSummary().status === 'running') {
				const startTime = Date.now();
				while (process.getSummary().status === 'running' &&
				(Date.now() - startTime) < max_wait_seconds * 1000) {
					await new Promise(resolve => setTimeout(resolve, 100));
				}
			}

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						terminal_id,
						process_summary: process.getSummary(),
						stdout: process.getOutput(),
						stderr: process.getErrors()
					}, null, 2)
				}]
			};
		} catch (error: any) {
			return {
				content: [{
					type: "text",
					text: `Error reading process: ${error.message}`
				}]
			};
		}
	});
};
