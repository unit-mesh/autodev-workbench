import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";

interface LlmProvider {
  fullModel: string;
  openai: OpenAIProvider;
  quickModel: string;
}

export function configureModelProvider(): LlmProvider {
  let quickModel = "gpt-4o-mini";
  let fullModel = "gpt-4o";
  const openai: OpenAIProvider = createOpenAI({
    compatibility: "compatible",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    apiKey: process.env.GLM_TOKEN,
  });
  fullModel = "glm-4-air";
  quickModel = "glm-4-air";
  // } else {
  //   openai = createOpenAI({
  //     compatibility: "strict",
  //   });
  // }

  return { fullModel, openai, quickModel };
}


