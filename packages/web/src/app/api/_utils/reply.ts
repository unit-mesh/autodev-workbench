import { CoreMessage, generateText } from "ai";
import { configureModelProvider } from "@/app/api/_utils/llm-provider";

const { fullModel, openai } = configureModelProvider();

export async function reply(messages: CoreMessage[]): Promise<string> {
  const result = await generateText({
    model: openai(fullModel),
    messages: messages,
  });

  return result.text;
}
