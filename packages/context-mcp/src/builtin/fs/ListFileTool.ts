import { Tool } from "../../base/Tool";
import { undefined } from "zod";

////  released to https://github.com/RooVetGit/Roo-Code/tree/f6cae4df0587dbd61e39fa9a34fdc510fac7b388/src/core/tools
//// https://github.com/RooVetGit/Roo-Code/blob/main/src/services/glob/list-files.ts#L40
export class ListFileTool implements Tool {
	name(): string { return  "list_files" }

	description(): string {
		return "Request to list files and directories within the specified directory. If recursive is true, it will list all files and directories recursively. If recursive is false or not provided, it will only list the top-level contents. Do not use this tool to confirm the existence of files you may have created, as the user will let you know if the files were created successfully or not.";
	}

	usage(): string {
		return "";
	}

	execute(_input: object): Promise<object> {
		return Promise.resolve(undefined);
	}

	icon(): string {
		return "";
	}
}
