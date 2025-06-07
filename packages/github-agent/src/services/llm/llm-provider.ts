import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";

export interface LLMProviderConfig {
  fullModel: string;
  openai: OpenAIProvider;
  quickModel: string;
  providerName: string;
}

/**
 * Configure LLM provider based on available environment variables
 * Similar to web package implementation but with multiple provider support
 */
export function configureLLMProvider(): LLMProviderConfig | null {
  // Priority order: GLM -> DeepSeek -> OpenAI

  // GLM Provider (智谱AI)
  if (process.env.GLM_TOKEN) {
    const openai = createOpenAI({
      compatibility: "compatible",
      baseURL: process.env.LLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
      apiKey: process.env.GLM_TOKEN,
    });

    return {
      fullModel: process.env.LLM_MODEL || "glm-4-air",
      quickModel: process.env.LLM_MODEL || "glm-4-air",
      openai,
      providerName: "GLM"
    };
  }

  // DeepSeek Provider
  if (process.env.DEEPSEEK_TOKEN) {
    const openai = createOpenAI({
      compatibility: "compatible",
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_TOKEN,
    });

    return {
      fullModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      quickModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      openai,
      providerName: "DeepSeek"
    };
  }

  // OpenAI Provider
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({
      compatibility: "strict",
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    return {
      fullModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
      quickModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
      openai,
      providerName: "OpenAI"
    };
  }

  return null;
}

/**
 * Check if any LLM provider is available
 */
export function hasLLMProvider(): boolean {
  return configureLLMProvider() !== null;
}

/**
 * Get provider status for debugging
 */
export function getLLMProviderStatus(): Record<string, boolean> {
  return {
    GLM: !!process.env.GLM_TOKEN,
    DeepSeek: !!process.env.DEEPSEEK_TOKEN,
    OpenAI: !!process.env.OPENAI_API_KEY,
    Anthropic: !!process.env.ANTHROPIC_API_KEY
  };
}
