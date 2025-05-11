import { getConversations } from "@/lib/db"

export async function GET() {
  try {
    const conversations = await getConversations()
    return new Response(JSON.stringify(conversations), {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch conversations" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
