import { type NextRequest, NextResponse } from "next/server"
import { validateDictConcepts } from "@/app/api/chat/ai-validator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { concepts, codeContext } = body

    if (!concepts || !Array.isArray(concepts) || !codeContext) {
      return NextResponse.json(
        { error: "Invalid request. Concepts array and codeContext are required." },
        { status: 400 },
      )
    }

    const validationResults = await validateDictConcepts(concepts, codeContext)

    return NextResponse.json(validationResults)
  } catch (error) {
    console.error("Error in validate-concepts API:", error)
    return NextResponse.json({ error: "Failed to validate concepts" }, { status: 500 })
  }
}
