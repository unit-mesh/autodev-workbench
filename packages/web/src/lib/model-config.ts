import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai"

interface LlmProvider {
  fullModel: string
  openai: OpenAIProvider
  quickModel: string
}

export function configureModelProvider(providerType = "zhipu", apiEndpoint?: string, apiKey?: string): LlmProvider {
  let quickModel = "gpt-4o-mini"
  let fullModel = "gpt-4o"
  let openai: OpenAIProvider

  if (providerType === "zhipu") {
    openai = createOpenAI({
      compatibility: "compatible",
      baseURL: apiEndpoint || "https://open.bigmodel.cn/api/paas/v4",
      apiKey: apiKey || process.env.GLM_TOKEN,
    })
    fullModel = "glm-4"
    quickModel = "glm-4-air"
  } else {
    openai = createOpenAI({
      compatibility: "strict",
      baseURL: apiEndpoint || "https://api.openai.com/v1",
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    })
  }

  return { fullModel, openai, quickModel }
}
