import { embed } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { LRUCache } from "lru-cache";

const openAICache = new LRUCache({
  max: 1000,
  maxSize: 50000,
  ttl: 1000 * 60 * 60 * 2,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sizeCalculation(key: any, value: any) {
    return typeof value === "string" ? value.length : 1;
  }
});

const glmCache = new LRUCache({
  max: 1000,
  maxSize: 50000,
  ttl: 1000 * 60 * 60 * 2,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sizeCalculation(key: any, value: any) {
    return typeof value === "string" ? value.length : 1;
  }
});

const embeddingModel = "text-embedding-3-small";
export async function generateEmbeddingOpenAI(raw: string) {
  if (!raw) {
    return null;
  }

  if (openAICache.has(raw)) {
    return openAICache.get(raw);
  }

  const input = raw.replace(/\n/g, " ");
  const { embedding } = await embed({
    model: openai.embedding(embeddingModel),
    value: input,
  });

  console.log("successfully generated embedding for: ", raw);
  openAICache.set(raw, embedding);
  return embedding;
}

/// generateEmbedding GLM, url: https://open.bigmodel.cn/api/paas/v4/embeddings
const glmModel = "embedding-3"
export async function generateEmbeddingGLM(raw: string) {
  if (!raw) {
    return null;
  }

  if (glmCache.has(raw)) {
    return glmCache.get(raw);
  }

  const input = raw.replace(/\n/g, " ");
  const openai = createOpenAI({
    compatibility: "compatible",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    apiKey: process.env.GLM_TOKEN,
  });
  const { embedding } = await embed({
    model: openai.embedding(glmModel),
    value: input,
  });

  glmCache.set(raw, embedding);
  return embedding;
}
