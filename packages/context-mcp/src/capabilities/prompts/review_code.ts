import { PromptLike } from "./_typing.js";

import { z } from "zod";

export const installReviewCodePrompt: PromptLike = (installer) => {
  installer("review-code", { code: z.string() }, ({ code }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please review this code:\n\n${code}`,
        },
      },
    ],
  }));
};
