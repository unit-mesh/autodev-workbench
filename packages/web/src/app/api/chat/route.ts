import { createConversation, createMessage, saveGeneratedCode } from "@/app/api/_utils/db"
import { reply } from "@/app/api/_utils/reply";

export async function POST(req: Request) {
	try {
		const { messages, conversationId: existingConversationId } = await req.json()

		const userMessage = messages[messages.length - 1]
		const conversationId = existingConversationId || (await createConversation())

		const text = await reply(messages)
		const assistantMessageId = await createMessage(conversationId, "assistant", text)

		const codeBlockRegex = /```([a-zA-Z0-9]+)?\n([\s\S]*?)```/g
		let match
		while ((match = codeBlockRegex.exec(text)) !== null) {
			const language = match[1] || "jsx"
			const code = match[2].trim()
			await saveGeneratedCode(
				conversationId,
				assistantMessageId,
				code,
				language,
				`Generated ${language} code`,
				`Code generated from prompt: ${userMessage.content.substring(0, 100)}...`,
			)
		}

		return new Response(
			JSON.stringify({
				text: text,
				conversationId,
			}),
			{
				headers: {
					"Content-Type": "application/json",
				},
			},
		)
	} catch (error) {
		console.error("Error in chat API:", error)
		return new Response(JSON.stringify({ error: "Failed to generate response" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		})
	}
}
