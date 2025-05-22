import { z } from "zod";
import { ToolLike } from "../_typing.js";

export const installGetProjectContextTool: ToolLike = (installer) => {
  installer(
    "get-project-context",
    "Get the context of a project",
    {
      keywords: z.array(z.string()).describe("Keywords to search for"),
    },
    async (params) => {
      // load env: for host url
      // Filter by both keywords and projectId:
      // /api/mcp/aggregate/context?keywords=login,auth&projectId=clqxyz123456

      // TODO: Implement it
      return {
        content: [],
      };
    }
  );
};
