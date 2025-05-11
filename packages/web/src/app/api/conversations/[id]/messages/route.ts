import { getMessages } from "@/lib/db"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const messages = await getMessages(params.id)
    return new Response(JSON.stringify(messages), {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch messages" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
