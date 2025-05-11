import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { createConversation, createMessage, saveGeneratedCode } from "@/lib/db"

// Define a system prompt for code generation
const SYSTEM_PROMPT = `You are an expert frontend developer specializing in React, Next.js, and modern web development.
Your task is to generate high-quality, working frontend code based on user requests.
Always provide complete, working code examples that follow best practices.
When generating code, wrap it in markdown code blocks with the appropriate language tag.
For example: \`\`\`jsx
// Your code here
\`\`\`
`

export async function POST(req: Request) {
  try {
    const { messages, conversationId: existingConversationId } = await req.json()

    // Get the last user message
    const userMessage = messages[messages.length - 1]

    // Create or use existing conversation
    const conversationId = existingConversationId || (await createConversation())

    // Save user message to database
    const userMessageId = await createMessage(conversationId, userMessage.role, userMessage.content)

    // Generate response from OpenAI
    const response = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt: userMessage.content,
    })

    // Save assistant message to database
    const assistantMessageId = await createMessage(conversationId, "assistant", response.text)

    // Extract code blocks from the response
    const codeBlockRegex = /```([a-zA-Z0-9]+)?\n([\s\S]*?)```/g
    let match
    while ((match = codeBlockRegex.exec(response.text)) !== null) {
      const language = match[1] || "jsx"
      const code = match[2].trim()

      // Save generated code to database
      await saveGeneratedCode(
        conversationId,
        assistantMessageId,
        code,
        language,
        `Generated ${language} code`,
        `Code generated from prompt: ${userMessage.content.substring(0, 100)}...`,
      )
    }

    // Return the response
    return new Response(
      JSON.stringify({
        text: response.text,
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
