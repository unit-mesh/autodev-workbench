import { PromptLike } from "./prompts/_typing.js";
import { installReviewCodePrompt } from "./prompts/review_code.js";

export const prompts: PromptLike[] = [
    installReviewCodePrompt,
];
