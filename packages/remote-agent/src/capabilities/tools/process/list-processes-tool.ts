import { z } from "zod";
import { ToolLike } from "../../_typing";
import { GlobalProcessManager } from "./global-process-manager";

export const installListProcessesTool: ToolLike = (installer) => {
	installer("list-processes", "List all active processes launched by the agent", {
		filter: z.enum(["all", "running", "completed", "failed"]).optional().describe("Filter processes by status")
	}, async ({ filter = "all" }) => {
		try {
			const manager = GlobalProcessManager.getInstance();
			let processes = manager.getAllProcesses();

			if (filter !== "all") {
				processes = processes.filter(p => p.status === filter);
			}

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						filter,
						total_processes: processes.length,
						processes
					}, null, 2)
				}]
			};
		} catch (error: any) {
			return {
				content: [{
					type: "text",
					text: `Error listing processes: ${error.message}`
				}]
			};
		}
	});
};
