import { ToolLike } from "../_typing.js";

export const installGetProjectContextTool: ToolLike = (installer) => {
  installer(
    "get-project-context",
    "Get the context of a project",
    {},
    async (params) => {
      // TODO: Implement it
      return {
        content: [],
      };
    }
  );
};
