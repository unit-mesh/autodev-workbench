import { getGeneratedCode } from "@/lib/db"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const code = await getGeneratedCode(params.id)
    return new Response(JSON.stringify(code), {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error fetching generated code:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch generated code" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
