import { CoreMessage, generateText, streamText } from "ai";
import { configureModelProvider } from "@/app/api/_utils/llm-provider";

const { fullModel, openai } = configureModelProvider();

export function reply(
  messages: CoreMessage[],
  options?: { stream: false }
): Promise<string>;
export function reply(
  messages: CoreMessage[],
  options: { stream: true }
): Promise<ReadableStream<string>>;
export async function reply(
  messages: CoreMessage[],
  options?: { stream: boolean }
): Promise<string | ReadableStream<string>> {
  if (options?.stream) {
    const { textStream } = await streamText({
      model: openai(fullModel),
      messages: messages,
    });

    return textStream;
  }

  const { text } = await generateText({
    model: openai(fullModel),
    messages: messages,
  });

  return text;
}
