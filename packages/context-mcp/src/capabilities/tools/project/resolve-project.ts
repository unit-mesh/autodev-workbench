import { ToolLike } from "../_typing.js";

import { z } from "zod";

export const installResolveProjectTool: ToolLike = (installer) => {
  installer(
    "resolve-project",
    "Resolve a project from a given path",
    {
      path: z.string().describe("The path to the project"),
    },
    async (params) => {
      const { path } = params;
      // TODO: Implement it
      return {
        content: [
          {
            type: "text",
            text: "",
          },
        ],
      };
    }
  );
};
