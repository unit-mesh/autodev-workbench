import { ReadableStream } from "node:stream/web";

import { createConversation, saveMessage } from "@/app/api/_utils/db";
import { reply } from "@/app/api/_utils/reply";

export async function POST(req: Request) {
  try {
    const {
      messages,
      conversationId: existingConversationId,
      stream,
    } = await req.json();

    const conversationId =
      existingConversationId || (await createConversation());

    const result = await reply(messages, { stream });

    const saveToDB = async (content: string) => {
      try {
        const userMessage = messages[messages.length - 1];
        const prompt = userMessage.content;
        await saveMessage(conversationId, prompt, content);
      } catch (ex) {
        console.error("Error saving message to DB:", ex);
      }
    };

    if (stream) {
      const resStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          let content = "";

          for await (const part of result) {
            content += part;

            const data = [
              `id: ${conversationId}\n`,
              `event: message\n`,
              `data: ${JSON.stringify({ id: conversationId, text: part })}\n\n`,
            ];

            controller.enqueue(encoder.encode(data.join("")));
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          saveToDB(content);
        },
      });

      return new Response(resStream as globalThis.ReadableStream, {
        headers: {
          "content-type": "text/event-stream",
        },
      });
    }

    saveToDB(result);

    return new Response(
      JSON.stringify({
        text: result,
        conversationId,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
