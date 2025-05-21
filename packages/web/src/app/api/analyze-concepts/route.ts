import { type NextRequest, NextResponse } from "next/server"
import { analyzeConcepts } from "@/app/api/chat/ai-validator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { concepts } = body

    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Concepts array is required." },
        { status: 400 },
      )
    }

    const analysisResults = await analyzeConcepts(concepts)

    return NextResponse.json(analysisResults)
  } catch (error) {
    console.error("Error in analyze-concepts API:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to analyze concepts",
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
